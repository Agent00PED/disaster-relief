-- =====================================================================
-- 28_volunteer_profile.sql — ข้อมูลอาสาสมัครเพิ่มเติม + รูปถ่ายยืนยันตัวตน
--
-- ที่มา: comment อาจารย์ เรื่องหน้าสมัครอาสาสมัคร
--   - เพิ่มข้อมูลที่สมัครสมาชิก (เบอร์, รูปถ่ายยืนยัน, ปีเกิด)
--   - แก้แบบฟอร์มแยก ชื่อ-สกุล ออกจากกัน
--
-- เบอร์โทรทำไปแล้วใน 27_profile_phone.sql ไฟล์นี้ทำส่วนที่เหลือ
--
-- ต้องรัน 27_profile_phone.sql ก่อน · รันซ้ำได้ · ไม่แตะ RLS เดิมของตารางใด
-- =====================================================================


-- =====================================================================
-- ส่วนที่ 1 — คอลัมน์ใหม่ใน profiles
-- =====================================================================

alter table public.profiles
  add column if not exists first_name    text,
  add column if not exists last_name     text,
  add column if not exists birth_year    int,
  add column if not exists id_photo_path text;

comment on column public.profiles.first_name    is 'ชื่อ (แยกจากนามสกุล) — full_name ยังเก็บไว้เป็นชื่อเต็มสำหรับแสดงผล';
comment on column public.profiles.last_name     is 'นามสกุล';
comment on column public.profiles.birth_year    is 'ปีเกิด พ.ศ. — เก็บเป็นปีล้วน ไม่เก็บวันเกิดเต็ม เพราะระบบต้องการแค่ยืนยันว่าบรรลุนิติภาวะ';
comment on column public.profiles.id_photo_path is 'path ของรูปถ่ายยืนยันตัวตนใน Storage bucket volunteer-ids — null คือยังไม่ได้อัปโหลด';

-- ปีเกิดต้องสมเหตุสมผล: 2400 พ.ศ. คือราว ค.ศ. 1857 และเพดานคือปีปัจจุบัน
-- ใส่เป็น constraint แยกเพื่อให้ error ชัดว่าผิดเพราะอะไร
-- (ใช้ not valid ไม่ได้เพราะอยากให้บังคับกับแถวใหม่ทันที แถวเดิมเป็น null
--  อยู่แล้วจึงผ่าน check ทุกแถว)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_birth_year_range'
  ) then
    alter table public.profiles
      add constraint profiles_birth_year_range
      check (
        birth_year is null
        or (birth_year between 2400 and (extract(year from now() at time zone 'Asia/Bangkok')::int + 543))
      );
  end if;
end
$$;


-- =====================================================================
-- ส่วนที่ 2 — trigger ตอนสมัคร เก็บฟิลด์ใหม่ด้วย
-- =====================================================================
-- คัดลอกมาจาก 27_profile_phone.sql ทุกบรรทัด เปลี่ยนแค่
--   - เพิ่มตัวแปร requested_first / requested_last / requested_birth_year
--   - ประกอบ full_name จากชื่อ+นามสกุล ถ้า client ส่งมาแยก
--   - เพิ่ม 3 คอลัมน์เข้าไปใน insert
-- allowlist ที่บังคับว่า client ตั้ง role ได้แค่ 'volunteer' ยังอยู่ครบ
-- ห้ามตัดบรรทัดนั้นออกเด็ดขาด ไม่งั้นคนสมัครเป็น admin เองได้

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  requested_center uuid;
  requested_username text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  requested_phone text := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');
  requested_first text := nullif(trim(new.raw_user_meta_data ->> 'first_name'), '');
  requested_last text := nullif(trim(new.raw_user_meta_data ->> 'last_name'), '');
  requested_birth_year int;
  resolved_full_name text;
begin
  -- allowlist: ยอมรับแค่ค่า 'volunteer' เท่านั้นจาก client, อย่างอื่น
  -- (รวมถึงไม่ส่งมาเลย หรือพยายามส่ง 'admin'/'staff') ตกไปเป็น 'staff' หมด
  if requested_role is distinct from 'volunteer' then
    requested_role := 'staff';
  end if;

  if requested_role = 'volunteer' then
    begin
      requested_center := (new.raw_user_meta_data ->> 'center_id')::uuid;
    exception when others then
      requested_center := null;
    end;
  end if;

  -- ปีเกิดมาเป็นข้อความจาก client แปลงไม่ได้ก็ปล่อย null ไม่ให้สมัครล้ม
  begin
    requested_birth_year := nullif(trim(new.raw_user_meta_data ->> 'birth_year'), '')::int;
  exception when others then
    requested_birth_year := null;
  end;

  -- full_name ยังเป็นคอลัมน์ที่ทั้งเว็บใช้แสดงชื่อ (nav, ใบเสร็จ, ตาราง admin)
  -- ถ้า client ส่งชื่อ-นามสกุลแยกมา ให้ประกอบเป็นชื่อเต็มให้ด้วย
  -- เพื่อไม่ต้องไล่แก้ทุกหน้าที่อ่าน full_name
  resolved_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(concat_ws(' ', requested_first, requested_last)), ''),
    ''
  );

  insert into public.profiles (
    id, full_name, role, center_id, username, phone,
    first_name, last_name, birth_year
  )
  values (
    new.id,
    resolved_full_name,
    requested_role,
    requested_center,
    requested_username,
    requested_phone,
    requested_first,
    requested_last,
    requested_birth_year
  );
  return new;
end
$$;


-- =====================================================================
-- ส่วนที่ 3 — Storage bucket สำหรับรูปถ่ายยืนยันตัวตน
-- =====================================================================
-- bucket เป็น private (public = false) รูปจึงเปิดด้วย URL ตรง ๆ ไม่ได้
-- ต้องขอ signed URL ผ่าน API ซึ่งจะผ่าน policy ข้างล่างอีกชั้น

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'volunteer-ids',
  'volunteer-ids',
  false,
  5242880,                                        -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ---------- policy ----------
-- โครงสร้าง path ที่บังคับ: <user_id>/<ชื่อไฟล์>
-- storage.foldername(name) คืน array ของโฟลเดอร์ ตัวแรกคือ user id
-- การผูก path กับ auth.uid() ทำให้แต่ละคนเขียนได้เฉพาะโฟลเดอร์ตัวเอง
-- ถึงจะรู้ path ของคนอื่นก็อัปโหลดทับไม่ได้

drop policy if exists volunteer_ids_insert_own on storage.objects;
create policy volunteer_ids_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'volunteer-ids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists volunteer_ids_update_own on storage.objects;
create policy volunteer_ids_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'volunteer-ids'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'volunteer-ids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- อ่านได้ 3 กลุ่ม: เจ้าของรูป · admin · staff ที่อยู่ศูนย์เดียวกับเจ้าของรูป
-- ใช้ helper เดิมจาก 03_rls_helpers.sql ไม่ได้เขียนกฎสิทธิ์ชุดใหม่
drop policy if exists volunteer_ids_select_scoped on storage.objects;
create policy volunteer_ids_select_scoped on storage.objects
  for select to authenticated
  using (
    bucket_id = 'volunteer-ids'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or exists (
        select 1 from public.profiles p
        where p.id::text = (storage.foldername(name))[1]
          and p.center_id = public.my_center_id()
          and public.my_center_id() is not null
      )
    )
  );

-- ลบได้เฉพาะเจ้าของกับ admin — staff ลบรูปยืนยันตัวตนของคนอื่นไม่ได้
drop policy if exists volunteer_ids_delete_own on storage.objects;
create policy volunteer_ids_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'volunteer-ids'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );


-- =====================================================================
-- ส่วนที่ 4 — เติม first_name / last_name ให้บัญชีที่มีอยู่แล้ว
-- =====================================================================
-- แยกจาก full_name เดิมโดยตัดที่ช่องว่างแรก
-- ชื่อไทยหลายคำจะตัดไม่สวย (เช่น "สมชาย ใจดี มากมาย" -> "สมชาย" / "ใจดี มากมาย")
-- แต่ดีกว่าปล่อยว่าง และผู้ใช้แก้เองได้ทีหลัง
-- เขียนเฉพาะแถวที่ยังว่าง จึงรันซ้ำแล้วไม่ทับข้อมูลที่แก้ไว้แล้ว

update public.profiles
set
  first_name = coalesce(first_name, nullif(split_part(btrim(full_name), ' ', 1), '')),
  last_name  = coalesce(
    last_name,
    nullif(btrim(substr(btrim(full_name), length(split_part(btrim(full_name), ' ', 1)) + 1)), '')
  )
where btrim(coalesce(full_name, '')) <> ''
  and (first_name is null or last_name is null);


-- =====================================================================
-- ตรวจผลหลังรัน
-- =====================================================================
-- 1) คอลัมน์ครบ
-- select column_name, data_type from information_schema.columns
-- where table_schema='public' and table_name='profiles' order by ordinal_position;
--
-- 2) แยกชื่อแล้วหน้าตาเป็นยังไง
-- select full_name, first_name, last_name, birth_year, phone from public.profiles;
--
-- 3) bucket ถูกสร้างและเป็น private
-- select id, public, file_size_limit, allowed_mime_types from storage.buckets
-- where id = 'volunteer-ids';
--
-- 4) policy ครบ 4 อัน
-- select policyname, cmd from pg_policies
-- where schemaname='storage' and tablename='objects'
--   and policyname like 'volunteer_ids%' order by policyname;
-- =====================================================================

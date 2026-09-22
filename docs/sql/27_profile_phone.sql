-- =====================================================================
-- 27_profile_phone.sql — เบอร์โทรของผู้ใช้ในระบบ (profiles.phone)
--
-- ที่มา: comment อาจารย์ — "เพิ่มเบอร์ติดต่อเจ้าหน้าที่ (ตอนนี้มีแค่เบอร์ศูนย์)"
--        ในหน้าอาสาสมัคร
--
-- ปัญหาเดิม: หน้าอาสาสมัครแสดงได้แค่ centers.contact_phone ซึ่งเป็นเบอร์กลาง
-- ของศูนย์ ไม่ใช่เบอร์ของคน ถ้าอาสาสมัครอยู่หน้างานแล้วของมาไม่ครบ จะโทรหา
-- เจ้าหน้าที่ที่ดูแลเรื่องนี้โดยตรงไม่ได้
--
-- เพิ่มแบบ additive ล้วน ๆ — ไม่แตะคอลัมน์เดิม ไม่แตะ RLS ไม่แตะ trigger
--
-- ไม่ต้องเพิ่ม policy ใหม่: profiles_select ใน 04_rls_policies.sql เปิดให้
-- "คนในศูนย์เดียวกัน" อ่านกันได้อยู่แล้ว อาสาสมัครจึงเห็นเบอร์ของเจ้าหน้าที่
-- ศูนย์ตัวเองได้ทันที และยังเห็นเฉพาะศูนย์ตัวเองเหมือนเดิม
--
--     create policy profiles_select on public.profiles
--       for select to authenticated
--       using (id = auth.uid() or public.is_admin()
--              or center_id = public.my_center_id());
--
-- รันหลัง 01–06 และหลัง 13 (volunteer role) · รันซ้ำได้
-- =====================================================================


-- ---------- 1. คอลัมน์ ----------
alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is
  'เบอร์ติดต่อของผู้ใช้ — อาสาสมัครใช้โทรหาเจ้าหน้าที่ศูนย์ตัวเองจากหน้า /volunteer';


-- ---------- 2. ให้ trigger ตอนสมัครรับเบอร์จากฟอร์มด้วย ----------
-- ฟอร์มสมัครอาสาสมัครส่ง phone มาใน raw_user_meta_data
--
-- ฟังก์ชันนี้คัดลอกมาจาก 13_volunteer_role.sql ทุกบรรทัด เปลี่ยนแค่
--   - เพิ่มตัวแปร requested_phone
--   - เพิ่ม phone เข้าไปใน insert
-- allowlist ที่บังคับว่า client ตั้ง role ได้แค่ 'volunteer' ยังอยู่ครบ
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

  insert into public.profiles (id, full_name, role, center_id, username, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    requested_role,
    requested_center,
    requested_username,
    requested_phone
  );
  return new;
end;
$$;

-- trigger เดิมผูกอยู่แล้วจาก 02_auth_trigger.sql และชี้มาที่ชื่อฟังก์ชันเดียวกัน
-- การ create or replace ข้างบนจึงมีผลทันที ไม่ต้องสร้าง trigger ใหม่


-- ---------- 3. ตรวจผล ----------
-- คอลัมน์ต้องโผล่มา และ trigger ต้องยังผูกอยู่
--
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'profiles'
-- order by ordinal_position;
--
-- select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
--
-- ใส่เบอร์ให้เจ้าหน้าที่ที่มีอยู่แล้ว (ทำผ่านหน้า /admin/centers ได้เลย
-- หรือรันตรงนี้ก็ได้):
--
-- update public.profiles set phone = '081-234-5678'
-- where username = 'ชื่อผู้ใช้ของเจ้าหน้าที่';
-- =====================================================================

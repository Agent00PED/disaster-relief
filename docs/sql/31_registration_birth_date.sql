-- =====================================================================
-- 31. วันเกิดเต็ม (วัน/เดือน/ปี) สำหรับการสมัครใหม่
--
-- รันหลัง 30_registration_details.sql
--
-- บัญชีเดิมที่มีแต่ปีเกิด ปล่อย birth_date เป็น null ไว้
-- ไม่เดาวัน/เดือนให้ เพราะจะกลายเป็นข้อมูลที่ดูเหมือนจริงแต่ไม่จริง
--
-- birth_year ยังอยู่ต่อในฐานะคอลัมน์ที่หน้าเว็บเดิมอ่านอยู่
-- การสมัครใหม่จะคำนวณ birth_year จาก birth_date ให้อัตโนมัติ
-- =====================================================================

begin;

alter table public.profiles
  add column if not exists birth_date date;

comment on column public.profiles.birth_date is
  'วันเกิดเต็มของผู้สมัครใหม่ บัญชีเก่าที่มีแต่ปีเกิดจะเป็น null';

comment on column public.profiles.birth_year is
  'ปีเกิด พ.ศ. — สำหรับผู้สมัครใหม่คำนวณจาก birth_date ให้อัตโนมัติ';

-- ---------------------------------------------------------------------
-- handle_new_user — เวอร์ชันสุดท้าย เพิ่ม birth_date ต่อจากไฟล์ 30
--
-- ของเดิมที่ต้องคงไว้ (ดูเหตุผลเต็มในไฟล์ 30):
--   allowlist บทบาท · full_name สำรอง · กันค่าแปลกจาก client
--
-- เพิ่มรอบนี้:
--   แปลง birth_date แบบกัน error ถ้า client ส่งวันที่ผิดรูปแบบมา
--   ต้องไม่ทำให้สมัครไม่ผ่าน แค่เก็บเป็น null
--
--   birth_year ที่คำนวณจาก birth_date ต้องอยู่ในช่วงที่ constraint
--   profiles_birth_year_range ยอมรับ (2400 ถึงปีปัจจุบัน) ถ้าหลุดช่วง
--   เช่นกรอกวันเกิดเป็นอนาคต ให้ทิ้งทั้ง birth_date และ birth_year
--   ไม่งั้นการสมัครจะล้มด้วย error ของ constraint ที่ผู้ใช้อ่านไม่รู้เรื่อง
--   (ฝั่งฟอร์มควรมี max ที่ช่อง input ด้วยอีกชั้น)
-- ---------------------------------------------------------------------
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
  requested_birth_date date;
  requested_birth_year int;
  max_birth_year int := extract(year from (now() at time zone 'Asia/Bangkok'))::int + 543;
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

  -- วันเกิดมาเป็นข้อความจาก client แปลงไม่ได้ก็ปล่อย null ไม่ให้สมัครล้ม
  begin
    requested_birth_date := nullif(trim(new.raw_user_meta_data ->> 'birth_date'), '')::date;
  exception when others then
    requested_birth_date := null;
  end;

  -- ปีเกิด: ใช้จาก birth_date ก่อน ถ้าไม่มีค่อยใช้ค่าที่ client ส่งมาตรง ๆ
  begin
    requested_birth_year := coalesce(
      extract(year from requested_birth_date)::int + 543,
      nullif(trim(new.raw_user_meta_data ->> 'birth_year'), '')::int
    );
  exception when others then
    requested_birth_year := null;
  end;

  -- หลุดช่วงที่ constraint ยอมรับ = ข้อมูลผิด ทิ้งไปทั้งคู่ ดีกว่าสมัครไม่ผ่าน
  if requested_birth_year is not null
     and (requested_birth_year < 2400 or requested_birth_year > max_birth_year) then
    requested_birth_year := null;
    requested_birth_date := null;
  end if;

  -- full_name ยังเป็นคอลัมน์ที่ทั้งเว็บใช้แสดงชื่อ (nav, ใบเสร็จ, ตาราง admin)
  -- ถ้า client ส่งชื่อ-นามสกุลแยกมา ให้ประกอบเป็นชื่อเต็มให้ด้วย
  resolved_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(concat_ws(' ', requested_first, requested_last)), ''),
    ''
  );

  insert into public.profiles (
    id, full_name, role, center_id, username, phone,
    first_name, last_name, birth_year, birth_date
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
    requested_birth_year,
    requested_birth_date
  );
  return new;
end;
$$;

commit;

-- ตรวจผล
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('first_name','last_name','phone','birth_year','birth_date','id_photo_path')
 order by column_name;

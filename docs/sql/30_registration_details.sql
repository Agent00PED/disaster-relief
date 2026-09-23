-- =====================================================================
-- 30. ข้อมูลเพิ่มเติมตอนสมัครสมาชิก — ชื่อ/นามสกุล/เบอร์/ปีเกิด/รูปยืนยัน
--
-- รันหลัง 28_volunteer_profile.sql และ 29_missing_columns.sql
-- บัญชีเดิมไม่กระทบ คอลัมน์ใหม่เป็น null ได้ทั้งหมด
--
-- หมายเหตุ: คอลัมน์ทั้ง 5 ตัวถูกเพิ่มไปแล้วตั้งแต่ไฟล์ 27 กับ 28
-- ไฟล์นี้จึงเป็น no-op สำหรับฐานข้อมูลปัจจุบัน เก็บไว้เพื่อให้คนที่
-- สร้างฐานข้อมูลใหม่จากไฟล์ทั้งชุดได้ผลลัพธ์เหมือนกัน
--
-- ใช้ id_photo_path และ bucket 'volunteer-ids' ที่มีอยู่แล้วจากไฟล์ 28
-- ไม่สร้างคอลัมน์/bucket ชุดใหม่ซ้ำ
-- =====================================================================

begin;

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists birth_year integer,
  add column if not exists id_photo_path text;

-- ช่วงปีเกิดที่รับได้: 2400 ถึงปีปัจจุบัน (พ.ศ. ตามเวลาไทย)
-- แยกเป็น constraint ต่างหากเพื่อให้ add column if not exists ข้ามได้
-- โดยไม่ทำให้กฎหายไปกรณีคอลัมน์มีอยู่แล้ว
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.profiles'::regclass
       and conname  = 'profiles_birth_year_range'
  ) then
    alter table public.profiles
      add constraint profiles_birth_year_range
      check (
        birth_year is null
        or (birth_year >= 2400
            and birth_year <= (extract(year from (now() at time zone 'Asia/Bangkok'))::int + 543))
      );
  end if;
end $$;

-- ---------------------------------------------------------------------
-- handle_new_user — ต้องคงของเดิมไว้ครบ 3 อย่าง ห้ามตัดออก
--
--   1. allowlist บทบาท: client ส่งได้แค่ 'volunteer' นอกนั้นเป็น 'staff'
--      ถ้าหายไป จะสมัครเป็น admin เองได้
--   2. full_name สำรอง: ถ้า client ส่งมาแต่ชื่อ-นามสกุลแยก ต้องประกอบ
--      เป็นชื่อเต็มให้ด้วย เพราะ nav / ใบเสร็จ / ตาราง admin อ่าน full_name
--      ถ้าหายไป ชื่อจะว่างทั้งเว็บ
--   3. กันค่าแปลกจาก client: ปีเกิดที่แปลงเป็นตัวเลขไม่ได้ต้องกลายเป็น null
--      ไม่ใช่ทำให้สมัครไม่ผ่าน
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
end;
$$;

-- รูปยืนยันตัวตนใช้ bucket 'volunteer-ids' (private) กับ policy จากไฟล์ 28
-- อัปโหลดหลังผู้ใช้ยืนยันอีเมลและล็อกอินแล้ว ไม่ได้อัปโหลดตอนสมัคร
-- จึงไม่ตั้งค่า id_photo_path ที่ trigger นี้

commit;

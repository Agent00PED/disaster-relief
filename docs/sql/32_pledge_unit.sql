-- =====================================================================
-- 32. donation_pledges.unit — เก็บหน่วยที่ผู้บริจาคเลือกไว้บนหน้า /pledge
--
-- ปัญหาเดิม: หน้า /pledge มี dropdown ให้ผู้บริจาคเลือกหน่วย แต่ตาราง
-- donation_pledges ไม่มีคอลัมน์รองรับ ค่าที่เลือกจึงหายทันทีที่กดส่ง
--
-- ผลที่ตามมา (ตรวจสอบจากการทดสอบจริง):
--   ผู้บริจาคเลือก "ลัง"
--     -> หน้า /pledges ของ staff แสดง "กล่อง"  (ค่า fallback ที่ hardcode ไว้)
--     -> กดยืนยันแล้วเข้าคลังเป็น "ชิ้น"        (normalizeUnit('') = 'ชิ้น')
--   หน่วยเดียวกันกลายเป็นสามค่าใน 3 หน้าจอ
--
-- เก็บเป็นภาษาไทยเสมอ ให้ตรงกับคอลัมน์ donations.unit
-- (ดู lib/units.ts และ docs/sql/26_standard_units.sql)
--
-- คำสั่งนี้เป็นการ "เพิ่มอย่างเดียว" รันซ้ำได้ ไม่กระทบข้อมูลเดิม
-- =====================================================================

alter table public.donation_pledges
  add column if not exists unit text;

comment on column public.donation_pledges.unit is
  'หน่วยที่ผู้บริจาคเลือกบนหน้า /pledge เก็บเป็นภาษาไทยตาม lib/units.ts';

-- แถวเก่าที่ยังไม่มีหน่วย ปล่อยเป็น null ไว้ ไม่เดาแทนผู้บริจาค
-- หน้า /pledges จะแสดงเป็น "—" และ staff เลือกหน่วยเองตอนกดยืนยัน

-- ตรวจผล
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'donation_pledges'
   and column_name  = 'unit';

-- ---------------------------------------------------------------------
-- ย้อนกลับ (ถ้าจำเป็น)
--   alter table public.donation_pledges drop column if exists unit;
-- ---------------------------------------------------------------------

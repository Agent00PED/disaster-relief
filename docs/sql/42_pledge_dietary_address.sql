-- =================================================================
-- 42. คำร้องจากคนทั่วไป: เพิ่มข้อกำหนดด้านอาหาร และที่อยู่ผู้บริจาค
--
-- ปัญหาที่แก้
-- ------------------------------------------------------------------
-- ตาราง donations กับ requests มีคอลัมน์ dietary_type มาตั้งแต่ไฟล์ 33
-- แต่ตารางคำร้องจากคนทั่วไปทั้งสองตารางไม่มี พอเจ้าหน้าที่กดอนุมัติ
-- โค้ดจึงไม่มีค่าจะส่งไป ปลายทางเลยตกไปใช้ค่า default คือ 'general'
--
-- ผลคือคำร้องจากคนทั่วไปกลายเป็น "ทั่วไป" ทุกใบ แล้วกฎใน allocate_items
-- ที่ตรวจเฉพาะตอนคำขอไม่ใช่ general ก็ไม่ทำงาน เท่ากับพังสองทาง
--
--   1. ขอข้าวฮาลาล -> บันทึกเป็นทั่วไป -> จ่ายของไม่ฮาลาลให้ได้ ไม่มีใครเตือน
--   2. บริจาคของฮาลาล -> ถูกลดเป็นทั่วไป -> เอาไปจ่ายคำขอฮาลาลไม่ได้
--
-- อีกเรื่องคือ donation_pledges ไม่มีที่อยู่ ทั้งที่ตาราง donors มี
-- และ findOrCreateDonor รับค่านี้ได้อยู่แล้ว ผู้บริจาคที่เกิดจากการ
-- อนุมัติคำร้องจึงไม่มีที่อยู่ หน้า /donors เลยขึ้น "-" ในช่องจังหวัด
-- และตัวกรองจังหวัดก็กรองไม่เจอ
--
-- หมายเหตุ
-- ------------------------------------------------------------------
-- ใช้ add column if not exists ทุกคอลัมน์ รันซ้ำได้ไม่พัง
-- ค่า default เป็น 'general' เพื่อให้แถวเดิมที่มีอยู่แล้วไม่ขัด NOT NULL
-- check constraint ลอกมาจาก donations_dietary_type_check ให้ตรงกันเป๊ะ
-- ถ้าแก้ค่าที่อนุญาตตรงนี้ ต้องแก้ lib/dietary.ts ด้วยเสมอ
-- =================================================================

-- ---------- donation_pledges ----------

alter table public.donation_pledges
  add column if not exists dietary_type text not null default 'general';

alter table public.donation_pledges
  drop constraint if exists donation_pledges_dietary_type_check;

alter table public.donation_pledges
  add constraint donation_pledges_dietary_type_check
  check (dietary_type = any (array['general', 'halal', 'vegetarian']));

alter table public.donation_pledges
  add column if not exists address text;

comment on column public.donation_pledges.dietary_type is
  'ข้อกำหนดด้านอาหารของของที่จะบริจาค general | halal | vegetarian';

comment on column public.donation_pledges.address is
  'ที่อยู่ผู้บริจาค เก็บเป็น "<ตำบล> <จังหวัด>" ให้ตรงกับ donors.address';

-- ---------- request_pledges ----------

alter table public.request_pledges
  add column if not exists dietary_type text not null default 'general';

alter table public.request_pledges
  drop constraint if exists request_pledges_dietary_type_check;

alter table public.request_pledges
  add constraint request_pledges_dietary_type_check
  check (dietary_type = any (array['general', 'halal', 'vegetarian']));

comment on column public.request_pledges.dietary_type is
  'ข้อกำหนดด้านอาหารที่ผู้ขอต้องการ general | halal | vegetarian';

-- ---------- ตรวจผล ----------
-- ต้องได้ 3 แถว และ dietary_type ทั้งสองตัวต้องเป็น NOT NULL default 'general'

select table_name, column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public'
   and (
        (table_name = 'donation_pledges' and column_name in ('dietary_type', 'address'))
     or (table_name = 'request_pledges'  and column_name = 'dietary_type')
   )
 order by table_name, column_name;

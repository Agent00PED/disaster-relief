-- =====================================================================
-- 29_missing_columns.sql — คอลัมน์ที่ถูกเพิ่มลง Supabase ตรง ๆ
--                          โดยไม่มีไฟล์ migration (เขียนย้อนหลัง)
--
-- ที่มา: ตอนตรวจ PR รอบที่ 2 เทียบฐานข้อมูลจริงกับไฟล์ใน docs/sql/ ทุกไฟล์
-- พบว่ามี 3 คอลัมน์ที่ "มีอยู่ใน Supabase แต่ไม่มีในไฟล์ SQL เลยสักไฟล์"
-- และไม่มีใน branch ไหนด้วย
--
-- ทำไมต้องมีไฟล์นี้
--   1. docs/sql/README.md เขียนว่ารันไฟล์ 01-06 แล้วได้ระบบที่ใช้งานได้
--      ถ้าไม่มีไฟล์นี้ ใครสร้างฐานข้อมูลใหม่จะได้เว็บที่พัง เพราะหน้า
--      /requests query คอลัมน์ name_en / item_name_en ที่ยังไม่มี
--   2. ถ้าอาจารย์ขอดูการออกแบบฐานข้อมูล ไฟล์ที่ส่งต้องตรงกับของจริง
--   3. ถ้าวันนำเสนอ Supabase มีปัญหาแล้วต้องสร้างใหม่ จะกู้ได้ทัน
--
-- ไฟล์นี้ไม่เปลี่ยนอะไรในฐานข้อมูลปัจจุบัน (ใช้ if not exists ทั้งหมด)
-- มีไว้ให้ฐานข้อมูลที่สร้างใหม่ได้โครงสร้างตรงกับของจริง
--
-- รันหลัง 01-06 · รันซ้ำได้
-- =====================================================================


-- ---------- ก่อนรัน: ตรวจชนิดข้อมูลจริงก่อน ----------
-- *** received_date ในฐานข้อมูลตอนนี้เป็น null ทุกแถว จึงยืนยันชนิดจาก
--     ข้อมูลไม่ได้ ไฟล์นี้เดาว่าเป็น date เพราะฟอร์มส่งค่าจาก
--     <input type="date"> ซึ่งได้รูปแบบ YYYY-MM-DD
--     ถ้าผลลัพธ์ข้างล่างไม่ตรง ให้แก้บรรทัดในไฟล์นี้ให้ตรงกับของจริง ***
--
-- select table_name, column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and (table_name, column_name) in (
--     ('centers','name_en'), ('requests','item_name_en'), ('donations','received_date')
--   )
-- order by table_name, column_name;


-- ---------- 1. ชื่อศูนย์ภาษาอังกฤษ ----------
-- ใช้ที่ app/requests/page.tsx — ตอน locale = en จะแสดง name_en แทน name
alter table public.centers
  add column if not exists name_en text;

comment on column public.centers.name_en is
  'ชื่อศูนย์ภาษาอังกฤษ ใช้ตอนผู้ใช้สลับเป็น EN — ว่างได้ ถ้าว่างจะ fallback ไปใช้ name';


-- ---------- 2. ชื่อสิ่งของที่ขอ ภาษาอังกฤษ ----------
-- ใช้ที่ app/requests/page.tsx เหมือนกัน
alter table public.requests
  add column if not exists item_name_en text;

comment on column public.requests.item_name_en is
  'ชื่อสิ่งของภาษาอังกฤษ ใช้ตอนผู้ใช้สลับเป็น EN — ว่างได้ ถ้าว่างจะ fallback ไปใช้ item_name';


-- ---------- 3. วันที่รับของเข้าคลัง (ที่เจ้าหน้าที่กรอกเอง) ----------
-- ต่างจาก received_at ที่มีอยู่เดิม:
--   received_at   timestamptz default now()  = เวลาที่ "กดบันทึก" ในระบบ
--   received_date date                       = วันที่ "รับของจริง" ที่เจ้าหน้าที่ระบุ
-- ใช้ตอนคีย์ย้อนหลัง เช่น รับของเมื่อวาน แต่มาคีย์วันนี้
alter table public.donations
  add column if not exists received_date date;

comment on column public.donations.received_date is
  'วันที่รับของจริงตามที่เจ้าหน้าที่กรอก (คีย์ย้อนหลังได้) — ต่างจาก received_at ที่เป็นเวลาที่กดบันทึก';


-- =====================================================================
-- ตรวจผลหลังรัน — ทั้ง 3 คอลัมน์ต้องโผล่มาครบ
-- =====================================================================
-- select table_name, column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public'
--   and column_name in ('name_en', 'item_name_en', 'received_date')
-- order by table_name, column_name;
--
--
-- หมายเหตุสำหรับคนที่เพิ่มคอลัมน์เหล่านี้
-- ---------------------------------------------------------------------
-- ครั้งหน้าถ้าจะเพิ่ม/แก้โครงสร้างฐานข้อมูล ขอให้เขียนเป็นไฟล์ใน docs/sql/
-- แล้ว commit ขึ้น git ด้วยทุกครั้ง ไม่ใช่รันใน Supabase Dashboard เฉย ๆ
-- เพราะคนอื่นในทีมจะไม่รู้ว่าโครงสร้างเปลี่ยนไปแล้ว และสร้างฐานข้อมูลใหม่
-- ตามไฟล์ไม่ได้
-- =====================================================================

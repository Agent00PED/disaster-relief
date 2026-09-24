-- =====================================================================
-- 35. v_stock_summary: แยกยอดตามข้อกำหนดด้านอาหาร
--
-- ของฮาลาลกับของทั่วไปจ่ายแทนกันไม่ได้ (ดู docs/sql/33_dietary_type.sql)
-- ถ้ารวมยอดไว้ด้วยกัน เจ้าหน้าที่จะเห็นของมากกว่าที่จ่ายได้จริง
-- เช่น ข้าวกล่องฮาลาล 40 + ทั่วไป 60 จะขึ้นเป็น 100 ทั้งที่คำขอฮาลาล
-- รับได้แค่ 40
--
-- ต้อง drop ก่อน create ไม่ใช่ create or replace
-- เพราะ postgres ยอมให้ replace เพิ่มคอลัมน์ได้เฉพาะ "ต่อท้าย" เท่านั้น
-- การแทรก dietary_type ไว้กลางลำดับจะขึ้น error 42P16
--   cannot change name of view column "total_remaining" to "dietary_type"
-- ตรวจแล้วว่าไม่มี view หรือ function อื่นอ้างถึง view นี้ drop ได้ปลอดภัย
-- =====================================================================

drop view if exists public.v_stock_summary;

create view public.v_stock_summary as
select
  center_id,
  category,
  item_name,
  unit,
  dietary_type,
  sum(quantity_remaining) as total_remaining,
  count(*) as lot_count,
  min(expiry_date) filter (where expiry_date is not null) as nearest_expiry
from public.donations
where quantity_remaining > 0
group by center_id, category, item_name, unit, dietary_type;

-- ตรวจผล
select column_name, ordinal_position
  from information_schema.columns
 where table_schema = 'public' and table_name = 'v_stock_summary'
 order by ordinal_position;

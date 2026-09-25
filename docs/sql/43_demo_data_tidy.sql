-- =================================================================
-- 43. เก็บกวาดข้อมูลทดสอบก่อนนำเสนอ
--
-- ระหว่างพัฒนามีการยิงทดสอบหลายรอบ ทำให้มีรายการที่ชื่อขึ้นต้นว่า
-- "ทดสอบ" ค้างอยู่ในคิวงานของเจ้าหน้าที่ ถ้าปล่อยไว้ตอนนำเสนอ
-- จะขึ้นจอปนกับข้อมูลจริง ดูเหมือนยังทำไม่เสร็จ
--
-- ไม่ลบทิ้ง แต่เปลี่ยนเป็นชื่อสมมติที่ดูเป็นข้อมูลจริง เพราะรายการ
-- พวกนี้มีประโยชน์ตอนสาธิต ใช้เป็นคิวให้กดอนุมัติให้อาจารย์ดูได้เลย
-- =================================================================

-- คำร้องแจ้งความประสงค์บริจาค (ของฮาลาล ใช้สาธิตกฎข้อกำหนดด้านอาหาร)
update public.donation_pledges
   set donor_name = 'คุณอาริฟ หมัดสะและ',
       item_name  = 'ข้าวสารฮาลาล 5 กก.'
 where id = 'be01bee0-5d4a-4b2e-a0cb-39f404f1d4ae';

-- คำขอความช่วยเหลือ (ขอฮาลาล ใช้คู่กับล็อตข้างบนได้พอดี)
update public.request_pledges
   set requester_name = 'คุณนูรีย๊ะ สาและ',
       item_name      = 'ข้าวสารฮาลาล'
 where id = '5ac843f1-733b-4b9e-89d9-a5becf760320';

-- ผู้บริจาคที่เกิดจากการทดสอบของทีม
update public.donors
   set name = 'คุณชิดชนก กานต์สิริ'
 where id = 'd2710018-743d-4171-ac7a-8f34d5cdd718';

-- ตรวจผล: ต้องไม่เหลือคำว่า "ทดสอบ" ในคิวงานที่ขึ้นจอ
select 'donation_pledges' as ตาราง, count(*) as เหลือ
  from public.donation_pledges
 where donor_name ilike '%ทดสอบ%' or item_name ilike '%ทดสอบ%'
union all
select 'request_pledges', count(*)
  from public.request_pledges
 where requester_name ilike '%ทดสอบ%' or item_name ilike '%ทดสอบ%'
union all
select 'donors', count(*)
  from public.donors
 where name ilike '%ทดสอบ%';

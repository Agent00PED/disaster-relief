-- =====================================================================
-- 37. ล้างข้อมูลส่วนตัวจริงออกจากข้อมูลเดโม
--
-- ระหว่างพัฒนา มีคนในทีมกรอกอีเมลมหาวิทยาลัยและเบอร์โทรจริงของตัวเอง
-- ลงในข้อมูลทดสอบ repo เป็น public และอาจารย์จะเปิดดูฐานข้อมูลตอนตรวจ
-- จึงต้องเปลี่ยนเป็นข้อมูลสมมติก่อน
--
-- แตะ 3 ตาราง: donors · donation_pledges · request_pledges
--
-- *** หลักการ ***
--   มีประวัติอ้างอิงอยู่  ->  เปลี่ยนชื่อ + ล้างเบอร์/อีเมล (ห้ามลบ)
--   ไม่มีอะไรอ้างถึงเลย   ->  ลบได้
--
-- เหตุผลที่ห้ามลบผู้บริจาคที่มีประวัติ:
--   donations_donor_id_fkey ตั้งเป็น ON DELETE SET NULL
--   ลบแล้วรายการบริจาคไม่หายตาม แต่ช่องผู้บริจาคจะว่าง
--   ใบรับของที่ออกไปแล้วจะไม่มีชื่อคนบริจาค ซึ่งแย่กว่าเดิม
--
-- ชื่อสมมติที่ใช้ เลียนแบบชุดที่มีอยู่แล้วในข้อมูลเดโม ("คุณ<ชื่อ> <สกุล>")
-- เบอร์ใช้รูปแบบ 000-000-00xx เหมือนแถวเดโมเดิม จะได้ดูเป็นชุดเดียวกัน
-- และเห็นได้ชัดว่าเป็นข้อมูลตัวอย่าง
--
-- อีเมลที่ลงท้าย .example ไม่ต้องแตะ เป็นโดเมนสงวนสำหรับตัวอย่างโดยเฉพาะ
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) donors — เปลี่ยนชื่อ + ล้างข้อมูลติดต่อ (ทุกรายมีประวัติบริจาค)
-- ---------------------------------------------------------------------

update public.donors set name = 'คุณกันตพงศ์ ทะเลใส', phone = '000-000-0011', email = null
 where id = '636d7000-dae7-4503-a5fc-700cc588faba';   -- เดิม: ชื่อจริง + อีเมลมหาวิทยาลัย

update public.donors set name = 'คุณพิมพ์ใจ ปันสุข', phone = '000-000-0012', email = null
 where id = 'f584fe2f-b826-4618-88a7-564e926ab2e0';   -- เดิม: ชื่อจริง-นามสกุลจริง

update public.donors set name = 'คุณอรุณ แสงเช้า', phone = '000-000-0013', email = null
 where id = '10be64ca-74d4-4cb5-a42a-aa2aac0c75f6';   -- เดิม: ชื่อจริง + เบอร์จริง

update public.donors set name = 'คุณนภา ฟ้าคราม', phone = '000-000-0014', email = null
 where id = '6797ac65-6aa3-477c-9313-deb8d14a8276';   -- เดิม: ชื่อเล่นคนในทีม

update public.donors set name = 'คุณชลธี สายน้ำ', phone = '000-000-0015', email = null
 where id = '38fed0fb-1338-489f-a3b9-424cc2f2cba9';   -- เดิม: ชื่อล้อเล่น ไม่เหมาะขึ้นจอ

update public.donors set name = 'คุณภูมิ ผาสุก', phone = '000-000-0016', email = null
 where id = '90dad7b9-863c-4e8e-9425-e64536dfcfa5';   -- เดิม: ข้อความเล่น ๆ

update public.donors set name = 'คุณเมธา ร่มไทร', phone = '000-000-0017', email = null
 where id = 'f7a14e61-7fe9-4e20-815d-0f23f2c05649';   -- เดิม: ตัวอักษรรัว ๆ

-- ---------------------------------------------------------------------
-- 2) donors — ลบรายที่ไม่มีการบริจาคอ้างถึงเลย
--    เงื่อนไข not exists กันพลาด เผื่อมีคนเพิ่มรายการให้ระหว่างนี้
-- ---------------------------------------------------------------------

delete from public.donors d
 where d.id in (
   '6350dda1-e4ff-4112-ba99-d75848d68107',   -- กกกก
   '586fbcf2-3e89-4626-9711-e468367af1b3',   -- ขขขขขขข
   'cb785392-d294-4806-b260-24c3abfd5385',   -- สายฟ้า ฟาด
   '83b104cb-d187-4173-82a6-29a2407c494e'    -- มานีมีชัย
 )
 and not exists (select 1 from public.donations dn where dn.donor_id = d.id);

-- ---------------------------------------------------------------------
-- 3) donation_pledges — คำร้องบริจาคจากหน้าสาธารณะ
-- ---------------------------------------------------------------------

update public.donation_pledges
   set donor_name = 'คุณกันตพงศ์ ทะเลใส', donor_phone = '000-000-0011', donor_email = null
 where id = '35cc7985-fb17-4908-8e37-6b03746c66c3';

update public.donation_pledges
   set donor_name = 'คุณนภา ฟ้าคราม', donor_phone = '000-000-0014', donor_email = null
 where id = '4d7e3e17-a05c-4a08-bfd6-b304292536e5';

-- ---------------------------------------------------------------------
-- 4) request_pledges — คำขอความช่วยเหลือจากหน้าสาธารณะ
-- ---------------------------------------------------------------------

update public.request_pledges
   set requester_name = 'คุณกันตพงศ์ ทะเลใส', requester_phone = '000-000-0011', requester_email = null
 where id = '4fbfcd42-73ff-41fd-8a96-878f8ac6c6de';

commit;


-- =====================================================================
-- ตรวจผล — ทั้ง 3 คำสั่งต้องได้ 0 แถว
-- =====================================================================

-- 4.1 ไม่มีอีเมลจริงหลงเหลือ (.example ถือว่าปลอดภัย)
select 'donors' as tbl, name, email from public.donors
 where email is not null and email not like '%.example'
union all
select 'donation_pledges', donor_name, donor_email from public.donation_pledges
 where donor_email is not null and donor_email not like '%.example'
union all
select 'request_pledges', requester_name, requester_email from public.request_pledges
 where requester_email is not null and requester_email not like '%.example';

-- 4.2 ไม่มีเบอร์มือถือรูปแบบจริงหลงเหลือ
select 'donors' as tbl, name, phone from public.donors
 where phone ~ '^0[0-9]{9}$' and phone <> '0000000000'
union all
select 'donation_pledges', donor_name, donor_phone from public.donation_pledges
 where donor_phone ~ '^0[0-9]{9}$'
union all
select 'request_pledges', requester_name, requester_phone from public.request_pledges
 where requester_phone ~ '^0[0-9]{9}$';

-- 4.3 ไม่มีชื่อที่เป็นตัวอักษรรัว ๆ หลงเหลือ
select name from public.donors where name ~ '(.)\1{2,}';

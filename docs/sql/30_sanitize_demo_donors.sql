-- 21_sanitize_demo_donors.sql
-- เปลี่ยนข้อมูลผู้บริจาค demo ให้เป็นชื่อบุคคลสมมติทั้งหมดก่อนแชร์ฐานข้อมูลหรือเดโม
-- รันด้วย SQL Editor ที่มีสิทธิ์ postgres/service role

update public.donors
set name = case id
    when '3048a254-4303-474f-8ef1-7ce5c9fe196d' then 'คุณธารา สายรุ้ง (นามสมมติ)'
    when 'aaaaaaaa-0000-0000-0000-000000000001' then 'คุณฟ้าใส เมฆา (นามสมมติ)'
    when 'aaaaaaaa-0000-0000-0000-000000000002' then 'คุณปันน้ำใจ วัฒนา (นามสมมติ)'
    when 'aaaaaaaa-0000-0000-0000-000000000004' then 'คุณสายรุ้ง ใจดี (นามสมมติ)'
    when 'c360b03b-c6a0-4b64-bee2-5f8b65a82db1' then 'คุณเมฆา พราวฟ้า (นามสมมติ)'
    when '5ca6d2d1-c881-423e-8fc2-7729463a2e7b' then 'คุณดารา แสงทอง (นามสมมติ)'
    when '055c5393-404b-4fdd-9f6d-0c31a84e47be' then 'คุณวารี ร่มเย็น (นามสมมติ)'
    when '95f10f9b-1bfe-4d8a-94ab-a02cf63fb3cb' then 'คุณอรุณ ใจดี (นามสมมติ)'
    when '2a48bea0-3ba9-4e29-a4ad-f4664c5ff37f' then 'คุณนที สดใส (นามสมมติ)'
    else name
  end,
  donor_type = case
    when is_anonymous then 'individual'
    else 'individual'
  end,
  phone = case id
    when '3048a254-4303-474f-8ef1-7ce5c9fe196d' then '000-000-0010'
    when 'aaaaaaaa-0000-0000-0000-000000000001' then '000-000-0001'
    when 'aaaaaaaa-0000-0000-0000-000000000002' then '000-000-0002'
    when 'aaaaaaaa-0000-0000-0000-000000000004' then '000-000-0003'
    when 'c360b03b-c6a0-4b64-bee2-5f8b65a82db1' then '000-000-0004'
    when '5ca6d2d1-c881-423e-8fc2-7729463a2e7b' then '000-000-0005'
    when '055c5393-404b-4fdd-9f6d-0c31a84e47be' then '000-000-0006'
    when '95f10f9b-1bfe-4d8a-94ab-a02cf63fb3cb' then '000-000-0007'
    when '2a48bea0-3ba9-4e29-a4ad-f4664c5ff37f' then '000-000-0008'
    else phone
  end
where id in (
  '3048a254-4303-474f-8ef1-7ce5c9fe196d',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000004',
  'c360b03b-c6a0-4b64-bee2-5f8b65a82db1',
  '5ca6d2d1-c881-423e-8fc2-7729463a2e7b',
  '055c5393-404b-4fdd-9f6d-0c31a84e47be',
  '95f10f9b-1bfe-4d8a-94ab-a02cf63fb3cb',
  '2a48bea0-3ba9-4e29-a4ad-f4664c5ff37f'
);

select id, name, donor_type, phone
from public.donors
where id in (
  '3048a254-4303-474f-8ef1-7ce5c9fe196d',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000004',
  'c360b03b-c6a0-4b64-bee2-5f8b65a82db1',
  '5ca6d2d1-c881-423e-8fc2-7729463a2e7b',
  '055c5393-404b-4fdd-9f6d-0c31a84e47be',
  '95f10f9b-1bfe-4d8a-94ab-a02cf63fb3cb',
  '2a48bea0-3ba9-4e29-a4ad-f4664c5ff37f'
)
order by created_at;

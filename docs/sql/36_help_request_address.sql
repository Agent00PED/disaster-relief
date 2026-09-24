-- =================================================================
-- 36. request_pledges: เพิ่มที่อยู่ของผู้ขอความช่วยเหลือ
--
-- หน้า /help-request เก็บชื่อและเบอร์ แต่ไม่เก็บว่าคนขออยู่ที่ไหน
-- ทำให้เจ้าหน้าที่ต้องโทรถามซ้ำก่อนจัดของไปส่ง
--
-- เก็บเป็น "<ตำบล> <จังหวัด>" ให้ตรงกับที่ donors.address ใช้อยู่
-- =================================================================

alter table public.request_pledges
  add column if not exists address text;

comment on column public.request_pledges.address is
  'ที่อยู่ผู้ขอความช่วยเหลือ เก็บเป็น "<ตำบล> <จังหวัด>"';

-- ตรวจผล
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'request_pledges'
   and column_name = 'address';
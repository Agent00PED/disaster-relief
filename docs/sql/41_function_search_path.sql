-- =================================================================
-- 41. ตั้ง search_path ให้ฟังก์ชัน trigger ที่ยังไม่ได้ตั้ง
--
-- ตัวตรวจความปลอดภัยของ Supabase แจ้งว่า 3 ฟังก์ชันนี้ไม่ได้กำหนด
-- search_path ไว้ ซึ่งแปลว่าตอนทำงานมันจะหาตารางตามลำดับที่ผู้เรียก
-- ตั้งไว้ ถ้ามีคนสร้างตารางชื่อซ้ำใน schema ที่ถูกค้นก่อน public
-- ฟังก์ชันอาจไปอ่านหรือเขียนตารางผิดตัวได้
--
-- ทั้ง 3 ตัวเป็น SECURITY INVOKER (ทำงานด้วยสิทธิ์ของผู้เรียก ไม่ใช่
-- ของเจ้าของฟังก์ชัน) ความเสี่ยงจึงต่ำกว่าฟังก์ชันแบบ DEFINER มาก
-- แต่กำหนดไว้ให้ชัดดีกว่า และไม่มีผลข้างเคียงกับการทำงานเดิม
--
-- ใช้ alter function ไม่ใช่ create or replace เพราะไม่ต้องแตะตัวโค้ด
-- ข้างในเลย จึงไม่มีโอกาสทำ trigger เดิมพัง
-- =================================================================

alter function public.guard_donation_stock()   set search_path = public;
alter function public.guard_request_progress() set search_path = public;
alter function public.prevent_donor_delete()   set search_path = public;

-- ตรวจผล: ทั้ง 3 แถวต้องขึ้น {search_path=public} ในคอลัมน์ config
select p.proname,
       p.prosecdef as is_security_definer,
       p.proconfig as config
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('guard_donation_stock',
                     'guard_request_progress',
                     'prevent_donor_delete')
 order by p.proname;

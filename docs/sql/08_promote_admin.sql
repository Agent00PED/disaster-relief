-- =====================================================================
-- 08_promote_admin.sql — เลื่อนบัญชีตัวเองเป็น admin
--
-- ต้องรัน 07_find_user_id.sql ก่อน เพื่อเอา id (UUID) มาแทนที่
-- 'วาง-user-id-ตรงนี้' ด้านล่าง
--
-- admin ส่วนกลางไม่ผูกกับศูนย์ไหนก็ได้ (center_id ปล่อยเป็น null ได้
-- ตามสคีมา) ถ้าสร้างศูนย์แล้วและอยากผูก ให้ค่อยใส่ center_id ทีหลังได้
--
-- หมายเหตุ: ถ้า user สมัครไว้ก่อนที่จะรัน 02_auth_trigger.sql
-- (trigger สร้าง profile อัตโนมัติ) จะยังไม่มีแถวใน public.profiles
-- ให้ update — ใช้ insert ... on conflict ด้านล่างแทน จะครอบคลุมทั้ง
-- กรณีมีแถวอยู่แล้ว (update role) และกรณียังไม่มีแถว (insert ใหม่)
-- =====================================================================

insert into public.profiles (id, full_name, role)
values ('วาง-user-id-ตรงนี้', '', 'admin')
on conflict (id) do update
  set role = 'admin';

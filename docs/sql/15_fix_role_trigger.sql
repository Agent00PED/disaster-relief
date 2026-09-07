-- =====================================================================
-- 15_fix_role_trigger.sql — แก้ trigger กัน self-escalation (13_volunteer_role.sql)
-- ที่ดันบล็อกการแก้ role ผ่าน SQL Editor ไปด้วยโดยไม่ตั้งใจ
--
-- ปัญหา: trg_prevent_self_role_escalation เช็คแค่ is_admin() ซึ่งอ่านจาก
-- auth.uid() ของ session ที่ login ผ่านแอปเท่านั้น — ตอนรัน SQL ตรงๆ ใน
-- SQL Editor ไม่มี session เลย auth.uid() เป็น null → is_admin() เป็น
-- false เสมอ → trigger เข้าใจผิดว่ามีคน "ไม่ใช่ admin" พยายามแก้ role
-- ตัวเอง เลยดีดค่า role/center_id กลับเป็นของเดิมเงียบๆ (ไม่ error เลย)
--
-- แก้โดยเช็คเพิ่มว่า "มี session ผู้ใช้จริงๆ อยู่ไหม" (auth.uid() is not
-- null) ก่อนจะเริ่มบล็อก — ถ้ารันผ่าน SQL Editor/service role (ไม่มี
-- session) ถือว่าเชื่อถือได้อยู่แล้วโดยธรรมชาติ (ข้าม RLS ได้อยู่แล้ว)
-- ไม่ต้องกันซ้ำอีกชั้น กันเฉพาะตอนมีคน login ผ่านแอปแล้วพยายามแก้ role
-- ตัวเองเท่านั้น ซึ่งเป็นช่องโหว่จริงที่ trigger นี้ตั้งใจจะปิด
-- =====================================================================

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.center_id := old.center_id;
  end if;
  return new;
end;
$$;

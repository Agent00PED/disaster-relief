-- =====================================================================
-- 11_username_login.sql — เข้าสู่ระบบด้วย username แทนอีเมล
--
-- Supabase Auth ผูกกับ email เป็นหลักเสมอ (ไม่มีฟิลด์ username ในตัว)
-- และ staff/admin แต่ละคนอยากใช้ "อีเมลจริงของตัวเอง" สมัคร (คนละโดเมนกัน
-- ต่อ suffix คงที่แบบ username@โดเมนเดียวกันไม่ได้) จึงต้องมีตาราง lookup:
--   username (ที่ผู้ใช้พิมพ์ตอน login) → email จริงใน auth.users
--
-- ฟังก์ชันนี้ต้องเป็น security definer และเปิดให้ role "anon" เรียกได้
-- เพราะตอน login ยังไม่มี session — แต่คืนแค่ email เท่านั้น ไม่คืนข้อมูลอื่น
--
-- ต้องรัน 01_tables.sql ก่อน
-- =====================================================================

alter table public.profiles add column if not exists username text unique;

comment on column public.profiles.username is
  'ชื่อผู้ใช้สำหรับ login แทนอีเมล — ต้องตั้งเองหลังสร้างบัญชีใน Dashboard (ไม่มีช่องนี้ในหน้า Add user ของ Supabase)';

create or replace function public.get_email_by_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username = p_username;
$$;

-- role "anon" ต้องเรียกได้ เพราะยังไม่ login ตอนกดปุ่มเข้าสู่ระบบ
grant execute on function public.get_email_by_username(text) to anon, authenticated;

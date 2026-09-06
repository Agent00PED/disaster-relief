-- =====================================================================
-- 03_rls_helpers.sql — ฟังก์ชันช่วยสำหรับ RLS
--
-- ทำไมต้องใช้ security definer:
-- ถ้าเขียน policy ของตาราง profiles โดย select จาก profiles ตรง ๆ
-- Postgres จะวน policy ซ้ำไม่รู้จบ (infinite recursion)
-- การห่อไว้ใน security definer function ทำให้ query ข้างในข้าม RLS ไปได้
--
-- ต้องรัน 01_tables.sql ก่อน
-- =====================================================================

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_center_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select center_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;

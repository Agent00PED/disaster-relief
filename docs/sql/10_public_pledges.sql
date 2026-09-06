-- =====================================================================
-- 10_public_pledges.sql — ฟีเจอร์ "ผู้ใช้ทั่วไป": แจ้งความประสงค์บริจาค
--
-- เพิ่มเติมจาก requirement ของอาจารย์: ต้องมี user ทั่วไปที่ใช้งานเว็บได้
-- โดยไม่ต้อง login (public / guest) — ไม่แตะ role/RLS เดิมของ
-- staff/admin เลย เพิ่มแบบ additive ล้วนๆ
--
-- แนวคิด: คนทั่วไปกรอกฟอร์ม "แจ้งความประสงค์จะบริจาค" ผ่านหน้าเว็บ
-- สาธารณะ (ไม่ต้อง login) → เข้าคิวรอ staff ตรวจสอบ → staff ยืนยันแล้ว
-- ค่อยแปลงเป็นแถวจริงใน public.donations (ผ่านหน้าเว็บที่มีอยู่แล้ว)
--
-- รันหลัง 01–06 (ต้องมี public.donations และ public.profiles อยู่แล้ว)
-- =====================================================================

create table if not exists public.donation_pledges (
  id           uuid primary key default gen_random_uuid(),
  donor_name   text not null,
  donor_phone  text,
  donor_email  text,
  item_name    text not null,
  category     text not null
               check (category in ('food','water','medicine','clothing','hygiene','other')),
  quantity     int not null check (quantity > 0),
  note         text,
  status       text not null default 'pending'
               check (status in ('pending','contacted','confirmed','dismissed')),

  -- ถ้า staff ยืนยันแล้วแปลงเป็นของบริจาคจริง ผูกไว้ตรงนี้ (nullable)
  converted_donation_id uuid references public.donations(id) on delete set null,
  reviewed_by            uuid references public.profiles(id) on delete set null,

  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);

comment on table public.donation_pledges is
  'คำร้องขอบริจาคจากผู้ใช้ทั่วไป (public, ไม่ต้อง login) — staff ตรวจสอบแล้วค่อยแปลงเป็น public.donations จริง';

create index if not exists idx_pledges_status on public.donation_pledges(status);

alter table public.donation_pledges enable row level security;

-- ผู้ใช้ทั่วไป (ไม่ login เลยก็ได้ — role anon) ส่งคำร้องได้ แต่ดู/แก้ไขไม่ได้
drop policy if exists pledges_public_insert on public.donation_pledges;
create policy pledges_public_insert on public.donation_pledges
  for insert to anon, authenticated
  with check (true);

-- เห็น/แก้ไขได้เฉพาะ staff/admin ที่ login แล้วเท่านั้น
drop policy if exists pledges_staff_select on public.donation_pledges;
create policy pledges_staff_select on public.donation_pledges
  for select to authenticated
  using (true);

drop policy if exists pledges_staff_update on public.donation_pledges;
create policy pledges_staff_update on public.donation_pledges
  for update to authenticated
  using (true)
  with check (true);

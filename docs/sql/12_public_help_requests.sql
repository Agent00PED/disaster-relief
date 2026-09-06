-- =====================================================================
-- 12_public_help_requests.sql — ฟีเจอร์ "ผู้ใช้ทั่วไป": ขอความช่วยเหลือ
--
-- คู่กับ 10_public_pledges.sql (บริจาค) แต่กลับทิศทาง — คนทั่วไปที่
-- เดือดร้อนขอความช่วยเหลือได้โดยไม่ต้อง login เลือกศูนย์พักพิงที่
-- เกี่ยวข้องเอง แล้วรอ staff ของศูนย์นั้นตรวจสอบก่อนแปลงเป็น
-- public.requests จริง — เพิ่มแบบ additive ไม่แตะ RLS/role เดิม
--
-- ต่างจาก donation_pledges ตรงที่ผู้ขอ "เลือกศูนย์" เองตั้งแต่ต้น จึงมี
-- ความหมายจริงว่าใครควรดูแล เลยผูก RLS select/update ตามศูนย์ (เหมือน
-- requests/donations) แทนที่จะเปิดให้ staff ทุกคนเห็นหมดแบบ donation_pledges
--
-- รันหลัง 01–06 (ต้องมี public.requests, public.centers, public.profiles อยู่แล้ว)
-- =====================================================================

create table if not exists public.request_pledges (
  id                   uuid primary key default gen_random_uuid(),
  requester_name       text not null,
  requester_phone      text not null,
  requester_email      text,
  center_id            uuid not null references public.centers(id) on delete restrict,
  item_name            text not null,
  category             text not null
                       check (category in ('food','water','medicine','clothing','hygiene','other')),
  quantity             int not null check (quantity > 0),
  urgency              text not null default 'medium'
                       check (urgency in ('low','medium','high')),
  note                 text,
  status               text not null default 'pending'
                       check (status in ('pending','contacted','confirmed','dismissed')),

  converted_request_id uuid references public.requests(id) on delete set null,
  reviewed_by          uuid references public.profiles(id) on delete set null,

  created_at           timestamptz not null default now(),
  reviewed_at          timestamptz
);

comment on table public.request_pledges is
  'คำขอความช่วยเหลือจากผู้ใช้ทั่วไป (public, ไม่ต้อง login) — staff ของศูนย์ที่ผู้ขอเลือกไว้ตรวจสอบแล้วค่อยแปลงเป็น public.requests จริง';

create index if not exists idx_request_pledges_status on public.request_pledges(status);
create index if not exists idx_request_pledges_center on public.request_pledges(center_id);

alter table public.request_pledges enable row level security;

-- ผู้ใช้ทั่วไป (ไม่ login เลยก็ได้ — role anon) ส่งคำขอได้ แต่ดู/แก้ไขไม่ได้
drop policy if exists request_pledges_public_insert on public.request_pledges;
create policy request_pledges_public_insert on public.request_pledges
  for insert to anon, authenticated
  with check (true);

-- staff เห็นเฉพาะคำขอที่ส่งมาหาศูนย์ตัวเอง / admin เห็นหมด
drop policy if exists request_pledges_staff_select on public.request_pledges;
create policy request_pledges_staff_select on public.request_pledges
  for select to authenticated
  using (public.is_admin() or center_id = public.my_center_id());

drop policy if exists request_pledges_staff_update on public.request_pledges;
create policy request_pledges_staff_update on public.request_pledges
  for update to authenticated
  using (public.is_admin() or center_id = public.my_center_id())
  with check (public.is_admin() or center_id = public.my_center_id());

-- ฟอร์มสาธารณะต้องมี dropdown ให้เลือกศูนย์พักพิง แต่ centers_select เดิม
-- (04_rls_policies.sql) เปิดให้แค่ authenticated เท่านั้น จึงเพิ่ม policy
-- แยกสำหรับ anon โดยเปิดเผยแค่ศูนย์ประเภท "shelter" ที่ยังเปิดใช้งานอยู่
-- (ไม่กระทบ policy เดิม เป็น permissive policy เพิ่มเติมสำหรับ role อื่น)
drop policy if exists centers_select_public_shelters on public.centers;
create policy centers_select_public_shelters on public.centers
  for select to anon
  using (type = 'shelter' and is_active = true);

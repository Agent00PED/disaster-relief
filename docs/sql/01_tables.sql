-- =====================================================================
-- 01_tables.sql — ตาราง (6 ตาราง) + Index
--
-- ระบบติดตามการบริจาคและกระจายสิ่งของช่วยเหลือภัยพิบัติ
-- COE67-331 Web Application Development — Topic 8
--
-- รันตามลำดับ: 01 → 02 → 03 → 04 → 05 → 06
-- =====================================================================

-- ---------- 1. centers : ศูนย์รับบริจาค และ ศูนย์พักพิง ----------
create table if not exists public.centers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text not null check (type in ('warehouse', 'shelter')),
  address       text,
  contact_phone text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

comment on table public.centers is 'ศูนย์ในระบบ: warehouse = ศูนย์รับบริจาค, shelter = ศูนย์พักพิง';


-- ---------- 2. profiles : ผู้ใช้ระบบ (ต่อจาก auth.users) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  role       text not null default 'staff' check (role in ('admin', 'staff')),
  center_id  uuid references public.centers(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on column public.profiles.center_id is 'admin ส่วนกลางปล่อยเป็น null ได้';


-- ---------- 3. donors : ทะเบียนผู้บริจาค ----------
create table if not exists public.donors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  donor_type   text not null default 'individual'
               check (donor_type in ('individual', 'organization')),
  phone        text,
  email        text,
  address      text,
  is_anonymous boolean not null default false,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);


-- ---------- 4. donations : ล็อตของที่รับเข้าคลัง ----------
create table if not exists public.donations (
  id                 uuid primary key default gen_random_uuid(),
  center_id          uuid not null references public.centers(id) on delete restrict,
  donor_id           uuid references public.donors(id) on delete set null,
  item_name          text not null,
  category           text not null
                     check (category in ('food','water','medicine','clothing','hygiene','other')),
  unit               text not null default 'ชิ้น',
  quantity_received  int  not null check (quantity_received > 0),
  quantity_remaining int  not null check (quantity_remaining >= 0),
  expiry_date        date,
  received_by        uuid references public.profiles(id) on delete set null,
  received_at        timestamptz not null default now(),

  -- คงเหลือห้ามเกินยอดที่รับเข้ามา
  constraint donations_remaining_lte_received
    check (quantity_remaining <= quantity_received)
);

comment on table public.donations is 'หนึ่งแถว = หนึ่งล็อต quantity_remaining จะถูกตัดเมื่อมีการจัดสรร';


-- ---------- 5. requests : คำขอจากศูนย์พักพิง ----------
create table if not exists public.requests (
  id                 uuid primary key default gen_random_uuid(),
  center_id          uuid not null references public.centers(id) on delete restrict,
  item_name          text not null,
  category           text not null
                     check (category in ('food','water','medicine','clothing','hygiene','other')),
  quantity_requested int  not null check (quantity_requested > 0),
  quantity_fulfilled int  not null default 0 check (quantity_fulfilled >= 0),
  urgency            text not null default 'medium'
                     check (urgency in ('low','medium','high')),
  status             text not null default 'pending'
                     check (status in ('pending','partial','fulfilled','cancelled')),
  requested_by       uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),

  -- จ่ายแล้วห้ามเกินจำนวนที่ขอ
  constraint requests_fulfilled_lte_requested
    check (quantity_fulfilled <= quantity_requested)
);


-- ---------- 6. allocations : การจัดสรร/ตัดจ่าย ----------
create table if not exists public.allocations (
  id                 uuid primary key default gen_random_uuid(),
  request_id         uuid not null references public.requests(id)  on delete restrict,
  donation_id        uuid not null references public.donations(id) on delete restrict,
  quantity_allocated int  not null check (quantity_allocated > 0),
  status             text not null default 'allocated'
                     check (status in ('allocated','delivered','cancelled')),
  allocated_by       uuid references public.profiles(id) on delete set null,
  allocated_at       timestamptz not null default now(),
  delivered_at       timestamptz
);


-- ---------- Index ที่ใช้บ่อย ----------
create index if not exists idx_profiles_center     on public.profiles(center_id);
create index if not exists idx_donations_center    on public.donations(center_id);
create index if not exists idx_donations_donor     on public.donations(donor_id);
create index if not exists idx_donations_category  on public.donations(category);
create index if not exists idx_donations_expiry    on public.donations(expiry_date);
create index if not exists idx_requests_center     on public.requests(center_id);
create index if not exists idx_requests_status     on public.requests(status);
create index if not exists idx_allocations_request on public.allocations(request_id);
create index if not exists idx_allocations_donation on public.allocations(donation_id);

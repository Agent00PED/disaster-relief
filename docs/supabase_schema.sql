-- =====================================================================
-- ระบบติดตามการบริจาคและกระจายสิ่งของช่วยเหลือภัยพิบัติ
-- COE67-331 Web Application Development — Topic 8
--
-- วิธีใช้: เปิด Supabase Dashboard > SQL Editor > New query
--          วางไฟล์นี้ทั้งหมด แล้วกด Run ครั้งเดียว
-- =====================================================================


-- =====================================================================
-- ส่วนที่ 1: ตาราง (6 ตาราง)
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


-- =====================================================================
-- ส่วนที่ 2: สร้าง profile อัตโนมัติเมื่อมีคนสมัครสมาชิก
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'staff'                      -- สมัครใหม่เป็น staff เสมอ admin ต้องเลื่อนให้ทีหลัง
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- ส่วนที่ 3: ฟังก์ชันช่วยสำหรับ RLS
--
-- ทำไมต้องใช้ security definer:
-- ถ้าเขียน policy ของตาราง profiles โดย select จาก profiles ตรง ๆ
-- Postgres จะวน policy ซ้ำไม่รู้จบ (infinite recursion)
-- การห่อไว้ใน security definer function ทำให้ query ข้างในข้าม RLS ไปได้
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


-- =====================================================================
-- ส่วนที่ 4: Row Level Security
-- =====================================================================

alter table public.centers     enable row level security;
alter table public.profiles    enable row level security;
alter table public.donors      enable row level security;
alter table public.donations   enable row level security;
alter table public.requests    enable row level security;
alter table public.allocations enable row level security;


-- ---------- centers : ทุกคนที่ล็อกอินอ่านได้ / admin เท่านั้นที่แก้ได้ ----------
drop policy if exists centers_select on public.centers;
create policy centers_select on public.centers
  for select to authenticated
  using (true);

drop policy if exists centers_write on public.centers;
create policy centers_write on public.centers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ---------- profiles : เห็นตัวเอง + คนในศูนย์เดียวกัน / admin เห็นทุกคน ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or center_id = public.my_center_id()
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- เฉพาะ admin ที่เปลี่ยน role หรือย้ายศูนย์ให้คนอื่นได้
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ---------- donors : ทุกคนที่ล็อกอินจัดการได้ (ห้ามลบ ใช้ is_active แทน) ----------
drop policy if exists donors_select on public.donors;
create policy donors_select on public.donors
  for select to authenticated
  using (true);

drop policy if exists donors_insert on public.donors;
create policy donors_insert on public.donors
  for insert to authenticated
  with check (true);

drop policy if exists donors_update on public.donors;
create policy donors_update on public.donors
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists donors_delete on public.donors;
create policy donors_delete on public.donors
  for delete to authenticated
  using (public.is_admin());


-- ---------- donations : staff เห็นเฉพาะศูนย์ตัวเอง / admin เห็นหมด ----------
drop policy if exists donations_select on public.donations;
create policy donations_select on public.donations
  for select to authenticated
  using (public.is_admin() or center_id = public.my_center_id());

drop policy if exists donations_insert on public.donations;
create policy donations_insert on public.donations
  for insert to authenticated
  with check (public.is_admin() or center_id = public.my_center_id());

drop policy if exists donations_update on public.donations;
create policy donations_update on public.donations
  for update to authenticated
  using (public.is_admin() or center_id = public.my_center_id())
  with check (public.is_admin() or center_id = public.my_center_id());

drop policy if exists donations_delete on public.donations;
create policy donations_delete on public.donations
  for delete to authenticated
  using (public.is_admin() or center_id = public.my_center_id());


-- ---------- requests : staff เห็นเฉพาะศูนย์ตัวเอง / admin เห็นหมด ----------
drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests
  for select to authenticated
  using (public.is_admin() or center_id = public.my_center_id());

drop policy if exists requests_insert on public.requests;
create policy requests_insert on public.requests
  for insert to authenticated
  with check (public.is_admin() or center_id = public.my_center_id());

drop policy if exists requests_update on public.requests;
create policy requests_update on public.requests
  for update to authenticated
  using (public.is_admin() or center_id = public.my_center_id())
  with check (public.is_admin() or center_id = public.my_center_id());

drop policy if exists requests_delete on public.requests;
create policy requests_delete on public.requests
  for delete to authenticated
  using (public.is_admin() or center_id = public.my_center_id());


-- ---------- allocations : อ่านได้ทุกคนที่ล็อกอิน / เขียนผ่าน function เท่านั้น ----------
drop policy if exists allocations_select on public.allocations;
create policy allocations_select on public.allocations
  for select to authenticated
  using (true);

drop policy if exists allocations_update on public.allocations;
create policy allocations_update on public.allocations
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =====================================================================
-- ส่วนที่ 5: หัวใจของระบบ — ฟังก์ชันตัดสต๊อก
--
-- ทุกอย่างอยู่ใน transaction เดียว ถ้าเงื่อนไขข้อใดข้อหนึ่งไม่ผ่าน
-- จะ raise exception แล้ว rollback ทั้งหมด ยอดคงเหลือไม่มีทางเพี้ยน
--
-- เรียกจากฝั่ง Next.js ด้วย:
--   const { data, error } = await supabase.rpc('allocate_items', {
--     p_request_id: requestId, p_donation_id: donationId, p_quantity: qty
--   })
-- =====================================================================

create or replace function public.allocate_items(
  p_request_id  uuid,
  p_donation_id uuid,
  p_quantity    int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request       public.requests%rowtype;
  v_donation      public.donations%rowtype;
  v_allocation_id uuid;
begin
  -- ตรวจสิทธิ์: ต้องล็อกอินก่อน
  if auth.uid() is null then
    raise exception 'ต้องเข้าสู่ระบบก่อนจึงจะจัดสรรของได้';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'จำนวนที่จัดสรรต้องมากกว่า 0';
  end if;

  -- ล็อกแถวไว้กัน race condition กรณีสองคนกดจ่ายพร้อมกัน
  select * into v_request
    from public.requests where id = p_request_id for update;
  if not found then
    raise exception 'ไม่พบคำขอที่ระบุ';
  end if;

  select * into v_donation
    from public.donations where id = p_donation_id for update;
  if not found then
    raise exception 'ไม่พบล็อตของบริจาคที่ระบุ';
  end if;

  -- กฎข้อ 1: คำขอที่ปิดแล้วห้ามจ่ายเพิ่ม
  if v_request.status in ('fulfilled', 'cancelled') then
    raise exception 'คำขอนี้ปิดแล้ว (สถานะ: %) ไม่สามารถจัดสรรเพิ่มได้', v_request.status;
  end if;

  -- กฎข้อ 2: หมวดหมู่ต้องตรงกัน
  if v_donation.category <> v_request.category then
    raise exception 'หมวดหมู่ไม่ตรงกัน (ของ: % / คำขอ: %)',
      v_donation.category, v_request.category;
  end if;

  -- กฎข้อ 3: ของหมดอายุแล้วห้ามจ่าย
  if v_donation.expiry_date is not null and v_donation.expiry_date < current_date then
    raise exception 'ของล็อตนี้หมดอายุแล้วเมื่อ % ไม่สามารถจ่ายออกได้', v_donation.expiry_date;
  end if;

  -- กฎข้อ 4: ห้ามจ่ายเกินยอดคงเหลือ
  if p_quantity > v_donation.quantity_remaining then
    raise exception 'จ่ายเกินยอดคงเหลือ (ขอจ่าย % แต่คงเหลือ % %)',
      p_quantity, v_donation.quantity_remaining, v_donation.unit;
  end if;

  -- กฎข้อ 5: ห้ามจ่ายเกินจำนวนที่ศูนย์พักพิงขอ
  if v_request.quantity_fulfilled + p_quantity > v_request.quantity_requested then
    raise exception 'จ่ายเกินจำนวนที่ขอ (ขอ % จ่ายไปแล้ว % คงต้องจ่ายอีกไม่เกิน %)',
      v_request.quantity_requested,
      v_request.quantity_fulfilled,
      v_request.quantity_requested - v_request.quantity_fulfilled;
  end if;

  -- ผ่านทุกกฎแล้ว เริ่มตัดยอด
  update public.donations
     set quantity_remaining = quantity_remaining - p_quantity
   where id = p_donation_id;

  update public.requests
     set quantity_fulfilled = quantity_fulfilled + p_quantity,
         status = case
                    when quantity_fulfilled + p_quantity >= quantity_requested
                    then 'fulfilled'
                    else 'partial'
                  end
   where id = p_request_id;

  insert into public.allocations
    (request_id, donation_id, quantity_allocated, allocated_by)
  values
    (p_request_id, p_donation_id, p_quantity, auth.uid())
  returning id into v_allocation_id;

  return v_allocation_id;
end;
$$;


-- ---------- ยกเลิกการจัดสรร แล้วคืนยอดกลับทั้งสองฝั่ง ----------
create or replace function public.cancel_allocation(p_allocation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alloc public.allocations%rowtype;
begin
  if not public.is_admin() then
    raise exception 'เฉพาะ admin เท่านั้นที่ยกเลิกการจัดสรรได้';
  end if;

  select * into v_alloc
    from public.allocations where id = p_allocation_id for update;
  if not found then
    raise exception 'ไม่พบรายการจัดสรรที่ระบุ';
  end if;

  if v_alloc.status = 'cancelled' then
    raise exception 'รายการนี้ถูกยกเลิกไปแล้ว';
  end if;

  if v_alloc.status = 'delivered' then
    raise exception 'ส่งมอบไปแล้ว ไม่สามารถยกเลิกได้';
  end if;

  -- คืนของกลับเข้าคลัง
  update public.donations
     set quantity_remaining = quantity_remaining + v_alloc.quantity_allocated
   where id = v_alloc.donation_id;

  -- ลดยอดที่จ่ายแล้วของคำขอ พร้อมคำนวณสถานะใหม่
  update public.requests
     set quantity_fulfilled = quantity_fulfilled - v_alloc.quantity_allocated,
         status = case
                    when quantity_fulfilled - v_alloc.quantity_allocated <= 0 then 'pending'
                    else 'partial'
                  end
   where id = v_alloc.request_id;

  update public.allocations
     set status = 'cancelled'
   where id = p_allocation_id;
end;
$$;


-- ---------- ยืนยันการส่งมอบ ----------
create or replace function public.mark_delivered(p_allocation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'ต้องเข้าสู่ระบบก่อน';
  end if;

  update public.allocations
     set status = 'delivered',
         delivered_at = now()
   where id = p_allocation_id
     and status = 'allocated';

  if not found then
    raise exception 'ไม่พบรายการที่รอส่งมอบ (อาจถูกยกเลิกหรือส่งมอบไปแล้ว)';
  end if;
end;
$$;


-- ---------- ป้องกันการลบผู้บริจาคที่มีประวัติแล้ว (TC14) ----------
create or replace function public.prevent_donor_delete()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.donations where donor_id = old.id) then
    raise exception 'ผู้บริจาครายนี้มีประวัติการบริจาคแล้ว กรุณาปิดใช้งาน (is_active = false) แทนการลบ';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_prevent_donor_delete on public.donors;
create trigger trg_prevent_donor_delete
  before delete on public.donors
  for each row execute function public.prevent_donor_delete();


-- =====================================================================
-- ส่วนที่ 6: View สำหรับหน้า Dashboard (F3)
-- =====================================================================

-- ยอดคงเหลือรวมแยกตามหมวดหมู่และชื่อของ
create or replace view public.v_stock_summary as
select
  d.center_id,
  d.category,
  d.item_name,
  d.unit,
  sum(d.quantity_remaining)                         as total_remaining,
  count(*)                                          as lot_count,
  min(d.expiry_date) filter (where d.expiry_date is not null) as nearest_expiry
from public.donations d
where d.quantity_remaining > 0
group by d.center_id, d.category, d.item_name, d.unit;


-- ของที่ขาดแคลนที่สุด (ใช้ทำ bar chart 5 อันดับ)
create or replace view public.v_shortage_ranking as
select
  r.category,
  r.item_name,
  sum(r.quantity_requested - r.quantity_fulfilled) as shortage
from public.requests r
where r.status in ('pending', 'partial')
group by r.category, r.item_name
order by shortage desc;


-- ยอดบริจาคสะสมรายผู้บริจาค (F6)
create or replace view public.v_donor_summary as
select
  dn.id            as donor_id,
  dn.name,
  dn.is_anonymous,
  count(d.id)      as donation_count,
  min(d.received_at) as first_donation_at,
  max(d.received_at) as last_donation_at
from public.donors dn
left join public.donations d on d.donor_id = dn.id
group by dn.id, dn.name, dn.is_anonymous;


-- =====================================================================
-- ส่วนที่ 7: ข้อมูลตัวอย่างสำหรับเดโมและเทสต์
-- (ลบทิ้งได้เมื่อขึ้นระบบจริง)
-- =====================================================================

insert into public.centers (id, name, type, address, contact_phone) values
  ('11111111-1111-1111-1111-111111111111', 'ศูนย์รับบริจาคกลาง มวล.', 'warehouse', 'อาคารกิจการนักศึกษา มหาวิทยาลัยวลัยลักษณ์', '075-000-001'),
  ('22222222-2222-2222-2222-222222222222', 'ศูนย์พักพิงโรงเรียนบ้านท่าศาลา', 'shelter', 'ต.ท่าศาลา อ.ท่าศาลา จ.นครศรีธรรมราช', '075-000-002'),
  ('33333333-3333-3333-3333-333333333333', 'ศูนย์พักพิงวัดโมคลาน', 'shelter', 'ต.โมคลาน อ.ท่าศาลา จ.นครศรีธรรมราช', '075-000-003')
on conflict (id) do nothing;

insert into public.donors (id, name, donor_type, phone, is_anonymous) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'บริษัท น้ำใจไทย จำกัด', 'organization', '02-000-0001', false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'คุณสมชาย ใจดี',        'individual',   '081-000-0002', false),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'ผู้ไม่ประสงค์ออกนาม',   'individual',   null,           true),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'ชมรมอาสาพัฒนา มวล.',   'organization', '081-000-0004', false)
on conflict (id) do nothing;

insert into public.donations
  (center_id, donor_id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'น้ำดื่ม 600ml',      'water',    'ขวด',  500, 500, current_date + 180),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'น้ำดื่ม 600ml',      'water',    'ขวด',  200, 200, current_date + 5),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002', 'ข้าวสาร 5 กก.',      'food',     'ถุง',  100, 100, current_date + 365),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002', 'บะหมี่กึ่งสำเร็จรูป', 'food',     'ลัง',   40,  40, current_date + 90),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003', 'ผ้าอนามัย',          'hygiene',  'ห่อ',  120, 120, null),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003', 'ผ้าห่ม',             'clothing', 'ผืน',   80,  80, null),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000004', 'ยาสามัญประจำบ้าน',   'medicine', 'ชุด',   60,  60, current_date + 200),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000004', 'ยาแก้ปวด',           'medicine', 'กล่อง', 30,  30, current_date - 10),  -- หมดอายุแล้ว ใช้เทสต์ TC09
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002', 'นมผงเด็ก',           'food',     'กระป๋อง', 25, 25, current_date + 120),
  ('11111111-1111-1111-1111-111111111111', null,                                   'เสื้อผ้ามือสอง',      'clothing', 'ถุง',   50,  50, null);

insert into public.requests
  (center_id, item_name, category, quantity_requested, urgency) values
  ('22222222-2222-2222-2222-222222222222', 'น้ำดื่ม 600ml',   'water',    300, 'high'),
  ('22222222-2222-2222-2222-222222222222', 'ผ้าอนามัย',       'hygiene',   80, 'high'),
  ('22222222-2222-2222-2222-222222222222', 'ข้าวสาร 5 กก.',   'food',      50, 'medium'),
  ('33333333-3333-3333-3333-333333333333', 'ผ้าห่ม',          'clothing',  60, 'medium'),
  ('33333333-3333-3333-3333-333333333333', 'นมผงเด็ก',        'food',      40, 'high');


-- =====================================================================
-- เสร็จแล้ว
--
-- ขั้นตอนถัดไปหลังรันไฟล์นี้:
--   1. สมัครสมาชิกผ่านหน้าเว็บหรือ Dashboard > Authentication > Add user
--   2. เลื่อนตัวเองเป็น admin:
--        update public.profiles
--           set role = 'admin', center_id = '11111111-1111-1111-1111-111111111111'
--         where id = 'ใส่ user id ของตัวเอง';
--   3. ทดสอบฟังก์ชันตัดสต๊อก:
--        select public.allocate_items('request_id', 'donation_id', 100);
--   4. คัดลอก Project URL และ anon key จาก Settings > API
--      ไปใส่ใน .env.local ของ Next.js:
--        NEXT_PUBLIC_SUPABASE_URL=...
--        NEXT_PUBLIC_SUPABASE_ANON_KEY=...
--      แล้วอย่าลืมตั้งค่าเดียวกันใน Vercel > Settings > Environment Variables
-- =====================================================================

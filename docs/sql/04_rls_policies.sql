-- =====================================================================
-- 04_rls_policies.sql — Row Level Security
--
-- ต้องรัน 01_tables.sql และ 03_rls_helpers.sql ก่อน
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

-- =====================================================================
-- 13_volunteer_role.sql — เพิ่ม role 'volunteer' + เปิด self-register
--
-- ต้องรัน 01-04 (และ 11_username_login.sql เพื่อ login ด้วย username) ก่อน
--
-- สิ่งที่ทำในไฟล์นี้:
--   1. เปิดให้ profiles.role มีค่า 'volunteer' ได้
--   2. แก้ trigger สมัครสมาชิกให้อ่าน role/center_id จาก signUp metadata
--      ได้ "เฉพาะตอนสมัครเป็น volunteer เท่านั้น" — สมัครแบบอื่นๆ (ไม่ส่ง
--      metadata มา) ยังคงได้ role = 'staff' เหมือนเดิมทุกประการ กันไม่ให้
--      ใครส่ง role: 'admin' มาทาง signUp metadata แล้วได้สิทธิ์แอดมินฟรีๆ
--   3. ปิดช่องโหว่ที่มีอยู่เดิม: policy profiles_update_self อนุญาตให้
--      ผู้ใช้ทุกคน update แถวของตัวเองได้ (เพื่อแก้ full_name) แต่ไม่ได้
--      กันไม่ให้แก้ "role" หรือ "center_id" ของตัวเอง — เท่ากับผู้ใช้ทั่วไป
--      สามารถ self-promote เป็น admin ได้ด้วยการ update ตรงๆ ผ่าน client
--      เพิ่ม trigger บังคับให้ role/center_id เปลี่ยนได้เฉพาะตอนที่คน
--      กระทำเป็น admin เท่านั้น (ไม่ว่าจะแก้แถวตัวเองหรือคนอื่น)
--   4. จำกัดสิทธิ์ volunteer: อ่านได้ (โควตาเดียวกับ staff ในศูนย์ตัวเอง)
--      แต่ "ห้ามบันทึกของเข้าคลัง / สร้างคำขอ" — งานสองอย่างนี้ยังเป็น
--      หน้าที่ staff/admin เท่านั้น
-- =====================================================================

-- ---------- 1. เปิด role ใหม่ ----------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'staff', 'volunteer'));


-- ---------- 2. trigger สมัครสมาชิก: รับ role/center_id จาก metadata ได้
--               เฉพาะกรณี role = 'volunteer' เท่านั้น ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  requested_center uuid;
  requested_username text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
begin
  -- allowlist: ยอมรับแค่ค่า 'volunteer' เท่านั้นจาก client, อย่างอื่น
  -- (รวมถึงไม่ส่งมาเลย หรือพยายามส่ง 'admin'/'staff') ตกไปเป็น 'staff' หมด
  if requested_role is distinct from 'volunteer' then
    requested_role := 'staff';
  end if;

  if requested_role = 'volunteer' then
    begin
      requested_center := (new.raw_user_meta_data ->> 'center_id')::uuid;
    exception when others then
      requested_center := null;
    end;
  end if;

  insert into public.profiles (id, full_name, role, center_id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    requested_role,
    requested_center,
    requested_username
  );
  return new;
end;
$$;


-- ---------- 3. กันการ self-promote role/center_id ----------
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.center_id := old.center_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on public.profiles;
create trigger trg_prevent_self_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();


-- ---------- 4. helper: staff หรือ admin เท่านั้น (ไม่รวม volunteer) ----------
create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()) in ('admin', 'staff'),
    false
  );
$$;


-- ---------- 5. donations: insert/update/delete เฉพาะ staff/admin
--               (select ยังเห็นได้เหมือนเดิมทุก role ในศูนย์ตัวเอง) ----------
drop policy if exists donations_insert on public.donations;
create policy donations_insert on public.donations
  for insert to authenticated
  with check (public.is_staff_or_admin() and (public.is_admin() or center_id = public.my_center_id()));

drop policy if exists donations_update on public.donations;
create policy donations_update on public.donations
  for update to authenticated
  using (public.is_staff_or_admin() and (public.is_admin() or center_id = public.my_center_id()))
  with check (public.is_staff_or_admin() and (public.is_admin() or center_id = public.my_center_id()));

drop policy if exists donations_delete on public.donations;
create policy donations_delete on public.donations
  for delete to authenticated
  using (public.is_staff_or_admin() and (public.is_admin() or center_id = public.my_center_id()));


-- ---------- 6. requests: insert/update/delete เฉพาะ staff/admin ----------
drop policy if exists requests_insert on public.requests;
create policy requests_insert on public.requests
  for insert to authenticated
  with check (public.is_staff_or_admin() and (public.is_admin() or center_id = public.my_center_id()));

drop policy if exists requests_update on public.requests;
create policy requests_update on public.requests
  for update to authenticated
  using (public.is_staff_or_admin() and (public.is_admin() or center_id = public.my_center_id()))
  with check (public.is_staff_or_admin() and (public.is_admin() or center_id = public.my_center_id()));

drop policy if exists requests_delete on public.requests;
create policy requests_delete on public.requests
  for delete to authenticated
  using (public.is_staff_or_admin() and (public.is_admin() or center_id = public.my_center_id()));


-- ---------- 7. เปิดให้หน้าสมัครอาสาสมัคร (ยังไม่ login) เห็นรายชื่อ
--               ศูนย์ทั้งหมด (ทั้ง warehouse และ shelter) เพื่อเลือกตอนสมัคร
--               — เดิมมีแค่ policy สำหรับ shelter อย่างเดียว (หน้าขอความ
--               ช่วยเหลือ) อันนี้เผื่อ scope กว้างกว่านั้น ไม่ได้แทนที่กัน ----------
drop policy if exists centers_select_public_register on public.centers;
create policy centers_select_public_register on public.centers
  for select to anon
  using (is_active = true);

-- หมายเหตุ: allocations (การจัดสรร) เดิมทีเขียนได้เฉพาะผ่าน function
-- allocate_items/cancel_allocation/mark_delivered (security definer) อยู่
-- แล้ว ไม่ได้พึ่ง RLS policy ตรงๆ — mark_delivered ที่ volunteer จะใช้
-- ยืนยันรับของ เปิดให้ "ผู้ใช้ที่ login แล้วทุกคน" เรียกได้เหมือนเดิม
-- (ดีไซน์เดิมตั้งแต่ก่อนมี volunteer แล้ว ไม่ได้แก้เพิ่ม)

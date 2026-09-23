-- =====================================================================
-- 33. ข้อกำหนดด้านอาหาร (dietary_type) — ของบริจาค + คำขอ
--
-- ปัญหาเดิม: ฟอร์มรับของบริจาคมีช่อง "ประเภทตามศาสนา" ให้เลือก พุทธ/ฮาลาล
-- ซึ่งผิดหลักสองชั้น
--   1. "พุทธ" คือศาสนา ส่วน "ฮาลาล" คือมาตรฐานรับรองอาหาร ไม่ใช่ของคู่กัน
--      และไม่มีสิ่งที่เรียกว่า "อาหารพุทธ" ในทางปฏิบัติ
--   2. มันไปถามศาสนาของ "ผู้บริจาค" ทั้งที่สิ่งที่ระบบต้องรู้คือ
--      "ของชิ้นนี้ฮาลาลหรือไม่" กับ "ศูนย์นี้ต้องการของฮาลาลหรือไม่"
--      ศาสนาของผู้บริจาคไม่ได้บอกอะไรเกี่ยวกับตัวของเลย
--      และเป็นข้อมูลส่วนตัวที่ไม่มีความจำเป็นต้องเก็บ
--
-- ของเดิมไม่เคยถูกบันทึกลงฐานข้อมูล (ไม่มีคอลัมน์รองรับ) จึงไม่มีข้อมูลเก่า
-- ที่ต้องย้าย
--
-- ค่าที่ใช้ต้องตรงกับ lib/dietary.ts เสมอ ถ้าแก้ที่หนึ่งให้แก้อีกที่ด้วย
-- =====================================================================

begin;

alter table public.donations
  add column if not exists dietary_type text not null default 'general';

alter table public.requests
  add column if not exists dietary_type text not null default 'general';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.donations'::regclass
       and conname  = 'donations_dietary_type_check'
  ) then
    alter table public.donations
      add constraint donations_dietary_type_check
      check (dietary_type in ('general', 'halal', 'vegetarian'));
  end if;

  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.requests'::regclass
       and conname  = 'requests_dietary_type_check'
  ) then
    alter table public.requests
      add constraint requests_dietary_type_check
      check (dietary_type in ('general', 'halal', 'vegetarian'));
  end if;
end $$;

comment on column public.donations.dietary_type is
  'ข้อกำหนดด้านอาหารของล็อตนี้: general | halal | vegetarian (ดู lib/dietary.ts)';

comment on column public.requests.dietary_type is
  'ข้อกำหนดด้านอาหารที่ศูนย์ต้องการ: general = รับได้ทุกแบบ';

commit;


-- ---------------------------------------------------------------------
-- allocate_items: เพิ่มกฎจับคู่ข้อกำหนดด้านอาหาร
--
-- กฎ: คำขอที่ระบุข้อกำหนด (halal / vegetarian) รับได้เฉพาะของที่ตรงกัน
--     คำขอที่เป็น general รับได้ทุกแบบ
--
-- ทิศทางนี้ปลอดภัยด้านเดียวโดยตั้งใจ — ยอมให้คนที่ไม่ได้ระบุข้อกำหนด
-- ได้ของฮาลาล (ไม่เสียหาย) แต่ห้ามคนที่ขอฮาลาลได้ของที่ไม่ใช่ฮาลาล
--
-- ไม่แปลง vegetarian เป็น halal ให้อัตโนมัติ ถึงอาหารมังสวิรัติส่วนใหญ่
-- จะกินได้ แต่ระบบไม่มีทางรู้เรื่องแอลกอฮอล์หรือการปนเปื้อน
-- เดาแทนผู้รับในเรื่องแบบนี้ไม่ได้
--
-- ส่วนที่เหลือของฟังก์ชันคัดลอกจาก docs/sql/23_f5_improvements.sql ทั้งหมด
-- แก้เฉพาะบล็อกที่มีคอมเมนต์ 33. กำกับ
-- ---------------------------------------------------------------------
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
  if auth.uid() is null then
    raise exception 'F5:not_logged_in';
  end if;

  if not public.is_staff_or_admin() then
    raise exception 'F5:not_staff';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'F5:invalid_quantity';
  end if;

  -- ล็อกแถวไว้กัน race condition กรณีสองคนกดจ่ายพร้อมกัน
  select * into v_request
    from public.requests where id = p_request_id for update;
  if not found then
    raise exception 'F5:request_not_found';
  end if;

  select * into v_donation
    from public.donations where id = p_donation_id for update;
  if not found then
    raise exception 'F5:donation_not_found';
  end if;

  -- จัดสรรข้ามศูนย์ = งานของ admin เท่านั้น
  if not public.is_admin() then
    if v_request.center_id <> v_donation.center_id then
      raise exception 'F5:cross_center_admin_only';
    end if;
    if v_donation.center_id is distinct from public.my_center_id() then
      raise exception 'F5:not_your_center';
    end if;
  end if;

  if v_request.status in ('fulfilled', 'cancelled') then
    raise exception 'F5:request_closed';
  end if;

  if v_donation.category <> v_request.category then
    raise exception 'F5:category_mismatch';
  end if;

  -- 33. ข้อกำหนดด้านอาหารต้องตรงกัน ถ้าคำขอระบุไว้
  if coalesce(v_request.dietary_type, 'general') <> 'general'
     and coalesce(v_donation.dietary_type, 'general')
         is distinct from coalesce(v_request.dietary_type, 'general') then
    raise exception 'F5:dietary_mismatch';
  end if;

  if nullif(btrim(v_request.unit), '') is not null
     and btrim(v_donation.unit) <> btrim(v_request.unit) then
    raise exception 'F5:unit_mismatch';
  end if;

  if v_donation.expiry_date is not null
     and v_donation.expiry_date < (now() at time zone 'Asia/Bangkok')::date then
    raise exception 'F5:expired';
  end if;

  if p_quantity > v_donation.quantity_remaining then
    raise exception 'F5:over_remaining';
  end if;

  if v_request.quantity_fulfilled + p_quantity > v_request.quantity_requested then
    raise exception 'F5:over_requested';
  end if;

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

-- allocate_items_multi เรียก allocate_items ทีละล็อตอยู่แล้ว จึงได้กฎนี้ไปด้วย
-- ไม่ต้องแก้ซ้ำ (ดู docs/sql/18_f5_features.sql)

-- ตรวจผล
select table_name, column_name, column_default
  from information_schema.columns
 where table_schema = 'public'
   and column_name  = 'dietary_type'
 order by table_name;

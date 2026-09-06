-- =====================================================================
-- 05_functions.sql — หัวใจของระบบ: ฟังก์ชันตัดสต๊อก + ฟังก์ชันที่เกี่ยวข้อง
--
-- ทุกอย่างอยู่ใน transaction เดียว ถ้าเงื่อนไขข้อใดข้อหนึ่งไม่ผ่าน
-- จะ raise exception แล้ว rollback ทั้งหมด ยอดคงเหลือไม่มีทางเพี้ยน
--
-- เรียกจากฝั่ง Next.js ด้วย:
--   const { data, error } = await supabase.rpc('allocate_items', {
--     p_request_id: requestId, p_donation_id: donationId, p_quantity: qty
--   })
--
-- ต้องรัน 01_tables.sql, 03_rls_helpers.sql ก่อน
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

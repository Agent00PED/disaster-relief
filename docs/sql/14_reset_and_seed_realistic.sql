-- =====================================================================
-- 14_reset_and_seed_realistic.sql — ล้างข้อมูลทดสอบทั้งหมด แล้วสร้างใหม่
-- ให้เป็นสถานการณ์เดียวกัน สมจริง ใช้ demo/ตรวจการบ้านได้ทันที
--
-- ฉากหลัง: อุทกภัยที่อำเภอหาดใหญ่ จังหวัดสงขลา (ตรงกับที่เขียนไว้ใน
-- Week10_Topic8_Analysis.md ข้อ 1 — "อุทกภัยในพื้นที่ภาคใต้")
--
-- ปลอดภัยกับบัญชี login เหมือน 09_reset_data.sql เดิม: ไม่แตะ
-- auth.users / public.profiles เลย — บัญชี admin/staff ที่มีอยู่ยังใช้ได้
-- ปกติ (received_by/requested_by/allocated_by ปล่อยเป็น null หมด เพราะ
-- สคริปต์นี้ไม่รู้ user id จริงในเครื่องคุณ — เข้าเว็บแล้วกดบันทึก/จัดสรร
-- เพิ่มเองได้ ค่าจะเติม profile ของคุณเข้าไปตามปกติ)
--
-- วันหมดอายุทุกรายการคำนวณจาก CURRENT_DATE ตอนรัน ไม่ใช่วันที่ตายตัว
-- เพื่อไม่ให้ข้อมูล "ใกล้หมดอายุ" กลายเป็นข้อมูลเก่าเมื่อรันคนละวัน
--
-- รันได้ซ้ำได้เรื่อยๆ (ล้างของเดิมทิ้งก่อนทุกครั้ง)
-- =====================================================================

truncate table
  public.request_pledges,
  public.donation_pledges,
  public.allocations,
  public.requests,
  public.donations,
  public.donors,
  public.centers
restart identity cascade;

do $$
declare
  v_wh_hatyai      uuid;
  v_wh_songkhla    uuid;
  v_sh_school      uuid;
  v_sh_temple      uuid;
  v_sh_hall        uuid;

  v_donor_ptt      uuid;
  v_donor_mirror   uuid;
  v_donor_somchai  uuid;
  v_donor_wanna    uuid;
  v_donor_711      uuid;
  v_donor_anon     uuid;

  v_don_rice       uuid;
  v_don_water1     uuid;
  v_don_water2     uuid;
  v_don_med        uuid;
  v_don_milk       uuid;
  v_don_cloth      uuid;
  v_don_pad        uuid;
  v_don_torch      uuid;

  v_req_water      uuid;
  v_req_pad        uuid;
  v_req_med        uuid;
  v_req_blanket    uuid;
  v_req_milk       uuid;
begin
  -- ---------- centers ----------
  insert into public.centers (name, type, address, contact_phone) values
    ('ศูนย์รับบริจาคหาดใหญ่', 'warehouse', 'ถ.เพชรเกษม อ.หาดใหญ่ จ.สงขลา', '074-123456')
    returning id into v_wh_hatyai;

  insert into public.centers (name, type, address, contact_phone) values
    ('ศูนย์รับบริจาคเทศบาลนครสงขลา', 'warehouse', 'ถ.รามวิถี อ.เมือง จ.สงขลา', '074-234567')
    returning id into v_wh_songkhla;

  insert into public.centers (name, type, address, contact_phone) values
    ('ศูนย์พักพิงโรงเรียนหาดใหญ่วิทยาลัย', 'shelter', 'ถ.สุนทรานุสรณ์ อ.หาดใหญ่ จ.สงขลา', '074-345678')
    returning id into v_sh_school;

  insert into public.centers (name, type, address, contact_phone) values
    ('ศูนย์พักพิงวัดคลองแห', 'shelter', 'ต.คลองแห อ.หาดใหญ่ จ.สงขลา', '074-456789')
    returning id into v_sh_temple;

  insert into public.centers (name, type, address, contact_phone) values
    ('ศูนย์พักพิงหอประชุมอำเภอ', 'shelter', 'ถ.นิพัทธ์สงเคราะห์ อ.หาดใหญ่ จ.สงขลา', '074-567890')
    returning id into v_sh_hall;

  -- ---------- donors (บุคคล + องค์กร + ไม่ประสงค์ออกนาม) ----------
  insert into public.donors (name, donor_type, phone, email) values
    ('บริษัท ปตท. จำกัด (มหาชน)', 'organization', '02-111-2222', 'csr@pttplc.example')
    returning id into v_donor_ptt;

  insert into public.donors (name, donor_type, phone, email) values
    ('มูลนิธิกระจกเงา', 'organization', '02-333-4444', 'contact@mirror.example')
    returning id into v_donor_mirror;

  insert into public.donors (name, donor_type, phone) values
    ('สมชาย ใจดี', 'individual', '081-234-5678')
    returning id into v_donor_somchai;

  insert into public.donors (name, donor_type, phone) values
    ('วรรณา รักชาติ', 'individual', '089-876-5432')
    returning id into v_donor_wanna;

  insert into public.donors (name, donor_type, phone, email) values
    ('เซเว่นอีเลฟเว่น สาขาหาดใหญ่ใน', 'organization', '074-987654', 'branch@cp711.example')
    returning id into v_donor_711;

  insert into public.donors (name, donor_type, is_anonymous) values
    ('ผู้บริจาคไม่ประสงค์ออกนาม', 'individual', true)
    returning id into v_donor_anon;

  -- ---------- donations (ล็อตของในคลัง — คละวันหมดอายุให้สมจริง) ----------
  -- ข้าวสาร: ยังไม่ถูกจัดสรรเลย (remaining = received) อายุยาว ไม่ใกล้หมด
  insert into public.donations
    (center_id, donor_id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date)
  values
    (v_wh_hatyai, v_donor_ptt, 'ข้าวสารหอมมะลิ 5 กก.', 'food', 'ถุง', 200, 200,
     current_date + interval '10 months')
    returning id into v_don_rice;

  -- น้ำดื่ม 2 ล็อตจากคนละที่ ยังไม่ถูกจัดสรรเลย — ล็อตแรกใกล้หมดอายุมาก
  -- (ตั้งใจให้คู่กับคำขอน้ำดื่ม urgency สูงที่ยังไม่จ่าย เป็นเคส "รีบจัดสรร
  -- ก่อนของหมดอายุ" ให้ demo ตอนสอนเรื่องหน้าจัดสรรได้พอดี)
  insert into public.donations
    (center_id, donor_id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date)
  values
    (v_wh_hatyai, v_donor_711, 'น้ำดื่มขวด 600 มล.', 'water', 'ขวด', 500, 500,
     current_date + interval '5 days')
    returning id into v_don_water1;

  insert into public.donations
    (center_id, donor_id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date)
  values
    (v_wh_songkhla, v_donor_ptt, 'น้ำดื่มขวด 600 มล.', 'water', 'ขวด', 300, 300,
     current_date + interval '8 months')
    returning id into v_don_water2;

  -- ยาสามัญประจำบ้าน: อายุสั้น ใกล้หมด (ตั้งใจให้ warning ขึ้นจริง) —
  -- จ่ายไปแล้ว 20 หน่วยให้คำขอที่ fulfilled ด้านล่าง เหลือ 55 จาก 75
  insert into public.donations
    (center_id, donor_id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date)
  values
    (v_wh_hatyai, v_donor_mirror, 'ชุดยาสามัญประจำบ้าน', 'medicine', 'ชุด', 75, 55,
     current_date + interval '3 days')
    returning id into v_don_med;

  -- นมผงเด็ก: ยังไม่ถูกจัดสรร ใกล้หมดอายุเช่นกัน คนละสาเหตุ (บริจาคมาเยอะ
  -- แต่เก็บได้ไม่นาน)
  insert into public.donations
    (center_id, donor_id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date)
  values
    (v_wh_songkhla, v_donor_wanna, 'นมผงเด็ก 900 กรัม', 'food', 'กระป๋อง', 40, 40,
     current_date + interval '12 days')
    returning id into v_don_milk;

  -- เสื้อผ้ามือสอง: ไม่มีวันหมดอายุ (การจัดสรรที่เคยทำไว้ถูกยกเลิกไปแล้ว
  -- ด้านล่าง เลยไม่กระทบยอดคงเหลือ)
  insert into public.donations
    (center_id, donor_id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date)
  values
    (v_wh_hatyai, v_donor_anon, 'เสื้อผ้าใช้แล้ว (คละไซซ์)', 'clothing', 'ถุง', 150, 150, null)
    returning id into v_don_cloth;

  -- ผ้าอนามัย: บริจาคมาน้อย จ่ายไปแล้ว 8 จาก 38 ที่มี — คงเหลือ 30
  insert into public.donations
    (center_id, donor_id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date)
  values
    (v_wh_songkhla, v_donor_wanna, 'ผ้าอนามัย', 'hygiene', 'แพ็ค', 38, 30, null)
    returning id into v_don_pad;

  -- ไฟฉาย LED: ของใช้ทั่วไป ไม่มีวันหมดอายุ
  insert into public.donations
    (center_id, donor_id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date)
  values
    (v_wh_hatyai, v_donor_somchai, 'ไฟฉาย LED แบบชาร์จ', 'other', 'ชิ้น', 45, 45, null)
    returning id into v_don_torch;

  -- ---------- requests (คำขอจากศูนย์พักพิง — คละความเร่งด่วน/สถานะ) ----------
  insert into public.requests
    (center_id, item_name, category, quantity_requested, quantity_fulfilled, urgency, status)
  values
    (v_sh_school, 'น้ำดื่มขวด 600 มล.', 'water', 200, 0, 'high', 'pending')
    returning id into v_req_water;

  insert into public.requests
    (center_id, item_name, category, quantity_requested, quantity_fulfilled, urgency, status)
  values
    (v_sh_temple, 'ผ้าอนามัย', 'hygiene', 30, 8, 'high', 'partial')
    returning id into v_req_pad;

  insert into public.requests
    (center_id, item_name, category, quantity_requested, quantity_fulfilled, urgency, status)
  values
    (v_sh_hall, 'ชุดยาสามัญประจำบ้าน', 'medicine', 20, 20, 'medium', 'fulfilled')
    returning id into v_req_med;

  insert into public.requests
    (center_id, item_name, category, quantity_requested, quantity_fulfilled, urgency, status)
  values
    (v_sh_school, 'ผ้าห่ม', 'clothing', 50, 0, 'low', 'pending')
    returning id into v_req_blanket;

  insert into public.requests
    (center_id, item_name, category, quantity_requested, quantity_fulfilled, urgency, status)
  values
    (v_sh_temple, 'นมผงเด็ก 900 กรัม', 'food', 15, 0, 'medium', 'pending')
    returning id into v_req_milk;

  -- ---------- allocations (ประวัติจัดสรร — คละสถานะให้ตรงกับคำขอด้านบน) ----------
  -- คำขอ "ผ้าอนามัย" จ่ายบางส่วนแล้ว (8/30) ตรงกับ quantity_fulfilled ด้านบน
  insert into public.allocations (request_id, donation_id, quantity_allocated, status, delivered_at)
  values (v_req_pad, v_don_pad, 8, 'delivered', now() - interval '2 days');

  -- คำขอ "ยาสามัญ" จ่ายครบแล้ว (20/20)
  insert into public.allocations (request_id, donation_id, quantity_allocated, status, delivered_at)
  values (v_req_med, v_don_med, 20, 'delivered', now() - interval '1 day');

  -- ตัวอย่างการยกเลิกการจัดสรร (พลาดเลือกล็อตผิด) — ให้มีเคสนี้ในประวัติด้วย
  insert into public.allocations (request_id, donation_id, quantity_allocated, status)
  values (v_req_blanket, v_don_cloth, 10, 'cancelled');

  -- ---------- donation_pledges (คำร้องขอบริจาคจากคนทั่วไป รอ staff ตรวจสอบ) ----------
  insert into public.donation_pledges (donor_name, donor_phone, donor_email, item_name, category, quantity, note)
  values
    ('ธนาคารกรุงไทย สาขาหาดใหญ่', '074-111222', 'hatyai.branch@ktb.example',
     'ข้าวสารหอมมะลิ 5 กก.', 'food', 100, 'พร้อมส่งภายในสัปดาห์นี้'),
    ('ปิยะดา ศรีสุข', '086-555-1234', null,
     'ผ้าห่มกันหนาว', 'clothing', 25, null);

  -- ---------- request_pledges (คำขอความช่วยเหลือจากคนทั่วไป รอ staff ตรวจสอบ) ----------
  insert into public.request_pledges
    (requester_name, requester_phone, center_id, item_name, category, quantity, urgency, note)
  values
    ('มานพ ทองแท้', '090-222-3344', v_sh_hall,
     'น้ำดื่มขวด 600 มล.', 'water', 40, 'high', 'ครอบครัว 8 คน ไม่มีน้ำดื่มมา 2 วันแล้ว'),
    ('สุนีย์ แก้วมณี', '093-444-5566', v_sh_school,
     'นมผงเด็ก 900 กรัม', 'food', 6, 'medium', 'มีเด็กเล็ก 2 คนในบ้าน');

end $$;

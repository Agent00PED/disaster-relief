-- =====================================================================
-- 06_views.sql — View สำหรับหน้า Dashboard (F3) และรายงานอื่น ๆ
--
-- ต้องรัน 01_tables.sql ก่อน
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

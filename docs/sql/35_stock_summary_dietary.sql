-- =================================================================
    -- 35. v_stock_summary: แยกยอดตามข้อกำหนดด้านอาหาร
    --
    -- ของฮาลาลกับของทั่วไปจ่ายแทนกันไม่ได้ (ดู docs/sql/33_dietary_type.sql)
    -- ถ้ารวมยอดไว้ด้วยกัน เจ้าหน้าที่จะเห็นของมากกว่าที่จ่ายได้จริง
    -- =================================================================

    create or replace view public.v_stock_summary as
    select
      center_id,
      category,
      item_name,
      unit,
      dietary_type,
      sum(quantity_remaining) as total_remaining,
      count(*) as lot_count,
      min(expiry_date) filter (where expiry_date is not null) as nearest_expiry
    from public.donations
    where quantity_remaining > 0
    group by center_id, category, item_name, unit, dietary_type;
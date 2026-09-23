-- =====================================================================
-- 25_public_needs.sql — ตัวเลข "สิ่งที่ศูนย์ยังต้องการ" แบบ realtime
--                        สำหรับผู้ใช้ทั่วไปที่ยังไม่ล็อกอิน (หน้าแรก /)
--
-- ที่มา: comment อาจารย์ — "เพิ่มสิ่งที่ศูนย์จะเปิดรับ/ขอบริจาค ให้ user เห็น"
--
-- ทำไมต้องมีตารางใหม่ แทนที่จะให้ anon อ่าน public.requests ตรง ๆ:
--   1) Supabase Realtime (postgres_changes) subscribe ได้เฉพาะ "ตาราง"
--      เท่านั้น subscribe view ไม่ได้ ถ้าอยากให้เลขขยับเองโดยไม่ต้อง
--      refresh จึงต้องมีตารางจริงให้ subscribe
--   2) ถ้าเปิด RLS ของ requests ให้ anon อ่านได้ คนทั่วไปจะเห็นคำขอ
--      ทุกแถวของทุกศูนย์ (ชื่อของ จำนวน ศูนย์ไหน ด่วนแค่ไหน) ซึ่งเป็น
--      ข้อมูลปฏิบัติการที่ไม่ควรเปิดเผย
--   ตารางนี้จึงเก็บ "เฉพาะตัวเลขที่ตั้งใจจะเปิดเผย" คือยอดรวมรายหมวด
--   ทั้งระบบ — ไม่มี center_id ไม่มี item_name ไม่มีแถวดิบ
--
-- เป็นการเพิ่มแบบ additive ล้วน ๆ ไม่แตะตาราง/RLS/policy เดิมสักบรรทัด
--
-- รันหลัง 01–06 (ต้องมี public.requests) และหลัง 10 (donation_pledges)
-- รันซ้ำได้ ไม่ต้องลบของเดิมก่อน
-- =====================================================================


-- ---------- 1. ตารางสรุป (หนึ่งแถว = หนึ่งหมวดหมู่ มีแค่ 6 แถวตลอดไป) ----------
create table if not exists public.public_needs (
  category      text primary key
                check (category in ('food','water','medicine','clothing','hygiene','other')),

  -- ยอดที่ศูนย์ยังขาด = sum(quantity_requested - quantity_fulfilled)
  -- ของคำขอที่ยังเปิดอยู่ (pending / partial) รวมทุกศูนย์
  shortage      int not null default 0 check (shortage >= 0),

  -- จำนวนศูนย์ที่กำลังขอหมวดนี้ — บอกว่า "กระจายหลายที่" ได้
  -- โดยไม่ต้องเปิดเผยว่าศูนย์ไหน
  center_count  int not null default 0 check (center_count >= 0),

  -- จำนวนคำแจ้งบริจาคที่ยังรอ staff ตรวจสอบในหมวดนี้
  -- สำคัญ: shortage จะลดก็ต่อเมื่อ staff กด "จัดสรร" จริงเท่านั้น
  -- ถ้าไม่โชว์ตัวนี้ คนจะเห็นว่ายังขาดเท่าเดิมทั้งวัน แล้วแห่บริจาค
  -- ของอย่างเดียวกันซ้ำ ๆ (over-donation) — ตัวเลขนี้คือตัวกันปัญหานั้น
  pledged_count int not null default 0 check (pledged_count >= 0),

  updated_at    timestamptz not null default now()
);

comment on table public.public_needs is
  'ยอดสรุปสาธารณะรายหมวดหมู่ สำหรับหน้าแรกที่ผู้ใช้ยังไม่ล็อกอิน — อัปเดตอัตโนมัติด้วย trigger ห้ามแก้ด้วยมือ';


-- ---------- 2. RLS: ทุกคนอ่านได้ ไม่มีใครเขียนได้ ----------
-- มี policy เฉพาะ select แปลว่า insert/update/delete ถูกปฏิเสธทั้ง anon
-- และ authenticated — เขียนได้เฉพาะฟังก์ชัน security definer ข้างล่าง
alter table public.public_needs enable row level security;

drop policy if exists public_needs_select on public.public_needs;
create policy public_needs_select on public.public_needs
  for select to anon, authenticated
  using (true);


-- ---------- 3. ฟังก์ชันคำนวณใหม่ทั้งตาราง ----------
-- คำนวณใหม่ทั้ง 6 หมวดทุกครั้ง (ไม่ใช่เฉพาะหมวดที่เปลี่ยน) เพราะ
--   - มีแค่ 6 แถว ต้นทุนต่ำมาก
--   - ได้ค่าถูกต้องเสมอ ไม่ต้องไล่ว่าใคร +/- เท่าไร
--   - เคส UPDATE ที่ย้ายหมวด (food -> water) จัดการได้ในตัว
create or replace function public.sync_public_needs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.public_needs as pn
    (category, shortage, center_count, pledged_count, updated_at)
  select
    c.category,
    coalesce(r.shortage, 0),
    coalesce(r.center_count, 0),
    coalesce(p.pledged_count, 0),
    now()
  from (
    values ('food'), ('water'), ('medicine'), ('clothing'), ('hygiene'), ('other')
  ) as c(category)
  left join (
    select
      category,
      greatest(0, sum(quantity_requested - quantity_fulfilled))::int as shortage,
      count(distinct center_id)::int                                 as center_count
    from public.requests
    where status in ('pending', 'partial')
    group by category
  ) as r on r.category = c.category
  left join (
    select category, count(*)::int as pledged_count
    from public.donation_pledges
    where status in ('pending', 'contacted')
    group by category
  ) as p on p.category = c.category
  on conflict (category) do update set
    shortage      = excluded.shortage,
    center_count  = excluded.center_count,
    pledged_count = excluded.pledged_count,
    updated_at    = now()
  -- อัปเดตเฉพาะแถวที่ค่าเปลี่ยนจริง ไม่งั้นทุกครั้งที่มีคนแตะ requests
  -- จะยิง realtime event ไปหาทุกเบราว์เซอร์ที่เปิดหน้าแรกค้างไว้
  where pn.shortage      is distinct from excluded.shortage
     or pn.center_count  is distinct from excluded.center_count
     or pn.pledged_count is distinct from excluded.pledged_count;
end
$$;

comment on function public.sync_public_needs() is
  'คำนวณ public_needs ใหม่ทั้งตารางจาก requests + donation_pledges';


-- ---------- 4. Trigger ----------
create or replace function public.trg_sync_public_needs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_public_needs();
  return null;
end
$$;

-- ใช้ "for each statement" ไม่ใช่ "for each row" — การจัดสรรหนึ่งครั้ง
-- อาจ update requests หลายแถวในคำสั่งเดียว (allocate_items_multi)
-- ถ้าใช้ for each row จะคำนวณใหม่ซ้ำหลายรอบโดยไม่จำเป็น
drop trigger if exists requests_sync_public_needs on public.requests;
create trigger requests_sync_public_needs
  after insert or update or delete on public.requests
  for each statement
  execute function public.trg_sync_public_needs();

drop trigger if exists pledges_sync_public_needs on public.donation_pledges;
create trigger pledges_sync_public_needs
  after insert or update or delete on public.donation_pledges
  for each statement
  execute function public.trg_sync_public_needs();


-- ---------- 5. เติมข้อมูลตั้งต้นจากข้อมูลที่มีอยู่แล้ว ----------
-- trigger ทำงานเฉพาะกับการเปลี่ยนแปลงในอนาคต ของที่มีอยู่ตอนนี้ต้อง
-- คำนวณเองหนึ่งครั้ง (ฟังก์ชันสร้างครบทั้ง 6 หมวดแม้ยอดเป็น 0 หน้าเว็บ
-- จะได้ไม่ต้องเดาว่าหมวดไหนหายไป)
select public.sync_public_needs();


-- ---------- 6. เปิด Realtime เฉพาะตารางนี้ ----------
-- รันซ้ำได้ ไม่ error ถ้าเพิ่มไปแล้ว
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_needs'
  ) then
    alter publication supabase_realtime add table public.public_needs;
  end if;
end
$$;


-- =====================================================================
-- ตรวจผลหลังรัน
-- =====================================================================
-- select * from public.public_needs order by shortage desc;
--
-- ทดสอบ realtime (เปิดหน้าแรกค้างไว้ในเบราว์เซอร์ แล้วรันคำสั่งนี้
-- ตัวเลขบนหน้าเว็บต้องขยับเองโดยไม่ต้อง refresh):
--
--   update public.requests
--   set quantity_requested = quantity_requested + 100
--   where status = 'pending' and category = 'water';
--
-- ถ้าเลขไม่ขยับ ให้เช็ค 3 อย่างตามลำดับ
--   1) select * from pg_publication_tables where tablename = 'public_needs';
--      -> ต้องมีแถว ถ้าไม่มี แปลว่าข้อ 6 ไม่ทำงาน
--   2) Supabase Dashboard > Database > Replication -> public_needs ต้องติ๊กอยู่
--   3) หน้าเว็บ: เปิด console ดูว่า channel subscribe สำเร็จไหม
-- =====================================================================

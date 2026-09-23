-- =====================================================================
-- 26_standard_units.sql — ปรับหน่วยของสิ่งของที่อยู่ในฐานข้อมูลแล้ว
--                          ให้ใช้คำมาตรฐานชุดเดียวกัน
--
-- ที่มา: comment อาจารย์ — "เพิ่มหน่วยของวัตถุดิบ หรือของต่างๆ ให้ครบและชัดเจน"
--
-- ปัญหาที่แก้: ตอนจัดสรร ฐานข้อมูลเทียบหน่วยของคำขอกับหน่วยของล็อตแบบ
-- ตรงตัวอักษร (docs/sql/23_f5_improvements.sql บรรทัด 139-141)
--
--     if nullif(btrim(v_request.unit), '') is not null
--        and btrim(v_donation.unit) <> btrim(v_request.unit) then
--       raise exception 'F5:unit_mismatch';
--
-- เดิมทั้ง 3 ฟอร์มให้พิมพ์หน่วยเอง คำว่า "แพ็ค" กับ "แพ็ก" หรือ "กก."
-- กับ "กิโลกรัม" จึงกลายเป็นคนละหน่วย แล้วจัดสรรไม่ผ่านทั้งที่ของมีอยู่
-- ฝั่งหน้าเว็บเปลี่ยนเป็น dropdown แล้ว (lib/units.ts + app/unit-select.tsx)
-- ไฟล์นี้ตามล้างข้อมูลเก่าที่พิมพ์ไว้ก่อนหน้า
--
-- *** ตารางแปลงในไฟล์นี้ต้องตรงกับ UNIT_ALIAS ใน lib/units.ts เสมอ ***
-- ถ้าแก้ที่หนึ่ง ให้แก้อีกที่ด้วย
--
-- รันซ้ำได้ ไม่แตะโครงสร้างตาราง ไม่แตะ RLS
-- =====================================================================


-- ---------- ขั้นที่ 1: PREVIEW — ดูก่อนว่าจะเปลี่ยนอะไรบ้าง ----------
-- รันเฉพาะส่วนนี้ก่อน ถ้าผลลัพธ์ดูถูกต้องค่อยรันขั้นที่ 2
-- (ถ้าไม่มีแถวไหนออกมาเลย แปลว่าข้อมูลสะอาดอยู่แล้ว ข้ามไปขั้นที่ 3 ได้)

with alias(raw, std) as (values
  ('แพ็ก','แพ็ค'), ('แพค','แพ็ค'), ('แพ็คเกจ','แพ็ค'), ('pack','แพ็ค'), ('packs','แพ็ค'),
  ('กก.','กิโลกรัม'), ('กก','กิโลกรัม'), ('กิโล','กิโลกรัม'), ('kg','กิโลกรัม'),
  ('ล.','ลิตร'), ('ลิตร.','ลิตร'), ('l','ลิตร'),
  ('อัน','ชิ้น'), ('ชิ้น.','ชิ้น'), ('pieces','ชิ้น'), ('piece','ชิ้น'),
  ('box','กล่อง'), ('boxes','กล่อง'),
  ('bag','ถุง'), ('bags','ถุง'),
  ('bottle','ขวด'), ('bottles','ขวด'),
  ('can','กระป๋อง'), ('cans','กระป๋อง')
)
select 'donations' as tbl, d.unit as ปัจจุบัน, a.std as จะเปลี่ยนเป็น, count(*) as จำนวนแถว
from public.donations d
join alias a on lower(btrim(d.unit)) = a.raw
group by d.unit, a.std
union all
select 'donations (มีช่องว่างเกิน)', d.unit, btrim(d.unit), count(*)
from public.donations d
where d.unit <> btrim(d.unit)
group by d.unit
union all
select 'requests', r.unit, a.std, count(*)
from public.requests r
join alias a on lower(btrim(r.unit)) = a.raw
group by r.unit, a.std
union all
select 'requests (มีช่องว่างเกิน)', r.unit, btrim(r.unit), count(*)
from public.requests r
where r.unit is not null and r.unit <> btrim(r.unit)
group by r.unit
order by 1, 2;


-- ---------- ขั้นที่ 2: แปลงจริง ----------
-- ทำในทรานแซกชันเดียว ถ้ามีอะไรผิดพลาดจะไม่เปลี่ยนอะไรเลย

begin;

create temp table _unit_alias (raw text primary key, std text not null) on commit drop;
insert into _unit_alias values
  ('แพ็ก','แพ็ค'), ('แพค','แพ็ค'), ('แพ็คเกจ','แพ็ค'), ('pack','แพ็ค'), ('packs','แพ็ค'),
  ('กก.','กิโลกรัม'), ('กก','กิโลกรัม'), ('กิโล','กิโลกรัม'), ('kg','กิโลกรัม'),
  ('ล.','ลิตร'), ('ลิตร.','ลิตร'), ('l','ลิตร'),
  ('อัน','ชิ้น'), ('ชิ้น.','ชิ้น'), ('pieces','ชิ้น'), ('piece','ชิ้น'),
  ('box','กล่อง'), ('boxes','กล่อง'),
  ('bag','ถุง'), ('bags','ถุง'),
  ('bottle','ขวด'), ('bottles','ขวด'),
  ('can','กระป๋อง'), ('cans','กระป๋อง');

-- ตัดช่องว่างหัวท้ายก่อน (เคสที่พบบ่อยสุดและไม่มีความเสี่ยง)
update public.donations set unit = btrim(unit) where unit <> btrim(unit);
update public.requests  set unit = btrim(unit) where unit is not null and unit <> btrim(unit);

-- แล้วค่อยแปลงคำพ้องความหมาย
update public.donations d
set unit = a.std
from _unit_alias a
where lower(d.unit) = a.raw and d.unit <> a.std;

update public.requests r
set unit = a.std
from _unit_alias a
where r.unit is not null and lower(r.unit) = a.raw and r.unit <> a.std;

commit;


-- ---------- ขั้นที่ 3: ตรวจผล ----------
-- ดูว่าตอนนี้ในฐานข้อมูลเหลือหน่วยอะไรบ้าง
-- คอลัมน์ "อยู่ในรายการมาตรฐาน" ควรเป็น true ทุกแถว
-- ถ้ามี false เหลืออยู่ ไม่ใช่ error — แปลว่ามีหน่วยที่เราไม่ได้เตรียมไว้
-- ให้พิจารณาว่าจะเพิ่มเข้า UNITS ใน lib/units.ts หรือเพิ่มเข้าตารางแปลงข้างบน

select
  unit as หน่วย,
  count(*) as จำนวนล็อต,
  unit = any (array['ชิ้น','กล่อง','ถุง','แพ็ค','ขวด','กระป๋อง','ลัง','ชุด',
                    'ห่อ','ซอง','แผง','หลอด','ผืน','กิโลกรัม','ลิตร'])
    as อยู่ในรายการมาตรฐาน
from public.donations
group by unit
order by จำนวนล็อต desc;

select
  unit as หน่วย,
  count(*) as จำนวนคำขอ,
  unit = any (array['ชิ้น','กล่อง','ถุง','แพ็ค','ขวด','กระป๋อง','ลัง','ชุด',
                    'ห่อ','ซอง','แผง','หลอด','ผืน','กิโลกรัม','ลิตร'])
    as อยู่ในรายการมาตรฐาน
from public.requests
where unit is not null
group by unit
order by จำนวนคำขอ desc;


-- =====================================================================
-- หมายเหตุ: ทำไมไม่ใส่ CHECK constraint บังคับหน่วย
-- =====================================================================
-- เคยคิดจะเพิ่ม
--   alter table public.donations add constraint donations_unit_std
--     check (unit = any (array[...]));
-- แต่ไม่ทำเพราะ
--   1) ตอนนี้มี branch ของเพื่อนอีกหลายอันที่แก้ฟอร์มรับของอยู่ ถ้าบังคับ
--      ที่ฐานข้อมูล แล้ว branch ไหนยังส่งค่าเก่ามา จะ insert ไม่ผ่านทันที
--      และ error จะโผล่ตอนนำเสนอ ไม่ใช่ตอน build
--   2) ถ้าวันหลังต้องรับของที่ใช้หน่วยแปลก ๆ (เช่น "ถัง 20 ลิตร") จะต้อง
--      แก้ constraint ก่อนถึงจะบันทึกได้ ซึ่งช้ากว่าการเพิ่มตัวเลือกใน
--      lib/units.ts
-- การบังคับจึงอยู่ที่ฟอร์ม (dropdown) + normalizeUnit() ในทุก server action
-- ซึ่งครอบทุกทางที่เขียนข้อมูลเข้าระบบผ่านหน้าเว็บแล้ว
-- ถ้าภายหลังทุก branch รวมเข้า main เรียบร้อย ค่อยเพิ่ม constraint ได้
-- =====================================================================

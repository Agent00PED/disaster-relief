# Supabase SQL — วิธีใช้

รันทีละไฟล์ตามลำดับเลขใน **Supabase Dashboard > SQL Editor > New query**
(วางเนื้อหาไฟล์นั้นทั้งหมด แล้วกด Run ก่อนไปไฟล์ถัดไป)

| ลำดับ | ไฟล์ | เนื้อหา |
|---|---|---|
| 1 | `01_tables.sql` | ตารางทั้ง 6 ตาราง + index |
| 2 | `02_auth_trigger.sql` | trigger สร้าง profile อัตโนมัติเมื่อสมัครสมาชิก |
| 3 | `03_rls_helpers.sql` | ฟังก์ชันช่วย (`my_role`, `my_center_id`, `is_admin`) |
| 4 | `04_rls_policies.sql` | เปิด RLS + policy ของทุกตาราง |
| 5 | `05_functions.sql` | ฟังก์ชันหลัก `allocate_items`, `cancel_allocation`, `mark_delivered` + trigger กันลบผู้บริจาคที่มีประวัติ |
| 6 | `06_views.sql` | view สำหรับ Dashboard (`v_stock_summary`, `v_shortage_ranking`, `v_donor_summary`) |
| 7 | `07_find_user_id.sql` | หา user id (UUID) ของตัวเองจาก `auth.users` |
| 8 | `08_promote_admin.sql` | เลื่อนบัญชีตัวเองเป็น admin (ต้องเอา id จากไฟล์ 7 มาแทนก่อนรัน) |
| — | `09_reset_data.sql` | (ไม่บังคับ) ล้างข้อมูลใน `centers`/`donors`/`donations`/`requests`/`allocations` ทั้งหมด — ไม่แตะ `auth.users`/`profiles` จึงไม่กระทบสิทธิ์ admin |
| — | `10_public_pledges.sql` | ฟีเจอร์ผู้ใช้ทั่วไป (ไม่ต้อง login): แจ้งความประสงค์บริจาคผ่านตาราง `donation_pledges` — เพิ่มแบบ additive ไม่แตะ RLS/role เดิม |

หลังรันครบ 1–6 แล้ว:

1. คัดลอก **Project URL** และ **anon key** จาก Settings > API ใส่ใน `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   แล้วตั้งค่าเดียวกันใน Vercel > Settings > Environment Variables ด้วย
2. สมัครสมาชิกผ่านหน้าเว็บ (หรือ Dashboard > Authentication > Add user)
3. รัน `07_find_user_id.sql` เพื่อดู id ของตัวเอง แล้วนำไปแทนใน `08_promote_admin.sql` ก่อนรัน เพื่อเลื่อนตัวเองเป็น admin
4. เริ่มสร้างศูนย์ (`centers`) และข้อมูลจริงผ่านหน้าเว็บได้เลย — ไฟล์ชุดนี้จงใจ **ไม่มีข้อมูลตัวอย่าง (seed data)** ตารางว่างพร้อมใช้งานทันที

หมายเหตุ: ไฟล์ `supabase_schema.sql` เดิม (ไฟล์รวมไฟล์เดียว, มีข้อมูลตัวอย่าง) ยังอยู่ในโฟลเดอร์ `docs/` เผื่ออ้างอิง แต่ไม่ต้องใช้แล้วหลังจากมีชุดไฟล์นี้

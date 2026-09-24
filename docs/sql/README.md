# Supabase SQL

## Registration rollout (review with Hum before running SQL)

1. Confirm migrations 27, 28 and 29 have run. Review the shared profile/storage changes with Hum before applying 30 and then 31 in Supabase SQL Editor.
2. Set `SUPABASE_SERVICE_ROLE_KEY` privately in `.env.local` and Vercel environment variables, then restart/redeploy. Never prefix it with `NEXT_PUBLIC_` or commit its value. Registration without a photo does not require this key; registration with a photo does.
3. Use `profiles.id_photo_path` and the existing private `volunteer-ids` bucket. Upload paths start with the Auth user ID. Migration 30 no longer creates a second photo column or bucket. The trigger ignores client-supplied photo paths; the server writes the path after uploading.
4. `birth_date` is the primary value for new registrations; `birth_year` remains the Buddhist-calendar compatibility value. Existing year-only accounts keep a null birth date.

Photos are optional. Signup uses ordinary Supabase Auth first, then the server uploads the photo and updates the profile. If photo storage fails after signup, the account remains valid and the form explicitly asks the user to upload again from `/volunteer`. Failed profile updates trigger file cleanup; cleanup failures are logged for operators. The volunteer page highlights missing photos. Existing storage policies govern owner/admin/center access.

If an earlier version of 30/31 was already applied, inspect existing `identity_photo_path` values and `identity-photos` objects before rollout. These scripts do not migrate or delete legacy photos; plan a separate data migration if any exist.

### Verification before release

- Register with and without a photo; test with email confirmation enabled and disabled.
- Check first/last name, phone, birth_date, Buddhist birth_year, and role `volunteer` on the new profile.
- For photo signup, confirm `id_photo_path` starts with the user ID, storage uses `volunteer-ids`, and `/volunteer` shows and opens the uploaded photo. Check scoped access using owner, admin and center staff accounts.
- Reject PDFs, spoofed image MIME types, oversized files and invalid/future birth dates before creating an account.
- Simulate upload/profile failures: show the recovery message and remove unreferenced uploads without deleting the account. Duplicate signup must not overwrite or delete existing photos.
- Check the homepage motto at 1366px and 375px.

Run SQL files in numeric order in Supabase Dashboard > SQL Editor.

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
| — | `11_username_login.sql` | เข้าสู่ระบบด้วย username แทนอีเมล — เพิ่มคอลัมน์ `profiles.username` + ฟังก์ชัน `get_email_by_username` |
| — | `12_public_help_requests.sql` | ฟีเจอร์ผู้ใช้ทั่วไป (ไม่ต้อง login): ขอความช่วยเหลือผ่านตาราง `request_pledges` — คู่กับ `10_public_pledges.sql` แต่กลับทิศทาง เพิ่มแบบ additive |
| 13 | 13_volunteer_role.sql | เพิ่มบทบาทอาสาสมัครในระบบ |
| 14 | 14_reset_and_seed_realistic.sql | ล้างข้อมูลและจำลองข้อมูลสมจริงสำหรับทดสอบ |
| 15 | 15_fix_role_trigger.sql | แก้ไขการทำงานของ Trigger กำหนดบทบาท |
| — | `17_f5_hardening.sql` | ปิดช่องโหว่สิทธิ์ F5 (รันหลัง `05` และ `13`): `allocate_items` ต้องเป็น staff/admin และจัดสรรข้ามศูนย์ได้เฉพาะ admin, `mark_delivered` เฉพาะ admin/ศูนย์ปลายทาง, ยกเลิกไม่เปิดคำขอที่ถูกยกเลิกกลับมา, `allocations_select` เห็นเฉพาะศูนย์ที่เกี่ยวข้อง — error เป็นรหัส `F5:<key>` ให้หน้าเว็บแปล TH/EN |
| — | `18_f5_features.sql` | ฟีเจอร์เพิ่ม F5 (รันหลัง `17`): `allocate_items_multi` จัดสรรหลายล็อตใน transaction เดียว, คอลัมน์ + บังคับเหตุผลการยกเลิก (`cancel_allocation` รับ `p_reason`), computed column `allocated_by_name` / `cancelled_by_name` สำหรับหน้าประวัติ |
| — | `16_manually_confirm_user.sql` | (ไม่บังคับ) ยืนยันอีเมลของบัญชีที่ค้างสถานะ "Waiting for verification" ด้วย SQL เพราะโปรเจกต์ยังไม่ได้ตั้งค่าส่งอีเมลจริง — แก้อีเมลในไฟล์ก่อนรัน |
| — | `19_dedupe_test_data.sql` | (ไม่บังคับ) ลบข้อมูลทดสอบที่ซ้ำกันใน `requests` / `donations` / `donation_pledges` / `donors` เก็บแถวเก่าสุดไว้ ไม่แตะแถวที่มีการจัดสรรอ้างอิง — รันส่วน PREVIEW ดูก่อน |
| — | `20_cleanup_test_records.sql` | (ไม่บังคับ) ลบข้อมูลทดสอบที่ชื่อขึ้นต้นด้วย `[TEST]` ทุกตาราง — หยุดและย้อนกลับทั้งหมดถ้ามีการจัดสรรที่ผูกของทดสอบกับของจริง |
| — | `21_merge_anonymous_donors.sql` | (ไม่บังคับ) รวมผู้บริจาค "ไม่ประสงค์ออกนาม" หลายแถวให้เหลือแถวเดียว ย้ายของบริจาคไปผูกแถวที่เก็บไว้ — รันส่วน PREVIEW ดูก่อน |
| — | `22_tc_f5_setup.sql` | (ไม่บังคับ) สร้างข้อมูล `[TEST]` สำหรับเก็บหลักฐาน TC07–TC11 ตามขั้นตอนใน `docs/test-evidence/README.md` — ลบด้วย `20` |
| 23 | `23_f5_improvements.sql` | ปรับปรุง F5 (รันหลัง `18`): ผู้ยืนยันและจำนวนที่ได้รับจริงตอนรับของ, กันแก้ยอดคงเหลือ/ยอดคำขอตรงจาก client, หน่วยของคำขอ, `cancel_request` ยกเลิกคำขอพร้อมคืนยอด, staff ยกเลิกรายการของตัวเองได้ภายใน 30 นาที, วันหมดอายุตามเวลาไทย |
| — | `24_f5_tests.sql` | (ไม่บังคับ) ทดสอบกฎ F5 ที่ระดับฐานข้อมูล 20 เคส โดยสวมสิทธิ์ admin/staff/อาสาสมัคร — ย้อนกลับทุกอย่าง ไม่ทิ้งข้อมูลค้าง |
| 25 | `25_public_needs.sql` | ตัวเลข "สิ่งที่ศูนย์ยังต้องการ" แบบ realtime บนหน้าแรก สำหรับผู้ใช้ที่ยังไม่ล็อกอิน — ตาราง `public_needs` (สรุปรายหมวดหมู่) + trigger จาก `requests`/`donation_pledges` + เปิด Realtime เฉพาะตารางนี้ anon อ่านได้อย่างเดียว เขียนไม่ได้ ไม่แตะ RLS เดิม |
| 26 | `26_standard_units.sql` | (ไม่บังคับ) ปรับหน่วยของสิ่งของที่บันทึกไว้แล้วให้เป็นคำมาตรฐานชุดเดียวกัน เช่น `แพ็ก`/`pack` → `แพ็ค`, `กก.` → `กิโลกรัม` แก้ปัญหาจัดสรรไม่ผ่านเพราะ `F5:unit_mismatch` — รันส่วน PREVIEW ดูก่อน |
| 27 | `27_profile_phone.sql` | เบอร์ติดต่อของผู้ใช้ (`profiles.phone`) — หน้าอาสาสมัครแสดงเบอร์เจ้าหน้าที่ของศูนย์ตัวเอง, ฟอร์มสมัครเก็บเบอร์ผ่าน trigger, admin แก้ได้ที่ `/admin/centers` · ไม่ต้องเพิ่ม RLS เพราะ `profiles_select` เปิดให้คนศูนย์เดียวกันอ่านอยู่แล้ว |
| 28 | `28_volunteer_profile.sql` | ข้อมูลอาสาสมัครเพิ่มเติม — `first_name`/`last_name`/`birth_year`/`id_photo_path` ใน `profiles`, trigger เก็บให้ตอนสมัคร, Storage bucket `volunteer-ids` (private 5MB เฉพาะรูป) + policy ผูก path กับ `auth.uid()` · รันหลัง `27` |
| 29 | `29_missing_columns.sql` | เขียนย้อนหลังให้คอลัมน์ที่ถูกเพิ่มลง Supabase ตรง ๆ โดยไม่มีไฟล์ migration — `centers.name_en`, `requests.item_name_en`, `donations.received_date` · ไม่เปลี่ยนข้อมูลเดิม มีไว้ให้ฐานข้อมูลที่สร้างใหม่โครงสร้างตรงกับของจริง |
| 30 | 30_registration_details.sql | เพิ่มรายละเอียดการลงทะเบียน |
| 31 | 31_registration_birth_date.sql | เพิ่มฟิลด์วันเกิดในการลงทะเบียน |
| 32 | 32_pledge_unit.sql | ปรับปรุงหน่วยการบริจาค (Pledge) |
| 33 | 33_dietary_type.sql | เพิ่มระบบแยกข้อกำหนดด้านอาหาร (ฮาลาล/ทั่วไป) |
| 34 | 34_sanitize_demo_donors.sql | ล้างข้อมูลผู้บริจาคตัวอย่างให้ปลอดภัย |

หลังรันครบ 1–6 แล้ว:

1. คัดลอก **Project URL** และ **anon key** จาก Settings > API ใส่ใน `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   แล้วตั้งค่าเดียวกันใน Vercel > Settings > Environment Variables ด้วย
2. สมัครสมาชิกผ่าน Dashboard > Authentication > Add user ด้วย**อีเมลจริง**ของแต่ละคน (ติ๊ก Auto Confirm User ด้วย ไม่งั้นต้องไปยืนยันอีเมลก่อน)
3. รัน `07_find_user_id.sql` เพื่อดู id ของตัวเอง แล้วนำไปแทนใน `08_promote_admin.sql` ก่อนรัน เพื่อเลื่อนตัวเองเป็น admin
4. ตั้ง username ให้ตัวเอง (หลังรัน `11_username_login.sql` แล้ว) — Dashboard ไม่มีช่อง username ให้กรอกตรงๆ ต้องรัน SQL เอง:
   ```sql
   update public.profiles set username = 'ชื่อที่อยากใช้ login' where id = 'user-id-จากข้อ-3';
   ```
5. เริ่มสร้างศูนย์ (`centers`) และข้อมูลจริงผ่านหน้าเว็บได้เลย — ไฟล์ชุดนี้จงใจ **ไม่มีข้อมูลตัวอย่าง (seed data)** ตารางว่างพร้อมใช้งานทันที

หมายเหตุ: ไฟล์ `supabase_schema.sql` เดิม (ไฟล์รวมไฟล์เดียว, มีข้อมูลตัวอย่าง) ยังอยู่ในโฟลเดอร์ `docs/` เผื่ออ้างอิง แต่ไม่ต้องใช้แล้วหลังจากมีชุดไฟล์นี้

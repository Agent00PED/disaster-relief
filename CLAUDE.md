# โปรเจกต์: ระบบติดตามการบริจาคและกระจายสิ่งของช่วยเหลือภัยพิบัติ

Mini Project วิชา COE67-331 Web Application Development
มหาวิทยาลัยวลัยลักษณ์ · อาจารย์ Mallika Kliangkhlao · หัวข้อที่ 8

## บริบทที่ต้องรู้ก่อนช่วย

- นี่คือ**งานนักศึกษา** ไม่ใช่ระบบ production ทีมมี 6 คน ระดับความรู้ไม่เท่ากัน
- ผู้ใช้ระบบคือ**เจ้าหน้าที่ศูนย์รับบริจาคและศูนย์พักพิง** ไม่ใช่ผู้บริจาคทั่วไป — เป็น internal tool
- ทุกคนต้อง**อธิบายโค้ดตัวเองด้วยปากเปล่าได้** ตอนสอบปลายภาค ถ้าอธิบายไม่ได้จะโดนหักคะแนน
- กำหนดส่งงานนำเสนอ: สัปดาห์ที่ 14 (ประมาณ 19-20 กันยายน 2569)

**ผลที่ตามมาสำหรับการช่วยเหลือ:** อธิบายเหตุผลของโค้ดเสมอ อย่าเขียนโค้ดฉลาดที่อ่านยาก
เลือกวิธีที่ตรงไปตรงมาแม้จะยาวกว่า และเขียนคอมเมนต์ภาษาไทยในจุดที่ไม่ชัดเจน

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase — Auth, Postgres, RLS, Postgres functions
- Deploy บน Vercel
- ไม่ใช้ ORM ใด ๆ เรียก Supabase client ตรง

## โครงสร้างที่ทุกฟีเจอร์ใช้เหมือนกัน

แต่ละฟีเจอร์อยู่ในโฟลเดอร์ `app/<ชื่อฟีเจอร์>/` ประกอบด้วย 4 ไฟล์:

| ไฟล์ | หน้าที่ |
|---|---|
| `page.tsx` | Server Component ดึงข้อมูลมาแสดง (Read) |
| `actions.ts` | Server Action สำหรับ Create / Update / Delete |
| `xxx-form.tsx` | Client Component ฟอร์มกรอกข้อมูล |
| `xxx-button.tsx` | Client Component ปุ่มที่ต้องมี onClick |

ดูตัวอย่างที่ทำเสร็จแล้วได้ที่ `app/donors/` — ใช้เป็นแม่แบบสำหรับฟีเจอร์อื่น

ไฟล์ของกลางที่**ห้ามแก้โดยไม่แจ้งทีม**:
`lib/supabase/client.ts` · `lib/supabase/server.ts` · `lib/supabase/proxy.ts` · `proxy.ts`

## ฐานข้อมูล 6 ตาราง

- `centers` — ศูนย์รับบริจาค (`warehouse`) และศูนย์พักพิง (`shelter`)
- `profiles` — ผู้ใช้ระบบ ต่อจาก `auth.users` มี `role` (`admin`/`staff`) และ `center_id`
- `donors` — ทะเบียนผู้บริจาค
- `donations` — ล็อตของที่รับเข้าคลัง มี `quantity_remaining` ที่ถูกตัดเมื่อจัดสรร
- `requests` — คำขอจากศูนย์พักพิง มี `quantity_fulfilled` และ `status`
- `allocations` — การจัดสรร เชื่อม `requests` กับ `donations`

Schema เต็มอยู่ที่ `docs/supabase_schema.sql` — **ถ้าจะแก้ตาราง ต้องแก้ไฟล์นี้ด้วยเสมอ**
ไม่ใช่แก้แค่ใน Supabase Dashboard ไม่งั้นเพื่อนที่ตั้ง project ใหม่จะได้ schema ไม่ตรงกัน

## กฎทางธุรกิจที่ห้ามละเมิด

ทั้งหมดบังคับที่ฐานข้อมูล ไม่ใช่แค่ฝั่งเว็บ:

1. `quantity_remaining` ห้ามติดลบ และห้ามเกิน `quantity_received`
2. `quantity_fulfilled` ห้ามเกิน `quantity_requested`
3. ห้ามจ่ายของที่ `expiry_date` เลยวันนี้แล้ว
4. หมวดหมู่ของที่จ่าย ต้องตรงกับหมวดหมู่ในคำขอ
5. คำขอที่ `fulfilled` หรือ `cancelled` แล้ว ห้ามจัดสรรเพิ่ม
6. ห้ามลบผู้บริจาคที่มีประวัติบริจาคแล้ว ให้ตั้ง `is_active = false`

**การตัดสต๊อกต้องเรียกผ่าน `supabase.rpc('allocate_items', ...)` เท่านั้น**
ห้ามเขียน update ตรงจากฝั่ง client เด็ดขาด เพราะฟังก์ชันนั้นใช้ `SELECT ... FOR UPDATE`
ล็อกแถวไว้กัน race condition ตอนเจ้าหน้าที่สองคนกดจ่ายจากล็อตเดียวกันพร้อมกัน

## กฎการเขียนโค้ด

- ใช้ `getUser()` เสมอ **ห้ามใช้ `getSession()`** ตัดสินสิทธิ์ เพราะ `getSession()` อ่านจาก cookie ที่ปลอมได้
- ตรวจสิทธิ์ซ้ำใน Server Action ทุกตัว แม้ proxy.ts จะกันไว้แล้ว เพราะ Server Action ถูกเรียกตรงจากภายนอกได้
- Server Component เป็นค่าเริ่มต้น ใช้ `'use client'` เฉพาะเมื่อต้องการ state หรือ event handler จริง ๆ
- ทำ Client Component ให้เล็กที่สุด แยกเฉพาะปุ่มหรือฟอร์ม ไม่ใช่ทั้งหน้า
- แปลงค่าว่างเป็น `null` ก่อนบันทึกลงคอลัมน์ที่เป็น nullable
- ข้อความ error ที่แสดงต่อผู้ใช้เป็นภาษาไทย และต้องบอกว่าต้องทำอะไรต่อ ไม่ใช่แค่บอกว่าผิด
- ตอน login ห้ามแยกว่า "อีเมลผิด" หรือ "รหัสผ่านผิด" เพราะเป็นการยืนยันให้คนนอกรู้ว่าอีเมลนี้มีบัญชีอยู่

## RLS

ทุกตารางเปิด RLS แล้ว หลักการคือ `staff` เห็นเฉพาะข้อมูลของศูนย์ที่ตัวเองสังกัด ส่วน `admin` เห็นทั้งหมด

ใช้ helper function `public.my_role()`, `public.my_center_id()`, `public.is_admin()` ใน policy
ทั้งสามตัวเป็น `security definer` **ห้ามเปลี่ยนเป็นการ select จาก `profiles` ตรง ๆ ใน policy**
เพราะจะเกิด infinite recursion แล้วทั้งระบบพัง

**อาการเวลา RLS ผิด: query ไม่ error แต่คืนค่าว่าง** ถ้าเจอ array ว่างทั้งที่มีข้อมูลใน Table Editor
ให้สงสัย RLS ก่อนเสมอ อย่าไปไล่หาบั๊กในโค้ด React

## Git

- แต่ละคนทำงานบน branch ของตัวเอง: `feat/auth` `feat/donations` `feat/inventory` `feat/requests` `feat/allocations` `feat/donors`
- ห้าม push เข้า `main` ตรง ๆ ให้เปิด Pull Request
- ห้าม commit ไฟล์ `.env.local`
- **commit ต้องใช้บัญชี git ของเจ้าของงานเท่านั้น** เพราะ commit log เป็นหลักฐานประเมินคะแนนรายบุคคล
  อย่าเสนอให้ commit แทนคนอื่นหรือรวม commit ของหลายคนเป็นก้อนเดียว

## คำสั่งที่ใช้บ่อย

```bash
npm run dev      # รันเครื่องตัวเอง localhost:3000
npm run build    # ต้องผ่านก่อนเปิด PR เสมอ
npm run lint
```

## เอกสารประกอบ

- `docs/Week10_Topic8_Analysis.md` — user story, backlog, test case, ตารางแบ่งงาน
- `docs/supabase_schema.sql` — schema เต็ม พร้อม RLS และ function
- `docs/diagrams/` — ER Diagram และ Use Case Diagram

## สิ่งที่อยู่นอกขอบเขต (ห้ามเสนอให้ทำ)

แผนที่ · การวางแผนเส้นทางขนส่ง · สแกนบาร์โค้ด · realtime subscription ·
push notification · ระบบบริจาคเงิน · ORM · เปลี่ยน framework

ทีมตัดสินใจตัดออกแล้วด้วยเหตุผลเรื่องเวลา ถ้าเสนอเพิ่มจะทำให้ส่งงานไม่ทัน

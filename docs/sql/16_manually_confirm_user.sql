-- =====================================================================
-- 16_manually_confirm_user.sql — ยืนยันอีเมลของผู้ใช้เองผ่าน SQL
--
-- ใช้ตอนบัญชีค้างสถานะ "Waiting for verification" ใน Authentication > Users
-- เพราะโปรเจกต์นี้ยังไม่ได้ตั้งค่าส่งอีเมลจริง (dev/class project)
--
-- แก้ p_email ด้านล่างเป็นอีเมลของบัญชีที่ค้างอยู่ แล้วรันทีละคน
-- =====================================================================

-- หมายเหตุ: อัปเดตแค่ email_confirmed_at พอ — ใน Supabase เวอร์ชันใหม่
-- คอลัมน์ confirmed_at เป็น generated column (คำนวณจาก email_confirmed_at
-- ให้อัตโนมัติ) แก้ตรงๆ ไม่ได้ ไม่ต้องไปยุ่งกับมัน
update auth.users
set email_confirmed_at = now()
where email = 'ใส่อีเมลของบัญชีที่ค้างตรงนี้'
  and email_confirmed_at is null;

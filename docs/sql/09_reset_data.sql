-- =====================================================================
-- 09_reset_data.sql — ล้างข้อมูลในตารางข้อมูลจริงทั้งหมด (เริ่มใหม่)
--
-- ปลอดภัยกับบัญชี login: ไม่แตะ auth.users และ public.profiles
-- จึงไม่กระทบสิทธิ์ admin ที่ตั้งไว้ใน 08_promote_admin.sql
--
-- ใช้ตอนอยากล้างข้อมูลทดสอบแล้วเริ่มกรอกข้อมูลจริงใหม่
-- =====================================================================

truncate table
  public.allocations,
  public.requests,
  public.donations,
  public.donors,
  public.centers
restart identity cascade;

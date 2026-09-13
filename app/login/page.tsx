// =====================================================================
// หน้าเข้าสู่ระบบ — เป็น Server Component เพื่อดึง locale/dictionary มาก่อน
// ส่วน interactive จริงๆ (form/state) อยู่ใน login-form.tsx ('use client')
//
// หมายเหตุ: หน้านี้เป็นของกลาง คนที่ทำ feat/auth จะมาต่อยอดเรื่อง
//           สมัครสมาชิก / ลืมรหัสผ่าน / จัดการสิทธิ์ ทีหลัง
// =====================================================================

import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const locale = await getLocale()
  const dict = getDictionary(locale)

  return <LoginForm dict={dict} />
}

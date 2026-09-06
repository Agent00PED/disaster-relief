// =====================================================================
// ไฟล์นี้ต้องอยู่ที่ "รากโปรเจกต์" เท่านั้น (ระดับเดียวกับ package.json)
// ถ้าเอาไปวางใน app/ จะไม่ทำงาน
//
// หมายเหตุ: Next.js 16 เปลี่ยนชื่อ middleware.ts เป็น proxy.ts
//           (ชื่อ middleware ยังใช้ได้แต่ขึ้นคำเตือน deprecated)
//           ตัวฟังก์ชันก็ต้องชื่อ proxy ตามไปด้วย
// =====================================================================

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // ทำงานกับทุก path ยกเว้นไฟล์ static และรูปภาพ
    // ถ้าไม่ยกเว้น proxy จะรันตอนโหลดรูปทุกใบด้วย ซึ่งช้าโดยเปล่าประโยชน์
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

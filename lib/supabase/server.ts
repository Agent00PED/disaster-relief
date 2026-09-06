// =====================================================================
// Supabase client สำหรับฝั่ง "เซิร์ฟเวอร์"
// ใช้ใน Server Component (page.tsx) และ Server Action (actions.ts)
//
// สำคัญ: ต้องเรียก createClient() ใหม่ทุกครั้งที่มี request เข้ามา
//        ห้ามสร้างตัวแปร client ไว้นอกฟังก์ชันแล้วใช้ร่วมกัน
//        เพราะแต่ละ request เป็นคนละผู้ใช้ ถ้าใช้ตัวเดียวกันข้อมูลจะปนกัน
//
// ไฟล์นี้เป็น "ของกลาง" — ห้ามแก้โดยไม่แจ้งทีม
// =====================================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // Next.js 16: cookies() เป็น async function ต้อง await เสมอ
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component เขียน cookie ไม่ได้ (HTTP ห้ามส่ง cookie หลังเริ่ม stream แล้ว)
            // จึงจะโยน error ตรงนี้เสมอ — ไม่เป็นไร เพราะ proxy.ts รีเฟรช token
            // ให้เรียบร้อยแล้วก่อนหน้าจะถูก render
            // ถ้าลบ try/catch ออก หน้าเว็บจะพังตอน token หมดอายุ
          }
        },
      },
    },
  )
}

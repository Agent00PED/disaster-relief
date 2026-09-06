// =====================================================================
// Supabase client สำหรับฝั่ง "เบราว์เซอร์" (Client Component เท่านั้น)
//
// ใช้ในไฟล์ที่มี 'use client' เช่น หน้า login ที่ต้องเรียก signInWithPassword
// ถ้าอยู่ใน Server Component ให้ใช้ lib/supabase/server.ts แทน
//
// ไฟล์นี้เป็น "ของกลาง" — ห้ามแก้โดยไม่แจ้งทีม
// =====================================================================

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // NEXT_PUBLIC_ ขึ้นต้นแบบนี้ = ค่าถูกฝังลงไปใน bundle ที่ส่งให้เบราว์เซอร์
  // จึงใส่ได้เฉพาะ anon key เท่านั้น ห้ามเอา service_role key มาใส่เด็ดขาด
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

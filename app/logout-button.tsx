'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// แยกเป็น client component เพราะต้องมี onClick (เหมือน print-button.tsx
// ของหน้าใบรับของ) — ส่วน nav ที่ครอบมันยังเป็น Server Component ได้ตามปกติ
export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-slate-500 hover:text-slate-900"
    >
      ออกจากระบบ
    </button>
  )
}

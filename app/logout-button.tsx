'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// แยกเป็น client component เพราะต้องมี onClick (เหมือน print-button.tsx
// ของหน้าใบรับของ) — ส่วน nav ที่ครอบมันยังเป็น Server Component ได้ตามปกติ
export function LogoutButton({ label, onDark = false }: { label: string; onDark?: boolean }) {
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
      className={
        onDark
          ? 'text-sm font-medium text-blue-100 hover:text-white'
          : 'text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
      }
    >
      {label}
    </button>
  )
}

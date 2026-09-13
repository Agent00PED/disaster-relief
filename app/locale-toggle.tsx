'use client'

import { usePathname } from 'next/navigation'
import { setLocale } from '@/lib/i18n/actions'
import type { Locale } from '@/lib/i18n/locale'

// สลับภาษาผ่าน server action (ตั้ง cookie แล้ว redirect กลับหน้าเดิม) แทน
// การใช้ client state เพราะข้อความทุกหน้าอ่านจาก dictionary ฝั่ง server
// component ตอน render — ต้อง reload หน้าจริงๆ ถึงจะเปลี่ยนภาษาเห็นผลทั่วเว็บ
//
// onDark: ดูหมายเหตุเดียวกับ ThemeToggle — ใช้บน nav พื้นเข้ม vs หน้า
// สาธารณะพื้นสว่างที่ไม่มี nav
export function LocaleToggle({
  locale,
  label,
  onDark = false,
}: {
  locale: Locale
  label: string
  onDark?: boolean
}) {
  const pathname = usePathname()
  const nextLocale: Locale = locale === 'th' ? 'en' : 'th'

  const colorClass = onDark
    ? 'text-blue-100 hover:text-white hover:bg-white/10'
    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10'

  return (
    <form action={setLocale}>
      <input type="hidden" name="path" value={pathname} />
      <input type="hidden" name="locale" value={nextLocale} />
      <button
        type="submit"
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}
        title={label}
      >
        {locale === 'th' ? 'EN' : 'TH'}
      </button>
    </form>
  )
}

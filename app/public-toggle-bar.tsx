import { ThemeToggle } from './theme-toggle'
import { LocaleToggle } from './locale-toggle'
import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locale'

// หน้าสาธารณะ (Entry Hub, login, register, pledge, help-request) ไม่มี
// <Nav> เลย (root layout เรนเดอร์ nav เฉพาะตอน login แล้ว) แต่โจทย์ต้องการ
// ให้สลับธีม/ภาษาได้ "ทุกหน้า" เลยลอยแถบเล็กๆ นี้ไว้มุมขวาบนแทน
export function PublicToggleBar({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)

  return (
    <div className="fixed right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-white/70 px-1 py-1 shadow-sm backdrop-blur dark:bg-slate-800/70">
      <LocaleToggle locale={locale} label={dict.common.langToggleLabel} />
      <ThemeToggle
        labelToDark={dict.common.themeToggleToDark}
        labelToLight={dict.common.themeToggleToLight}
      />
    </div>
  )
}

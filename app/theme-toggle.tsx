'use client'

// ปุ่มสลับ dark/light — เก็บค่าใน cookie "theme" ให้ root layout อ่านฝั่ง
// server แล้วใส่ class `dark` มาตั้งแต่ HTML แรก จึงไม่กระพริบตอนโหลด
// ไม่ใช้ useState — icon สลับด้วย CSS (`dark:` variant) ตาม class บน <html>
// เลยไม่ต้องอ่าน DOM ใน effect (ชน react-hooks/set-state-in-effect)
//
// onDark: ใช้บนแถบ nav พื้นกรมท่าเข้ม (ตัวหนังสือสีอ่อน) — หน้าสาธารณะที่
// ไม่มี nav (พื้นสว่าง) ใช้ค่า default (ตัวหนังสือสีเข้ม) แทน เหมือน pattern
// ของ BrandMark/LogoutButton ที่มีอยู่แล้ว
export function ThemeToggle({
  labelToDark,
  labelToLight,
  onDark = false,
}: {
  labelToDark: string
  labelToLight: string
  onDark?: boolean
}) {
  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    document.cookie = `theme=${next ? 'dark' : 'light'}; Path=/; Max-Age=31536000; SameSite=Lax`
  }

  const colorClass = onDark
    ? 'text-blue-100 hover:text-white hover:bg-white/10'
    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={labelToDark}
      title={labelToDark}
      className={`flex h-8 w-8 items-center justify-center rounded-full ${colorClass}`}
    >
      <span className="dark:hidden">🌙</span>
      <span className="hidden dark:inline" title={labelToLight}>
        ☀️
      </span>
    </button>
  )
}

import Link from 'next/link'
import { LogoutButton } from './logout-button'
import { BrandMark } from './brand-mark'

// แสดงเฉพาะตอน login แล้วเท่านั้น (root layout เป็นคนเช็ค user ก่อนค่อยเรียก
// nav นี้) — /login กับ /pledge (สาธารณะ) จะไม่เห็นแถบนี้เลย
const STAFF_LINKS = [
  { href: '/', label: 'หน้าหลัก' },
  { href: '/donations', label: 'รับของเข้าคลัง' },
  { href: '/inventory', label: 'คลังสินค้า' },
  { href: '/requests', label: 'คำขอ' },
  { href: '/allocations', label: 'จัดสรร' },
  { href: '/donors', label: 'ผู้บริจาค' },
  { href: '/pledges', label: 'คำร้องบริจาค' },
  { href: '/help-requests', label: 'คำขอช่วยเหลือ' },
]

// อาสาสมัครมีแค่หน้าเดียวของตัวเอง ไม่เห็นเมนูของ staff/admin เลย — สิทธิ์
// จริงถูกกันด้วย RLS อยู่แล้ว แต่ไม่โชว์ลิงก์ที่กดไปแล้วเจอ redirect เปล่าๆ
const VOLUNTEER_LINKS = [{ href: '/volunteer', label: 'หน้าหลักอาสาสมัคร' }]

export function Nav({ role }: { role: string | null }) {
  // แถบเมนูพื้นกรมท่าเข้ม (ตามที่ชมพู่ทำ mockup ไว้) ต้องใช้ตัวหนังสือสี
  // อ่อนแทน slate เข้มแบบพื้นขาวเดิม
  const linkClass = 'text-sm font-medium text-blue-100 hover:text-white'
  const isAdmin = role === 'admin'
  const LINKS = role === 'volunteer' ? VOLUNTEER_LINKS : STAFF_LINKS

  return (
    <nav className="bg-brand">
      <div className="mx-auto w-full max-w-5xl px-6 py-3">
        {/* จอกว้าง (md+): แสดงลิงก์ทั้งหมดแถวเดียว ไม่ต้องกดเปิด */}
        <div className="hidden md:flex md:items-center md:justify-between md:gap-x-6">
          <Link href="/" className="shrink-0">
            <BrandMark size="sm" onDark />
          </Link>
          <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin/centers" className={linkClass}>
                จัดการศูนย์/ผู้ใช้
              </Link>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <LogoutButton onDark />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand">
              {role === 'admin' ? 'A' : role === 'volunteer' ? 'V' : 'S'}
            </span>
          </div>
        </div>

        {/* จอมือถือ: พับเมนูไว้ในปุ่มเดียว ใช้ details/summary ของ HTML ล้วนๆ
            ไม่ต้องพึ่ง client-side JS หรือ state ใดๆ */}
        <details className="group md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-medium text-blue-100 [&::-webkit-details-marker]:hidden">
            <BrandMark size="sm" onDark />
            <span className="text-blue-200 group-open:rotate-180">▾</span>
          </summary>
          <div className="flex flex-col gap-1 border-t border-white/10 pb-2 pt-3">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={`${linkClass} py-1.5`}>
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin/centers" className={`${linkClass} py-1.5`}>
                จัดการศูนย์/ผู้ใช้
              </Link>
            )}
            <div className="mt-1 border-t border-white/10 pt-2">
              <LogoutButton onDark />
            </div>
          </div>
        </details>
      </div>
    </nav>
  )
}

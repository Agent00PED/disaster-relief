import Link from 'next/link'
import { LogoutButton } from './logout-button'

// แสดงเฉพาะตอน login แล้วเท่านั้น (root layout เป็นคนเช็ค user ก่อนค่อยเรียก
// nav นี้) — /login กับ /pledge (สาธารณะ) จะไม่เห็นแถบนี้เลย
const LINKS = [
  { href: '/', label: 'หน้าหลัก' },
  { href: '/donations', label: 'รับของเข้าคลัง' },
  { href: '/inventory', label: 'คลังสินค้า' },
  { href: '/requests', label: 'คำขอ' },
  { href: '/allocations', label: 'จัดสรร' },
  { href: '/donors', label: 'ผู้บริจาค' },
  { href: '/pledges', label: 'คำร้องบริจาค' },
  { href: '/help-requests', label: 'คำขอช่วยเหลือ' },
]

export function Nav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {link.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin/centers"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            จัดการศูนย์/ผู้ใช้
          </Link>
        )}
        <span className="ml-auto">
          <LogoutButton />
        </span>
      </div>
    </nav>
  )
}

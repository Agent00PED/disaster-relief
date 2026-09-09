import Link from 'next/link'
import { LogoutButton } from './logout-button'
import { BrandMark } from './brand-mark'

// แสดงเฉพาะตอน login แล้วเท่านั้น (root layout เป็นคนเช็ค user ก่อนค่อยเรียก
// nav นี้) — /login กับ /pledge (สาธารณะ) จะไม่เห็นแถบนี้เลย

// 5 ฟีเจอร์หลักที่ staff เปิดใช้งานทุกวัน — อยู่แถวเมนูตรงๆ กดถึงเร็วที่สุด
const STAFF_LINKS = [
  { href: '/', label: 'หน้าหลัก' },
  { href: '/donations', label: 'รับของเข้าคลัง' },
  { href: '/inventory', label: 'คลังสินค้า' },
  { href: '/requests', label: 'คำขอ' },
  { href: '/allocations', label: 'จัดสรร' },
  { href: '/donors', label: 'ผู้บริจาค' },
]

// คิวจากคนนอกระบบ (ไม่ต้อง login มาส่ง) — staff เข้ามาตรวจเป็นครั้งคราว
// ไม่ใช่งานที่เปิดค้างทั้งวันเหมือน 5 อันบน จึงพับไว้ใน dropdown เดียวกัน
// กันแถวเมนูหลักยาวเกินจนล้นบรรทัดบนจอที่ไม่ได้กว้างมาก
const QUEUE_LINKS = [
  { href: '/pledges', label: 'คำร้องบริจาค' },
  { href: '/help-requests', label: 'คำขอช่วยเหลือ' },
]

// อาสาสมัครมีแค่หน้าเดียวของตัวเอง ไม่เห็นเมนูของ staff/admin เลย — สิทธิ์
// จริงถูกกันด้วย RLS อยู่แล้ว แต่ไม่โชว์ลิงก์ที่กดไปแล้วเจอ redirect เปล่าๆ
const VOLUNTEER_LINKS = [{ href: '/volunteer', label: 'หน้าหลักอาสาสมัคร' }]

export function Nav({ role }: { role: string | null }) {
  // ใช้ชุดสีร่วมของเว็บเพื่อให้เมนูเปลี่ยนตามโหมดสว่าง/มืดทันที
  const linkClass = 'text-sm font-medium text-slate-700 hover:text-slate-900'
  const isAdmin = role === 'admin'
  const isVolunteer = role === 'volunteer'
  const LINKS = isVolunteer ? VOLUNTEER_LINKS : STAFF_LINKS

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-3">
        {/* จอกว้าง (md+): แสดงลิงก์ทั้งหมดแถวเดียว ไม่ต้องกดเปิด */}
        <div className="hidden md:flex md:items-center md:justify-between md:gap-x-6">
          <Link href="/" className="shrink-0">
            <BrandMark size="sm" />
          </Link>
          <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}

            {!isVolunteer && (
              <details className="group relative">
                <summary
                  className={`flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden ${linkClass}`}
                >
                  คำร้องสาธารณะ
                  <span className="text-slate-500 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="absolute left-0 top-full z-10 mt-2 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                  {QUEUE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </div>

          <details className="group relative shrink-0">
            <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-brand">
                {role === 'admin' ? 'A' : role === 'volunteer' ? 'V' : 'S'}
              </span>
            </summary>
            <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
              {isAdmin && (
                <Link
                  href="/admin/centers"
                  className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  จัดการศูนย์/ผู้ใช้
                </Link>
              )}
              <div className="px-3 py-2">
                <LogoutButton />
              </div>
            </div>
          </details>
        </div>

        {/* จอมือถือ: พับเมนูไว้ในปุ่มเดียว ใช้ details/summary ของ HTML ล้วนๆ
            ไม่ต้องพึ่ง client-side JS หรือ state ใดๆ — หน้าจอเล็กพอจะไล่
            ลิงก์ทั้งหมดเป็นแนวตั้งได้อยู่แล้ว เลยไม่ต้องแยกกลุ่มแบบจอกว้าง */}
        <details className="group md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-medium text-slate-700 [&::-webkit-details-marker]:hidden">
            <BrandMark size="sm" />
            <span className="text-slate-500 group-open:rotate-180">▾</span>
          </summary>
          <div className="flex flex-col gap-1 border-t border-slate-200 pb-2 pt-3">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={`${linkClass} py-1.5`}>
                {link.label}
              </Link>
            ))}
            {!isVolunteer &&
              QUEUE_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={`${linkClass} py-1.5`}>
                  {link.label}
                </Link>
              ))}
            {isAdmin && (
              <Link href="/admin/centers" className={`${linkClass} py-1.5`}>
                จัดการศูนย์/ผู้ใช้
              </Link>
            )}
            <div className="mt-1 border-t border-slate-200 pt-2">
              <LogoutButton />
            </div>
          </div>
        </details>
      </div>
    </nav>
  )
}

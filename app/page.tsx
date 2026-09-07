// =====================================================================
// เส้นทางเดียว 2 หน้าจอ:
//   - ยังไม่ login  → Entry Hub ให้เลือกว่าจะเข้าเว็บในฐานะอะไร
//   - login แล้ว    → Dashboard เดิม (volunteer เด้งไปหน้าของตัวเองที่ /volunteer)
//
// เป็น Server Component (ไม่มี 'use client') เพราะแค่ดึงข้อมูลมาแสดง
// ไม่มี state ไม่มีปุ่มที่ต้อง onClick
// =====================================================================

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandMark } from './brand-mark'

function EntryHub() {
  const CHOICES = [
    {
      href: '/login',
      icon: '🧑‍💼',
      label: 'เจ้าหน้าที่ / ผู้ดูแลระบบ',
      desc: 'สำหรับผู้ที่มีบัญชีอยู่แล้ว',
    },
    {
      href: '/register',
      icon: '🙋',
      label: 'อาสาสมัคร',
      desc: 'สมัครหรือเข้าสู่ระบบเพื่อช่วยงานที่ศูนย์',
    },
    {
      href: '/pledge',
      icon: '❤️',
      label: 'อยากบริจาค',
      desc: 'แจ้งความประสงค์บริจาคสิ่งของ ไม่ต้องมีบัญชี',
    },
    {
      href: '/help-request',
      icon: '🆘',
      label: 'ขอความช่วยเหลือ',
      desc: 'แจ้งความต้องการจากศูนย์พักพิง ไม่ต้องมีบัญชี',
    },
  ]

  return (
    <main className="brand-hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-2xl">
        <header className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <BrandMark size="lg" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            ระบบติดตามการบริจาคและกระจายสิ่งของช่วยเหลือภัยพิบัติ
          </h1>
          <p className="mt-2 text-sm text-slate-500">เลือกว่าคุณต้องการเข้าใช้งานในฐานะอะไร</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {CHOICES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand"
            >
              <div className="text-2xl">{c.icon}</div>
              <h2 className="mt-2 font-medium text-slate-900">{c.label}</h2>
              <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

// รายการเมนู = 6 ฟีเจอร์ตามตารางแบ่งงานใน docs/Week10_Topic8_Analysis.md
// หน้าไหนยังไม่มีคนทำ ให้ตั้ง ready: false ไว้ก่อน จะได้ไม่กดแล้ว 404
const MENU = [
  { href: '/donations', label: 'รับของเข้าคลัง', desc: 'บันทึกของที่ผู้บริจาคนำมาส่ง', ready: true },
  { href: '/inventory', label: 'คลังสินค้า', desc: 'ยอดคงเหลือและของใกล้หมดอายุ', ready: true },
  { href: '/requests', label: 'คำขอจากศูนย์พักพิง', desc: 'แจ้งและติดตามความต้องการ', ready: true },
  { href: '/allocations', label: 'จัดสรรและตัดจ่าย', desc: 'จับคู่คำขอกับล็อตในคลัง', ready: true },
  { href: '/donors', label: 'ทะเบียนผู้บริจาค', desc: 'ข้อมูลผู้บริจาคและประวัติ', ready: true },
  { href: '/admin/centers', label: 'จัดการศูนย์และผู้ใช้', desc: 'เฉพาะผู้ดูแลระบบ', ready: true },
  { href: '/pledges', label: 'คำร้องขอบริจาค', desc: 'จากผู้ใช้ทั่วไป (ไม่ต้อง login)', ready: true },
  { href: '/help-requests', label: 'คำขอความช่วยเหลือ', desc: 'จากผู้ใช้ทั่วไป (ไม่ต้อง login)', ready: true },
]

export default async function HomePage() {
  const supabase = await createClient()

  // ตรวจสิทธิ์ซ้ำที่นี่อีกชั้น แม้ proxy.ts จะกันไว้แล้ว
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <EntryHub />
  }

  // ดึงชื่อและบทบาทจากตาราง profiles มาแสดงหัวหน้าจอ
  // .single() = คาดว่าจะได้แถวเดียว ถ้าได้ 0 หรือมากกว่า 1 แถวจะเป็น error
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, role, centers(name)')
    .eq('id', user.id)
    .single()

  // อาสาสมัครมีหน้าของตัวเองแยกต่างหาก ไม่ใช้ dashboard ชุดนี้
  if (profile?.role === 'volunteer') {
    redirect('/volunteer')
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          ระบบติดตามการบริจาคและกระจายสิ่งของ
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {profile?.full_name || profile?.username || 'ผู้ใช้งาน'}
          {profile?.role === 'admin' ? ' · ผู้ดูแลระบบ' : ' · เจ้าหน้าที่'}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {MENU.map((item) =>
          item.ready ? (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
            >
              <h2 className="font-medium text-slate-900">{item.label}</h2>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </Link>
          ) : (
            // ยังไม่มีหน้านี้ จึงเรนเดอร์เป็น div เฉย ๆ ไม่ใช่ Link
            <div
              key={item.href}
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5"
            >
              <h2 className="font-medium text-slate-400">{item.label}</h2>
              <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
              <p className="mt-2 text-xs text-slate-400">ยังไม่เปิดใช้งาน</p>
            </div>
          ),
        )}
      </div>
    </main>
  )
}

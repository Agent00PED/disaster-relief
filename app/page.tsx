// =====================================================================
// หน้าหลักหลังเข้าสู่ระบบ — เป็น "โครง" ให้แต่ละฟีเจอร์มาต่อ
//
// เป็น Server Component (ไม่มี 'use client') เพราะแค่ดึงข้อมูลมาแสดง
// ไม่มี state ไม่มีปุ่มที่ต้อง onClick
//
// คนที่ทำ F3 (คลัง + Dashboard) จะมาแทนที่ส่วน "การ์ดสรุป" ทีหลัง
// =====================================================================

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    redirect('/login')
  }

  // ดึงชื่อและบทบาทจากตาราง profiles มาแสดงหัวหน้าจอ
  // .single() = คาดว่าจะได้แถวเดียว ถ้าได้ 0 หรือมากกว่า 1 แถวจะเป็น error
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, centers(name)')
    .eq('id', user.id)
    .single()

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          ระบบติดตามการบริจาคและกระจายสิ่งของ
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {profile?.full_name || user.email}
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

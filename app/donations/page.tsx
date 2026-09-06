// =====================================================================
// หน้ารายการของบริจาคที่บันทึกไว้ (F2)
// staff เห็นเฉพาะศูนย์ตัวเอง / admin เห็นทุกศูนย์ (บังคับด้วย RLS)
// =====================================================================

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const CATEGORY_LABEL: Record<string, string> = {
  food: 'อาหาร',
  water: 'น้ำดื่ม',
  medicine: 'ยา',
  clothing: 'เสื้อผ้า',
  hygiene: 'ของใช้ส่วนตัว',
  other: 'อื่นๆ',
}

export default async function DonationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: donations } = await supabase
    .from('donations')
    .select(
      'id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date, received_at, donors(name)',
    )
    .order('received_at', { ascending: false })

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">รายการของบริจาค</h1>
          <p className="mt-2 text-sm text-slate-500">ล็อตของที่รับเข้าคลังทั้งหมด</p>
        </div>
        <Link
          href="/donations/new"
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          + บันทึกของเข้า
        </Link>
      </header>

      {!donations || donations.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
          ยังไม่มีรายการ
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">ชื่อของ</th>
                <th className="px-4 py-2 font-medium">หมวดหมู่</th>
                <th className="px-4 py-2 font-medium">รับเข้า</th>
                <th className="px-4 py-2 font-medium">คงเหลือ</th>
                <th className="px-4 py-2 font-medium">วันหมดอายุ</th>
                <th className="px-4 py-2 font-medium">ผู้บริจาค</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">{d.item_name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {CATEGORY_LABEL[d.category] ?? d.category}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {d.quantity_received} {d.unit}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {d.quantity_remaining} {d.unit}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{d.expiry_date ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {(d.donors as unknown as { name?: string } | null)?.name ?? 'ไม่ประสงค์ออกนาม'}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/donations/${d.id}/receipt`}
                      className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
                    >
                      ใบรับของ
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

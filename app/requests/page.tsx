// =====================================================================
// หน้ารายการคำขอ (F4) — เรียงตามความเร่งด่วน
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
const URGENCY_LABEL: Record<string, string> = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง' }
const STATUS_LABEL: Record<string, string> = {
  pending: 'รอดำเนินการ',
  partial: 'จ่ายบางส่วน',
  fulfilled: 'จ่ายครบแล้ว',
  cancelled: 'ยกเลิก',
}

export default async function RequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: requests } = await supabase
    .from('requests')
    .select(
      'id, item_name, category, quantity_requested, quantity_fulfilled, urgency, status, created_at, centers(name)',
    )
    .order('urgency', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">คำขอจากศูนย์พักพิง</h1>
          <p className="mt-2 text-sm text-slate-500">เรียงตามความเร่งด่วน</p>
        </div>
        <Link
          href="/requests/new"
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          + สร้างคำขอ
        </Link>
      </header>

      {!requests || requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
          ยังไม่มีคำขอ
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">ศูนย์</th>
                <th className="px-4 py-2 font-medium">รายการ</th>
                <th className="px-4 py-2 font-medium">ต้องการ</th>
                <th className="px-4 py-2 font-medium">จ่ายแล้ว</th>
                <th className="px-4 py-2 font-medium">ความเร่งด่วน</th>
                <th className="px-4 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-600">
                    {(r.centers as unknown as { name?: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-900">
                    {r.item_name}{' '}
                    <span className="text-xs text-slate-400">
                      ({CATEGORY_LABEL[r.category] ?? r.category})
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{r.quantity_requested}</td>
                  <td className="px-4 py-2 text-slate-600">{r.quantity_fulfilled}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        r.urgency === 'high'
                          ? 'rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700'
                          : r.urgency === 'medium'
                            ? 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700'
                            : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'
                      }
                    >
                      {URGENCY_LABEL[r.urgency] ?? r.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{STATUS_LABEL[r.status] ?? r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

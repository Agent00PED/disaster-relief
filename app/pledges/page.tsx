// =====================================================================
// หน้ารายการคำร้องขอบริจาค (staff ตรวจสอบ) — มาจากฟอร์มสาธารณะ /pledge
// =====================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { confirmPledge, dismissPledge } from './actions'

const CATEGORY_LABEL: Record<string, string> = {
  food: 'อาหาร',
  water: 'น้ำดื่ม',
  medicine: 'ยา',
  clothing: 'เสื้อผ้า',
  hygiene: 'ของใช้ส่วนตัว',
  other: 'อื่นๆ',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'รอตรวจสอบ',
  contacted: 'ติดต่อแล้ว',
  confirmed: 'ยืนยันแล้ว',
  dismissed: 'ปฏิเสธ',
}

export default async function PledgesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pledges } = await supabase
    .from('donation_pledges')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">คำร้องขอบริจาค</h1>
        <p className="mt-2 text-sm text-slate-500">
          จากผู้ใช้ทั่วไปที่แจ้งความประสงค์ผ่านฟอร์มสาธารณะ — ยืนยันเพื่อแปลงเป็นของบริจาคจริง
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!pledges || pledges.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
          ยังไม่มีคำร้อง
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">ผู้แจ้ง</th>
                <th className="px-4 py-2 font-medium">รายการ</th>
                <th className="px-4 py-2 font-medium">จำนวน</th>
                <th className="px-4 py-2 font-medium">สถานะ</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pledges.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">
                    {p.donor_name}
                    <div className="text-xs text-slate-400">{p.donor_phone ?? p.donor_email ?? '—'}</div>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {p.item_name}{' '}
                    <span className="text-xs text-slate-400">
                      ({CATEGORY_LABEL[p.category] ?? p.category})
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.quantity}</td>
                  <td className="px-4 py-2 text-slate-600">{STATUS_LABEL[p.status] ?? p.status}</td>
                  <td className="px-4 py-2">
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <form action={confirmPledge}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
                          >
                            ยืนยัน
                          </button>
                        </form>
                        <form action={dismissPledge}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-red-600 underline hover:text-red-800"
                          >
                            ปฏิเสธ
                          </button>
                        </form>
                      </div>
                    )}
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

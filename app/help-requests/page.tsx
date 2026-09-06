// =====================================================================
// หน้ารายการคำขอความช่วยเหลือ (staff ตรวจสอบ) — มาจากฟอร์มสาธารณะ /help-request
// เห็นเฉพาะคำขอของศูนย์ตัวเอง (RLS) / admin เห็นทุกศูนย์
// =====================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { confirmHelpRequest, dismissHelpRequest } from './actions'

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
  pending: 'รอตรวจสอบ',
  contacted: 'ติดต่อแล้ว',
  confirmed: 'ยืนยันแล้ว',
  dismissed: 'ปฏิเสธ',
}

export default async function HelpRequestsPage({
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
    .from('request_pledges')
    .select('*, centers(name)')
    .order('urgency', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">คำขอความช่วยเหลือ</h1>
        <p className="mt-2 text-sm text-slate-500">
          จากผู้ใช้ทั่วไปที่แจ้งผ่านฟอร์มสาธารณะ (เห็นเฉพาะที่เลือกศูนย์ของคุณ) — ยืนยันเพื่อแปลงเป็นคำขอจริง
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!pledges || pledges.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
          ยังไม่มีคำขอ
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">ผู้ขอ</th>
                <th className="px-4 py-2 font-medium">ศูนย์</th>
                <th className="px-4 py-2 font-medium">รายการ</th>
                <th className="px-4 py-2 font-medium">จำนวน</th>
                <th className="px-4 py-2 font-medium">ความเร่งด่วน</th>
                <th className="px-4 py-2 font-medium">สถานะ</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pledges.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">
                    {p.requester_name}
                    <div className="text-xs text-slate-400">{p.requester_phone}</div>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {(p.centers as unknown as { name?: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {p.item_name}{' '}
                    <span className="text-xs text-slate-400">
                      ({CATEGORY_LABEL[p.category] ?? p.category})
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.quantity}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        p.urgency === 'high'
                          ? 'rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700'
                          : p.urgency === 'medium'
                            ? 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700'
                            : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'
                      }
                    >
                      {URGENCY_LABEL[p.urgency] ?? p.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{STATUS_LABEL[p.status] ?? p.status}</td>
                  <td className="px-4 py-2">
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <form action={confirmHelpRequest}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
                          >
                            ยืนยัน
                          </button>
                        </form>
                        <form action={dismissHelpRequest}>
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

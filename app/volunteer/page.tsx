// =====================================================================
// หน้าหลักของอาสาสมัคร — แยกจาก dashboard ของ staff/admin โดยเจตนา
//
// ขอบเขตสิทธิ์อาสาสมัคร (ตามที่ตกลงกันไว้):
//   - ดูข้อมูลศูนย์ตัวเอง: คำขอที่ยังไม่ปิด + รายการที่รอส่งมอบ (อ่านอย่างเดียว)
//   - ทำได้อย่างเดียว: กดยืนยันว่าของถึงศูนย์แล้ว (mark_delivered)
//   - ทำไม่ได้: บันทึกของเข้าคลัง, สร้าง/แก้คำขอ, จัดการผู้บริจาค, หน้า admin
//     (บังคับด้วย RLS ใน docs/sql/13_volunteer_role.sql อีกชั้นหนึ่ง
//     ไม่ได้พึ่งแค่การซ่อนปุ่มในหน้านี้)
// =====================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { confirmReceipt } from './actions'

const CATEGORY_LABEL: Record<string, string> = {
  food: 'อาหาร',
  water: 'น้ำดื่ม',
  medicine: 'ยา',
  clothing: 'เสื้อผ้า',
  hygiene: 'ของใช้ส่วนตัว',
  other: 'อื่นๆ',
}
const URGENCY_LABEL: Record<string, string> = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง' }

export default async function VolunteerPage({
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, role, center_id, centers(name, type)')
    .eq('id', user.id)
    .single()

  // หน้านี้เฉพาะอาสาสมัครเท่านั้น — staff/admin ใช้ dashboard ปกติที่ /
  if (profile?.role !== 'volunteer') {
    redirect('/')
  }

  const center = profile.centers as unknown as { name?: string; type?: string } | null

  const [{ data: requests }, { data: pending }] = await Promise.all([
    profile.center_id
      ? supabase
          .from('requests')
          .select('id, item_name, category, quantity_requested, quantity_fulfilled, urgency, status')
          .neq('status', 'fulfilled')
          .neq('status', 'cancelled')
          .order('urgency', { ascending: false })
      : Promise.resolve({ data: [] }),
    profile.center_id
      ? supabase
          .from('allocations')
          .select('id, quantity_allocated, requests!inner(item_name, center_id), donations(unit)')
          .eq('status', 'allocated')
          .eq('requests.center_id', profile.center_id)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          สวัสดี {profile.full_name || profile.username || 'อาสาสมัคร'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {center?.name
            ? `ประจำที่ ${center.name} (${center.type === 'warehouse' ? 'ศูนย์รับบริจาค' : 'ศูนย์พักพิง'})`
            : 'ยังไม่ได้ผูกกับศูนย์ — ติดต่อผู้ดูแลระบบ'}
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-slate-700">รอส่งมอบที่ศูนย์คุณ</h2>
        {!pending || pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
            ยังไม่มีรายการรอส่งมอบ
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[480px] whitespace-nowrap text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">รายการ</th>
                  <th className="px-4 py-2 font-medium">จำนวน</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => {
                  const req = p.requests as unknown as { item_name?: string } | null
                  const don = p.donations as unknown as { unit?: string } | null
                  return (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-900">{req?.item_name ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {p.quantity_allocated} {don?.unit}
                      </td>
                      <td className="px-4 py-2">
                        <form action={confirmReceipt}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-blue-700 px-3 py-1 text-xs font-medium text-white hover:bg-blue-800"
                          >
                            ยืนยันรับของแล้ว
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-700">คำขอของศูนย์คุณที่ยังไม่ปิด</h2>
        {!requests || requests.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
            ไม่มีคำขอค้าง
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[480px] whitespace-nowrap text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">รายการ</th>
                  <th className="px-4 py-2 font-medium">ต้องการ</th>
                  <th className="px-4 py-2 font-medium">จ่ายแล้ว</th>
                  <th className="px-4 py-2 font-medium">ความเร่งด่วน</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

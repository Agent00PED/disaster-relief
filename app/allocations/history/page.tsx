import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { confirmDelivery, cancelAllocation } from '../actions'

const STATUS_LABEL: Record<string, string> = {
  allocated: 'จัดสรรแล้ว',
  delivered: 'ส่งมอบแล้ว',
  cancelled: 'ยกเลิก',
}

export default async function AllocationHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  const user = await requireStaffOrAdmin(supabase)

  // ยกเลิกการจัดสรรเป็นสิทธิ์ admin เท่านั้น (บังคับซ้ำใน cancel_allocation
  // เองอยู่แล้ว) เช็คตรงนี้แค่เพื่อไม่โชว์ปุ่มที่กดแล้วจะโดนปฏิเสธเปล่าๆ
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = me?.role === 'admin'

  const { data: allocations } = await supabase
    .from('allocations')
    .select(
      'id, quantity_allocated, status, allocated_at, delivered_at, requests(item_name, centers(name)), donations(item_name, unit)',
    )
    .order('allocated_at', { ascending: false })

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">ประวัติการจัดสรร</h1>
        <p className="mt-2 text-sm text-slate-500">ยืนยันการส่งมอบให้ศูนย์พักพิงเมื่อของถึงมือแล้ว</p>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!allocations || allocations.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
          ยังไม่มีรายการจัดสรร
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">ศูนย์ที่รับ</th>
                <th className="px-4 py-2 font-medium">รายการ</th>
                <th className="px-4 py-2 font-medium">จำนวน</th>
                <th className="px-4 py-2 font-medium">สถานะ</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => {
                const req = a.requests as unknown as {
                  item_name?: string
                  centers?: { name?: string }
                } | null
                const don = a.donations as unknown as { item_name?: string; unit?: string } | null
                return (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-slate-600">{req?.centers?.name ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-900">
                      {req?.item_name ?? don?.item_name ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {a.quantity_allocated} {don?.unit}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {STATUS_LABEL[a.status] ?? a.status}
                    </td>
                    <td className="px-4 py-2">
                      {a.status === 'allocated' && (
                        <div className="flex items-center gap-3">
                          <form action={confirmDelivery}>
                            <input type="hidden" name="id" value={a.id} />
                            <button
                              type="submit"
                              className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
                            >
                              ยืนยันส่งมอบ
                            </button>
                          </form>
                          {isAdmin && (
                            <form action={cancelAllocation}>
                              <input type="hidden" name="id" value={a.id} />
                              <button
                                type="submit"
                                className="text-xs font-medium text-red-600 underline hover:text-red-800"
                              >
                                ยกเลิก
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

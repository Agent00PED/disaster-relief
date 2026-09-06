// =====================================================================
// หน้าคลังสินค้า + Dashboard (F3)
//
// staff เห็นเฉพาะศูนย์ตัวเอง / admin เห็นทุกศูนย์ — ไม่ต้องกรองเองในหน้านี้
// เพราะ RLS บนตาราง donations/requests (docs/sql/04_rls_policies.sql)
// กรองให้แล้วว่า is_admin() หรือ center_id = my_center_id() เท่านั้นที่มองเห็น
// views ด้านล่าง (docs/sql/06_views.sql) สืบ RLS ต่อจากตารางต้นทางโดยอัตโนมัติ
// =====================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type StockRow = {
  center_id: string
  category: string
  item_name: string
  unit: string
  total_remaining: number
  lot_count: number
  nearest_expiry: string | null
}

type ShortageRow = {
  category: string
  item_name: string
  shortage: number
}

const CATEGORY_LABEL: Record<string, string> = {
  food: 'อาหาร',
  water: 'น้ำดื่ม',
  medicine: 'ยา',
  clothing: 'เสื้อผ้า',
  hygiene: 'ของใช้ส่วนตัว',
  other: 'อื่นๆ',
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function InventoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, center_id, centers(name)')
    .eq('id', user.id)
    .single()

  // ยิงพร้อมกัน 3 คำขอ — แยกกันเพราะ view คนละตัว ไม่เกี่ยวกัน
  const [{ data: stock }, { data: shortage }, { data: centers }] = await Promise.all([
    supabase
      .from('v_stock_summary')
      .select('*')
      .order('nearest_expiry', { ascending: true, nullsFirst: false }),
    supabase.from('v_shortage_ranking').select('*').limit(5),
    // ตาราง centers เล็กและ RLS อนุญาตให้ authenticated ทุกคนอ่านได้ (centers_select)
    // ดึงมาทั้งหมดเพื่อแปะชื่อศูนย์ในตารางฝั่ง admin เท่านั้น
    supabase.from('centers').select('id, name'),
  ])

  const centerName = new Map((centers ?? []).map((c) => [c.id as string, c.name as string]))
  const stockRows = (stock ?? []) as StockRow[]
  const shortageRows = (shortage ?? []) as ShortageRow[]
  const maxShortage = Math.max(1, ...shortageRows.map((r) => r.shortage))

  const isAdmin = profile?.role === 'admin'
  const centerLabel = (profile?.centers as unknown as { name?: string } | null)?.name

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">คลังสินค้า</h1>
        <p className="mt-2 text-sm text-slate-500">
          {isAdmin ? 'ภาพรวมทุกศูนย์' : `ศูนย์ของคุณ: ${centerLabel ?? '—'}`}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          ของใกล้หมดอายุ / ยอดคงเหลือ
        </h2>
        {stockRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
            ยังไม่มีของในคลัง
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  {isAdmin && <th className="px-4 py-2 font-medium">ศูนย์</th>}
                  <th className="px-4 py-2 font-medium">หมวดหมู่</th>
                  <th className="px-4 py-2 font-medium">ชื่อของ</th>
                  <th className="px-4 py-2 font-medium">คงเหลือ</th>
                  <th className="px-4 py-2 font-medium">จำนวนล็อต</th>
                  <th className="px-4 py-2 font-medium">ใกล้หมดอายุสุด</th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((row) => {
                  const soon =
                    row.nearest_expiry !== null && daysUntil(row.nearest_expiry) <= 7
                  return (
                    <tr
                      key={`${row.center_id}-${row.category}-${row.item_name}-${row.unit}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      {isAdmin && (
                        <td className="px-4 py-2 text-slate-600">
                          {centerName.get(row.center_id) ?? '—'}
                        </td>
                      )}
                      <td className="px-4 py-2 text-slate-600">
                        {CATEGORY_LABEL[row.category] ?? row.category}
                      </td>
                      <td className="px-4 py-2 text-slate-900">{row.item_name}</td>
                      <td className="px-4 py-2 text-slate-900">
                        {row.total_remaining} {row.unit}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{row.lot_count}</td>
                      <td
                        className={
                          soon ? 'px-4 py-2 font-medium text-red-600' : 'px-4 py-2 text-slate-600'
                        }
                      >
                        {row.nearest_expiry ?? '—'}
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
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          ของที่ขาดแคลนที่สุด (5 อันดับ)
        </h2>
        {shortageRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
            ไม่มีคำขอค้างอยู่ตอนนี้
          </p>
        ) : (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            {shortageRows.map((row) => (
              <div key={`${row.category}-${row.item_name}`}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-700">{row.item_name}</span>
                  <span className="text-slate-500">ขาด {row.shortage}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-700"
                    style={{ width: `${(row.shortage / maxShortage) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

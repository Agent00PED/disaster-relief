// =====================================================================
// หน้าจัดสรรของ (F5) — เลือกคำขอ + เลือกล็อตในคลัง แล้วยืนยันจัดสรร/ตัดจ่าย
//
// การตัดยอดจริงเกิดที่ allocate_items (docs/sql/05_functions.sql) ทั้งหมด
// ฝั่งนี้แค่แสดงตัวเลือกแล้วส่ง id/จำนวนไปเรียก rpc — ไม่คำนวณเองที่ frontend
// เพื่อไม่ให้กฎ (หมดอายุ/เกินยอด/หมวดหมู่ไม่ตรง) หลุดไปสองที่
// =====================================================================

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { allocate } from './actions'

const CATEGORY_LABEL: Record<string, string> = {
  food: 'อาหาร',
  water: 'น้ำดื่ม',
  medicine: 'ยา',
  clothing: 'เสื้อผ้า',
  hygiene: 'ของใช้ส่วนตัว',
  other: 'อื่นๆ',
}

export default async function AllocationsPage({
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

  const [{ data: requests }, { data: donations }] = await Promise.all([
    supabase
      .from('requests')
      .select(
        'id, item_name, category, quantity_requested, quantity_fulfilled, urgency, centers(name)',
      )
      .in('status', ['pending', 'partial'])
      .order('urgency', { ascending: false }),
    supabase
      .from('donations')
      .select('id, item_name, category, unit, quantity_remaining, expiry_date, centers(name)')
      .gt('quantity_remaining', 0)
      .order('expiry_date', { ascending: true, nullsFirst: false }),
  ])

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">จัดสรรของ</h1>
          <p className="mt-2 text-sm text-slate-500">เลือกคำขอ + เลือกล็อตในคลัง แล้วยืนยันจัดสรร</p>
        </div>
        <Link
          href="/allocations/history"
          className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
        >
          ดูประวัติการจัดสรร →
        </Link>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={allocate}
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">คำขอ</label>
          <select
            name="request_id"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— เลือกคำขอ —</option>
            {(requests ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {(r.centers as unknown as { name?: string } | null)?.name} — {r.item_name} (
                {CATEGORY_LABEL[r.category] ?? r.category}) เหลือขอ{' '}
                {r.quantity_requested - r.quantity_fulfilled}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ล็อตของในคลัง</label>
          <select
            name="donation_id"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— เลือกล็อต —</option>
            {(donations ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {(d.centers as unknown as { name?: string } | null)?.name} — {d.item_name} คงเหลือ{' '}
                {d.quantity_remaining} {d.unit}
                {d.expiry_date ? ` (หมดอายุ ${d.expiry_date})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">จำนวนที่จัดสรร</label>
          <input
            name="quantity"
            type="number"
            min={1}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep sm:col-span-3"
        >
          ยืนยันจัดสรร
        </button>
      </form>
    </main>
  )
}

// =====================================================================
// หน้าจัดสรรของ (F5) — เลือกคำขอ + เลือกล็อตในคลัง แล้วยืนยันจัดสรร/ตัดจ่าย
//
// การตัดยอดจริงเกิดที่ allocate_items (docs/sql/05_functions.sql) ทั้งหมด
// ฝั่งนี้แค่แสดงตัวเลือกแล้วส่ง id/จำนวนไปเรียก rpc — ไม่คำนวณเองที่ frontend
// เพื่อไม่ให้กฎ (หมดอายุ/เกินยอด/หมวดหมู่ไม่ตรง) หลุดไปสองที่
// =====================================================================

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { AllocateForm } from './allocate-form'

export default async function AllocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  await requireStaffOrAdmin(supabase)

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

      <AllocateForm
        requests={(requests ?? []).map((r) => ({
          ...r,
          centers: r.centers as unknown as { name?: string } | null,
        }))}
        donations={(donations ?? []).map((d) => ({
          ...d,
          centers: d.centers as unknown as { name?: string } | null,
        }))}
      />
    </main>
  )
}

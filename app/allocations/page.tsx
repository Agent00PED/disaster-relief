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
import { PageHeader } from '../page-header'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

export default async function AllocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  await requireStaffOrAdmin(supabase)
  const locale = await getLocale()
  const dict = getDictionary(locale)

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
      <PageHeader
        color="rose"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3l4 4-4 4M21 7H9M7 21l-4-4 4-4M3 17h12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        title={dict.allocations.title}
        subtitle={dict.allocations.subtitle}
        action={
          <Link
            href="/allocations/history"
            className="whitespace-nowrap text-sm font-medium text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            {dict.allocations.viewHistory}
          </Link>
        }
      />

      {error && (
        <p role="alert" className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <AllocateForm
        dict={dict}
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

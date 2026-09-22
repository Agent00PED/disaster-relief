// =====================================================================
// หน้ารายการคำร้องขอบริจาค (staff / admin)
// มาจากฟอร์มสาธารณะ /pledge
// =====================================================================

import Link from 'next/link'
import {
  CalendarDays,
  FileText,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Package,
  ChevronDown,
  Plus,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { confirmPledge, dismissPledge } from './actions'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getCenterPicker } from '@/lib/center-choice'
import { CenterSelect } from '@/app/center-select'
import PrintButton from './PrintButton'

export default async function PledgesPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string
    q?: string
    status?: string
    from?: string
    to?: string
  }>
}) {
  const {
    error,
    q = '',
    status = '',
    from = '',
    to = '',
  } = await searchParams

  const supabase = await createClient()

  // ============================================================
  // ตรวจสิทธิ์ staff / admin
  // ============================================================

  await requireStaffOrAdmin(supabase)

  // ============================================================
  // ภาษา
  // ============================================================

  const locale = await getLocale()
  const dict = getDictionary(locale)

  // ============================================================
  // CATEGORY LABEL
  // ============================================================

  const CATEGORY_LABEL: Record<string, string> = {
    food: dict.form?.categoryFood || 'อาหาร / อาหารแห้ง',
    water: dict.form?.categoryWater || 'น้ำดื่ม',
    medicine: dict.form?.categoryMedicine || 'ยาสามัญ / เวชภัณฑ์',
    clothing: dict.form?.categoryClothing || 'เสื้อผ้า / เครื่องน้อมห่ม',
    hygiene: dict.form?.categoryHygiene || 'ของใช้ส่วนตัว',
    other: dict.form?.categoryOther || 'อื่น ๆ',
  }

  // ============================================================
  // CATEGORY ICON
  // ============================================================

  const CATEGORY_ICON: Record<string, string> = {
    water: '💧',
    medicine: '💊',
    food: '📦',
    clothing: '👕',
    hygiene: '🧼',
    other: '📦',
  }

  // ============================================================
  // STATUS
  // ============================================================

  const STATUS_LABEL: Record<string, string> = {
    pending: dict.queue?.statusPending || 'รอดำเนินการ',
    contacted: dict.queue?.statusContacted || 'ติดต่อแล้ว',
    confirmed: dict.queue?.statusConfirmed || 'ยืนยันแล้ว',
    dismissed: dict.queue?.statusDismissed || 'ยกเลิก/ปฏิเสธ',
  }

  // ============================================================
  // QUERY
  // ============================================================

  let query = supabase
    .from('donation_pledges')
    .select('*')
    .order('created_at', { ascending: false })

  if (q.trim()) {
    const keyword = q.trim()

    query = query.or(
      `donor_name.ilike.%${keyword}%,item_name.ilike.%${keyword}%`,
    )
  }

  if (status) {
    query = query.eq('status', status)
  }

  const normalizeDateFilter = (value: string) => {
    if (!value) return ''

    const trimmed = value.trim()
    const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)

    if (!match) return value

    const [, day, month, year] = match
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const formatDateInputValue = (value: string) => {
    if (!value) return ''

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) {
      const [, year, month, day] = isoMatch
      return `${day}/${month}/${year}`
    }

    return value
  }

  if (from) {
    const normalizedFrom = normalizeDateFilter(from)
    if (normalizedFrom) {
      query = query.gte('created_at', `${normalizedFrom}T00:00:00`)
    }
  }

  if (to) {
    const normalizedTo = normalizeDateFilter(to)
    if (normalizedTo) {
      query = query.lte('created_at', `${normalizedTo}T23:59:59`)
    }
  }

  const { data: pledges } = await query

  // ============================================================
  // CENTER
  // ============================================================

  const centers = await getCenterPicker(supabase, 'warehouse')

  // ============================================================
  // FORMAT DATE & TIME (ภาษาไทย/อังกฤษ)
  // ============================================================

  function formatDateTime(value: string | null | undefined) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '—'
    }

    return date.toLocaleDateString(
      locale === 'en' ? 'en-US' : 'th-TH',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    )
  }

  // ============================================================
  // STATUS STYLE
  // ============================================================

  function getStatusClass(status: string) {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'

      case 'pending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'

      case 'contacted':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'

      case 'dismissed':
        return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'

      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-7">
        {/* ========================================================
            TITLE & ADD BUTTON
        ======================================================== */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4 print:mb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fff0ee] text-[#e65f5a] shadow-sm print:hidden dark:bg-red-500/10 dark:text-red-400">
              <FileText className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-[25px] font-bold leading-tight text-[#1d2935] dark:text-slate-100 print:text-black">
                {dict.pledgeQueue?.title || 'รายการแจ้งความประสงค์บริจาค'}
              </h1>

              <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                {dict.pledgeQueue?.subtitle ||
                  'ตรวจสอบและยืนยันรายการขอบริจาคจากประชาชน'}
              </p>
            </div>
          </div>

          {/* ปุ่มกดเปิดหน้าแจ้งความประสงค์บริจาค (/pledge) */}
          <Link
            href="/pledge"
            className="flex items-center gap-1.5 rounded-lg bg-[#e65f5a] px-4 py-2.5 text-[12px] font-medium text-white shadow-sm transition hover:bg-[#d64e49] print:hidden dark:bg-red-600 dark:hover:bg-red-500"
          >
            <Plus className="h-4 w-4" />
            <span>{locale === 'en' ? 'New Request' : 'แจ้งความประสงค์บริจาค'}</span>
          </Link>
        </header>

        {/* ========================================================
            ERROR
        ======================================================== */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {/* ========================================================
            FILTER BOX
        ======================================================== */}
        <form
          method="GET"
          className="mb-4 rounded-lg border border-[#e7e1d7] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)] print:hidden dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
        >
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr_0.9fr_0.9fr_auto] lg:items-end">
            {/* Search */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {locale === 'en' ? 'Search' : 'ค้นหา'}
              </label>

              <div className="flex h-[40px] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-800">
                <Search className="h-4 w-4 shrink-0 text-[#31556c] dark:text-blue-400" />

                <input
                  name="q"
                  defaultValue={q}
                  placeholder={
                    locale === 'en'
                      ? 'Search donor name, requested item...'
                      : 'ค้นหาชื่อผู้ขอ, รายการขอ...'
                  }
                  className="w-full border-0 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {locale === 'en' ? 'Request status' : 'สถานะคำร้อง'}
              </label>

              <div className="relative">
                <select
                  name="status"
                  defaultValue={status}
                  className="h-[40px] w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-9 text-[12px] text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">
                    {locale === 'en' ? 'All' : 'ทั้งหมด'}
                  </option>

                  <option value="pending">{STATUS_LABEL.pending}</option>

                  <option value="contacted">{STATUS_LABEL.contacted}</option>

                  <option value="confirmed">{STATUS_LABEL.confirmed}</option>

                  <option value="dismissed">{STATUS_LABEL.dismissed}</option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* From Date */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {locale === 'en' ? 'From date' : 'ตั้งแต่วันที่'}
              </label>

              <div className="relative flex items-center">
                <input
                  name="from"
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/yyyy"
                  defaultValue={formatDateInputValue(from)}
                  pattern="\d{1,2}/\d{1,2}/\d{4}"
                  className="h-[40px] w-full rounded-md border border-slate-200 bg-white px-3 pr-9 text-[12px] text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />

                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#31556c] dark:text-blue-400" />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {locale === 'en' ? 'To date' : 'สิ้นสุดวันที่'}
              </label>

              <div className="relative flex items-center">
                <input
                  name="to"
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/yyyy"
                  defaultValue={formatDateInputValue(to)}
                  pattern="\d{1,2}/\d{1,2}/\d{4}"
                  className="h-[40px] w-full rounded-md border border-slate-200 bg-white px-3 pr-9 text-[12px] text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />

                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#31556c] dark:text-blue-400" />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <a
                href="/pledges"
                className="flex h-[40px] items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {locale === 'en' ? 'Reset' : 'รีเซ็ต'}
              </a>

              <button
                type="submit"
                className="flex h-[40px] items-center justify-center rounded-md bg-[#1d3b5a] px-4 text-[12px] font-medium text-white transition hover:bg-[#142d45] dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {locale === 'en' ? 'Search' : 'ค้นหา'}
              </button>
            </div>
          </div>
        </form>

        {/* ========================================================
            TABLE CARD
        ======================================================== */}
        <section className="overflow-hidden rounded-lg border border-[#e7e1d7] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          {/* Table header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200 print:text-black">
              {locale === 'en'
                ? `Total ${pledges?.length ?? 0} requests`
                : `ทั้งหมด ${pledges?.length ?? 0} คำร้อง`}
            </div>

            {/* PRINT BUTTON */}
            <PrintButton
              label={locale === 'en' ? 'Print report' : 'พิมพ์รายงาน'}
            />
          </div>

          {/* EMPTY STATE */}
          {!pledges || pledges.length === 0 ? (
            <div className="border-t border-dashed border-slate-200 px-5 py-12 text-center dark:border-slate-700">
              <Package className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />

              <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                {dict.pledgeQueue?.noPledges || 'ไม่พบรายการคำร้องขอบริจาค'}
              </p>
            </div>
          ) : (
            /* TABLE */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="border-b border-slate-200 bg-[#faf9f6] dark:border-slate-700 dark:bg-slate-800">
                  <tr className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <th className="w-[55px] px-3 py-3 text-center">
                      {locale === 'en' ? 'No.' : 'ลำดับ'}
                    </th>

                    <th className="px-3 py-3">
                      {locale === 'en' ? 'Received date' : 'วันที่รับของ'}
                    </th>

                    <th className="px-3 py-3">
                      {locale === 'en' ? 'Requester' : 'ชื่อผู้ขอ'}
                    </th>

                    <th className="px-3 py-3">
                      {locale === 'en' ? 'Requested item' : 'รายการขอ'}
                    </th>

                    <th className="px-3 py-3">
                      {locale === 'en' ? 'Quantity' : 'จำนวน'}
                    </th>

                    <th className="px-3 py-3">
                      {locale === 'en' ? 'Unit' : 'หน่วย'}
                    </th>

                    <th className="px-3 py-3">
                      {locale === 'en' ? 'Required date' : 'วันที่ต้องการ'}
                    </th>

                    <th className="px-3 py-3">
                      {dict.common?.status || (locale === 'en' ? 'Status' : 'สถานะ')}
                    </th>

                    <th className="px-3 py-3 print:hidden">
                      {locale === 'en' ? 'Actions' : 'จัดการ'}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pledges.map((p, index) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-[#fcfbf8] dark:border-slate-800 dark:hover:bg-slate-800/60"
                    >
                      {/* ลำดับ */}
                      <td className="px-3 py-3 text-center text-[11px] text-slate-600 dark:text-slate-300">
                        {index + 1}
                      </td>

                      {/* วันที่ */}
                      <td className="whitespace-nowrap px-3 py-3 text-[11px] text-slate-600 dark:text-slate-300">
                        {formatDateTime(p.created_at)}
                      </td>

                      {/* ผู้ขอ */}
                      <td className="px-3 py-3">
                        <div className="text-[11px] font-medium text-slate-800 dark:text-slate-100">
                          {p.donor_name}
                        </div>

                        <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                          {p.donor_phone ?? p.donor_email ?? '—'}
                        </div>
                      </td>

                      {/* รายการ */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white text-[20px] dark:border-slate-700 dark:bg-slate-800">
                            {CATEGORY_ICON[p.category] ?? '📦'}
                          </span>

                          <div>
                            <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                              {p.item_name}
                            </div>

                            <div className="text-[9px] text-slate-400 dark:text-slate-500">
                              {CATEGORY_LABEL[p.category] ?? p.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* จำนวน */}
                      <td className="px-3 py-3 text-[11px] text-slate-700 dark:text-slate-200">
                        {p.quantity}
                      </td>

                      {/* หน่วย */}
                      <td className="px-3 py-3 text-[11px] text-slate-600 dark:text-slate-300">
                        {p.unit ?? (locale === 'en' ? 'box' : 'กล่อง')}
                      </td>

                      {/* วันที่ต้องการ */}
                      <td className="px-3 py-3 text-[11px] text-slate-600 dark:text-slate-300">
                        —
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-medium ${getStatusClass(
                            p.status,
                          )}`}
                        >
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 print:hidden">
                        {p.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            {/* Confirm */}
                            <form
                              action={confirmPledge}
                              className="flex items-center gap-1"
                            >
                              <input
                                type="hidden"
                                name="id"
                                value={p.id}
                              />

                              {centers && (
                                <CenterSelect
                                  centers={centers}
                                  label={dict.common?.center || 'ศูนย์'}
                                  placeholder={
                                    dict.common?.selectCenter || 'เลือกศูนย์'
                                  }
                                  compact
                                />
                              )}

                              <button
                                type="submit"
                                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <Pencil className="h-3 w-3" />
                                {locale === 'en' ? 'Confirm' : 'ยืนยัน'}
                              </button>
                            </form>

                            {/* Dismiss */}
                            <form action={dismissPledge}>
                              <input
                                type="hidden"
                                name="id"
                                value={p.id}
                              />

                              <button
                                type="submit"
                                className="flex items-center gap-1 rounded-md border border-red-100 bg-[#ffffff] px-2.5 py-1.5 text-[10px] font-medium text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-500/20 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" />
                                {locale === 'en' ? 'Reject' : 'ปฏิเสธ'}
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {locale === 'en' ? 'Completed' : 'ดำเนินการแล้ว'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { deleteDonation } from './actions'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

// กำหนดรายการหมวดหมู่ทั้งหมดพร้อมสัญลักษณ์ไอคอน
const CATEGORIES_CONFIG = [
  {
    id: 'water',
    label: 'น้ำ',
    icon: '💧',
    matchKeys: ['water', 'น้ำ'],
    color:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  {
    id: 'milk',
    label: 'นม',
    icon: '🍼',
    matchKeys: ['milk', 'นม'],
    color:
      'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
  },
  {
    id: 'rice',
    label: 'ข้าวสาร',
    icon: '🌾',
    matchKeys: ['rice', 'ข้าวสาร'],
    color:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  {
    id: 'food',
    label: 'อาหารแห้ง',
    icon: '📦',
    matchKeys: ['food', 'dry_food', 'อาหารแห้ง'],
    color:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  },
  {
    id: 'supplies',
    label: 'ของใช้',
    icon: '👕',
    matchKeys: ['clothing', 'hygiene', 'supplies', 'ของใช้'],
    color:
      'bg-emerald-100 text-emerald-800 border-emerald-950 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    id: 'medicine',
    label: 'ยา',
    icon: '💊',
    matchKeys: ['medicine', 'ยา'],
    color:
      'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
  },
  {
    id: 'other',
    label: 'อื่นๆ / ไม่ระบุประเภท',
    icon: '🏷️',
    matchKeys: [],
    color:
      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
]

// ฟังก์ชันระบุ ID ของหมวดหมู่
function getCategoryId(categoryKey?: string): string {
  const key = categoryKey?.toLowerCase().trim() || ''

  const found = CATEGORIES_CONFIG.find((cat) =>
    cat.matchKeys.includes(key)
  )

  return found ? found.id : 'other'
}

export default async function DonationsPage() {
  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  const locale = await getLocale()
  const dict = getDictionary(locale)

  // =====================================================
  // ดึงข้อมูลบริจาค
  // ใช้ received_date แทน received_at
  // =====================================================

  const { data: donations, error } = await supabase
    .from('donations')
    .select(
      'id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date, received_date, donors(name)'
    )
    .order('expiry_date', {
      ascending: true,
      nullsFirst: false,
    })

  if (error) {
    console.error('Error fetching donations:', error.message)
  }

  // จัดกลุ่มข้อมูลตามประเภทสิ่งของ
  type DonationItem = NonNullable<typeof donations>[number]

  const groupedDonations: Record<string, DonationItem[]> = {}

  donations?.forEach((item) => {
    const catId = getCategoryId(item.category)

    if (!groupedDonations[catId]) {
      groupedDonations[catId] = []
    }

    groupedDonations[catId].push(item)
  })

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-950/60 dark:text-red-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {dict.donationsPage.title}
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dict.donationsPage.subtitle}
            </p>
          </div>
        </div>

        <Link
          href="/donations/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {dict.donationsPage.addNew}
        </Link>
      </div>

      {/* ฟอร์มตัวกรอง/ค้นหา */}
      <form className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <input
              type="text"
              name="search"
              placeholder={dict.table.searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />

            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="md:col-span-3">
            <select
              name="category"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">
                {dict.form.category} ({dict.common.all})
              </option>

              <option value="water">💧 น้ำ</option>
              <option value="milk">🍼 นม</option>
              <option value="rice">🌾 ข้าวสาร</option>
              <option value="food">📦 อาหารแห้ง</option>
              <option value="supplies">👕 ของใช้</option>
              <option value="medicine">💊 ยา</option>
            </select>
          </div>

          <div className="flex items-center gap-1 md:col-span-3">
            <input
              type="text"
              name="date_from"
              inputMode="numeric"
              placeholder={dict.table.datePlaceholder}
              aria-label={dict.table.dateFrom}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <span className="text-slate-400 dark:text-slate-500">
              -
            </span>

            <input
              type="text"
              name="date_to"
              inputMode="numeric"
              placeholder={dict.table.datePlaceholder}
              aria-label={dict.table.dateTo}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <button
            type="reset"
            className="flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 md:col-span-1"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            {dict.table.reset}
          </button>
        </div>
      </form>

      {/* แถบสรุปจำนวนรายการรวม และ ปุ่มพิมพ์ */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {dict.table.totalPrefix} {donations?.length ?? 0}{' '}
          {dict.table.totalSuffix}
        </span>

        <PrintButton label={dict.receipt.print} />
      </div>

      {!donations || donations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {dict.table.noRecords}
        </p>
      ) : (
        <div className="space-y-8">
          {/* วนลูปสร้างตารางแยกตามแต่ละประเภทสิ่งของ */}
          {CATEGORIES_CONFIG.map((cat) => {
            const items = groupedDonations[cat.id] || []

            // หากหมวดหมู่นี้ไม่มีข้อมูล ให้ข้ามไม่แสดงตาราง
            if (items.length === 0) return null

            return (
              <section key={cat.id} className="space-y-3">
                {/* หัวข้อหมวดหมู่ + ไอคอน */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold shadow-sm ${cat.color}`}
                  >
                    <span className="text-base">
                      {cat.icon}
                    </span>

                    <span>{cat.label}</span>
                  </span>

                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    ({items.length} รายการ)
                  </span>
                </div>

                {/* ตารางของหมวดหมู่ */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <table className="w-full min-w-[1050px] text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="border-b border-slate-200 bg-slate-50 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                      <tr>
                        <th className="p-3">
                          {dict.table.index}
                        </th>

                        <th className="p-3">
                          {dict.table.receivedDate}
                        </th>

                        <th className="p-3">
                          {dict.table.donor}
                        </th>

                        <th className="p-3">
                          {dict.table.itemName}
                        </th>

                        <th className="p-3">
                          ยี่ห้อ / รายละเอียด
                        </th>

                        <th className="p-3">
                          ขนาด / ปริมาณ
                        </th>

                        <th className="p-3">
                          {dict.table.receivedQty}
                        </th>

                        <th className="p-3">
                          {dict.donationNew.unit}
                        </th>

                        <th className="p-3">
                          {dict.table.expiryDate}
                        </th>

                        <th className="p-3">
                          {dict.table.status}
                        </th>

                        <th className="p-3 text-center">
                          {dict.table.actions}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((item, index) => {
                        const donor =
                          item.donors as unknown as
                            | { name?: string }
                            | null

                        // ตัดคำจาก item_name โดยใช้ ' - '
                        const parts = (
                          item.item_name || ''
                        ).split(' - ')

                        const itemName =
                          parts[0]?.trim() || '—'

                        const brand =
                          parts[1]?.trim() || '—'

                        const size =
                          parts[2]?.trim() || '—'

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          >
                            <td className="p-3">
                              {index + 1}
                            </td>

                            {/* =================================================
                                วันที่รับบริจาค
                                ใช้ received_date ที่ผู้ใช้เลือก
                            ================================================= */}
                            <td className="p-3">
                              {item.received_date
                                ? new Date(
                                    `${item.received_date}T00:00:00`
                                  ).toLocaleDateString(
                                    locale
                                  )
                                : '—'}
                            </td>

                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                              {donor?.name ??
                                dict.table
                                  .anonymousDonor}
                            </td>

                            <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                              {itemName}
                            </td>

                            <td className="p-3">
                              {brand}
                            </td>

                            <td className="p-3">
                              {size}
                            </td>

                            <td className="p-3">
                              {item.quantity_received}
                            </td>

                            <td className="p-3">
                              {item.unit}
                            </td>

                            <td className="p-3">
                              {item.expiry_date ?? '—'}
                            </td>

                            <td className="p-3">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                {dict.table.statusReceived}
                              </span>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                {/* ใบรับของ → หน้าใบรับของ */}
                                <Link
                                  href={`/donations/${item.id}/receipt`}
                                  className="text-sky-600 underline hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
                                >
                                  {dict.table.receiptLink}
                                </Link>

                                {/* แก้ไข */}
                                <Link
                                  href={`/donations/${item.id}/edit`}
                                  className="text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                >
                                  {dict.common.edit}
                                </Link>

                                {/* ลบ */}
                                <form
                                  action={
                                    deleteDonation
                                  }
                                >
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={item.id}
                                  />

                                  <button
                                    type="submit"
                                    className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                  >
                                    {dict.common.delete}
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
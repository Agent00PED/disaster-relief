import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { unitLabel } from '@/lib/units'
import { deleteDonation } from './actions'
import PrintButton from './PrintButton'
import SearchInput from './SearchInput'

export const dynamic = 'force-dynamic'

// กำหนดรายการหมวดหมู่ทั้งหมดพร้อมสัญลักษณ์ไอคอน
const CATEGORIES_CONFIG = [
  {
    id: 'water',
    labelTh: 'น้ำ',
    labelEn: 'Water',
    icon: '💧',
    matchKeys: ['water', 'น้ำ'],
    color:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  {
    id: 'milk',
    labelTh: 'นม',
    labelEn: 'Milk',
    icon: '🍼',
    matchKeys: ['milk', 'นม'],
    color:
      'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
  },
  {
    id: 'rice',
    labelTh: 'ข้าวสาร',
    labelEn: 'Rice',
    icon: '🌾',
    matchKeys: ['rice', 'ข้าวสาร'],
    color:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  {
    id: 'food',
    labelTh: 'อาหารแห้ง',
    labelEn: 'Dry Food',
    icon: '📦',
    matchKeys: ['food', 'dry_food', 'อาหารแห้ง'],
    color:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  },
  {
    id: 'supplies',
    labelTh: 'ของใช้',
    labelEn: 'Supplies',
    icon: '👕',
    matchKeys: ['clothing', 'hygiene', 'supplies', 'ของใช้'],
    color:
      'bg-emerald-100 text-emerald-800 border-emerald-950 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    id: 'medicine',
    labelTh: 'ยา',
    labelEn: 'Medicine',
    icon: '💊',
    matchKeys: ['medicine', 'ยา'],
    color:
      'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
  },
  {
    id: 'other',
    labelTh: 'อื่นๆ / ไม่ระบุประเภท',
    labelEn: 'Other / Unspecified',
    icon: '🏷️',
    matchKeys: [],
    color:
      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
]

// ฟังก์ชันระบุ ID ของหมวดหมู่
function getCategoryId(
  categoryKey?: string,
  itemName?: string
): string {
  const key = categoryKey?.toLowerCase().trim() || ''
  const name = itemName?.toLowerCase().trim() || ''

  // =====================================================
  // ตรวจข้าวสารก่อน
  // เพื่อป้องกันกรณีข้อมูลข้าวสารถูกจัดเข้าหมวดอื่น
  // =====================================================
  if (
    name.includes('ข้าวสาร') ||
    name.includes('rice')
  ) {
    return 'rice'
  }

  // =====================================================
  // แก้กรณีนมถูกบันทึก category เป็น food
  // ให้ตรวจจากชื่อรายการด้วย
  //
  // แต่ต้องไม่ให้คำว่า "ขนม" ถูกจัดเป็นหมวดนม
  // =====================================================
  if (
    key === 'milk' ||
    key === 'นม' ||
    name.includes('milk') ||
    (name.includes('นม') && !name.includes('ขนม'))
  ) {
    return 'milk'
  }

  const found = CATEGORIES_CONFIG.find((cat) =>
    cat.matchKeys.includes(key)
  )

  return found ? found.id : 'other'
}

type DonationsPageProps = {
  searchParams?: Promise<{
    search?: string
    category?: string
    date_from?: string
    date_to?: string
  }>
}

export default async function DonationsPage({
  searchParams,
}: DonationsPageProps) {
  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  const locale = await getLocale()
  const dict = getDictionary(locale)
  const { search, category, date_from, date_to } =
    (await searchParams) || {}

  // =====================================================
  // ดึงข้อมูลบริจาค
  // ใช้ received_date และ fallback received_at
  //
  // เพิ่ม address และ is_anonymous ของผู้บริจาค
  // =====================================================

  const { data: initialDonations, error } = await supabase
    .from('donations')
    .select(
      'id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date, received_date, received_at, donors(name, address, is_anonymous)'
    )
    .order('expiry_date', {
      ascending: true,
      nullsFirst: false,
    })

  let donations = initialDonations

  // =====================================================
  // fallback กรณีฐานข้อมูลยังไม่มี received_date
  // =====================================================

  if (
    error &&
    error.message &&
    error.message.includes('received_date')
  ) {
    const fallback = await supabase
      .from('donations')
      .select(
        'id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date, received_at, donors(name, address, is_anonymous)'
      )
      .order('expiry_date', {
        ascending: true,
        nullsFirst: false,
      })

    donations = fallback.data as typeof donations
  } else if (error) {
    console.error(
      'Error fetching donations:',
      error.message
    )
  }

  // =====================================================
  // กรองข้อมูลตาม searchParams
  // =====================================================

  let filteredDonations = donations || []

  if (category) {
    filteredDonations = filteredDonations.filter(
      (item) =>
        getCategoryId(
          item.category,
          item.item_name
        ) === category
    )
  }

  if (search) {
    const q = search.toLowerCase().trim()

    filteredDonations = filteredDonations.filter((item) => {
      const donor = item.donors as unknown as
        | {
            name?: string
            address?: string | null
            is_anonymous?: boolean | null
          }
        | null

      const donorName =
        donor?.is_anonymous ? '' : (donor?.name?.toLowerCase() || '')

      const itemName =
        (item.item_name || '').toLowerCase()

      return (
        itemName.includes(q) ||
        donorName.includes(q)
      )
    })
  }

  if (date_from) {
    filteredDonations = filteredDonations.filter(
      (item) => {
        const d =
          item.received_date ||
          (item.received_at
            ? String(item.received_at).split('T')[0]
            : '')

        return !d || d >= date_from
      }
    )
  }

  if (date_to) {
    filteredDonations = filteredDonations.filter(
      (item) => {
        const d =
          item.received_date ||
          (item.received_at
            ? String(item.received_at).split('T')[0]
            : '')

        return !d || d <= date_to
      }
    )
  }

  // =====================================================
  // จัดกลุ่มข้อมูลตามประเภทสิ่งของ
  // =====================================================

  type DonationItem =
    NonNullable<typeof donations>[number]

  const groupedDonations: Record<
    string,
    DonationItem[]
  > = {}

  filteredDonations.forEach((item) => {
    const catId = getCategoryId(
      item.category,
      item.item_name
    )

    if (!groupedDonations[catId]) {
      groupedDonations[catId] = []
    }

    groupedDonations[catId].push(item)
  })

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">

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
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
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
      <form
        method="GET"
        className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">

          <div className="relative md:col-span-5">
            <SearchInput
              defaultValue={search || ''}
              placeholder={dict.table.searchPlaceholder}
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
              defaultValue={category || ''}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">
                {dict.form.category} (
                {dict.inventory.allCategories})
              </option>

              <option value="water">
                💧 {locale === 'th' ? 'น้ำ' : 'Water'}
              </option>

              <option value="milk">
                🍼 {locale === 'th' ? 'นม' : 'Milk'}
              </option>

              <option value="rice">
                🌾 {locale === 'th' ? 'ข้าวสาร' : 'Rice'}
              </option>

              <option value="food">
                📦 {locale === 'th' ? 'อาหารแห้ง' : 'Dry Food'}
              </option>

              <option value="supplies">
                👕 {locale === 'th' ? 'ของใช้' : 'Supplies'}
              </option>

              <option value="medicine">
                💊 {locale === 'th' ? 'ยา' : 'Medicine'}
              </option>

              <option value="other">
                🏷️ {locale === 'th' ? 'อื่นๆ' : 'Other'}
              </option>
            </select>
          </div>

          {/* =================================================
              ช่องเลือกวันที่
              แสดง placeholder ตามภาษาที่เลือก
          ================================================= */}
          <div className="flex items-center gap-1 md:col-span-3">

            {/* วันที่เริ่มต้น */}
            <div className="relative w-full">
              {!date_from && (
                <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-xs text-slate-400">
                  {locale === 'th'
                    ? 'วว/ดด/ปปปป'
                    : 'mm/dd/yyyy'}
                </span>
              )}

              <input
                type="date"
                name="date_from"
                defaultValue={date_from || ''}
                aria-label={dict.table.dateFrom}
                lang={
                  locale === 'th'
                    ? 'th-TH'
                    : 'en-US'
                }
                className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800 ${
                  !date_from
                    ? 'text-transparent'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              />
            </div>

            <span className="text-slate-400 dark:text-slate-500">
              -
            </span>

            {/* วันที่สิ้นสุด */}
            <div className="relative w-full">
              {!date_to && (
                <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-xs text-slate-400">
                  {locale === 'th'
                    ? 'วว/ดด/ปปปป'
                    : 'mm/dd/yyyy'}
                </span>
              )}

              <input
                type="date"
                name="date_to"
                defaultValue={date_to || ''}
                aria-label={dict.table.dateTo}
                lang={
                  locale === 'th'
                    ? 'th-TH'
                    : 'en-US'
                }
                className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800 ${
                  !date_to
                    ? 'text-transparent'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:col-span-1">

            <button
              type="submit"
              className="flex flex-1 items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              title={
                locale === 'th'
                  ? 'ค้นหา'
                  : 'Search'
              }
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            <Link
              href="/donations"
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title={dict.table.reset}
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
            </Link>
          </div>
        </div>
      </form>

      {/* แถบสรุปจำนวนรายการรวม และ ปุ่มพิมพ์ */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {dict.table.totalPrefix}{' '}
          {filteredDonations.length}{' '}
          {dict.table.totalSuffix}
        </span>

        <PrintButton label={dict.receipt.print} />
      </div>

      {filteredDonations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {dict.table.noRecords}
        </p>
      ) : (
        <div className="space-y-8">

          {/* วนลูปสร้างตารางแยกตามแต่ละประเภทสิ่งของ */}
          {CATEGORIES_CONFIG.map((cat) => {
            const items =
              groupedDonations[cat.id] || []

            // หากหมวดหมู่นี้ไม่มีข้อมูล ให้ข้ามไม่แสดงตาราง
            if (items.length === 0) return null

            const catLabel =
              locale === 'th'
                ? cat.labelTh
                : cat.labelEn

            return (
              <section
                key={cat.id}
                className="space-y-3"
              >

                {/* หัวข้อหมวดหมู่ + ไอคอน */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold shadow-sm ${cat.color}`}
                  >
                    <span className="text-base">
                      {cat.icon}
                    </span>

                    <span>{catLabel}</span>
                  </span>

                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    ({items.length}{' '}
                    {dict.table.totalSuffix})
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
                          {locale === 'th'
                            ? 'ยี่ห้อ / รายละเอียด'
                            : 'Brand / Detail'}
                        </th>

                        <th className="p-3">
                          {locale === 'th'
                            ? 'ขนาด / ปริมาณ'
                            : 'Size / Volume'}
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
                            | {
                                name?: string
                                address?: string | null
                                is_anonymous?: boolean | null
                              }
                            | null

                        // ตัดคำจาก item_name โดยใช้ ' - '
                        const parts =
                          (item.item_name || '').split(
                            ' - '
                          )

                        const itemName =
                          parts[0]?.trim() || '—'

                        const brand =
                          parts[1]?.trim() || '—'

                        const size =
                          parts[2]?.trim() || '—'

                        const rawDate =
                          item.received_date ||
                          (item.received_at
                            ? String(
                                item.received_at
                              ).split('T')[0]
                            : null)

                        const formattedDate =
                          rawDate
                            ? new Date(
                                `${
                                  rawDate.includes('T')
                                    ? rawDate
                                    : rawDate +
                                      'T00:00:00'
                                }`
                              ).toLocaleDateString(
                                locale
                              )
                            : '—'

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          >
                            <td className="p-3">
                              {index + 1}
                            </td>

                            {/* วันที่รับบริจาค */}
                            <td className="p-3">
                              {formattedDate}
                            </td>

                            {/* ผู้บริจาค + ที่อยู่ */}
                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                              <div>
                                {donor?.is_anonymous
                                  ? dict.table
                                      .anonymousDonor
                                  : (donor?.name ??
                                    dict.table
                                      .anonymousDonor)}
                              </div>

                              {!donor?.is_anonymous &&
                                donor?.address && (
                                  <div className="text-xs text-slate-400 dark:text-slate-500">
                                    {donor.address}
                                  </div>
                                )}
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
                              {unitLabel(
                                item.unit,
                                locale
                              ) || item.unit}
                            </td>

                            <td className="p-3">
                              {item.expiry_date ?? '—'}
                            </td>

                            <td className="p-3">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                {
                                  dict.table
                                    .statusReceived
                                }
                              </span>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">

                                {/* ใบรับของ → หน้าใบรับของ */}
                                <Link
                                  href={`/donations/${item.id}/receipt`}
                                  className="text-sky-600 underline hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
                                >
                                  {
                                    dict.table
                                      .receiptLink
                                  }
                                </Link>

                                {/* แก้ไข */}
                                <Link
                                  href={`/donations/${item.id}/receipt/edit`}
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
                                    {
                                      dict.common
                                        .delete
                                    }
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
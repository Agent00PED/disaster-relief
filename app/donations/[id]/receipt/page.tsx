import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PrintButton from '../../PrintButton'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { unitLabel } from '@/lib/units'

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const locale = await getLocale()
  const dict = getDictionary(locale)

  const { data: donation, error } = await supabase
    .from('donations')
    .select(
      `
        id,
        item_name,
        category,
        unit,
        quantity_received,
        expiry_date,
        received_at,
        donors(name, phone),
        centers(name),
        profiles(full_name, username)
      `,
    )
    .eq('id', id)
    .single()

  if (error || !donation) {
    notFound()
  }

  const donor = donation.donors as unknown as {
    name?: string
    phone?: string
  } | null

  const center = donation.centers as unknown as {
    name?: string
  } | null

  const receiver = donation.profiles as unknown as {
    full_name?: string
    username?: string
  } | null

  // แยกชื่อ / ยี่ห้อ / ขนาด
  const parts = (donation.item_name || '').split(' - ')

  const itemName = parts[0]?.trim() || '—'
  const brand = parts[1]?.trim() || '—'
  const size = parts[2]?.trim() || '—'

  // วันที่รับ
  const receivedDate = donation.received_at
    ? new Date(donation.received_at).toLocaleDateString(
        locale === 'en' ? 'en-GB' : 'th-TH',
        {
          dateStyle: 'long',
          timeZone: 'Asia/Bangkok',
        },
      )
    : '—'

  // วันหมดอายุ
  const expiryDate = donation.expiry_date
    ? new Date(
        `${donation.expiry_date}T00:00:00`,
      ).toLocaleDateString(
        locale === 'en' ? 'en-GB' : 'th-TH',
        {
          dateStyle: 'medium',
          timeZone: 'Asia/Bangkok',
        },
      )
    : '—'

  const receiverName =
    receiver?.full_name ||
    receiver?.username ||
    '—'

  const donorName =
    donor?.name ||
    dict.table.anonymousDonor

  const donorPhone =
    donor?.phone || '—'

  const quantity = `${donation.quantity_received} ${unitLabel(
    donation.unit,
    locale,
  )}`

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 text-slate-900 dark:text-white print:max-w-none print:bg-white print:px-0 print:py-0 print:text-black">

      {/* =====================================================
          HEADER หน้าใบรับของ
          ===================================================== */}
      <div className="mb-5 flex items-center justify-between print:hidden">

        <div className="flex items-center gap-3">

          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-500">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l5 5v11a2 2 0 01-2 2z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 3v5h5"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {locale === 'en'
                ? 'Donation Receipt'
                : 'ใบรับของบริจาค'}
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {locale === 'en'
                ? 'Print donation receipt for donor'
                : 'พิมพ์ใบรับของบริจาคสำหรับผู้บริจาค'}
            </p>
          </div>

        </div>

        {/* ปุ่มพิมพ์ */}
        <PrintButton label={dict.receipt.print} />

      </div>


      {/* =====================================================
          ตัวใบรับบริจาค
          ===================================================== */}
      <div
        id="receipt"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-950 dark:text-white print:rounded-none print:border-0 print:bg-white print:text-black print:shadow-none"
      >

        {/* ===================================================
            HEADER ใบรับของ
            =================================================== */}
        <div className="border-b border-slate-200 bg-white px-8 py-7 dark:border-slate-700 dark:bg-slate-950">

          <div className="flex items-start justify-between gap-6">

            {/* Logo */}
            <div className="flex items-center gap-3">

              <div className="relative flex h-14 w-14 items-center justify-center">

                <div className="absolute left-1 top-1 h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />

                <div className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-red-500" />

                <div className="relative z-10 text-xl font-bold text-white">
                  ♥
                </div>

              </div>

              <div>

                <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Walai
                  <span className="text-red-500">
                    Track
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {locale === 'en'
                    ? 'Donation and Relief Item Tracking System'
                    : 'ระบบติดตามการบริจาคและกระจายสิ่งของ'}
                </p>

              </div>

            </div>


            {/* ศูนย์ */}
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">

              <p className="font-bold text-slate-900 dark:text-white">
                {center?.name ?? '—'}
              </p>

              <p className="mt-1 text-slate-500 dark:text-slate-400">
                {locale === 'en'
                  ? 'Donation Management System'
                  : 'ระบบบริหารจัดการสิ่งของบริจาค'}
              </p>

            </div>

          </div>


          {/* หัวข้อ */}
          <div className="mt-7 text-center">

            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {dict.receipt.title}
            </h2>

            <div className="mx-auto mt-3 flex max-w-md items-center gap-3">

              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />

              <span className="text-red-500">
                ♥
              </span>

              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />

            </div>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {dict.receipt.thanks}
            </p>

          </div>

        </div>


        {/* ===================================================
            ข้อมูลใบรับ + ผู้บริจาค
            =================================================== */}
        <div className="grid grid-cols-1 gap-4 bg-slate-50 px-8 py-6 dark:bg-slate-950 md:grid-cols-2">

          {/* ข้อมูลใบรับ */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
              {locale === 'en'
                ? 'Receipt Information'
                : 'ข้อมูลใบรับของ'}
            </h3>

            <dl className="space-y-3 text-sm">

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">
                  {dict.receipt.receivedDate}
                </dt>

                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {receivedDate}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">
                  {dict.receipt.receivedBy}
                </dt>

                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {receiverName}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">
                  {dict.table.expiryDate}
                </dt>

                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {expiryDate}
                </dd>
              </div>

            </dl>

          </section>


          {/* ข้อมูลผู้บริจาค */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
              {locale === 'en'
                ? 'Donor Information'
                : 'ข้อมูลผู้บริจาค'}
            </h3>

            <dl className="space-y-3 text-sm">

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">
                  {dict.table.donor}
                </dt>

                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {donorName}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">
                  {locale === 'en'
                    ? 'Phone'
                    : 'โทรศัพท์'}
                </dt>

                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {donorPhone}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">
                  {locale === 'en'
                    ? 'Center'
                    : 'ศูนย์รับบริจาค'}
                </dt>

                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {center?.name ?? '—'}
                </dd>
              </div>

            </dl>

          </section>

        </div>


        {/* ===================================================
            รายการของที่รับบริจาค
            =================================================== */}
        <section className="bg-slate-50 px-8 pb-6 dark:bg-slate-950">

          <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-white">
            {locale === 'en'
              ? 'Donated Items'
              : 'รายการของที่รับบริจาค'}
          </h3>


          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">

            <table className="w-full text-sm">

              <thead className="bg-slate-100 dark:bg-slate-800">

                <tr className="border-b border-slate-200 dark:border-slate-700">

                  <th className="w-16 px-4 py-3 text-center font-semibold text-slate-700 dark:text-white">
                    #
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-white">
                    {dict.receipt.item}
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-white">
                    {locale === 'en'
                      ? 'Brand / Detail'
                      : 'ยี่ห้อ / รายละเอียด'}
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-white">
                    {locale === 'en'
                      ? 'Size / Quantity'
                      : 'ขนาด / ปริมาณ'}
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-white">
                    {dict.form.quantity}
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-white">
                    {dict.table.expiryDate}
                  </th>

                </tr>

              </thead>


              <tbody>

                <tr className="border-b border-slate-200 dark:border-slate-800">

                  <td className="px-4 py-4 text-center text-slate-600 dark:text-slate-300">
                    1
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                    {itemName}
                  </td>

                  <td className="px-4 py-4 text-center text-slate-600 dark:text-slate-300">
                    {brand}
                  </td>

                  <td className="px-4 py-4 text-center text-slate-600 dark:text-slate-300">
                    {size}
                  </td>

                  <td className="px-4 py-4 text-center font-semibold text-slate-900 dark:text-white">
                    {quantity}
                  </td>

                  <td className="px-4 py-4 text-center text-slate-600 dark:text-slate-300">
                    {expiryDate}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </section>


        {/* ===================================================
            ข้อความขอบคุณ + ลายเซ็น
            =================================================== */}
        <div className="grid grid-cols-1 gap-6 bg-slate-50 px-8 pb-7 dark:bg-slate-950 md:grid-cols-2">

          {/* ขอบคุณ */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">

            <div className="flex gap-3">

              <span className="text-lg text-red-500">
                ♥
              </span>

              <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                {dict.receipt.thanks}
              </p>

            </div>

          </div>


          {/* ลายเซ็น */}
          <div className="flex flex-col items-center justify-end px-6 pt-5">

            <div className="mb-3 text-3xl">
              ✍️
            </div>

            <div className="w-48 border-b border-dotted border-slate-400 dark:border-slate-600" />

            <p className="mt-2 text-xs font-medium text-slate-900 dark:text-white">
              {receiverName}
            </p>

            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              {dict.receipt.receivedBy}
            </p>

          </div>

        </div>


        {/* ===================================================
            Footer
            =================================================== */}
        <div className="border-t border-slate-200 bg-white px-8 py-4 dark:border-slate-700 dark:bg-slate-950">

          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">

            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />

            <span>
              WalaiTrack
            </span>

            <span className="text-slate-400 dark:text-slate-600">
              |
            </span>

            <span>
              {locale === 'en'
                ? 'Donation Management System'
                : 'ระบบติดตามการบริจาค'}
            </span>

            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />

          </div>

        </div>

      </div>
    </main>
  )
}
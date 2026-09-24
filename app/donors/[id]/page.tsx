import Link from 'next/link'

import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { requireStaffOrAdmin } from '@/lib/guard'

import { getLocale } from '@/lib/i18n/locale'

import { getDictionary } from '@/lib/i18n/dictionaries'

import { unitLabel } from '@/lib/units'



type Props = {

  params: Promise<{ id: string }>

}



export default async function DonorDetailPage({ params }: Props) {

  const { id } = await params

  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)



  const locale = await getLocale()

  const dict = await getDictionary(locale)



  // 1. ดึงข้อมูลผู้บริจาคจากตาราง donors

  const { data: donor } = await supabase

    .from('donors')

    .select('*')

    .eq('id', id)

    .single()



  if (!donor) {

    notFound()

  }



  // 2. ดึงข้อมูลสรุปจากวิว v_donor_summary

  const { data: summary } = await supabase

    .from('v_donor_summary')

    .select('*')

    .eq('donor_id', id)

    .single()



  // 3. ดึงรายการบริจาคของคนนี้จากตาราง donations

  const { data: donations } = await supabase

    .from('donations')

    .select('id, item_name, category, unit, quantity_received, received_date, received_at, centers(name)')

    .eq('donor_id', id)

    .order('received_at', { ascending: false })



  // 4. เช็กเงื่อนไขผู้บริจาคที่ไม่ประสงค์ออกนาม (is_anonymous)

  const displayName = donor.is_anonymous ? 'ไม่ประสงค์ออกนาม' : donor.name

  const displayPhone = donor.is_anonymous ? 'ไม่ประสงค์ออกนาม' : (donor.phone || '-')

  const displayEmail = donor.is_anonymous ? 'ไม่ประสงค์ออกนาม' : (donor.email || '-')

  const displayAddress = donor.is_anonymous ? 'ไม่ประสงค์ออกนาม' : (donor.address || '-')



  return (

    <main className="mx-auto w-full max-w-4xl px-6 py-12 space-y-8">

      {/* ส่วนบน — ข้อมูลผู้บริจาค */}

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

        <div className="flex items-center justify-between mb-4">

          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">

            {displayName}

          </h1>

          <Link

            href={`/donors/${donor.id}/edit`}

            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"

          >

            {dict.common?.edit ?? 'Edit'}

          </Link>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300">

          <div><span className="font-medium">ประเภท:</span> {donor.donor_type === 'organization' ? 'องค์กร' : 'บุคคลทั่วไป'}</div>

          <div><span className="font-medium">เบอร์โทรศัพท์:</span> {displayPhone}</div>

          <div><span className="font-medium">อีเมล:</span> {displayEmail}</div>

          <div><span className="font-medium">ที่อยู่:</span> {displayAddress}</div>

          <div><span className="font-medium">สถานะ:</span> {donor.is_active ? 'Active' : 'Inactive'}</div>

          <div><span className="font-medium">ไม่ประสงค์ออกนาม:</span> {donor.is_anonymous ? 'ใช่' : 'ไม่ใช่'}</div>

        </div>

      </div>



      {/* ส่วนกลาง — สรุปจาก v_donor_summary */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">

          <p className="text-sm text-slate-500">บริจาคทั้งหมด</p>

          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary?.donation_count ?? 0} ครั้ง</p>

        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">

          <p className="text-sm text-slate-500">ครั้งแรกเมื่อไหร่</p>

          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">

            {summary?.first_donation_at ? new Date(summary.first_donation_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US') : '-'}

          </p>

        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">

          <p className="text-sm text-slate-500">ครั้งล่าสุดเมื่อไหร่</p>

          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">

            {summary?.last_donation_at ? new Date(summary.last_donation_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US') : '-'}

          </p>

        </div>

      </div>



      {/* ส่วนล่าง — รายการบริจาคของคนนี้ */}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-hidden">

        <div className="p-4 border-b border-slate-200 dark:border-slate-700">

          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">ประวัติการบริจาค</h2>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">

            <thead className="bg-slate-50 text-xs uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-400">

              <tr>

                <th className="px-4 py-3">วันที่</th>

                <th className="px-4 py-3">ศูนย์</th>

                <th className="px-4 py-3">ชื่อสิ่งของ</th>

                <th className="px-4 py-3">จำนวน</th>

                <th className="px-4 py-3">หน่วย</th>

                <th className="px-4 py-3">ลิงก์ใบรับของ</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">

              {donations && donations.length > 0 ? (

                donations.map((row: any) => (

                  <tr key={row.id}>

                    <td className="px-4 py-3">{row.received_date || (row.received_at ? new Date(row.received_at).toLocaleDateString() : '-')}</td>

                    <td className="px-4 py-3">{row.centers?.name ?? '-'}</td>

                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.item_name}</td>

                    <td className="px-4 py-3">{row.quantity_received}</td>

                    <td className="px-4 py-3">{unitLabel(row.unit, locale)}</td>

                    <td className="px-4 py-3">

                      <Link href={`/donations/${row.id}`} className="text-brand hover:underline">

                        ดูใบรับของ

                      </Link>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">

                    ยังไม่มีประวัติการบริจาค

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>

  )

}
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'

type Donation = {
  id: string
  item_name: string
  category: string
  unit: string
  quantity_received: number
  quantity_remaining: number
  expiry_date: string | null
  received_date: string | null
  donors: {
    name: string | null
  } | null
}

const CATEGORY_LABEL: Record<string, string> = {
  food: 'อาหาร',
  water: 'น้ำดื่ม',
  medicine: 'ยา',
  clothing: 'เสื้อผ้า',
  hygiene: 'ของใช้ส่วนตัว',
  other: 'อื่น ๆ',
}

export default async function DonationsPage() {
  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  const { data, error } = await supabase
    .from('donations')
    .select(`
      id,
      item_name,
      category,
      unit,
      quantity_received,
      quantity_remaining,
      expiry_date,
      received_date,
      donors (
        name
      )
    `)
    .order('received_date', {
      ascending: false,
    })

  const donations = (data ?? []) as unknown as Donation[]

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                รายการของบริจาค
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                รายการของบริจาคที่บันทึกเข้าคลัง
              </p>
            </div>

            <Link
              href="/donations/new"
              className="rounded-md bg-[#16476b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123b5d]"
            >
              + บันทึกของเข้า
            </Link>
          </header>

          {error ? (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบฐานข้อมูล
            </div>
          ) : donations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              ยังไม่มีรายการของบริจาค
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-sky-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3">ลำดับ</th>
                    <th className="px-4 py-3">วันที่รับของ</th>
                    <th className="px-4 py-3">ผู้บริจาค</th>
                    <th className="px-4 py-3">รายการของ</th>
                    <th className="px-4 py-3">หมวดหมู่</th>
                    <th className="px-4 py-3">รับเข้า</th>
                    <th className="px-4 py-3">คงเหลือ</th>
                    <th className="px-4 py-3">วันหมดอายุ</th>
                  </tr>
                </thead>

                <tbody>
                  {donations.map((donation, index) => (
                    <tr
                      key={donation.id}
                      className="border-b last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3">
                        {donation.received_date ?? '—'}
                      </td>

                      <td className="px-4 py-3">
                        {donation.donors?.name ?? 'ไม่ประสงค์ออกนาม'}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {donation.item_name}
                      </td>

                      <td className="px-4 py-3">
                        {CATEGORY_LABEL[donation.category] ??
                          donation.category}
                      </td>

                      <td className="px-4 py-3">
                        {donation.quantity_received} {donation.unit}
                      </td>

                      <td className="px-4 py-3">
                        {donation.quantity_remaining} {donation.unit}
                      </td>

                      <td className="px-4 py-3">
                        {donation.expiry_date ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

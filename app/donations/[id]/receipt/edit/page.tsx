import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { updateDonation } from '@/app/donations/actions'

type EditDonationPageProps = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

const categories = [
  { value: 'food', label: 'อาหาร' },
  { value: 'water', label: 'น้ำดื่ม' },
  { value: 'medicine', label: 'ยาและเวชภัณฑ์' },
  { value: 'clothing', label: 'เสื้อผ้า' },
  { value: 'hygiene', label: 'ของใช้ส่วนตัว' },
  { value: 'other', label: 'อื่น ๆ' },
]

export default async function EditDonationPage({
  params,
}: EditDonationPageProps) {
  const { id } = await params

  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  const { data: donation, error } = await supabase
    .from('donations')
    .select(
      'id, item_name, category, unit, quantity_received, quantity_remaining, expiry_date',
    )
    .eq('id', id)
    .single()

  if (error || !donation) {
    redirect('/donations')
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/donations"
          className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          ← กลับรายการบริจาค
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
          แก้ไขรายการบริจาค
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          แก้ไขข้อมูลรายการบริจาค
        </p>
      </div>

      {/* Form */}
      <form
        action={updateDonation}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <input
          type="hidden"
          name="id"
          value={donation.id}
        />

        <div className="grid grid-cols-1 gap-5">
          {/* ชื่อสิ่งของ */}
          <div>
            <label
              htmlFor="item_name"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              ชื่อสิ่งของ
            </label>

            <input
              id="item_name"
              name="item_name"
              type="text"
              required
              defaultValue={donation.item_name}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* หมวดหมู่ */}
          <div>
            <label
              htmlFor="category"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              หมวดหมู่
            </label>

            <select
              id="category"
              name="category"
              required
              defaultValue={donation.category}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {categories.map((category) => (
                <option
                  key={category.value}
                  value={category.value}
                >
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* จำนวน + หน่วย */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="quantity_received"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                จำนวนที่รับ
              </label>

              <input
                id="quantity_received"
                name="quantity_received"
                type="number"
                min="1"
                required
                defaultValue={donation.quantity_received}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="unit"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                หน่วย
              </label>

              <input
                id="unit"
                name="unit"
                type="text"
                required
                defaultValue={donation.unit}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* จำนวนคงเหลือ */}
          <div>
            <label
              htmlFor="quantity_remaining"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              จำนวนคงเหลือ
            </label>

            <input
              id="quantity_remaining"
              name="quantity_remaining"
              type="number"
              min="0"
              required
              defaultValue={donation.quantity_remaining}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <p className="mt-1 text-xs text-slate-400">
              หากมีการเบิกจ่ายไปแล้ว ควรใส่จำนวนคงเหลือจริง
            </p>
          </div>

          {/* วันหมดอายุ */}
          <div>
            <label
              htmlFor="expiry_date"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              วันหมดอายุ
            </label>

            <input
              id="expiry_date"
              name="expiry_date"
              type="date"
              defaultValue={donation.expiry_date ?? ''}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <Link
            href="/donations"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ยกเลิก
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            บันทึกการแก้ไข
          </button>
        </div>
      </form>
    </main>
  )
}
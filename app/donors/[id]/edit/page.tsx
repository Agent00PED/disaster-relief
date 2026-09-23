import Link from 'next/link'
import { PROVINCES } from '@/app/lib/provinces'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
// สมมติว่าคุณมี Server Action สำหรับอัปเดตข้อมูล เช่น updateDonor ลองปรับชื่อ path ตามโปรเจกต์จริงครับ
// import { updateDonor } from '../actions' 

type Props = {
  params: { id: string }
}

export default async function EditDonorPage({ params }: Props) {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const isEn = locale === 'en'

  // ตรงนี้สามารถดึงข้อมูลเดิมจาก Database ตาม params.id มาใส่ได้เลย
  // const donor = await db.getDonorById(params.id)

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {isEn ? "Edit Donor Information" : "แก้ไขข้อมูลผู้บริจาค"}
        </h1>
      </div>

      <form
        // action={updateDonor} // ผูกกับ Server Action ของคุณ
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {isEn ? "Name" : "ชื่อ"} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            // defaultValue={donor?.name}
            placeholder={isEn ? "Enter donor name or organization" : "ระบุชื่อหรือนามสกุลผู้บริจาค"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {isEn ? "Donor Type" : "ประเภทผู้บริจาค"}
          </label>
          <select
            name="donor_type"
            // defaultValue={donor?.donor_type}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="individual">{isEn ? "Individual" : "บุคคลธรรมดา"}</option>
            <option value="organization">{isEn ? "Organization" : "องค์กร / นิติบุคคล"}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {isEn ? "Email" : "อีเมล"}
          </label>
          <input
            type="email"
            name="email"
            // defaultValue={donor?.email ?? ''}
            placeholder="example@email.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {isEn ? "Phone Number" : "เบอร์โทร"}
          </label>
          <input
            type="text"
            name="phone"
            // defaultValue={donor?.phone ?? ''}
            placeholder="0xxxxxxxx"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {isEn ? "Province" : "จังหวัด"}
          </label>
          <select
            name="address"
            // defaultValue={donor?.address ?? ''}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">{isEn ? "-- Select Province --" : "-- เลือกจังหวัด --"}</option>
            {PROVINCES.map((prov: string) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              name="is_anonymous"
              // defaultChecked={donor?.is_anonymous}
              className="rounded border-slate-300"
            />
            {isEn ? "Anonymous" : "ไม่ประสงค์ออกนาม"}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              // defaultChecked={donor?.is_active ?? true}
              className="rounded border-slate-300"
            />
            {isEn ? "Active" : "ใช้งาน"}
          </label>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 rounded-md bg-brand px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-deep"
          >
            {isEn ? "Save Information" : "บันทึกข้อมูล"}
          </button>
          <Link
            href="/donors"
            className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Link>
        </div>
      </form>
    </main>
  )
}
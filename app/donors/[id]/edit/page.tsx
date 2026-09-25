import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PROVINCES } from '@/lib/provinces'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { updateDonor } from '../../actions'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditDonorPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  await requireStaffOrAdmin(supabase)

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const { data: donor } = await supabase
    .from('donors')
    .select('*')
    .eq('id', id)
    .single()

  if (!donor) {
    notFound()
  }

  // แยก address กลับเป็น ตำบล กับ จังหวัด
  //
  // ที่อยู่ถูกประกอบเป็น "<ตำบล> <จังหวัด>" (ดู app/donors/actions.ts)
  // จึงต้องอ่านจังหวัดจาก "คำสุดท้าย" เท่านั้น
  //
  // ถ้าไล่หาชื่อจังหวัดจากที่ไหนก็ได้ในข้อความ จะสลับกันเองเมื่อชื่อตำบล
  // ซ้ำกับชื่อจังหวัด ซึ่งมีอยู่จริง 22 กรณี เช่น ต.ขอนแก่น อยู่ใน จ.ร้อยเอ็ด
  // เปิดหน้าแก้ไขแล้วกดบันทึก ที่อยู่จะกลับด้านถาวรโดยไม่มีใครรู้ตัว
  const rawAddress = (donor?.address || '').trim()
  const addressParts = rawAddress ? rawAddress.split(/\s+/) : []
  const lastPart = addressParts[addressParts.length - 1] ?? ''
  const defaultProvince = PROVINCES.includes(lastPart) ? lastPart : ''
  // ที่อยู่เก่าที่ไม่ได้ลงท้ายด้วยชื่อจังหวัด เก็บไว้ทั้งก้อนในช่องตำบล ไม่ให้ข้อมูลหาย
  const defaultSubdistrict = defaultProvince
    ? addressParts.slice(0, -1).join(' ')
    : rawAddress
  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      <div className="mb-6">
        {/* ทางกลับ — เข้าหน้านี้จากทะเบียนหรือหน้าประวัติ ต้องมีทางออกที่ไม่ใช่ปุ่ม Back */}
        <Link
          href="/donors"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          ← {locale === 'th' ? 'กลับไปหน้าทะเบียนผู้บริจาค' : 'Back to donor registry'}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {dict.donors?.editTitle ?? dict.common?.edit ?? 'Edit Donor'}
        </h1>
      </div>

      <form
        action={updateDonor}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <input type="hidden" name="id" value={donor.id} />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.donors?.name ?? 'Name'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={donor?.name ?? ''}
            placeholder={dict.donors?.searchPlaceholder ?? 'Name'}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.donors?.donorType ?? 'Donor Type'}
          </label>
          <select
            name="donor_type"
            defaultValue={donor?.donor_type ?? 'individual'}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="individual">{dict.donors?.typeIndividual ?? 'Individual'}</option>
            <option value="organization">{dict.donors?.typeOrganization ?? 'Organization'}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.form?.email ?? 'Email'}
          </label>
          <input
            type="email"
            name="email"
            defaultValue={donor?.email ?? ''}
            placeholder="example@email.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.form?.phone ?? 'Phone number'}
          </label>
          <input
            type="text"
            name="phone"
            defaultValue={donor?.phone ?? ''}
            placeholder="0xxxxxxxx"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* ช่องกรอกตำบล (subdistrict) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {locale === 'th' ? 'ตำบล' : 'Subdistrict'}
          </label>
          <input
            type="text"
            name="subdistrict"
            defaultValue={defaultSubdistrict}
            placeholder={locale === 'th' ? 'ระบุตำบล' : 'Subdistrict'}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* ช่องเลือกจังหวัด (province_name) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.donors?.provinceArea ?? 'Province / Area'}
          </label>
          <select
            name="province_name"
            defaultValue={defaultProvince}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">{dict.donors?.selectProvince ?? 'Select Province'}</option>
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
              defaultChecked={donor?.is_anonymous ?? false}
              className="rounded border-slate-300"
            />
            {dict.donors?.anonymousCheckbox ?? 'Anonymous'}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={donor?.is_active ?? true}
              className="rounded border-slate-300"
            />
            {dict.donors?.active ?? 'Active'}
          </label>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 rounded-md bg-brand px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-deep"
          >
            {dict.common?.save ?? 'Save'}
          </button>
          <Link
            href="/donors"
            className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {dict.common?.cancel ?? 'Cancel'}
          </Link>
        </div>
      </form>
    </main>
  )
}
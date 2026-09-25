import Link from 'next/link'
import { createDonor } from '../actions'
import { PROVINCES } from '@/lib/provinces'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

export default async function NewDonorPage() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const th = locale === 'th'

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* หัวข้อและทางกลับ — ใช้โครงเดียวกับ /donations/new เพื่อให้ทุกหน้าฟอร์มหน้าตาตรงกัน */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/donors"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← {th ? 'กลับไปหน้าทะเบียนผู้บริจาค' : 'Back to donor registry'}
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {dict.donors?.addNew ?? 'Add donor'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {th
              ? 'บันทึกผู้บริจาครายใหม่เข้าทะเบียน เพื่อออกใบรับของและดูประวัติย้อนหลังได้'
              : 'Register a new donor so receipts and donation history can be tracked.'}
          </p>
        </div>
        <Link
          href="/donors"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← {th ? 'ทะเบียนผู้บริจาค' : 'Donor Registry'}
        </Link>
      </div>

      <form action={createDonor} className="space-y-5">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {th ? 'ข้อมูลผู้บริจาค' : 'Donor details'}
        </h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.donors?.name ?? 'Name'} <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            placeholder={dict.donors?.searchPlaceholder ?? 'Search by name...'}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.donors?.donorType ?? 'Donor Type'}
          </label>
          <select
            name="donor_type"
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
            name="email"
            type="email"
            placeholder="example@email.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.form?.phone ?? 'Phone number'}
          </label>
          <input
            name="phone"
            inputMode="numeric"
            placeholder="0xxxxxxxx"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* ช่องกรอกตำบล (subdistrict) ที่ดึงค่าจาก Dictionary */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.donors?.subdistrict ?? 'Subdistrict'}
          </label>
          <input
            name="subdistrict"
            placeholder={dict.donors?.subdistrictPlaceholder ?? 'Enter subdistrict'}
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">{dict.donors?.selectProvince ?? '-- Select Province --'}</option>
            {PROVINCES.map((prov: string) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              name="is_anonymous"
              type="checkbox"
              className="rounded border-slate-300"
            />
            {dict.donors?.anonymousCheckbox ?? 'Anonymous'}
          </label>
        </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
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
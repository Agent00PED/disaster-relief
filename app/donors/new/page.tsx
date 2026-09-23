import Link from 'next/link'
import { createDonor } from '../actions'
import { PROVINCES } from '@/app/lib/provinces'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

export default async function NewDonorPage() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {dict.donors.addNew}
      </h1>

      <form
        action={createDonor}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {locale === 'en' ? 'Name' : 'ชื่อ'} <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            placeholder={dict.donors.searchPlaceholder}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {locale === 'en' ? 'Donor Type' : 'ประเภทผู้บริจาค'}
          </label>
          <select
            name="donor_type"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="individual">{locale === 'en' ? 'Individual' : 'บุคคลธรรมดา'}</option>
            <option value="organization">{locale === 'en' ? 'Organization' : 'องค์กร / นิติบุคคล'}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {locale === 'en' ? 'Email' : 'อีเมล'}
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
            {locale === 'en' ? 'Phone Number' : 'เบอร์โทร'}
          </label>
          <input
            name="phone"
            inputMode="numeric"
            placeholder="0xxxxxxxx"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {locale === 'en' ? 'Province' : 'จังหวัด'}
          </label>
          <select
            name="address"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">{locale === 'en' ? '-- Select Province --' : '-- เลือกจังหวัด --'}</option>
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
            {dict.donors.anonymousCheckbox}
          </label>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
          >
            {dict.common.save}
          </button>
          <Link
            href="/donors"
            className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {dict.common.cancel}
          </Link>
        </div>
      </form>
    </main>
  )
}
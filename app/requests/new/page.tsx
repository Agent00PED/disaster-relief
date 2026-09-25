import Link from 'next/link'
import { createRequest } from '../actions'
import { getLocale } from '@/lib/i18n/locale'
import { UnitSelect } from '@/app/unit-select'
import { DietarySelect } from '@/app/dietary-select'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { createClient } from '@/lib/supabase/server'
import { getCenterPicker } from '@/lib/center-choice'
import { CenterSelect } from '@/app/center-select'

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const locale = await getLocale()
  const dict = getDictionary(locale)
  const centers = await getCenterPicker(await createClient(), 'shelter')

  const th = locale === 'th'

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* หัวข้อและทางกลับ — ใช้โครงเดียวกับ /donations/new เพื่อให้ทุกหน้าฟอร์มหน้าตาตรงกัน */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/requests"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← {th ? 'กลับไปหน้ารายการคำขอ' : 'Back to request list'}
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {dict.requests.newTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {th
              ? 'แจ้งสิ่งของที่ศูนย์พักพิงต้องการ พร้อมระดับความเร่งด่วน'
              : 'Tell us what the shelter needs, with its urgency level.'}
          </p>
        </div>
        <Link
          href="/requests"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← {th ? 'รายการคำขอ' : 'Request List'}
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <form action={createRequest} className="space-y-5">
        {centers && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              {th ? 'ศูนย์ที่ต้องการของ' : 'Requesting center'}
            </h2>
            <CenterSelect centers={centers} label={dict.common.center} placeholder={dict.common.selectCenter} />
          </section>
        )}

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {th ? 'รายละเอียดสิ่งของที่ขอ' : 'Requested item'}
        </h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.requests.itemWanted}</label>
          <input
            name="item_name"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.form.category}</label>
            <select
              name="category"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="food">{dict.form.categoryFood}</option>
              <option value="water">{dict.form.categoryWater}</option>
              <option value="medicine">{dict.form.categoryMedicine}</option>
              <option value="clothing">{dict.form.categoryClothing}</option>
              <option value="hygiene">{dict.form.categoryHygiene}</option>
              <option value="other">{dict.form.categoryOther}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.form.quantity}</label>
            <input
              name="quantity_requested"
              type="number"
              min={1}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
        <div>
          <label htmlFor="request-unit" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.requests.unit}
          </label>
          {/* คำขอไม่บังคับหน่วย — เว้นว่างไว้ระบบจะจัดสรรจากล็อตหน่วยไหนก็ได้ */}
          <UnitSelect
            id="request-unit"
            locale={locale}
            defaultValue=""
            allowEmpty
            emptyLabel={dict.requests.unitAny}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{dict.requests.unitHint}</p>
        </div>
        <div>
          <label htmlFor="request-dietary" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {dict.requests.dietary}
          </label>
          {/* เลือก "ทั่วไป" = รับของได้ทุกแบบ เลือกแบบอื่น = ระบบจะจ่ายให้เฉพาะของที่ตรงกัน */}
          <DietarySelect
            id="request-dietary"
            locale={locale}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{dict.requests.dietaryHint}</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.requests.urgency}</label>
          <select
            name="urgency"
            defaultValue="medium"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="low">{dict.requests.urgencyLow}</option>
            <option value="medium">{dict.requests.urgencyMedium}</option>
            <option value="high">{dict.requests.urgencyHigh}</option>
          </select>
        </div>
        </section>

        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-deep"
        >
          {dict.requests.submit}
        </button>
      </form>
    </main>
  )
}

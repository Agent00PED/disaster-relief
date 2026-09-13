// =====================================================================
// หน้าฟอร์มสาธารณะ — ขอความช่วยเหลือ (ผู้ใช้ทั่วไป)
//
// ไม่ต้อง login คู่กับ /pledge (บริจาค) แต่กลับทิศทาง — ผู้ขอเลือกศูนย์
// พักพิงที่เกี่ยวข้องเอง staff ของศูนย์นั้นจะมาตรวจสอบต่อที่ /help-requests
// (docs/sql/12_public_help_requests.sql)
//
// ตั้งใจให้ฟอร์มสั้นที่สุดเท่าที่จำเป็น — ผู้ใช้กลุ่มนี้อาจกำลังเดือดร้อน
// อยู่จริงๆ และมักใช้มือถือ จึงไม่ใส่ฟิลด์ที่ไม่จำเป็นเพิ่ม
// =====================================================================

import { createClient } from '@/lib/supabase/server'
import { submitHelpRequest } from './actions'
import { BrandMark } from '../brand-mark'
import { BackHomeLink } from '../back-home-link'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

export default async function HelpRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const { ok, error } = await searchParams
  const supabase = await createClient()
  const locale = await getLocale()
  const dict = getDictionary(locale)

  const { data: shelters } = await supabase
    .from('centers')
    .select('id, name')
    .eq('type', 'shelter')
    .eq('is_active', true)
    .order('name')

  return (
    <main className="brand-hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-sm">
        <BackHomeLink label={dict.common.backHome} />
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{dict.helpRequest.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{dict.helpRequest.subtitle}</p>
        </div>

        {ok && (
          <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {dict.helpRequest.successMsg}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        {!shelters || shelters.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
            {dict.helpRequest.noShelters}
          </p>
        ) : (
          <form
            action={submitHelpRequest}
            className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.form.name}</label>
              <input
                name="requester_name"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {dict.form.phoneContact}
              </label>
              <input
                name="requester_phone"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {dict.helpRequest.nearestShelter}
              </label>
              <select
                name="center_id"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">{dict.form.selectCenterPlaceholder}</option>
                {shelters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {dict.helpRequest.itemNeeded}
              </label>
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
                  name="quantity"
                  type="number"
                  min={1}
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {dict.helpRequest.urgency}
              </label>
              <select
                name="urgency"
                defaultValue="medium"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="low">{dict.helpRequest.urgencyLow}</option>
                <option value="medium">{dict.helpRequest.urgencyMedium}</option>
                <option value="high">{dict.helpRequest.urgencyHigh}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {dict.form.noteOptional}
              </label>
              <textarea
                name="note"
                rows={2}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
            >
              {dict.helpRequest.submit}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

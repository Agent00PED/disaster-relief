/*
 * หน้าฟอร์มยื่นคำร้องขอความช่วยเหลือ (Public)
 * - ผู้ขอไม่ต้อง Login (คู่กับ /pledge)
 * - ผู้ขอเลือกศูนย์พักพิงเอง แล้ว Staff ของศูนย์นั้นจะไปตรวจต่อที่ /help-requests
 * - อ้างอิง docs/sql/12_public_help_requests.sql
 */
import shared from '../login/login.module.css'
import styles from '../pledge/pledge.module.css'
import helpStyles from './help-request.module.css'
import { createClient } from '@/lib/supabase/server'
import { submitHelpRequest } from './actions'
import { PhoneInput } from '../phone-input'
import { BrandMark } from '../brand-mark'
import { BackHomeLink } from '../back-home-link'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { PROVINCES } from '@/lib/provinces' // <-- เพิ่ม Import จังหวัด
import { DietarySelect } from '@/app/dietary-select'
import { CategoryDietaryFields } from './category-dietary-fields'
import { AtSign, ClipboardList, FileText, Hash, MapPin, Package, Phone, Salad, Send, UserRound } from 'lucide-react'

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

  const features = [
    { title: dict.helpRequest.needsTitle, desc: dict.helpRequest.needsDesc, icon: 'list' },
    { title: dict.helpRequest.contactTitle, desc: dict.helpRequest.contactDesc, icon: 'phone' },
    { title: dict.helpRequest.localTitle, desc: dict.helpRequest.localDesc, icon: 'people' },
  ] as const

  return (
    <main className={`${shared.hero} ${styles.hero}`}>
      <div className={shared.artwork} aria-hidden="true" />
      <div className={styles.brand}>
        <BrandMark size="lg" />
      </div>
      <div className={styles.layout}>
        <section className={`${shared.panel} ${styles.panel}`} aria-labelledby="help-title">
          <BackHomeLink label={dict.common.backHome} />
          <header className={shared.formHeader}>
            <BrandMark size="lg" />
            <h1 id="help-title">{dict.helpRequest.title}</h1>
            <p>{dict.helpRequest.subtitle}</p>
          </header>

          {ok && <p role="status" className={styles.notice}>{dict.helpRequest.successMsg}</p>}
          {error && <p role="alert" className={shared.error}>{error}</p>}

          {!shelters || shelters.length === 0 ? (
            <p className={styles.notice}>{dict.helpRequest.noShelters}</p>
          ) : (
            <form action={submitHelpRequest} className={`${styles.form} space-y-4`}>
              <div>
                <label htmlFor="requester_name" className={helpStyles.fieldLabel}>
                  <UserRound aria-hidden="true" />
                  {dict.form.name}
                </label>
                <input id="requester_name" name="requester_name" autoComplete="name" required placeholder={dict.helpRequest.namePlaceholder} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="requester_phone" className={helpStyles.fieldLabel}>
                    <Phone aria-hidden="true" />
                    {dict.form.phoneContact}
                  </label>
                  <PhoneInput id="requester_phone" name="requester_phone" required placeholder={dict.helpRequest.phonePlaceholder} />
                </div>
                <div>
                  <label htmlFor="requester_email" className={helpStyles.fieldLabel}>
                    <AtSign aria-hidden="true" />
                    {dict.form.email}
                  </label>
                  <input id="requester_email" name="requester_email" type="email" autoComplete="email" placeholder={dict.helpRequest.emailPlaceholder} />
                </div>
              </div>

              {/* ================= เริ่มส่วนที่อยู่ (ตำบล/จังหวัด) ================= */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="subdistrict" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {dict.form.subdistrictOptional}
                  </label>
                  <input
                    id="subdistrict"
                    name="subdistrict"
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label htmlFor="province_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {dict.form.provinceOptional}
                  </label>
                  <select
                    id="province_name"
                    name="province_name"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">{dict.form.selectProvince}</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* ================= สิ้นสุดส่วนที่อยู่ ================= */}

              <div>
                <label htmlFor="center_id" className={helpStyles.fieldLabel}>
                  <MapPin aria-hidden="true" />
                  {dict.helpRequest.nearestShelter}
                </label>
                <select
                  id="center_id"
                  name="center_id"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
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
                  <label htmlFor="item_name" className={helpStyles.fieldLabel}>
                    <Package aria-hidden="true" />
                  {dict.helpRequest.itemNeeded}
                </label>
                <input id="item_name" name="item_name" required placeholder={dict.helpRequest.itemPlaceholder} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CategoryDietaryFields
                  labelClassName={helpStyles.fieldLabel}
                  categoryLabel={
                    <>
                      <ClipboardList aria-hidden="true" />
                      {dict.form.category}
                    </>
                  }
                  options={[
                    { value: 'food', label: dict.form.categoryFood },
                    { value: 'water', label: dict.form.categoryWater },
                    { value: 'medicine', label: dict.form.categoryMedicine },
                    { value: 'clothing', label: dict.form.categoryClothing },
                    { value: 'hygiene', label: dict.form.categoryHygiene },
                    { value: 'other', label: dict.form.categoryOther },
                  ]}
                  dietaryField={
                    <div>
                      <label htmlFor="help-request-dietary" className={helpStyles.fieldLabel}>
                        <Salad aria-hidden="true" />
                        {dict.requests.dietary}
                      </label>
                      <DietarySelect
                        id="help-request-dietary"
                        locale={locale}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                  }
                />
                <div>
                  <label htmlFor="quantity" className={helpStyles.fieldLabel}>
                    <Hash aria-hidden="true" />
                    {dict.form.quantity}
                  </label>
                  <input id="quantity" name="quantity" type="number" min={1} required placeholder={dict.helpRequest.quantityPlaceholder} />
                </div>
              </div>

              <div>
                <label htmlFor="urgency" className={helpStyles.fieldLabel}>
                  <Send aria-hidden="true" />
                  {dict.helpRequest.urgency}
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  defaultValue="medium"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="low">{dict.helpRequest.urgencyLow}</option>
                  <option value="medium">{dict.helpRequest.urgencyMedium}</option>
                  <option value="high">{dict.helpRequest.urgencyHigh}</option>
                </select>
              </div>

              <div>
                <label htmlFor="note" className={helpStyles.fieldLabel}>
                  <FileText aria-hidden="true" />
                  {dict.form.noteOptional}
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={2}
                  placeholder={dict.helpRequest.notePlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <button type="submit" className={`${shared.submit} w-full py-3 text-base font-medium transition duration-150`}>
                {dict.helpRequest.submit}
              </button>
            </form>
          )}
          <p className={styles.notice}>{dict.helpRequest.followUp}</p>
        </section>

      </div>
    </main>
  )
}
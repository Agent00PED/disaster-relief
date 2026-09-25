import shared from '../login/login.module.css'
import styles from './pledge.module.css'
import { submitPledge } from './actions'
import { UnitSelect } from '@/app/unit-select'
import { DietarySelect } from '@/app/dietary-select'
import { PROVINCES } from '@/lib/provinces'
import { BrandMark } from '../brand-mark'
import { BackHomeLink } from '../back-home-link'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import {
  AtSign,
  ClipboardList,
  FileText,
  Hash,
  MapPin,
  Package,
  Phone,
  Scale,
  UserRound,
  Utensils,
} from 'lucide-react'

export default async function PledgePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; category?: string }>
}) {
  const { ok, error, category } = await searchParams
  const initialCategory = ['food', 'water', 'medicine', 'clothing', 'hygiene', 'other'].includes(category ?? '') ? category : 'food'
  const locale = await getLocale()
  const dict = getDictionary(locale)

  const features = [
    { title: dict.pledge.goodsTitle, desc: dict.pledge.goodsDesc, icon: 'shield' },
    { title: dict.pledge.careTitle, desc: dict.pledge.careDesc, icon: 'heart' },
    { title: dict.entryHub.togetherTitle, desc: dict.login.togetherDesc, icon: 'people' },
  ] as const

  return (
    <main className={`${shared.hero} ${styles.hero}`}>
      <div className={shared.artwork} aria-hidden="true" />
      <div className={styles.brand}>
        <BrandMark size="lg" />
      </div>
      <div className={styles.layout}>
        <section className={styles.intro}>
          <h2>
            {dict.pledge.introTitle}
            <span>{dict.pledge.introAccent}</span>
          </h2>
          <p>{dict.pledge.introDesc}</p>
          <blockquote>
            {dict.pledge.motto}
            <span aria-hidden="true"> &hearts;</span>
          </blockquote>
        </section>

        <section className={`${shared.panel} ${styles.panel}`} aria-labelledby="pledge-title">
          <BackHomeLink label={dict.common.backHome} />
          <header className={shared.formHeader}>
            <BrandMark size="lg" />
            <h1 id="pledge-title">{dict.pledge.title}</h1>
            <p>{dict.pledge.subtitle}</p>
          </header>

          {ok && <p role="status" className={styles.notice}>{dict.pledge.successMsg}</p>}
          {error && <p role="alert" className={shared.error}>{error}</p>}

          <form action={submitPledge} className={`${styles.form} space-y-4`}>
            <div>
              <label htmlFor="donor-name" className={styles.fieldLabel}>
                <UserRound aria-hidden="true" />
                {dict.form.name}
              </label>
              <input
                id="donor-name"
                name="donor_name"
                autoComplete="name"
                required
                placeholder={dict.pledge.namePlaceholder}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="donor-phone" className={styles.fieldLabel}>
                  <Phone aria-hidden="true" />
                  {dict.form.phone}
                </label>
                <input
                  id="donor-phone"
                  name="donor_phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={dict.pledge.phonePlaceholder}
                />
              </div>
              <div>
                <label htmlFor="donor-email" className={styles.fieldLabel}>
                  <AtSign aria-hidden="true" />
                  {dict.form.email}
                </label>
                <input
                  id="donor-email"
                  name="donor_email"
                  type="email"
                  autoComplete="email"
                  placeholder={dict.pledge.emailPlaceholder}
                />
              </div>
            </div>

            {/* ที่อยู่ผู้บริจาค — ส่งต่อไปสร้างทะเบียนผู้บริจาคตอนเจ้าหน้าที่อนุมัติ
                ตำบลต้องมาก่อนจังหวัดเสมอ เพราะหน้าอื่นอ่านจังหวัดจากคำสุดท้าย */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="subdistrict" className={styles.fieldLabel}>
                  <MapPin aria-hidden="true" />
                  {dict.form.subdistrictOptional}
                </label>
                <input
                  id="subdistrict"
                  name="subdistrict"
                  placeholder={dict.donors.subdistrictPlaceholder}
                />
              </div>
              <div>
                <label htmlFor="province_name" className={styles.fieldLabel}>
                  <MapPin aria-hidden="true" />
                  {dict.form.provinceOptional}
                </label>
                <select
                  id="province_name"
                  name="province_name"
                  defaultValue=""
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">{dict.donors.selectProvince}</option>
                  {PROVINCES.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="item-name" className={styles.fieldLabel}>
                <Package aria-hidden="true" />
                {dict.pledge.itemWanted}
              </label>
              <input
                id="item-name"
                name="item_name"
                required
                placeholder={dict.pledge.itemPlaceholder}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className={styles.fieldLabel}>
                  <ClipboardList aria-hidden="true" />
                  {dict.form.category}
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  defaultValue={initialCategory}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="food">{dict.form.categoryFood}</option>
                  <option value="water">{dict.form.categoryWater}</option>
                  <option value="medicine">{dict.form.categoryMedicine}</option>
                  <option value="clothing">{dict.form.categoryClothing}</option>
                  <option value="hygiene">{dict.form.categoryHygiene}</option>
                  <option value="other">{dict.form.categoryOther}</option>
                </select>
              </div>
              {/* ข้อกำหนดด้านอาหาร — ต้องมี ไม่งั้นของฮาลาลจะถูกบันทึกเป็นของทั่วไป
                  แล้วเอาไปจ่ายให้คำขอที่ระบุฮาลาลไม่ได้ */}
              <div>
                <label htmlFor="pledge-dietary" className={styles.fieldLabel}>
                  <Utensils aria-hidden="true" />
                  {dict.requests.dietary}
                </label>
                <DietarySelect
                  id="pledge-dietary"
                  name="dietary_type"
                  locale={locale}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label htmlFor="quantity" className={styles.fieldLabel}>
                  <Hash aria-hidden="true" />
                  {dict.form.quantity}
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  required
                  placeholder={dict.pledge.quantityPlaceholder}
                />
              </div>
            </div>

            <div>
              <label htmlFor="unit" className={styles.fieldLabel}>
                <Scale aria-hidden="true" />
                {dict.pledge.unit}
              </label>
              <UnitSelect
                id="unit"
                locale={locale}
                required
                aria-label={dict.pledge.unit}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label htmlFor="note" className={styles.fieldLabel}>
                <FileText aria-hidden="true" />
                {dict.form.note}
              </label>
              <textarea
                id="note"
                name="note"
                rows={2}
                placeholder={dict.form.noteOptional}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              type="submit"
              className={`${shared.submit} w-full py-3 text-base font-medium transition duration-150`}
            >
              {dict.pledge.submit}
            </button>
          </form>
          <p className={styles.notice}>{dict.pledge.followUp}</p>
        </section>

        <aside className={shared.features}>
          {features.map((feature) => (
            <div className={shared.feature} key={feature.title}>
              <span className={feature.icon === 'shield' ? shared.shield : feature.icon === 'heart' ? shared.heart : shared.people}>
                <svg viewBox="0 0 24 24" fill={feature.icon === 'heart' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {feature.icon === 'shield' && (
                    <path d="m12 2 10 5v10l-10 5-10-5V7l10-5Zm0 10v10M2 7l10 5 10-5M7 4.5l10 5V15" />
                  )}
                  {feature.icon === 'heart' && (
                    <path d="M12 21S2 15 2 8a5.5 5.5 0 0 1 10-3 5.5 5.5 0 0 1 10 3c0 7-10 13-10 13Z" />
                  )}
                  {feature.icon === 'people' && (
                    <>
                      <circle cx="12" cy="7" r="3" />
                      <path d="M6 21v-3a6 6 0 0 1 12 0v3H6ZM4 4a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6M3 15a4 4 0 0 0-2 4v1m20-5a4 4 0 0 1 2 4v1" />
                    </>
                  )}
                </svg>
              </span>
              <div>
                <h2>{feature.title}</h2>
                <p>{feature.desc}</p>
              </div>
            </div>
          ))}
          <p className={styles.thanks}>
            {dict.pledge.thanks}
            <span aria-hidden="true"> &hearts;</span>
          </p>
        </aside>
      </div>
    </main>
  )
}


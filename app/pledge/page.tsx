// app/pledge/page.tsx
// =====================================================================
// หน้าฟอร์มสาธารณะ — แจ้งความประสงค์บริจาค (ผู้ใช้ทั่วไป)
//
// Route: /pledge
// เข้าจากหน้า Entry
//
// ไม่ต้อง login
// เมื่อส่งข้อมูลแล้ว → บันทึกลง donation_pledges
// staff จะมาตรวจสอบ/ยืนยันต่อที่หน้า /pledges
// =====================================================================

import Link from 'next/link'
import {
  Gift,
  Mail,
  Phone,
  Send,
  UserRound,
  Heart,
  Package,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

import { submitPledge } from './actions'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

function FieldShell({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[42px] items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-[#1d3b5a] focus-within:ring-2 focus-within:ring-[#1d3b5a]/10 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-sky-500 dark:focus-within:ring-sky-500/20 dark:hover:border-slate-600">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f3f5f6] text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
        {icon}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default async function PledgePage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string
    error?: string
  }>
}) {
  const { ok, error } = await searchParams

  const locale = await getLocale()
  // ✅ แก้ไข: กำหนด type เป็น Record<string, Record<string, string>> เพื่อหลีกเลี่ยงการใช้ any และผ่าน ESLint
  const dict = (await getDictionary(locale)) as unknown as Record<string, Record<string, string>>
  const isEn = locale === 'en'

  // Dynamic Translations Dictionary with fallback support
  const t = {
    brand: 'WalaiTrack',
    title1: dict?.pledge?.title1 || (isEn ? 'Notify Your' : 'แจ้งความประสงค์'),
    title2: dict?.pledge?.title2 || (isEn ? 'Donation' : 'บริจาค'),
    slogan:
      dict?.pledge?.slogan ||
      (isEn
        ? 'Be part of helping disaster victims with your valuable items and goodwill.'
        : 'ร่วมเป็นส่วนหนึ่งในการช่วยเหลือผู้ประสบภัย ด้วยสิ่งของและน้ำใจอันทรงคุณค่าจากคุณ'),
    givingPower:
      dict?.pledge?.givingPower ||
      (isEn ? 'Every gift is a great power' : 'ทุกการให้ คือ พลังที่ยิ่งใหญ่'),
    transparentMsg:
      dict?.pledge?.transparentMsg ||
      (isEn
        ? 'Every item will be delivered transparently to disaster victims.'
        : 'สิ่งของทุกชิ้นของคุณจะถูกจัดส่งถึงมือผู้ประสบภัยอย่างโปร่งใส'),
    backHome: dict?.pledge?.backHome || (isEn ? 'Back to Home' : 'กลับหน้าหลัก'),
    formTitle:
      dict?.pledge?.formTitle || (isEn ? 'Pledge Donation' : 'แจ้งความประสงค์บริจาค'),
    formSubtitle:
      dict?.pledge?.formSubtitle ||
      (isEn
        ? 'No login required — Staff will contact you back'
        : 'ไม่ต้องเข้าสู่ระบบ — เจ้าหน้าที่จะติดต่อกลับ'),
    successTitle:
      dict?.pledge?.successTitle || (isEn ? 'Submitted Successfully!' : 'ส่งข้อมูลสำเร็จ!'),
    successMsg:
      dict?.pledge?.successMsg ||
      (isEn
        ? 'Thank you for your generosity. Our staff will contact you shortly.'
        : 'ขอบคุณสำหรับน้ำใจของท่าน เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด'),

    // Labels & Placeholders
    yourName: dict?.pledge?.yourName || (isEn ? 'Your Name' : 'ชื่อของคุณ'),
    namePlaceholder:
      dict?.pledge?.namePlaceholder ||
      (isEn ? 'Donor name or organization' : 'ชื่อผู้บริจาค หรือชื่อองค์กร'),
    phone: dict?.pledge?.phone || (isEn ? 'Phone Number' : 'เบอร์โทรศัพท์'),
    email: dict?.pledge?.email || (isEn ? 'Email' : 'อีเมล'),
    optional: dict?.pledge?.optional || (isEn ? '(Optional)' : '(ถ้ามี)'),
    itemToDonate:
      dict?.pledge?.itemToDonate || (isEn ? 'Item to Donate' : 'สิ่งที่อยากบริจาค'),
    itemPlaceholder:
      dict?.pledge?.itemPlaceholder ||
      (isEn ? 'Specify items to donate' : 'ระบุสิ่งของที่ต้องการบริจาค'),
    category: dict?.pledge?.category || (isEn ? 'Category' : 'หมวดหมู่'),
    selectCategory:
      dict?.pledge?.selectCategory || (isEn ? 'Select category' : 'เลือกประเภท'),
    quantity: dict?.pledge?.quantity || (isEn ? 'Quantity' : 'จำนวน'),
    qtyPlaceholder:
      dict?.pledge?.qtyPlaceholder || (isEn ? 'Enter amount' : 'ระบุจำนวน'),
    unit: dict?.pledge?.unit || (isEn ? 'Unit' : 'หน่วย'),
    note: dict?.pledge?.note || (isEn ? 'Note' : 'หมายเหตุ'),
    noteOptional:
      dict?.pledge?.noteOptional || (isEn ? '(Additional details)' : '(รายละเอียดเพิ่มเติม)'),
    notePlaceholder:
      dict?.pledge?.notePlaceholder ||
      (isEn
        ? 'Additional details e.g. preferred pickup date...'
        : 'รายละเอียดเพิ่มเติม เช่น สะดวกส่งของวันไหน หรือต้องการให้มารับ...'),
    submitBtn: dict?.pledge?.submitBtn || (isEn ? 'Submit Pledge' : 'ส่งคำร้อง'),
    footerNotice:
      dict?.pledge?.footerNotice ||
      (isEn
        ? 'After submission, staff will contact you back for pickup and donation details.'
        : 'หลังจากการส่งข้อมูลแล้ว เจ้าหน้าที่จะติดต่อกลับเพื่อรับสินค้าและแจ้งรายละเอียดการรับบริจาค'),

    // Categories
    catFood: isEn ? 'Food / Dry Food' : 'อาหาร / อาหารแห้ง',
    catWater: isEn ? 'Drinking Water' : 'น้ำดื่ม',
    catMed: isEn ? 'Medicine / Medical Supplies' : 'ยาสามัญ / เวชภัณฑ์',
    catClothes: isEn ? 'Clothing / Apparel' : 'เสื้อผ้า / เครื่องน้อมห่ม',
    catHygiene: isEn ? 'Personal Care / Household' : 'ของใช้ส่วนตัว / ของใช้ในบ้าน',
    catOther: isEn ? 'Other' : 'อื่น ๆ',

    // Units
    unitPiece: isEn ? 'Piece(s)' : 'ชิ้น',
    unitBox: isEn ? 'Box(es)' : 'กล่อง',
    unitPack: isEn ? 'Pack(s)' : 'แพ็ค',
    unitBag: isEn ? 'Bag(s)' : 'ถุง',
    unitSet: isEn ? 'Set(s)' : 'ชุด',
    unitBottle: isEn ? 'Bottle(s)' : 'ขวด',
    unitCrate: isEn ? 'Crate(s)' : 'ลัง',
    unitSack: isEn ? 'Sack(s)' : 'กระสอบ',
    unitKg: isEn ? 'Kg' : 'กิโลกรัม',
    unitOther: isEn ? 'Other' : 'อื่นๆ',

    // Side Features
    feat1Title: isEn ? 'Donate Items' : 'ส่งของบริจาค',
    feat1Desc: isEn
      ? 'Help disaster victims quickly and directly in local areas.'
      : 'ช่วยเหลือผู้ประสบภัยในพื้นที่ได้อย่างรวดเร็วและตรงจุด',
    feat2Title: isEn ? 'Pass Along Care' : 'ส่งต่อความห่วงใย',
    feat2Desc: isEn
      ? 'Every donation brings great encouragement to recipients.'
      : 'ทุกการบริจาคของคุณ คือกำลังใจอันยิ่งใหญ่ของผู้รับ',
    feat3Title: isEn ? 'Join Hands' : 'ร่วมมือกัน',
    feat3Desc: isEn
      ? 'Together we make a meaningful impact.'
      : 'เพราะทุกการร่วมมือคือพลังขับเคลื่อนที่สำคัญ',
    thankTitle: isEn ? 'Thank you for all kindness' : 'ขอบคุณทุกน้ำใจ',
    thankSub: isEn ? 'in spreading help' : 'ที่ส่งต่อความช่วยเหลือ',
    sysTrackTitle: isEn ? 'Transparent Tracking' : 'ระบบติดตามการบริจาคโปร่งใส',
    sysTrackDesc: isEn
      ? 'Your donation info will be systematically processed and distributed to shelters.'
      : 'ข้อมูลของท่านจะถูกประมวลผลและนำไปกระจายสิ่งของยังศูนย์พักพิงอย่างเป็นระบบ',
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf7f2] font-sans text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* ============================================================
          BACKGROUND & HERO SECTION
      ============================================================ */}
      <section className="relative min-h-[calc(100vh-64px)] py-8 md:py-12">
        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbf7] via-[#f7f2ea] to-[#ebdccb]/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/60" />

          {/* Soft cloud shapes */}
          <div className="absolute left-[5%] top-[6%] h-24 w-56 rounded-full bg-white/80 blur-3xl dark:bg-sky-900/20" />
          <div className="absolute right-[8%] top-[8%] h-28 w-64 rounded-full bg-white/80 blur-3xl dark:bg-indigo-900/20" />

          {/* Warm Sun */}
          <div className="absolute right-[12%] top-[18%] h-20 w-20 rounded-full bg-[#f6d38b]/50 blur-sm dark:bg-amber-500/10" />

          {/* Vector Landscapes Background */}
          <div className="absolute bottom-0 left-0 h-[35%] w-[42%] opacity-30 dark:opacity-10">
            <div
              className="absolute inset-0"
              style={{
                clipPath:
                  'polygon(0 78%, 13% 56%, 23% 67%, 38% 25%, 50% 53%, 61% 37%, 75% 68%, 87% 49%, 100% 76%, 100% 100%, 0 100%)',
                background: '#8ca188',
              }}
            />
            <div
              className="absolute bottom-0 left-0 h-[75%] w-full"
              style={{
                clipPath:
                  'polygon(0 88%, 20% 62%, 35% 75%, 51% 42%, 66% 67%, 79% 55%, 100% 86%, 100% 100%, 0 100%)',
                background: '#69856f',
              }}
            />
          </div>

          <div className="absolute bottom-0 right-0 h-[35%] w-[42%] opacity-30 dark:opacity-10">
            <div
              className="absolute inset-0"
              style={{
                clipPath:
                  'polygon(0 77%, 15% 57%, 27% 68%, 41% 34%, 53% 54%, 67% 25%, 80% 62%, 92% 45%, 100% 73%, 100% 100%, 0 100%)',
                background: '#8ca188',
              }}
            />
            <div
              className="absolute bottom-0 right-0 h-[75%] w-full"
              style={{
                clipPath:
                  'polygon(0 85%, 18% 65%, 35% 76%, 50% 48%, 65% 70%, 79% 54%, 100% 85%, 100% 100%, 0 100%)',
                background: '#638269',
              }}
            />
          </div>

          {/* Water/Ground base */}
          <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-gradient-to-t from-[#b2c8c3]/40 to-transparent dark:from-slate-900/60" />
        </div>

        {/* ============================================================
            MAIN CONTENT CONTAINER (3-COLUMN GRID)
        ============================================================ */}
        <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.3fr_1fr] lg:gap-10">
            
            {/* ======================================================
                LEFT COLUMN: Greeting & Slogan
            ====================================================== */}
            <div className="hidden space-y-6 lg:block">
              <div>
                <p className="text-sm font-bold tracking-wide uppercase text-[#1d3b5a] dark:text-sky-300">
                  {t.brand}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold leading-tight text-[#183b59] dark:text-slate-100">
                  {t.title1}
                  <br />
                  <span className="text-[#4b3d9d] dark:text-violet-300">{t.title2}</span>
                </h1>
                <p className="mt-3 max-w-[280px] text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.slogan}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-xl font-bold leading-snug text-[#183b59] dark:text-slate-100">
                  {t.givingPower}
                  <span className="ml-1.5 inline-block animate-pulse text-[#4b3d9d] dark:text-violet-300">
                    ♥
                  </span>
                </p>
                <div className="mt-2 h-[3px] w-28 rotate-[-3deg] rounded-full bg-[#4b3d9d] dark:bg-violet-400" />
              </div>

              {/* Left Art Box */}
              <div className="relative mt-6 h-[200px] w-full overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-b from-white/40 to-[#dce7db]/60 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-800/60">
                <div className="flex h-full flex-col justify-end">
                  <div className="relative z-10 rounded-xl bg-white/80 p-3 shadow-sm backdrop-blur-md dark:bg-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ece7ff] text-[#4b3d9d] dark:bg-violet-500/20 dark:text-violet-300">
                        <Heart className="h-4 w-4 fill-current" />
                      </div>
                      <p className="text-[11px] font-medium leading-snug text-slate-700 dark:text-slate-300">
                        {t.transparentMsg}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================
                CENTER COLUMN: FORM CARD
            ====================================================== */}
            <div className="mx-auto w-full max-w-[520px]">
              <div className="rounded-2xl border border-[#e5dcd0] bg-white/95 p-6 shadow-[0_20px_50px_rgba(30,41,59,0.08)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:p-7">
                
                {/* Back button */}
                <div className="mb-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t.backHome}
                  </Link>
                </div>

                {/* Form Header */}
                <div className="mb-6 text-center">
                  <div className="mb-1 flex items-center justify-center gap-1.5">
                    <Heart className="h-5 w-5 fill-[#4b3d9d] text-[#4b3d9d] dark:fill-violet-400 dark:text-violet-400" />
                    <span className="text-lg font-bold tracking-tight text-[#183b59] dark:text-slate-100">
                      {t.brand}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-[#183b59] dark:text-slate-100">
                    {t.formTitle}
                  </h2>

                  <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                    {t.formSubtitle}
                  </p>
                </div>

                {/* Success Alert */}
                {ok && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-800 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-semibold">{t.successTitle}</p>
                      <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300/80">
                        {t.successMsg}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/90 p-3 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-300" />
                    <p className="text-[11px]">{error}</p>
                  </div>
                )}

                {/* FORM */}
                <form action={submitPledge} className="space-y-3.5">
                  {/* Donor Name */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.yourName} <span className="text-slate-400 dark:text-slate-500">*</span>
                    </label>
                    <FieldShell icon={<UserRound className="h-3.5 w-3.5" />}>
                      <input
                        name="donor_name"
                        required
                        placeholder={t.namePlaceholder}
                        className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </FieldShell>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {t.phone} <span className="text-slate-400 dark:text-slate-500">*</span>
                      </label>
                      <FieldShell icon={<Phone className="h-3.5 w-3.5" />}>
                        <input
                          name="donor_phone"
                          type="tel"
                          required
                          placeholder="081-234-5678"
                          className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                      </FieldShell>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {t.email}{' '}
                        <span className="font-normal text-slate-400 dark:text-slate-500">
                          {t.optional}
                        </span>
                      </label>
                      <FieldShell icon={<Mail className="h-3.5 w-3.5" />}>
                        <input
                          name="donor_email"
                          type="email"
                          placeholder="example@email.com"
                          className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                      </FieldShell>
                    </div>
                  </div>

                  {/* Item Name */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.itemToDonate} <span className="text-slate-400 dark:text-slate-500">*</span>
                    </label>
                    <FieldShell icon={<Gift className="h-3.5 w-3.5" />}>
                      <input
                        name="item_name"
                        required
                        placeholder={t.itemPlaceholder}
                        className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </FieldShell>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.category} <span className="text-slate-400 dark:text-slate-500">*</span>
                    </label>
                    <FieldShell icon={<Package className="h-3.5 w-3.5" />}>
                      <select
                        name="category"
                        required
                        defaultValue=""
                        className="w-full cursor-pointer border-0 bg-transparent p-0 text-[12px] text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="" disabled className="dark:bg-slate-800">
                          {t.selectCategory}
                        </option>
                        <option value="food" className="dark:bg-slate-800">
                          {t.catFood}
                        </option>
                        <option value="water" className="dark:bg-slate-800">
                          {t.catWater}
                        </option>
                        <option value="medicine" className="dark:bg-slate-800">
                          {t.catMed}
                        </option>
                        <option value="clothing" className="dark:bg-slate-800">
                          {t.catClothes}
                        </option>
                        <option value="hygiene" className="dark:bg-slate-800">
                          {t.catHygiene}
                        </option>
                        <option value="other" className="dark:bg-slate-800">
                          {t.catOther}
                        </option>
                      </select>
                    </FieldShell>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.quantity} <span className="text-slate-400 dark:text-slate-500">*</span>
                    </label>
                    <FieldShell icon={<Package className="h-3.5 w-3.5" />}>
                      <input
                        name="quantity"
                        type="number"
                        min={1}
                        required
                        placeholder={t.qtyPlaceholder}
                        className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </FieldShell>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {t.note}{' '}
                      <span className="font-normal text-slate-400 dark:text-slate-500">
                        {t.noteOptional}
                      </span>
                    </label>
                    <textarea
                      name="note"
                      rows={2}
                      placeholder={t.notePlaceholder}
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1d3b5a] focus:ring-2 focus:ring-[#1d3b5a]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="group flex h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#1d3b5a] text-[13px] font-semibold text-white shadow-md transition hover:bg-[#152c44] active:scale-[0.99] dark:bg-sky-600 dark:hover:bg-sky-500"
                    >
                      <span>{t.submitBtn}</span>
                      <Send className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </button>
                  </div>

                  {/* Footer Info Notice */}
                  <div className="rounded-lg border border-[#d3e3ed] bg-[#f0f5f8] p-3 text-center dark:border-slate-700/80 dark:bg-slate-800/60">
                    <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {t.footerNotice}
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* ======================================================
                RIGHT COLUMN: Feature Highlights & Thank You Quote
            ====================================================== */}
            <div className="hidden space-y-6 lg:block">
              <div className="space-y-4">
                {/* Feature 1 */}
                <div className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/50 p-2.5 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e3eff7] text-[#347298] dark:bg-sky-950 dark:text-sky-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold text-[#183b59] dark:text-slate-100">
                      {t.feat1Title}
                    </h3>
                    <p className="mt-0.5 text-[10px] leading-normal text-slate-500 dark:text-slate-400">
                      {t.feat1Desc}
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/50 p-2.5 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#efeaff] text-[#4b3d9d] dark:bg-violet-900/60 dark:text-violet-300">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold text-[#183b59] dark:text-slate-100">
                      {t.feat2Title}
                    </h3>
                    <p className="mt-0.5 text-[10px] leading-normal text-slate-500 dark:text-slate-400">
                      {t.feat2Desc}
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/50 p-2.5 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f3e6] text-[#5b8c5a] dark:bg-emerald-950 dark:text-emerald-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold text-[#183b59] dark:text-slate-100">
                      {t.feat3Title}
                    </h3>
                    <p className="mt-0.5 text-[10px] leading-normal text-slate-500 dark:text-slate-400">
                      {t.feat3Desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thank You Quote */}
              <div className="pt-2">
                <p className="text-lg font-bold leading-snug text-[#183b59] dark:text-slate-100">
                  {t.thankTitle}
                  <br />
                  <span className="text-[#4b3d9d] dark:text-violet-300">{t.thankSub}</span>
                  <span className="ml-1 inline-block text-[#4b3d9d] dark:text-violet-300">♥</span>
                </p>
                <div className="mt-2 h-[3px] w-32 rotate-[-2deg] rounded-full bg-[#4b3d9d] dark:bg-violet-400" />
              </div>

              {/* Right Art Box */}
              <div className="relative mt-4 h-[180px] w-full overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-b from-white/40 to-[#dce7db]/60 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-800/60">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#183b59] dark:text-slate-100">
                    <Sparkles className="h-3.5 w-3.5 text-[#f59e0b] dark:text-amber-400" />
                    <span>{t.sysTrackTitle}</span>
                  </div>
                  <p className="p-2.5 text-[10px] leading-relaxed text-slate-600 bg-white/70 rounded-lg backdrop-blur-xs shadow-2xs dark:bg-slate-800/80 dark:text-slate-300">
                    {t.sysTrackDesc}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
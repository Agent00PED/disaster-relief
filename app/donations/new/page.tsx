import Link from 'next/link'
import { createDonation } from '../actions'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { getCenterPicker } from '@/lib/center-choice'
import { CenterSelect } from '@/app/center-select'
import NewDonationForm from './NewDonationForm'

export const dynamic = 'force-dynamic'

export default async function NewDonationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const locale = await getLocale()
  const dict = getDictionary(locale)
  const supabase = await createClient()
  await requireStaffOrAdmin(supabase)
  const centers = await getCenterPicker(supabase, 'warehouse')

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/donations"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← {locale === 'th' ? 'กลับไปหน้ารายการของบริจาค' : 'Back to donation list'}
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {dict.donationNew.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {locale === 'th'
              ? 'บันทึกรายการสิ่งของที่รับเข้าคลังสินค้า'
              : 'Record incoming donated items into warehouse.'}
          </p>
        </div>
        <Link
          href="/donations"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← {locale === 'th' ? 'รายการของบริจาค' : 'Donation List'}
        </Link>
      </div>

      <NewDonationForm
        locale={locale}
        dict={dict}
        error={error}
        createDonationAction={createDonation}
        centerSelect={
          centers ? (
            <CenterSelect
              centers={centers}
              label={dict.common.center}
              placeholder={dict.common.selectCenter}
            />
          ) : null
        }
      />
    </main>
  )
}

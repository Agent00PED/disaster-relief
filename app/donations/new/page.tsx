import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { createDonation } from '../actions'
import NewDonationForm from './NewDonationForm'

export default async function NewDonationPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string
  }>
}) {
  const { error } = await searchParams

  const locale = await getLocale()

  const dict = getDictionary(
    locale
  ) as unknown as Parameters<
    typeof NewDonationForm
  >[0]['dict']

  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">

        {/* =========================
            PAGE HEADER
        ========================= */}
        <div className="mb-7 flex items-center gap-4">
          {/* Icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
            <svg
              className="h-7 w-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3.27 6.96L12 12l8.73-5.04M12 22V12"
              />
            </svg>
          </div>

          {/* Title + Description */}
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">
              {locale === 'th'
                ? 'บันทึกของเข้าคลัง'
                : 'Record Incoming Items'}
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {locale === 'th'
                ? 'บันทึกสิ่งของที่ได้รับเข้าคลังทั้งหมด'
                : 'Record all items received into the warehouse'}
            </p>
          </div>
        </div>

        {/* =========================
            DONATION FORM
        ========================= */}
        <NewDonationForm
          dict={dict}
          locale={locale}
          error={error}
          createDonationAction={
            createDonation
          }
        />
      </div>
    </main>
  )
}
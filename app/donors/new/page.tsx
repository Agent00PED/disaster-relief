import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { DonorForm } from './donor-form'

export default async function NewDonorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const locale = await getLocale()
  const dict = getDictionary(locale)

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">{dict.donors.addTitle}</h1>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <DonorForm />
    </main>
  )
}

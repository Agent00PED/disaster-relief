import { BackHomeLink } from './back-home-link'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

export default async function NotFound() {
  const locale = await getLocale()
  const dict = getDictionary(locale)
  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{dict.notFound.title}</h1>
      <p className="my-4 text-sm text-slate-500 dark:text-slate-400">{dict.notFound.description}</p>
      <BackHomeLink label={dict.common.backHome} />
    </main>
  )
}

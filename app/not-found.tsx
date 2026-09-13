import { BackHomeLink } from './back-home-link'
import { getLocale } from '@/lib/i18n/locale'
import { translate } from '@/lib/i18n'

export default async function NotFound() {
  const locale = await getLocale()
  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">{translate(locale, 'ไม่พบหน้าที่ต้องการ')}</h1>
      <p className="my-4 text-sm text-slate-500">{translate(locale, 'หน้านี้ไม่มีอยู่หรือถูกย้ายแล้ว')}</p>
      <BackHomeLink label={translate(locale, 'กลับหน้าหลัก')} />
    </main>
  )
}

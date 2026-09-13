import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { RegisterForm } from './register-form'

export default async function RegisterPage() {
  const locale = await getLocale()
  const dict = getDictionary(locale)

  return <RegisterForm dict={dict} />
}

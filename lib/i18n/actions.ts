'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LOCALE_COOKIE } from './locale'

export async function setLocale(formData: FormData) {
  const next = formData.get('locale') === 'en' ? 'en' : 'th'
  const path = (formData.get('path') as string) || '/'
  const store = await cookies()
  store.set(LOCALE_COOKIE, next, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  redirect(path)
}

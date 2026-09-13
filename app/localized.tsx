'use client'

import type { ComponentProps } from 'react'
import { useLanguage } from './language-provider'
import { formatDate } from '@/lib/i18n'
import { translateError } from '@/lib/i18n-errors'

export function LocalizedInput({ placeholder, title, 'aria-label': ariaLabel, ...props }: ComponentProps<'input'>) {
  const { t } = useLanguage()
  return <input {...props} placeholder={placeholder ? t(placeholder) : undefined} title={title ? t(title) : undefined} aria-label={ariaLabel ? t(ariaLabel) : undefined} />
}

export function LocalizedButton({ title, 'aria-label': ariaLabel, ...props }: ComponentProps<'button'>) {
  const { t } = useLanguage()
  return <button {...props} title={title ? t(title) : undefined} aria-label={ariaLabel ? t(ariaLabel) : title ? t(title) : undefined} />
}

export function LocalizedDate({ value }: { value: string | null | undefined }) {
  const { language } = useLanguage()
  return value ? <time dateTime={value}>{formatDate(language, value)}</time> : <>—</>
}

export function LocalizedUnit({ value }: { value: string | null | undefined }) {
  const { t } = useLanguage()
  return <>{value ? t(value) : ''}</>
}

export function TranslatedError({ children }: { children: string }) {
  const { language } = useLanguage()
  return <>{translateError(language, children)}</>
}

// Keep a stable stored unit while translating its label; changing language must
// not change submitted values or split the inventory into differently named units.
export function UnitInput() {
  return <LocalizedInput name="unit" placeholder="ชิ้น" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
}

export function VolunteerCenter({ name, type }: { name: string; type?: string }) {
  const { t } = useLanguage()
  return <>{t('ประจำที่ {name} ({type})', { name, type: t(type === 'warehouse' ? 'ศูนย์รับบริจาค' : 'ศูนย์พักพิง') })}</>
}

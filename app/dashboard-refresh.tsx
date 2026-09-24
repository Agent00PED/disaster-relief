'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locale'

export function DashboardRefresh({ updatedAt, locale, labels }: { updatedAt: string | null; locale: Locale; labels: Dictionary['volunteerDashboard'] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return <div className="flex flex-wrap items-center gap-3 text-sm">
    <button type="button" disabled={pending} aria-busy={pending} onClick={() => startTransition(() => router.refresh())}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 font-semibold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800">
      <RefreshCw size={18} aria-hidden="true" className={pending ? 'animate-spin motion-reduce:animate-none' : ''} />
      {pending ? labels.refreshing : labels.refresh}
    </button>
    <p role="status" className="text-slate-500 dark:text-slate-400">
      {pending ? labels.refreshing : updatedAt ? <>{labels.lastUpdated}: <time dateTime={updatedAt}>{new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(updatedAt))}</time> {labels.thailandTime}</> : labels.refreshIncomplete}
    </p>
  </div>
}

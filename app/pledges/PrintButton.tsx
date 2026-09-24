'use client'

import { Printer } from 'lucide-react'

export default function PrintButton({
  label,
}: {
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 print:hidden"
    >
      <Printer className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
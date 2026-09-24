'use client'

interface PrintButtonProps {
  label: string
}

export function PrintButton({ label }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 print:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
    >
      {label}
    </button>
  )
}

export default PrintButton
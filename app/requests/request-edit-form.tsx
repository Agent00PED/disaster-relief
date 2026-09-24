'use client'

import { useState } from 'react'
import { updateRequest } from './actions'

export function RequestEditForm({
  id,
  quantity,
  urgency,
  unit,
  labels,
  onCancel,
}: {
  id: string
  quantity: number
  urgency: string
  unit: string
  labels: { quantity: string; urgency: string; low: string; medium: string; high: string; save: string; cancel: string }
  onCancel: () => void
}) {
  const [currentQuantity, setCurrentQuantity] = useState(String(quantity))
  const [currentUrgency, setCurrentUrgency] = useState(urgency)

  return (
    <form action={updateRequest} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="text-xs text-slate-600 dark:text-slate-300">
        <span className="sr-only">{labels.quantity}</span>
        <input
          type="number"
          name="quantity_requested"
          min={1}
          required
          value={currentQuantity}
          onChange={(event) => setCurrentQuantity(event.target.value)}
          aria-label={labels.quantity}
          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />{' '}
        {unit}
      </label>
      <label className="text-xs text-slate-600 dark:text-slate-300">
        <span className="sr-only">{labels.urgency}</span>
        <select
          name="urgency"
          value={currentUrgency}
          onChange={(event) => setCurrentUrgency(event.target.value)}
          aria-label={labels.urgency}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="low">{labels.low}</option>
          <option value="medium">{labels.medium}</option>
          <option value="high">{labels.high}</option>
        </select>
      </label>
      <button
        type="submit"
        className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-deep"
      >
        {labels.save}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {labels.cancel}
      </button>
    </form>
  )
}
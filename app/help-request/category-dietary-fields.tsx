'use client'

import { useState, type ReactNode } from 'react'

export function CategoryDietaryFields({
  categoryLabel,
  options,
  dietaryField,
}: {
  categoryLabel: string
  options: { value: string; label: string }[]
  dietaryField: ReactNode
}) {
  const [category, setCategory] = useState('food')

  return (
    <>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {categoryLabel}
        </label>
        <select
          id="category"
          name="category"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {category === 'food' && dietaryField}
    </>
  )
}

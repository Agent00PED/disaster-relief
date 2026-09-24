'use client'

type SearchInputProps = {
  defaultValue?: string
  placeholder?: string
}

export default function SearchInput({
  defaultValue = '',
  placeholder = '',
}: SearchInputProps) {
  return (
    <input
      type="text"
      name="search"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
    />
  )
}
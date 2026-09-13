// =====================================================================
// หน้ารายการผู้บริจาค + ค้นหา (F6)
// ทุกคนที่ล็อกอินแล้วเห็นได้หมด (donors_select ไม่กรองตามศูนย์)
// =====================================================================

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()
  await requireStaffOrAdmin(supabase)
  const locale = await getLocale()
  const dict = getDictionary(locale)

  let query = supabase.from('donors').select('*').order('name')
  if (q) query = query.ilike('name', `%${q}%`)
  const { data: donors } = await query

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{dict.donors.registryTitle}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{dict.donors.searchByName}</p>
        </div>
        <Link
          href="/donors/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
        >
          {dict.donors.addNew}
        </Link>
      </header>

      <form className="mb-6">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder={dict.donors.searchPlaceholder}
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </form>

      {!donors || donors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
          {dict.donors.notFound}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">{dict.donors.name}</th>
                <th className="px-4 py-2 font-medium">{dict.donors.type}</th>
                <th className="px-4 py-2 font-medium">{dict.form.phone}</th>
                <th className="px-4 py-2 font-medium">{dict.common.status}</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {donors.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-2 text-slate-900 dark:text-slate-100">
                    {d.is_anonymous ? dict.table.anonymousDonor : d.name}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                    {d.donor_type === 'organization' ? dict.donors.typeOrganization : dict.donors.typeIndividual}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{d.phone ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                    {d.is_active ? dict.donors.active : dict.donors.inactive}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/donors/${d.id}/edit`}
                      className="text-xs font-medium text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      {dict.common.edit}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

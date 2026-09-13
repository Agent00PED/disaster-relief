import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateDonor } from '../../actions'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

export default async function EditDonorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const locale = await getLocale()
  const dict = getDictionary(locale)
  const { data: donor } = await supabase.from('donors').select('*').eq('id', id).single()
  if (!donor) notFound()

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">{dict.donors.editTitle}</h1>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <form
        action={updateDonor}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <input type="hidden" name="id" value={donor.id} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.donors.name}</label>
          <input
            name="name"
            defaultValue={donor.name}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.donors.type}</label>
          <select
            name="donor_type"
            defaultValue={donor.donor_type}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="individual">{dict.donors.typeIndividual}</option>
            <option value="organization">{dict.donors.typeOrganization}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.form.phone}</label>
            <input
              name="phone"
              defaultValue={donor.phone ?? ''}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.form.email}</label>
            <input
              name="email"
              type="email"
              defaultValue={donor.email ?? ''}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.donors.address}</label>
          <input
            name="address"
            defaultValue={donor.address ?? ''}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            name="is_anonymous"
            type="checkbox"
            defaultChecked={donor.is_anonymous}
            className="rounded border-slate-300"
          />
          {dict.donors.anonymousCheckbox}
        </label>
        {/* ห้ามลบผู้บริจาคที่มีประวัติแล้ว (trigger กันลบใน 05_functions.sql)
            ใช้ปิดใช้งานแทนเสมอ — เดิมฟอร์มนี้ไม่มีช่องให้ตั้งเลย */}
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={donor.is_active}
            className="rounded border-slate-300"
          />
          {dict.donors.activeCheckbox}
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
        >
          {dict.common.save}
        </button>
      </form>
    </main>
  )
}

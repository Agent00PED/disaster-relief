// =====================================================================
// หน้ารายการผู้บริจาค + ค้นหา (F6)
// ทุกคนที่ล็อกอินแล้วเห็นได้หมด (donors_select ไม่กรองตามศูนย์)
// =====================================================================

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase.from('donors').select('*').order('name')
  if (q) query = query.ilike('name', `%${q}%`)
  const { data: donors } = await query

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">ทะเบียนผู้บริจาค</h1>
          <p className="mt-2 text-sm text-slate-500">ค้นหาด้วยชื่อ</p>
        </div>
        <Link
          href="/donors/new"
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          + เพิ่มผู้บริจาค
        </Link>
      </header>

      <form className="mb-6">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="ค้นหาด้วยชื่อ..."
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </form>

      {!donors || donors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
          ไม่พบผู้บริจาค
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">ชื่อ</th>
                <th className="px-4 py-2 font-medium">ประเภท</th>
                <th className="px-4 py-2 font-medium">เบอร์โทร</th>
                <th className="px-4 py-2 font-medium">สถานะ</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {donors.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">
                    {d.is_anonymous ? 'ไม่ประสงค์ออกนาม' : d.name}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {d.donor_type === 'organization' ? 'องค์กร' : 'บุคคล'}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{d.phone ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {d.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/donors/${d.id}/edit`}
                      className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
                    >
                      แก้ไข
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

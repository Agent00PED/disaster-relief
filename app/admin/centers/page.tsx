// =====================================================================
// หน้าจัดการศูนย์และผู้ใช้ (F1) — เฉพาะผู้ดูแลระบบ
//
// RLS ฝั่ง DB (04_rls_policies.sql) บังคับอยู่แล้วว่าแก้ไข profiles/centers
// ได้เฉพาะ admin แต่เช็คซ้ำที่นี่เพื่อไม่ให้ staff เห็นฟอร์มแล้วกดพังเปล่าๆ
// =====================================================================

import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { addCenter, updateUser } from './actions'

export default async function AdminCentersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const user = await requireStaffOrAdmin(supabase)

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (me?.role !== 'admin') {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-12">
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          หน้านี้เฉพาะผู้ดูแลระบบเท่านั้น
        </p>
      </main>
    )
  }

  const [{ data: centers }, { data: users }] = await Promise.all([
    supabase.from('centers').select('*').order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, role, center_id, centers(name)')
      .order('full_name'),
  ])

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">จัดการศูนย์และผู้ใช้</h1>
        <p className="mt-2 text-sm text-slate-500">เฉพาะผู้ดูแลระบบ</p>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-slate-700">ศูนย์ในระบบ</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">ชื่อศูนย์</th>
                <th className="px-4 py-2 font-medium">ประเภท</th>
                <th className="px-4 py-2 font-medium">ที่อยู่</th>
                <th className="px-4 py-2 font-medium">เบอร์ติดต่อ</th>
              </tr>
            </thead>
            <tbody>
              {(centers ?? []).map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">{c.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {c.type === 'warehouse' ? 'ศูนย์รับบริจาค' : 'ศูนย์พักพิง'}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{c.address ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{c.contact_phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          action={addCenter}
          className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <input
            name="name"
            required
            placeholder="ชื่อศูนย์"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="type"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="warehouse">ศูนย์รับบริจาค</option>
            <option value="shelter">ศูนย์พักพิง</option>
          </select>
          <input
            name="address"
            placeholder="ที่อยู่"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="contact_phone"
            placeholder="เบอร์ติดต่อ"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep sm:col-span-2"
          >
            เพิ่มศูนย์
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-700">ผู้ใช้ในระบบ</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">ชื่อ</th>
                <th className="px-4 py-2 font-medium">บทบาท</th>
                <th className="px-4 py-2 font-medium">ศูนย์</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">{u.full_name || '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{u.role}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {(u.centers as unknown as { name?: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateUser} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                      <select
                        name="center_id"
                        defaultValue={u.center_id ?? ''}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="">— ไม่มีศูนย์ —</option>
                        {(centers ?? []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-deep"
                      >
                        บันทึก
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

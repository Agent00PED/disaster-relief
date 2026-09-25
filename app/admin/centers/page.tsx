// =====================================================================
// หน้าจัดการศูนย์และผู้ใช้ (F1) — เฉพาะผู้ดูแลระบบ
//
// RLS ฝั่ง DB (04_rls_policies.sql) บังคับอยู่แล้วว่าแก้ไข profiles/centers
// ได้เฉพาะ admin แต่เช็คซ้ำที่นี่เพื่อไม่ให้ staff เห็นฟอร์มแล้วกดพังเปล่าๆ
// =====================================================================

import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { CentersDashboard } from './centers-dashboard'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { UsersDirectory } from './users-directory'

export default async function AdminCentersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  const locale = await getLocale()
  const dict = getDictionary(locale)

  const user = await requireStaffOrAdmin(supabase)

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (me?.role !== 'admin') {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-12">
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {dict.admin.adminOnly}
        </p>
      </main>
    )
  }

  const [{ data: centers, error: centersError }, { data: users, error: usersError }] = await Promise.all([
    supabase.from('centers').select('*').order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, username, role, center_id, phone, first_name, last_name, id_photo_path, centers(name)')
      .order('full_name'),
  ])
  const rolePriority = new Map([['admin', 0], ['staff', 1], ['volunteer', 2]])
  const sortedUsers = [...(users ?? [])].sort((a, b) =>
    (rolePriority.get(a.role) ?? 3) - (rolePriority.get(b.role) ?? 3)
    || (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '', locale)
    || a.id.localeCompare(b.id)
  )

  return (
    <CentersDashboard centers={centers ?? []} users={sortedUsers} dict={dict} error={error} loadError={!!centersError || !!usersError}>
      <UsersDirectory users={sortedUsers} centers={centers ?? []} dict={dict} currentUserId={user.id} />
    </CentersDashboard>
  )
}

'use client'

import { useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { updateUser } from './actions'
import { IdentityPhotoButton } from './identity-photo-button'

type User = {
  id: string; full_name: string | null; username: string | null; role: string
  center_id: string | null; phone: string | null; first_name: string | null
  last_name: string | null; id_photo_path: string | null
}
type Center = { id: string; name: string; is_active: boolean }
const field = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800'
const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-600 dark:hover:bg-slate-800'
const filterField = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
const phoneDigits = (value: string) => value.replace(/[^0-9]/g, '')
function formatPhone(value: string | null) {
  if (!value) return '—'
  const digits = phoneDigits(value)
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : value
}

export function UsersDirectory({ users, centers, dict, currentUserId }: { users: User[]; centers: Center[]; dict: Dictionary; currentUserId?: string }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [center, setCenter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editing, setEditing] = useState<User | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [phone, setPhone] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const t = dict.admin
  const v = dict.volunteerDashboard
  const roles = [
    { value: 'admin', label: v.memberAdmin, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
    { value: 'staff', label: v.memberStaff, tone: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
    { value: 'volunteer', label: v.memberVolunteer, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  ]
  const name = (user: User) => user.full_name || user.username || '—'
  const query = search.trim().toLocaleLowerCase()
  const visible = users.filter(user =>
    (center === 'all' || (center === 'none' ? !user.center_id : user.center_id === center))
    && (roleFilter === 'all' || user.role === roleFilter)
    && (`${user.full_name ?? ''} ${user.username ?? ''} ${user.phone ?? ''} ${formatPhone(user.phone)}`.toLocaleLowerCase().includes(query)
      || (/^[0-9\s()-]+$/.test(query) && phoneDigits(query).length > 0 && phoneDigits(user.phone ?? '').includes(phoneDigits(query))))
  )

  function openEdit(user: User) {
    setEditing(user)
    setPhone(phoneDigits(user.phone ?? ''))
    setError('')
    setSaved(false)
    dialog.current?.showModal()
  }

  async function save(form: FormData) {
    if (editing) {
      const nextRole = String(form.get('role') || '')
      const nextCenter = String(form.get('center_id') || '')
      if (editing.id === currentUserId && nextRole !== editing.role) {
        setError(t.cannotChangeOwnRole)
        return
      }
      if ((nextRole !== editing.role || nextCenter !== (editing.center_id ?? ''))
        && !window.confirm(t.confirmUserChange)) return
    }
    setPending(true)
    setError('')
    try {
      const result = await updateUser(form)
      if (result.error) { setError(result.error); return }
      setSaved(true)
      dialog.current?.close()
      router.refresh()
    } catch {
      setError(dict.centerDashboard.saveError)
    } finally {
      setPending(false)
    }
  }

  return <section className="space-y-6 text-slate-900 dark:text-slate-100">
    <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
        <input type="search" aria-label={t.searchUsers} placeholder={t.searchUsers} value={search} onChange={event => setSearch(event.target.value)} className={filterField} />
        <select aria-label={t.center} value={center} onChange={event => setCenter(event.target.value)} className={filterField}>
          <option value="all">{t.allCenters}</option>
          <option value="none">{t.noCenter}</option>
          {centers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select aria-label={t.role} value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className={filterField}>
          <option value="all">{t.allRoles}</option>
          {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
        </select>
        <button type="button" onClick={() => { setSearch(''); setCenter('all'); setRoleFilter('all') }}
          className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800">{dict.centerDashboard.clear}</button>
    </div>
    {saved && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{t.userSaved}</p>}
    <p role="status" className="text-sm text-slate-500 dark:text-slate-400">{t.usersInSystem}: {visible.length} / {users.length}</p>
    {!visible.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">{t.noUsersFound}</p>}
    {roles.map(role => {
      const members = visible.filter(user => user.role === role.value)
      if (!members.length) return null
      return <section key={role.value} aria-label={role.label} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 font-semibold dark:border-slate-700 dark:bg-slate-800/50">
          <span className={`rounded-full px-3 py-1 text-sm ${role.tone}`}>{role.label}</span>
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({members.length})</span>
        </h3>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map(user => <li key={user.id} className="grid items-center gap-4 px-5 py-5 hover:bg-slate-50/70 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_15rem] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_17rem] lg:gap-6 dark:hover:bg-slate-800/30">
            <div className="min-w-0">
              <p className="break-words font-medium">{name(user)}</p>
              {user.username && user.username !== name(user) && <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>}
            </div>
            <div className="min-w-0 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <p className="break-words">{centers.find(item => item.id === user.center_id)?.name ?? t.noCenter}</p>
              <p className="tabular-nums">{t.userPhone}: {formatPhone(user.phone)}</p>
            </div>
            <div className="flex min-w-0 items-center gap-3 md:justify-end [&>span]:min-w-0 [&>span]:break-words [&>span]:md:text-right [&>button]:shrink-0">
              {user.role === 'volunteer' && <IdentityPhotoButton path={user.id_photo_path} name={name(user)} labels={{
                title: v.idPhotoTitle, view: v.idPhotoView, missing: v.idPhotoMissing,
                loading: dict.common.loading, failed: v.idPhotoViewFailed, close: dict.common.close,
              }} />}
              <button type="button" className={button} onClick={() => openEdit(user)} aria-label={`${dict.common.edit}: ${name(user)}`}>{dict.common.edit}</button>
            </div>
          </li>)}
        </ul>
      </section>
    })}
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { if (pending) event.preventDefault() }}
      onClose={() => setEditing(null)} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/60 dark:bg-slate-900 dark:text-slate-100">
      <h2 id={titleId} className="mb-5 break-words text-lg font-semibold">{dict.common.edit}: {editing ? name(editing) : ''}</h2>
      {editing && <form key={editing.id} onSubmit={event => {
        event.preventDefault()
        if (!pending) void save(new FormData(event.currentTarget))
      }}>
        <input type="hidden" name="id" value={editing.id} />
        <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">{dict.register.firstName}<input autoFocus name="first_name" defaultValue={editing.first_name ?? ''} maxLength={100} className={field} /></label>
            <label className="text-sm font-medium">{dict.register.lastName}<input name="last_name" defaultValue={editing.last_name ?? ''} maxLength={100} className={field} /></label>
          </div>
          <label className="block text-sm font-medium">
            {t.role}
            {editing.id === currentUserId ? (
              <>
                <input type="hidden" name="role" value={editing.role} />
                <select disabled value={editing.role} className={`${field} cursor-not-allowed opacity-60`}>
                  {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
                <span className="mt-1 block text-xs font-normal text-amber-600 dark:text-amber-400">
                  {t.cannotChangeOwnRole}
                </span>
              </>
            ) : (
              <select name="role" defaultValue={editing.role} className={field}>
                {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            )}
          </label>
          <label className="block text-sm font-medium">{t.center}<select name="center_id" defaultValue={editing.center_id ?? ''} className={field}>
            <option value="">{t.noCenter}</option>
            {centers.filter(item => item.is_active || item.id === editing.center_id).map(item => <option key={item.id} value={item.id}>{item.name}{!item.is_active ? ` (${t.inactiveCenter})` : ''}</option>)}
          </select></label>
          <label className="block text-sm font-medium">{t.userPhone}<input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national"
            value={phone} onChange={event => setPhone(phoneDigits(event.target.value).slice(0, 10))}
            onPaste={event => {
              event.preventDefault()
              const input = event.currentTarget
              const start = input.selectionStart ?? phone.length
              const end = input.selectionEnd ?? start
              const digits = phoneDigits(event.clipboardData.getData('text'))
              setPhone((phone.slice(0, start) + digits.slice(0, Math.max(0, 10 - (phone.length - (end - start)))) + phone.slice(end)).slice(0, 10))
            }}
            maxLength={10} minLength={10} pattern="[0-9]{10}" title={t.phoneTenDigits} placeholder="0000000000" className={field} />
            <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">{t.phoneTenDigits}</span>
          </label>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={() => dialog.current?.close()} className={button}>{dict.common.cancel}</button>
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep">{pending ? dict.common.saving : dict.common.save}</button>
          </div>
        </fieldset>
      </form>}
    </dialog>
  </section>
}

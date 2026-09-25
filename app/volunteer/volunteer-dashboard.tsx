'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clipboard, RefreshCw } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locale'
import { ErrorDialog } from '../allocations/error-dialog'
import { DeliverButton } from '../allocations/deliver-dialog'
import { IdPhotoCard } from './id-photo-card'
import { FlashNotice } from '../flash-notice'
import { confirmReceipt } from './actions'

type RequestRow = {
  id: string; item_name: string; category: string; quantity_requested: number
  quantity_fulfilled: number; urgency: string
}
type Delivery = {
  id: string; quantity_allocated: number; delivered_at?: string | null
  received_quantity?: number | null
  requests: unknown; donations: unknown
}
type Props = {
  userId: string
  idPhotoPath: string | null
  dict: Dictionary; locale: Locale; name: string; error?: string
  updatedAt: string | null
  allHistory: boolean; historyPage: number; historyTotal: number | null
  center: { name: string; type: string; address: string | null; contact_phone: string | null } | null
  staff: { id: string; name: string; phone: string | null; role: string }[]
  requests: RequestRow[]; pending: Delivery[]; history: Delivery[]
  counts: (number | null)[]; loadError: boolean; notice?: string | null
  failed: { requests: boolean; pending: boolean; history: boolean }
}

function Icon({ kind = 0 }: { kind?: number }) {
  const paths = [
    'm3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10',
    'm12 3 10 18H2L12 3Zm0 6v5m0 3v1',
    'M8 5H5v16h14V5h-3M9 3h6v4H9V3Zm0 9h6m-6 4h4',
    'm8 12 3 3 6-7M21 12a9 9 0 1 1-4-7.5',
    'M4 21V5h10v16M14 10h6v11M2 21h20M8 8h2m-2 4h2m-2 4h2',
  ]
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>
}

export function VolunteerDashboard({ dict, locale, name, center, staff, requests, pending, history, counts, error, failed, loadError, notice, updatedAt, allHistory, historyPage, historyTotal, userId, idPhotoPath }: Props) {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  const t = dict.volunteerDashboard
  const v = dict.volunteer
  const rolePriority = new Map([['admin', 0], ['staff', 1], ['volunteer', 2]])
  const sortedMembers = [...staff].sort((a, b) =>
    (rolePriority.get(a.role) ?? 3) - (rolePriority.get(b.role) ?? 3)
    || a.name.localeCompare(b.name, locale)
    || a.id.localeCompare(b.id)
  )
  const number = new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US')
  const format = (value: number | null) => value === null ? '—' : number.format(value)
  const panel = 'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
  const heading = 'flex items-center gap-3 border-b border-slate-100 px-5 py-4 font-semibold dark:border-slate-800'
  const muted = 'text-sm text-slate-500 dark:text-slate-400'
  const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand px-4 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 dark:border-slate-600 dark:hover:bg-slate-800'
  const tones = [
    'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300',
    'bg-sky-50 text-blue-700 dark:bg-sky-950 dark:text-sky-300',
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  ]
  const categories: Record<string, string> = {
    food: dict.form.categoryFood, water: dict.form.categoryWater,
    medicine: dict.form.categoryMedicine, clothing: dict.form.categoryClothing,
    hygiene: dict.form.categoryHygiene, other: dict.form.categoryOther,
  }
  const urgency: Record<string, string> = { high: dict.requests.urgencyHigh, medium: dict.requests.urgencyMedium, low: dict.requests.urgencyLow }
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const itemName = (row: Delivery) => (row.requests as { item_name?: string } | null)?.item_name ?? '—'
  const unit = (row: Delivery) => (row.donations as { unit?: string } | null)?.unit ?? ''
  const next = pending[0]
  const digits = (value: string | null | undefined) => (value ?? '').replace(/\D/g, '')
  const formatPhone = (value: string | null | undefined) => {
    const phoneDigits = digits(value)
    if (phoneDigits.length === 9) return `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`
    if (phoneDigits.length === 10) return `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`
    return value || '—'
  }
  const phone = digits(center?.contact_phone)
  const telHref = (value: string | null) => (value ?? '').replace(/[^\d+]/g, '')
  const visibleRequests = urgencyFilter === 'all' ? requests : requests.filter(request => request.urgency === urgencyFilter)
  const requestProgress = (row: RequestRow) => row.quantity_requested > 0 ? Math.max(0, Math.min(100, Math.round(row.quantity_fulfilled / row.quantity_requested * 100))) : 0
  const progressTone = (progress: number) => progress >= 81 ? '[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500' : progress >= 41 ? '[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500' : '[&::-webkit-progress-value]:bg-red-500 [&::-moz-progress-bar]:bg-red-500'
  const copyPhone = (value: string) => { void navigator.clipboard.writeText(formatPhone(value)).then(() => undefined) }
  const a = dict.allocations
  // กรอกจำนวนที่ได้รับจริงก่อนยืนยัน — ได้รับไม่ครบต้องมีหมายเหตุ (mark_delivered)
  const receiptForm = (row: Delivery) => <DeliverButton
    id={row.id} itemName={itemName(row)} allocated={row.quantity_allocated} unit={unit(row)}
    action={confirmReceipt} variant="button"
    labels={{
      button: v.confirmReceived, title: a.deliverTitle, message: a.deliverMessage,
      allocated: a.allocatedQuantity, received: a.receivedQuantity, note: a.deliveryNote,
      notePlaceholder: a.deliveryNotePlaceholder, noteRequired: a.deliveryNoteRequired,
      back: a.close, submit: a.deliverSubmit, receivedFull: a.receivedFull,
      receivedPartial: a.receivedPartial, receivedInvalid: a.receivedInvalid,
      noteTooShort: a.noteTooShort, saving: dict.common.saving,
    }}
  />

  return <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-7 text-brand sm:px-6 dark:text-slate-100">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold leading-relaxed sm:text-3xl">{v.greeting} {name} <span aria-hidden="true">👋</span></h1>
        <p className={`mt-2 ${muted}`}>{center?.name ? `${v.assignedAt} ${center.name} (${center.type === 'warehouse' ? dict.admin.centerTypeWarehouse : dict.admin.centerTypeShelter})` : v.noCenterAssigned}</p>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${button} disabled:cursor-wait disabled:opacity-60`} disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())} aria-busy={refreshing}>
            <RefreshCw size={18} aria-hidden="true" className={refreshing ? 'animate-spin motion-reduce:animate-none' : ''} />
            {refreshing ? t.refreshing : t.refresh}
          </button>
          <a href="#delivery-history" className={button}><Icon kind={2} />{t.viewHistory}</a>
        </div>
        <p className={muted} role="status" aria-live="polite">
          {refreshing ? t.refreshing : updatedAt ? <>{t.lastUpdated}: <time dateTime={updatedAt}>{new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Bangkok',
          }).format(new Date(updatedAt))}</time> {t.thailandTime}</> : t.refreshIncomplete}
        </p>
      </div>
    </header>

    {error && <ErrorDialog key={error} title={dict.allocations.errorTitle} message={error} closeLabel={dict.allocations.close} clearHref="/volunteer" />}
    {notice && <FlashNotice key={notice} message={notice} clearHref="/volunteer" closeLabel={dict.allocations.close} variant="toast" />}
    {loadError && <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">{t.loadError}</p>}

    <section aria-label={t.overview} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[t.waiting, t.urgent, t.open, t.delivered].map((label, i) => <div key={label} className={`${panel} flex items-center gap-4 p-5`}>
        <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${tones[i]}`}><Icon kind={i} /></span>
        <div><h2 className="text-sm font-semibold">{label}</h2><p className="mt-1 text-3xl font-bold tabular-nums">{format(counts[i])} <span className={`text-sm font-normal ${muted}`}>{t.records}</span></p></div>
      </div>)}
    </section>

    <div className="grid items-start gap-4 lg:grid-cols-3">
      <section className={`${panel} lg:col-span-2`}>
        <h2 className={heading}><Icon kind={2} />{t.next}</h2>
        {failed.pending ? <p className={`p-6 ${muted}`}>{t.loadError}</p> : !next ? <p className={`p-10 text-center ${muted}`}>{v.noPendingDelivery}</p> : <div className="space-y-5 p-5">
          <div className="flex items-center gap-4"><span className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800"><Icon /></span><div><h3 className="text-xl font-semibold">{itemName(next)}</h3><p className="mt-1 text-lg">{format(next.quantity_allocated)} {unit(next)}</p><p className={`mt-1 text-xs ${muted}`}>{t.pendingTotal}: {format(pending.length)} {t.records}</p></div></div>
          <p className={muted}>{t.destination}: <span className="font-medium text-brand dark:text-slate-200">{center?.name ?? '—'}</span></p>
          <ol aria-label={dict.common.status} className="grid grid-cols-3 py-2 text-center text-xs sm:text-sm">
            {[t.allocated, t.awaiting, t.completed].map((label, i) => <li key={label} aria-current={i === 1 ? 'step' : undefined} className={`border-t-2 pt-3 ${i < 2 ? 'border-blue-600 text-blue-700 dark:border-sky-400 dark:text-sky-300' : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'}`}><span className={`mx-auto -mt-6 mb-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${i < 2 ? 'border-blue-600 bg-white dark:border-sky-400 dark:bg-slate-900' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`} aria-hidden="true">{i === 0 ? '✓' : i === 1 ? '•' : ''}</span>{label}</li>)}
          </ol>
          <div className="flex flex-wrap gap-3">{receiptForm(next)}<a href="#pending-deliveries" className={button}>{t.viewPending}</a></div>
        </div>}
      </section>
      <section className={panel}>
        <h2 className={heading}><Icon kind={4} />{t.center}</h2>
        <div className="space-y-4 p-5">
          <div><h3 className="font-semibold">{center?.name ?? v.noCenterAssigned}</h3>{center && <p className={`mt-1 ${muted}`}>{center.type === 'warehouse' ? dict.admin.centerTypeWarehouse : dict.admin.centerTypeShelter}</p>}</div>
          {center?.address && <p className={`border-t border-slate-100 pt-4 dark:border-slate-800 ${muted}`}>{center.address}</p>}
          {center?.contact_phone && <div className="flex items-center gap-2"><p className={muted}>{dict.admin.contactPhone}: {formatPhone(center.contact_phone)}</p><button type="button" onClick={() => copyPhone(center.contact_phone!)} aria-label={dict.admin.copyPhone} title={dict.admin.copyPhone} className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Clipboard size={15} /></button></div>}
          {!center?.address && !center?.contact_phone && <p className={muted}>{t.noContact}</p>}
          <div className="flex flex-wrap gap-2">
            {center?.address && <a className={button} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.name} ${center.address}`)}`} target="_blank" rel="noopener noreferrer">{t.map}</a>}
            {phone && <a className={button} href={`tel:${phone}`}>{t.call}</a>}
          </div>
        </div>
      </section>
    </div>

    <section id="pending-deliveries" className={`${panel} scroll-mt-6`}>
      <h2 className={heading}><Icon />{v.pendingDeliverySection}<span className="ml-auto rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">{format(pending.length)} {t.records}</span></h2>
      {failed.pending ? <p className={`p-6 ${muted}`}>{t.loadError}</p> : !pending.length ? <p className={`p-6 ${muted}`}>{v.noPendingDelivery}</p> : <ul className="divide-y divide-slate-100 dark:divide-slate-800">{pending.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><h3 className="font-medium">{itemName(row)}</h3><p className={`mt-1 ${muted}`}>{format(row.quantity_allocated)} {unit(row)}</p></div>{receiptForm(row)}</li>)}</ul>}
    </section>

    <section className={panel}>
      <h2 className={heading}><Icon kind={4} />{t.staffDirectory}</h2>
      {staff.length === 0 ? (
        <p className={`p-5 ${muted}`}>{t.noStaffMembers}</p>
      ) : (
        <ul className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedMembers.map(person => (
            <li key={person.id} className="flex min-w-0 flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <span className="text-sm font-semibold break-words text-slate-900 dark:text-slate-100">
                {person.name || t.staffUnnamed}
                <span className={`ml-2 ${muted}`}>
                  ({person.role === 'admin' ? t.memberAdmin : person.role === 'staff' ? t.memberStaff : person.role === 'volunteer' ? t.memberVolunteer : person.role})
                </span>
              </span>
              {person.phone?.trim() ? <span className="flex max-w-full items-center gap-1"><a className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg px-2 text-sm font-medium break-all text-brand underline underline-offset-4 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:text-sky-300 dark:hover:bg-slate-700" href={`tel:${telHref(person.phone)}`}>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" /></svg>
                {formatPhone(person.phone)}
              </a><button type="button" onClick={() => copyPhone(person.phone!)} aria-label={dict.admin.copyPhone} title={dict.admin.copyPhone} className="rounded p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><Clipboard size={14} /></button></span> : <p className={muted}>{t.noStaffPhone}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>

      {/* รูปยืนยันตัวตนของตัวเอง — เจ้าของบัญชีต้องเห็นและแก้ไขได้
          ไม่ได้เอาไปแปะเป็นไอคอนโปรไฟล์ เพราะตอนสมัครบอกผู้ใช้ไว้ว่า
          "รูปจะถูกเก็บเป็นส่วนตัว" */}
      <IdPhotoCard dict={dict} userId={userId} initialPath={idPhotoPath}
        panelClass={panel} headingClass={heading} mutedClass={muted} buttonClass={button} />

      <section className={panel}>
        <div className={`${heading} flex-wrap`}><h2 className="flex items-center gap-3"><Icon kind={2} />{v.openRequestsSection}</h2><select aria-label={t.urgencyFilter} value={urgencyFilter} onChange={event => setUrgencyFilter(event.target.value)} className="min-h-9 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-600 dark:bg-slate-800"><option value="all">{t.allUrgencies}</option><option value="high">{urgency.high}</option><option value="medium">{urgency.medium}</option><option value="low">{urgency.low}</option></select></div>
        {failed.requests ? <p className={`p-6 ${muted}`}>{t.loadError}</p> : !visibleRequests.length ? <p className={`p-8 text-center ${muted}`}>{requests.length ? t.noUrgencyMatch : v.noOpenRequests}</p> : <>
        <ul className="grid gap-3 p-4 md:hidden">
          {visibleRequests.map(row => {
            const progress = requestProgress(row)
            return <li key={row.id} className="min-w-0 space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold break-words [overflow-wrap:anywhere]">{row.item_name}</h3>
                  <p className={`mt-1 ${muted}`}>{categories[row.category] ?? row.category}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${row.urgency === 'high' ? tones[1] : row.urgency === 'medium' ? tones[0] : tones[3]}`}>
                  {v.urgency}: {urgency[row.urgency] ?? row.urgency}
                </span>
              </div>
              <dl className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                {[[v.requested, row.quantity_requested], [v.fulfilled, row.quantity_fulfilled], [t.remaining, Math.max(0, row.quantity_requested - row.quantity_fulfilled)]].map(([label, value]) => <div key={String(label)} className="min-w-0">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd className="mt-1 font-semibold tabular-nums break-words">{format(Number(value))}</dd>
                </div>)}
              </dl>
              <div>
                <div className="mb-2 flex justify-between gap-2 text-xs"><span className="text-slate-500 dark:text-slate-400">{t.progress}</span><span className="font-medium tabular-nums">{progress}%</span></div>
                <progress className={`block h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full ${progressTone(progress)} dark:[&::-webkit-progress-bar]:bg-slate-800`} max={100} value={progress} aria-label={`${t.progress}: ${row.item_name}`} />
              </div>
            </li>
          })}
        </ul>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><tr>{[v.item, v.requested, v.fulfilled, t.remaining, t.progress, v.urgency].map(label => <th key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead>
        <tbody>{visibleRequests.map(row => {
          const progress = requestProgress(row)
          return <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
            <td className="px-5 py-4 font-medium">{row.item_name} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({categories[row.category] ?? row.category})</span></td>
            <td className="px-5 py-4 tabular-nums">{format(row.quantity_requested)}</td><td className="px-5 py-4 tabular-nums">{format(row.quantity_fulfilled)}</td><td className="px-5 py-4 tabular-nums">{format(Math.max(0, row.quantity_requested - row.quantity_fulfilled))}</td>
            <td className="px-5 py-4"><div className="flex items-center gap-3"><progress className={`h-2 w-28 overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full ${progressTone(progress)} dark:[&::-webkit-progress-bar]:bg-slate-800`} max={100} value={progress} aria-label={`${t.progress}: ${row.item_name}`} /><span className="text-xs tabular-nums">{progress}%</span></div></td>
            <td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${row.urgency === 'high' ? tones[1] : row.urgency === 'medium' ? tones[0] : tones[3]}`}>{urgency[row.urgency] ?? row.urgency}</span></td>
          </tr>
        })}</tbody>
      </table></div></>}
    </section>



    <div className="grid items-start gap-4 lg:grid-cols-3">
      <aside className={panel}><h2 className={heading}><Icon kind={1} />{t.guidance}</h2><p className={`p-5 leading-relaxed ${muted}`}>{t.guidanceText}</p></aside>
      <section id="delivery-history" className={`${panel} scroll-mt-6 lg:col-span-2`}>
        <div className={`${heading} flex-wrap justify-between`}>
          <h2 className="flex items-center gap-3"><Icon kind={3} />{allHistory ? t.allHistory : t.history}</h2>
          <Link className="rounded text-sm underline underline-offset-4" href={allHistory ? '/volunteer#delivery-history' : '/volunteer?history=all#delivery-history'} scroll={false}>{allHistory ? t.recentHistory : t.allHistory}</Link>
        </div>
        {failed.history ? <p className={`p-6 ${muted}`}>{t.loadError}</p> : !history.length ? <p className={`p-6 ${muted}`}>{t.noHistory}</p> : <ul className="divide-y divide-slate-100 dark:divide-slate-800">{history.map(row => <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm">
          <span className="h-2 w-2 rounded-full bg-brand dark:bg-sky-400" aria-hidden="true" />
          <time className="text-xs text-slate-500 dark:text-slate-400" dateTime={row.delivered_at ?? undefined}>{row.delivered_at ? new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(row.delivered_at)) : '—'}</time>
          <span className="min-w-0 flex-1 font-medium break-words">{itemName(row)}</span>
          <div className="w-full rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">{a.receivedQuantity}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{row.received_quantity == null ? t.receivedUnknown : `${format(row.received_quantity)} ${unit(row)}`}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className={muted}>{a.allocatedQuantity}: {format(row.quantity_allocated)} {unit(row)}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${row.received_quantity != null && row.received_quantity < row.quantity_allocated ? tones[0] : tones[3]}`}>
                {row.received_quantity != null && row.received_quantity < row.quantity_allocated ? t.receivedPartial : t.completed}
              </span>
            </div>
          </div>
        </li>)}</ul>}
        {allHistory && !failed.history && <nav aria-label={t.historyPages} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
          <span className={muted}>{t.pageLabel} {format(historyPage)} · {format(historyTotal)} {t.records}</span>
          <div className="flex gap-2">
            {historyPage > 1 && <Link className={button} scroll={false} href={`/volunteer?history=all&page=${historyPage - 1}#delivery-history`}>{t.previousPage}</Link>}
            {historyTotal != null && historyPage * 5 < historyTotal && <Link className={button} scroll={false} href={`/volunteer?history=all&page=${historyPage + 1}#delivery-history`}>{t.nextPage}</Link>}
          </div>
        </nav>}
      </section>
    </div>
    <p className={`text-center text-xs ${muted}`}>{t.scope}</p>
  </main>
}

// =====================================================================
// Web Component ที่เลือกสำหรับ F5 (docs/Week10_Topic8_Analysis.md ข้อ 9):
// Modal Dialog ยืนยันการตัดจ่าย — เพราะการจัดสรรกระทบยอดคงเหลือจริงและ
// ย้อนกลับยาก (ต้องให้ admin ยกเลิกเองทีหลัง) การบังคับให้เห็นสรุปก่อนกด
// ยืนยันจึงลดความเสี่ยงกดพลาดตอนเจ้าหน้าที่ทำงานเร่งรีบ
//
// ใช้ <dialog> ของ HTML ล้วนๆ (ไม่ใช้ library) — ได้ focus trap +
// ปิดด้วย Esc + backdrop ฟรีจากเบราว์เซอร์
// =====================================================================

'use client'

import { useRef, useState } from 'react'
import { allocate } from './actions'
import type { Dictionary } from '@/lib/i18n/dictionaries'

type Req = {
  id: string
  item_name: string
  category: string
  quantity_requested: number
  quantity_fulfilled: number
  centers: { name?: string } | null
}
type Don = {
  id: string
  item_name: string
  unit: string
  quantity_remaining: number
  expiry_date: string | null
  centers: { name?: string } | null
}

export function AllocateForm({
  requests,
  donations,
  dict,
}: {
  requests: Req[]
  donations: Don[]
  dict: Dictionary
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const confirmedRef = useRef(false)

  const CATEGORY_LABEL: Record<string, string> = {
    food: dict.form.categoryFood,
    water: dict.form.categoryWater,
    medicine: dict.form.categoryMedicine,
    clothing: dict.form.categoryClothing,
    hygiene: dict.form.categoryHygiene,
    other: dict.form.categoryOther,
  }

  const [requestId, setRequestId] = useState('')
  const [donationId, setDonationId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [nearExpiry, setNearExpiry] = useState(false)

  const selectedRequest = requests.find((r) => r.id === requestId)
  const selectedDonation = donations.find((d) => d.id === donationId)
  const qty = Number(quantity) || 0
  const remainingAfter = selectedDonation ? selectedDonation.quantity_remaining - qty : null

  function handleSubmit(e: React.FormEvent) {
    if (confirmedRef.current) return // ผ่านมาจากปุ่ม "ยืนยัน" ในโมดัลแล้ว ปล่อยให้ submit จริง
    e.preventDefault()
    if (!requestId || !donationId || !qty) return
    setNearExpiry(
      !!selectedDonation?.expiry_date &&
        new Date(selectedDonation.expiry_date).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 7,
    )
    dialogRef.current?.showModal()
  }

  function handleConfirm() {
    confirmedRef.current = true
    dialogRef.current?.close()
    formRef.current?.requestSubmit()
  }

  return (
    <>
      <form
        ref={formRef}
        action={allocate}
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.allocations.selectRequest}</label>
          <select
            name="request_id"
            required
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">{dict.allocations.selectRequestPlaceholder}</option>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.centers?.name} — {r.item_name} ({CATEGORY_LABEL[r.category] ?? r.category})
                {dict.allocations.remainingWord} {r.quantity_requested - r.quantity_fulfilled}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.allocations.selectLot}</label>
          <select
            name="donation_id"
            required
            value={donationId}
            onChange={(e) => setDonationId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">{dict.allocations.selectLotPlaceholder}</option>
            {donations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.centers?.name} — {d.item_name} {dict.allocations.remainingInLot} {d.quantity_remaining} {d.unit}
                {d.expiry_date ? ` (${dict.allocations.expiresOn} ${d.expiry_date})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.allocations.quantityToAllocate}</label>
          <input
            name="quantity"
            type="number"
            min={1}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep sm:col-span-3"
        >
          {dict.allocations.confirmAllocate}
        </button>
      </form>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-lg border border-slate-200 p-0 shadow-lg backdrop:bg-slate-900/40 dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{dict.allocations.modalTitle}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {dict.allocations.modalSubtitle}
          </p>

          <dl className="mt-4 space-y-2 rounded-md bg-slate-50 p-4 text-sm dark:bg-slate-800">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{dict.allocations.item}</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {selectedRequest?.item_name ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{dict.allocations.quantityToAllocate}</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {qty} {selectedDonation?.unit}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{dict.allocations.fromLotOfCenter}</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {selectedDonation?.centers?.name ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{dict.allocations.toCenter}</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {selectedRequest?.centers?.name ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 dark:border-slate-700">
              <dt className="text-slate-500 dark:text-slate-400">{dict.allocations.remainingAfter}</dt>
              <dd
                className={`text-right font-medium ${
                  remainingAfter !== null && remainingAfter < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {remainingAfter ?? '—'} {selectedDonation?.unit}
              </dd>
            </div>
          </dl>

          {nearExpiry && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              {dict.allocations.nearExpiryWarning}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {dict.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
            >
              {dict.allocations.confirmAllocate}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

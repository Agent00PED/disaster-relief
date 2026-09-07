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

const CATEGORY_LABEL: Record<string, string> = {
  food: 'อาหาร',
  water: 'น้ำดื่ม',
  medicine: 'ยา',
  clothing: 'เสื้อผ้า',
  hygiene: 'ของใช้ส่วนตัว',
  other: 'อื่นๆ',
}

export function AllocateForm({ requests, donations }: { requests: Req[]; donations: Don[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const confirmedRef = useRef(false)

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
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">คำขอ</label>
          <select
            name="request_id"
            required
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— เลือกคำขอ —</option>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.centers?.name} — {r.item_name} ({CATEGORY_LABEL[r.category] ?? r.category})
                เหลือขอ {r.quantity_requested - r.quantity_fulfilled}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ล็อตของในคลัง</label>
          <select
            name="donation_id"
            required
            value={donationId}
            onChange={(e) => setDonationId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— เลือกล็อต —</option>
            {donations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.centers?.name} — {d.item_name} คงเหลือ {d.quantity_remaining} {d.unit}
                {d.expiry_date ? ` (หมดอายุ ${d.expiry_date})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">จำนวนที่จัดสรร</label>
          <input
            name="quantity"
            type="number"
            min={1}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep sm:col-span-3"
        >
          ยืนยันจัดสรร
        </button>
      </form>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-lg border border-slate-200 p-0 shadow-lg backdrop:bg-slate-900/40"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">ยืนยันการตัดจ่าย</h2>
          <p className="mt-1 text-sm text-slate-500">
            ตรวจสอบให้แน่ใจก่อนยืนยัน การจัดสรรกระทบยอดคงเหลือทันที
          </p>

          <dl className="mt-4 space-y-2 rounded-md bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">รายการ</dt>
              <dd className="text-right font-medium text-slate-900">
                {selectedRequest?.item_name ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">จำนวนที่จัดสรร</dt>
              <dd className="text-right font-medium text-slate-900">
                {qty} {selectedDonation?.unit}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">จากล็อตของศูนย์</dt>
              <dd className="text-right font-medium text-slate-900">
                {selectedDonation?.centers?.name ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">ไปยังศูนย์</dt>
              <dd className="text-right font-medium text-slate-900">
                {selectedRequest?.centers?.name ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
              <dt className="text-slate-500">คงเหลือในล็อตหลังจ่าย</dt>
              <dd
                className={`text-right font-medium ${
                  remainingAfter !== null && remainingAfter < 0 ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                {remainingAfter ?? '—'} {selectedDonation?.unit}
              </dd>
            </div>
          </dl>

          {nearExpiry && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ⚠ ล็อตนี้ใกล้หมดอายุภายใน 7 วัน
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
            >
              ยืนยันจัดสรร
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

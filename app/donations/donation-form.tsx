'use client'

import { useState } from 'react'
import type { Dictionary } from '@/lib/i18n/dictionaries'

interface ItemRow {
  id: string
  itemName: string
  category: string
  quantity: string
  unit: string
  expiryDate: string
}

interface NewDonationFormProps {
  dict?: Dictionary
  locale?: 'th' | 'en'
  error?: string
  createDonationAction?: (formData: FormData) => void | Promise<void>
}

export default function NewDonationForm({
  dict,
  locale = 'th',
  error,
  createDonationAction,
}: NewDonationFormProps) {
  const getTodayLocalDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const [donorName, setDonorName] = useState('')
  const [phone, setPhone] = useState('')
  const [receivedDate, setReceivedDate] = useState(getTodayLocalDate)

  const [items, setItems] = useState<ItemRow[]>([
    {
      id: '1',
      itemName: '',
      category: '',
      quantity: '',
      unit: '',
      expiryDate: '',
    },
  ])

  const formatDisplayDate = (date: string) => {
    if (!date) return ''

    const [year, month, day] = date.split('-')

    if (!year || !month || !day) return date

    return new Intl.DateTimeFormat(
      locale === 'th' ? 'th-TH' : 'en-US',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    ).format(
      new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      )
    )
  }

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        itemName: '',
        category: '',
        quantity: '',
        unit: '',
        expiryDate: '',
      },
    ])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleItemChange = (
    id: string,
    field: keyof ItemRow,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    )
  }

  const handleReset = () => {
    setDonorName('')
    setPhone('')
    setReceivedDate(getTodayLocalDate())

    setItems([
      {
        id: '1',
        itemName: '',
        category: '',
        quantity: '',
        unit: '',
        expiryDate: '',
      },
    ])
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-950/60 dark:text-red-400">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {dict?.donationNew?.title ?? 'บันทึกของบริจาคเข้าคลัง'}
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            กรอกข้อมูลเพื่อใช้ของบริจาคที่ได้รับ เพื่อนำเข้าคลังสินค้า
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg bg-rose-50 p-4 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
        >
          {error}
        </div>
      )}

      <form
        action={createDonationAction}
        lang={locale === 'th' ? 'th-TH' : 'en-US'}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {/* =====================================================
            Section 1 : ข้อมูลผู้บริจาค
        ====================================================== */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <svg
              className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>

            <span>ข้อมูลผู้บริจาค</span>
          </div>

          {/* แถวที่ 1 : ชื่อ + เบอร์โทร */}
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            {/* ชื่อผู้บริจาค */}
            <div className="w-full min-w-0">
              <label className="mb-1.5 block min-h-[18px] text-xs font-medium leading-[18px] text-slate-700 dark:text-slate-300">
                ชื่อผู้บริจาค <span className="text-rose-500">*</span>
              </label>

              <div className="relative w-full">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>

                <input
                  type="text"
                  name="donor_name"
                  placeholder="เช่น มูลนิธิใจดี"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  required
                  className="block h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {/* เบอร์โทรศัพท์ */}
            <div className="w-full min-w-0">
              <label className="mb-1.5 block min-h-[18px] text-xs font-medium leading-[18px] text-slate-700 dark:text-slate-300">
                เบอร์โทรศัพท์ (ถ้ามี)
              </label>

              <div className="relative w-full">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A2 2 0 0121 19v1a2 2 0 01-2 2h-1C9.716 22 2 14.284 2 6V5z"
                  />
                </svg>

                <input
                  type="text"
                  name="phone"
                  placeholder="เช่น 081-234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* แถวที่ 2 : วันที่รับของ */}
          <div className="mt-4 w-full md:w-1/2">
            <label className="mb-1.5 block min-h-[18px] text-xs font-medium leading-[18px] text-slate-700 dark:text-slate-300">
              {dict?.table?.receivedDate ?? 'วันที่รับของ'}{' '}
              <span className="text-rose-500">*</span>
            </label>

            <div className="relative w-full">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>

              <input
                type="date"
                name="received_date"
                lang={locale === 'th' ? 'th-TH' : 'en-US'}
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                aria-label={
                  locale === 'th'
                    ? 'วันที่รับของ'
                    : 'Received date'
                }
                className="block h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />

              <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {formatDisplayDate(receivedDate) || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            Section 2 : รายการของ
        ====================================================== */}
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <svg
              className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>

            <span>รายการของที่รับเข้าคลัง</span>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid min-w-0 grid-cols-12 items-end gap-2.5"
              >
                {/* 1. ชื่อของ */}
                <div className="col-span-12 min-w-0 md:col-span-3">
                  {index === 0 && (
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      {dict?.table?.itemName || 'ชื่อของ'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                  )}

                  <input
                    type="text"
                    name={`item_name_${index}`}
                    placeholder="เช่น ข้าวสาร"
                    value={item.itemName}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        'itemName',
                        e.target.value
                      )
                    }
                    required
                    className="block h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>

                {/* 2. หมวดหมู่ */}
                <div className="col-span-6 min-w-0 md:col-span-2">
                  {index === 0 && (
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      {dict?.form?.category ?? 'หมวดหมู่'}
                    </label>
                  )}

                  <input
                    type="text"
                    name={`category_${index}`}
                    placeholder="เช่น อาหาร"
                    value={item.category}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        'category',
                        e.target.value
                      )
                    }
                    className="block h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>

                {/* 3. จำนวน */}
                <div className="col-span-6 min-w-0 md:col-span-2">
                  {index === 0 && (
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      {dict?.donationNew?.receivedQtyLabel ||
                        'จำนวนที่รับเข้า'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                  )}

                  <input
                    type="number"
                    min="1"
                    name={`quantity_${index}`}
                    placeholder="เช่น 50"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        'quantity',
                        e.target.value
                      )
                    }
                    required
                    className="block h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>

                {/* 4. หน่วย */}
                <div className="col-span-6 min-w-0 md:col-span-2">
                  {index === 0 && (
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      {dict?.donationNew?.unit ?? 'หน่วย'}
                    </label>
                  )}

                  <select
                    name={`unit_${index}`}
                    value={item.unit}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        'unit',
                        e.target.value
                      )
                    }
                    className="block h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">เช่น ถุง</option>
                    <option value="ชิ้น">ชิ้น</option>
                    <option value="แพ็ค">แพ็ค</option>
                    <option value="กล่อง">กล่อง</option>
                    <option value="ถุง">ถุง</option>
                    <option value="ลัง">ลัง</option>
                    <option value="โหล">โหล</option>
                    <option value="ขวด">ขวด</option>
                    <option value="ชุด">ชุด</option>
                  </select>
                </div>

                {/* 5. วันหมดอายุ */}
                <div className="col-span-6 min-w-0 md:col-span-2">
                  {index === 0 && (
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      {dict?.donationNew?.expiryOptional ||
                        'วันหมดอายุ'}
                    </label>
                  )}

                  <div className="relative w-full">
                    <svg
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2v0"
                      />
                    </svg>

                    <input
                      type="date"
                      name={`expiry_date_${index}`}
                      lang={locale === 'th' ? 'th-TH' : 'en-US'}
                      value={item.expiryDate}
                      onChange={(e) =>
                        handleItemChange(
                          item.id,
                          'expiryDate',
                          e.target.value
                        )
                      }
                      aria-label={
                        locale === 'th'
                          ? 'วันหมดอายุ'
                          : 'Expiry date'
                      }
                      className="block h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* 6. ปุ่มลบ */}
                <div className="col-span-12 flex justify-end md:col-span-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={items.length === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/50"
                    aria-label="ลบรายการ"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* เพิ่มรายการ */}
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-4 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>

            <span>เพิ่มรายการ</span>
          </button>
        </div>

        {/* =====================================================
            ปุ่มด้านล่าง
        ====================================================== */}
        <div className="mt-8 flex items-center gap-3">
          {/* บันทึกข้อมูล */}
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-[#0E2A47] px-5 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-[#163a61] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>

            <span>บันทึกข้อมูล</span>
          </button>

          {/* ล้างข้อมูล */}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            <span>ล้างข้อมูล</span>
          </button>
        </div>
      </form>
    </main>
  )
}
'use client'

import { useState } from 'react'
import { createDonation } from './actions'

type DonationItem = {
  id: number
  item_name: string
  category: string
  quantity: string
  unit: string
  expiry_date: string
  note: string
}

export default function DonationForm() {
  const [items, setItems] = useState<DonationItem[]>([
    {
      id: 1,
      item_name: '',
      category: '',
      quantity: '',
      unit: '',
      expiry_date: '',
      note: '',
    },
  ])

  const [loading, setLoading] = useState(false)

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        item_name: '',
        category: '',
        quantity: '',
        unit: '',
        expiry_date: '',
        note: '',
      },
    ])
  }

  function removeItem(id: number) {
    if (items.length === 1) return

    setItems((current) =>
      current.filter((item) => item.id !== id),
    )
  }

  function updateItem(
    id: number,
    field: keyof DonationItem,
    value: string,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    const donorName = String(
      form.get('donor_name') ?? '',
    ).trim()

    const donorPhone = String(
      form.get('donor_phone') ?? '',
    ).trim()

    const receivedDate = String(
      form.get('received_date') ?? '',
    )

    if (!receivedDate) {
      alert('กรุณาเลือกวันที่รับของ')
      return
    }

    if (
      items.some(
        (item) =>
          !item.item_name ||
          !item.category ||
          !item.quantity ||
          !item.unit,
      )
    ) {
      alert('กรุณากรอกข้อมูลรายการของให้ครบ')
      return
    }

    setLoading(true)

    try {
      const result = await createDonation({
        donorName,
        donorPhone,
        receivedDate,
        items: items.map((item) => ({
          item_name: item.item_name,
          category: item.category,
          quantity: Number(item.quantity),
          unit: item.unit,
          expiry_date: item.expiry_date || null,
          note: item.note || null,
        })),
      })

      if (result?.error) {
        alert(result.error)
        return
      }

      window.location.href = '/donations'
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  function clearForm() {
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-[#f5faff] px-4 py-4 md:px-6">
      <div className="mx-auto max-w-7xl">

        {/* Title */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-xl">
            📦
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#123b5d]">
              บันทึกของบริจาคเข้าคลัง
            </h1>

            <p className="text-xs text-gray-400">
              กรอกข้อมูลเพื่อบันทึกของบริจาคที่ได้รับ
              เพื่อนำเข้าคลังสินค้า
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Donor */}
          <section className="mb-3 overflow-hidden rounded-lg border border-[#dbeaf5] bg-white shadow-sm">

            <div className="bg-[#edf7ff] px-4 py-2">
              <h2 className="font-semibold text-[#123b5d]">
                ♙ ข้อมูลผู้บริจาค
              </h2>

              <p className="text-[11px] text-gray-500">
                ข้อมูลผู้บริจาค
              </p>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-3">

              {/* Name */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[#31536d]">
                  ชื่อผู้บริจาค
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ♙
                  </span>

                  <input
                    name="donor_name"
                    type="text"
                    placeholder="เช่น นายสมชาย"
                    className="h-9 w-full rounded-md border border-[#cfe1ed] pl-9 pr-3 text-xs outline-none focus:border-[#2675a8]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[#31536d]">
                  เบอร์โทรศัพท์{' '}
                  <span className="text-gray-400">
                    (ถ้ามี)
                  </span>
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ☎
                  </span>

                  <input
                    name="donor_phone"
                    type="tel"
                    placeholder="เช่น 081-234-5678"
                    className="h-9 w-full rounded-md border border-[#cfe1ed] pl-9 pr-3 text-xs outline-none focus:border-[#2675a8]"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[#31536d]">
                  วันที่รับของ{' '}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  name="received_date"
                  type="date"
                  defaultValue={
                    new Date().toISOString().split('T')[0]
                  }
                  required
                  className="h-9 w-full rounded-md border border-[#cfe1ed] bg-white px-3 text-xs text-gray-500 outline-none focus:border-[#2675a8]"
                />
              </div>

            </div>
          </section>

          {/* Items */}
          <section className="overflow-hidden rounded-lg border border-[#dbeaf5] bg-white shadow-sm">

            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-[#17608d]">
                📦
              </span>

              <h2 className="font-semibold text-[#123b5d]">
                รายการของที่รับเข้าคลัง
              </h2>
            </div>

            {/* Header */}
            <div className="hidden bg-[#edf7ff] px-4 py-2 text-xs font-medium text-[#31536d] md:grid md:grid-cols-[1.5fr_1fr_0.7fr_0.9fr_1fr_1.5fr_40px] md:gap-3">
              <div>
                ชื่อของ <span className="text-red-500">*</span>
              </div>

              <div>
                หมวดหมู่ <span className="text-red-500">*</span>
              </div>

              <div>
                จำนวน <span className="text-red-500">*</span>
              </div>

              <div>
                หน่วย <span className="text-red-500">*</span>
              </div>

              <div>
                วันหมดอายุ
              </div>

              <div>
                หมายเหตุ
              </div>

              <div />
            </div>

            {/* Rows */}
            <div className="space-y-4 p-4">

              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-3 md:grid md:grid-cols-[1.5fr_1fr_0.7fr_0.9fr_1fr_1.5fr_40px] md:gap-3 md:border-0 md:p-0"
                >

                  {/* Item */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 md:hidden">
                      ชื่อของ
                    </label>

                    <input
                      value={item.item_name}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          'item_name',
                          e.target.value,
                        )
                      }
                      placeholder="ชื่อสิ่งของ"
                      className="h-9 w-full rounded-md border border-[#cfe1ed] px-3 text-xs outline-none focus:border-[#2675a8]"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 md:hidden">
                      หมวดหมู่
                    </label>

                    <select
                      value={item.category}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          'category',
                          e.target.value,
                        )
                      }
                      className="h-9 w-full rounded-md border border-[#cfe1ed] bg-white px-2 text-xs outline-none focus:border-[#2675a8]"
                    >
                      <option value="">
                        เลือกหมวดหมู่
                      </option>
                      <option value="food">
                        อาหาร
                      </option>
                      <option value="water">
                        น้ำดื่ม
                      </option>
                      <option value="medicine">
                        ยา
                      </option>
                      <option value="clothing">
                        เสื้อผ้า
                      </option>
                      <option value="hygiene">
                        ของใช้ส่วนตัว
                      </option>
                      <option value="other">
                        อื่น ๆ
                      </option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 md:hidden">
                      จำนวน
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          'quantity',
                          e.target.value,
                        )
                      }
                      placeholder="เช่น 50"
                      className="h-9 w-full rounded-md border border-[#cfe1ed] px-3 text-xs outline-none focus:border-[#2675a8]"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 md:hidden">
                      หน่วย
                    </label>

                    <select
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          'unit',
                          e.target.value,
                        )
                      }
                      className="h-9 w-full rounded-md border border-[#cfe1ed] bg-white px-2 text-xs outline-none focus:border-[#2675a8]"
                    >
                      <option value="">
                        เลือกหน่วย
                      </option>
                      <option value="ชิ้น">
                        ชิ้น
                      </option>
                      <option value="กล่อง">
                        กล่อง
                      </option>
                      <option value="ถุง">
                        ถุง
                      </option>
                      <option value="แพ็ค">
                        แพ็ค
                      </option>
                      <option value="ขวด">
                        ขวด
                      </option>
                      <option value="กิโลกรัม">
                        กิโลกรัม
                      </option>
                    </select>
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 md:hidden">
                      วันหมดอายุ
                    </label>

                    <input
                      type="date"
                      value={item.expiry_date}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          'expiry_date',
                          e.target.value,
                        )
                      }
                      className="h-9 w-full rounded-md border border-[#cfe1ed] px-2 text-xs outline-none focus:border-[#2675a8]"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 md:hidden">
                      หมายเหตุ
                    </label>

                    <input
                      value={item.note}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          'note',
                          e.target.value,
                        )
                      }
                      placeholder="เช่น ของบริจาคจาก..."
                      className="h-9 w-full rounded-md border border-[#cfe1ed] px-3 text-xs outline-none focus:border-[#2675a8]"
                    />
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() =>
                      removeItem(item.id)
                    }
                    className="mt-2 flex h-9 w-full items-center justify-center rounded-md text-red-400 hover:bg-red-50 md:mt-0 md:w-auto"
                    title="ลบรายการ"
                  >
                    🗑️
                  </button>

                </div>
              ))}

              {/* Add */}
              <button
                type="button"
                onClick={addItem}
                className="rounded-md border border-[#cfe1ed] px-3 py-1.5 text-xs font-medium text-[#2675a8] hover:bg-[#edf7ff]"
              >
                ＋ เพิ่มรายการ
              </button>

            </div>

            {/* Bottom buttons */}
            <div className="flex flex-wrap gap-2 border-t border-[#e4eef5] px-4 py-3">

              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#16476b] px-7 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#123b5d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'กำลังบันทึก...'
                  : '▣ บันทึกข้อมูล'}
              </button>

              <button
                type="button"
                onClick={clearForm}
                disabled={loading}
                className="rounded-md border border-[#bcd3e2] bg-white px-7 py-2 text-xs font-semibold text-[#31536d] hover:bg-gray-50"
              >
                ↻ ล้างข้อมูล
              </button>

            </div>

          </section>

        </form>
      </div>
    </main>
  )
}
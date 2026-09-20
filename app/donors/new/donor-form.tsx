'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createDonor } from '../actions'

type DonationItem = {
  id: number
  category: string
  quantity: string
  unit: string
}

const inputClass = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300'

export function DonorForm() {
  const [items, setItems] = useState<DonationItem[]>([{ id: 1, category: '', quantity: '', unit: 'ชิ้น' }])
  const [fileName, setFileName] = useState('ยังไม่มีไฟล์เลือก')
  const [donorType, setDonorType] = useState('')

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      { id: Date.now(), category: '', quantity: '', unit: 'ชิ้น' },
    ])
  }

  function updateItem(id: number, field: keyof DonationItem, value: string) {
    setItems((currentItems) => currentItems.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }

  function resetForm() {
    setItems([{ id: 1, category: '', quantity: '', unit: 'ชิ้น' }])
    setFileName('ยังไม่มีไฟล์เลือก')
    setDonorType('')
  }

  return (
    <form action={createDonor} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">ข้อมูลผู้บริจาค</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className={labelClass}>ชื่อผู้บริจาค <span className="text-red-500">*</span></label>
            <input name="name" required placeholder="เช่น นางสาว ดาริกา ใจดี" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>เบอร์โทรศัพท์</label>
            <input name="phone" placeholder="เช่น 08X-XXX-XXXX" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>วันที่บริจาค <span className="text-red-500">*</span></label>
            <input name="donation_date" type="text" required placeholder="เช่น 10/09/2568" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>ประเภทผู้บริจาค <span className="text-red-500">*</span></label>
            <select name="donor_type" required value={donorType} onChange={(event) => setDonorType(event.target.value)} className={inputClass}>
              <option value="" disabled>เลือกประเภทผู้บริจาค</option>
              <option value="individual">บุคคลทั่วไป</option>
              <option value="organization">องค์กร / หน่วยงาน</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>อีเมล</label>
            <input name="email" type="email" placeholder="เช่น donor@example.com" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>ที่อยู่</label>
            <input name="address" placeholder="ที่อยู่สำหรับติดต่อ" className={inputClass} />
          </div>
        </div>
        {donorType === 'organization' && (
          <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 dark:border-slate-700 md:grid-cols-2">
            <div>
              <label className={labelClass}>ชื่อองค์กร / หน่วยงาน <span className="text-red-500">*</span></label>
              <input name="organization_name" required placeholder="เช่น บริษัท วไลยอลงกรณ์ จำกัด" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ประเภทองค์กร / หน่วยงาน <span className="text-red-500">*</span></label>
              <select name="organization_type" required defaultValue="" className={inputClass}>
                <option value="" disabled>เลือกประเภทองค์กร</option>
                <option value="company">บริษัท / ห้างร้าน</option>
                <option value="school">โรงเรียน / สถานศึกษา</option>
                <option value="government">หน่วยงานราชการ</option>
                <option value="foundation">มูลนิธิ / องค์กรสาธารณประโยชน์</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">รายละเอียดการบริจาค</h2>
        <label className={labelClass}>รายการที่บริจาค</label>
        <input name="donation_detail" placeholder="เช่น เสื้อผ้า อาหารแห้ง ของใช้จำเป็น" className={inputClass} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input name="is_anonymous" type="checkbox" className="rounded border-slate-300" />
          ไม่ประสงค์ออกนาม
        </label>
        <label className={`${labelClass} mt-3`}>หมายเหตุเพิ่มเติม</label>
        <textarea name="notes" rows={3} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" className={inputClass} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">แนบหลักฐาน (Slip/ภาพถ่าย)</h2>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">รองรับไฟล์หลักฐาน JPG, PNG และ PDF</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
            อัปโหลดหลักฐาน/รูปภาพ
            <input type="file" name="proof" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? 'ยังไม่มีไฟล์เลือก')} />
          </label>
          <span className="text-sm text-slate-500 dark:text-slate-400">{fileName}</span>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">รายการสิ่งของบริจาคเพิ่มเติม (ทางเลือก)</h2>
          <button type="button" onClick={addItem} className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-600 text-xl text-white hover:bg-sky-700" aria-label="เพิ่มรายการสิ่งของ">+</button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="grid gap-3 md:grid-cols-[1fr_180px_150px]">
              <input name="item_category" value={item.category} onChange={(event) => updateItem(item.id, 'category', event.target.value)} placeholder="[รายการ/หมวดหมู่]" className={inputClass} />
              <input name="item_quantity" type="number" min="1" value={item.quantity} onChange={(event) => updateItem(item.id, 'quantity', event.target.value)} placeholder="[จำนวน]" className={inputClass} />
              <select name="item_unit" value={item.unit} onChange={(event) => updateItem(item.id, 'unit', event.target.value)} className={inputClass}>
                <option value="ชิ้น">ชิ้น</option>
                <option value="กล่อง">กล่อง</option>
                <option value="ถุง">ถุง</option>
                <option value="แพ็ค">แพ็ค</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        <Link href="/donors" className="rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700">ยกเลิก/ย้อนกลับ</Link>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700">บันทึกข้อมูล</button>
          <button type="reset" onClick={resetForm} className="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">ล้างข้อมูล</button>
        </div>
      </div>
    </form>
  )
}

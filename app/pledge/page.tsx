// =====================================================================
// หน้าฟอร์มสาธารณะ — แจ้งความประสงค์บริจาค (ผู้ใช้ทั่วไป)
//
// ไม่ต้อง login เป็นทางเข้าเดียวของ role "ผู้ใช้ทั่วไป" ในระบบนี้
// staff จะมาตรวจสอบ/ยืนยันคำร้องต่อที่หน้า /pledges (docs/sql/10_public_pledges.sql)
// =====================================================================

import { CalendarDays, Gift, Mail, Phone, Plus, Trash2, UserRound } from 'lucide-react'
import { submitPledge } from './actions'
import { BrandMark } from '../brand-mark'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

function FieldShell({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-[42px] items-center gap-3 rounded-md border border-slate-200 bg-[#f4f5f6] px-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
        {icon}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default async function PledgePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const { ok, error } = await searchParams
  const locale = await getLocale()
  const dict = getDictionary(locale)

  return (
    <main className="min-h-screen bg-[#f3efe7] text-slate-800">
      <nav className="bg-[#1d3b5a] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3">
          <div className="flex items-center gap-8">
            <BrandMark size="sm" onDark />
            <div className="hidden items-center gap-7 text-[15px] md:flex">
              <a href="#" className="font-medium text-slate-100 hover:text-white">หน้าหลัก</a>
              <a href="#" className="font-medium text-slate-100 hover:text-white">รับบริจาค</a>
              <a href="#" className="font-medium text-slate-100 hover:text-white">คลังสินค้า</a>
              <a href="#" className="font-medium text-slate-100 hover:text-white">คำขอ</a>
              <a href="#" className="font-medium text-slate-100 hover:text-white">จัดสรร</a>
              <a href="#" className="font-medium text-slate-100 hover:text-white">ผู้บริจาค</a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="rounded-md border border-white/20 px-2 py-1 text-[11px] font-medium text-slate-100">
              EN
            </button>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2d4d1] text-xs font-bold text-[#1d3b5a]">
              A
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f1a4a4] text-white shadow-sm">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[2.2rem] font-bold leading-none text-slate-800">บันทึกของบริจาค</h1>
            <p className="mt-2 text-[15px] text-slate-500">กรอกข้อมูลเพื่อใช้บริจาคได้ที่ร้านเพื่อนำเข้าคลังสินค้า</p>
          </div>
        </div>

        {ok && (
          <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {dict.pledge.successMsg}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <form action={submitPledge} className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <UserRound className="h-4 w-4" />
                </div>
                <h2 className="text-[1.05rem] font-bold text-slate-800">ข้อมูลผู้บริจาค</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-[14px] font-medium text-slate-700">ชื่อผู้บริจาค <span className="text-red-500">*</span></label>
                  <FieldShell icon={<UserRound className="h-4 w-4" />}>
                    <input
                      name="donor_name"
                      required
                      placeholder="เช่น มนูสิริได้"
                      className="w-full border-0 bg-transparent p-0 text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </FieldShell>
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-slate-700">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <FieldShell icon={<Phone className="h-4 w-4" />}>
                    <input
                      name="donor_phone"
                      required
                      placeholder="เช่น 081-234-5678"
                      className="w-full border-0 bg-transparent p-0 text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </FieldShell>
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-slate-700">วันที่เข้ารับ <span className="text-red-500">*</span></label>
                  <FieldShell icon={<CalendarDays className="h-4 w-4" />}>
                    <input
                      name="donation_date"
                      type="date"
                      className="w-full border-0 bg-transparent p-0 text-[15px] text-slate-700 outline-none"
                    />
                  </FieldShell>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <Gift className="h-4 w-4" />
                </div>
                <h2 className="text-[1.05rem] font-bold text-slate-800">รายการของที่บริจาค</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.5fr_0.9fr_0.8fr_0.9fr_1.1fr_auto]">
                <div>
                  <label className="mb-2 block text-[14px] font-medium text-slate-700">ชื่อสิ่งของ <span className="text-red-500">*</span></label>
                  <FieldShell icon={<Gift className="h-4 w-4" />}>
                    <input
                      name="item_name"
                      required
                      placeholder="เลือกสิ่งของ"
                      className="w-full border-0 bg-transparent p-0 text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </FieldShell>
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-slate-700">จำนวน <span className="text-red-500">*</span></label>
                  <FieldShell icon={<Plus className="h-4 w-4" />}>
                    <input
                      name="quantity"
                      type="number"
                      min={1}
                      required
                      placeholder="50"
                      className="w-full border-0 bg-transparent p-0 text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </FieldShell>
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-slate-700">หน่วย</label>
                  <FieldShell icon={<Gift className="h-4 w-4" />}>
                    <select
                      name="category"
                      className="w-full border-0 bg-transparent p-0 text-[15px] text-slate-700 outline-none"
                    >
                      <option value="">เลือก</option>
                      <option value="food">สิ่งของ</option>
                      <option value="water">น้ำ</option>
                      <option value="medicine">ยา</option>
                    </select>
                  </FieldShell>
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-slate-700">วันหมดอายุ</label>
                  <FieldShell icon={<CalendarDays className="h-4 w-4" />}>
                    <input
                      name="expiry_date"
                      type="date"
                      className="w-full border-0 bg-transparent p-0 text-[15px] text-slate-700 outline-none"
                    />
                  </FieldShell>
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-slate-700">หมายเหตุ</label>
                  <FieldShell icon={<Mail className="h-4 w-4" />}>
                    <input
                      name="note"
                      placeholder="เช่น ประกวดฯ"
                      className="w-full border-0 bg-transparent p-0 text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </FieldShell>
                </div>

                <div className="flex items-end pb-1">
                  <button
                    type="button"
                    aria-label="ลบรายการ"
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#efb8b8] text-white shadow-sm hover:bg-[#e39d9d]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 text-[15px] font-medium text-slate-700"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-lg leading-none">
                  +
                </span>
                เพิ่มรายการ
              </button>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-md bg-[#1d3b5a] px-6 py-3 text-[15px] font-medium text-white shadow-sm hover:bg-[#142a3f]"
            >
              <Gift className="h-4 w-4" />
              บันทึกข้อมูล
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-[15px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <CalendarDays className="h-4 w-4" />
              ยกเลิก
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

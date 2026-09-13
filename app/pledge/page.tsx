// =====================================================================
// หน้าฟอร์มสาธารณะ — แจ้งความประสงค์บริจาค (ผู้ใช้ทั่วไป)
//
// ไม่ต้อง login เป็นทางเข้าเดียวของ role "ผู้ใช้ทั่วไป" ในระบบนี้
// staff จะมาตรวจสอบ/ยืนยันคำร้องต่อที่หน้า /pledges (docs/sql/10_public_pledges.sql)
// =====================================================================

import { submitPledge } from './actions'
import { BrandMark } from '../brand-mark'
import { BackHomeLink } from '../back-home-link'

export default async function PledgePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const { ok, error } = await searchParams

  return (
    <main className="brand-hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-sm">
        <BackHomeLink />
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">แจ้งความประสงค์บริจาค</h1>
          <p className="mt-1 text-sm text-slate-500">ไม่ต้องเข้าสู่ระบบ — เจ้าหน้าที่จะติดต่อกลับ</p>
        </div>

        {ok && (
          <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            ส่งคำร้องเรียบร้อยแล้ว ขอบคุณสำหรับความช่วยเหลือ
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form
          action={submitPledge}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อของคุณ</label>
            <input
              name="donor_name"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">เบอร์โทร</label>
              <input
                name="donor_phone"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">อีเมล</label>
              <input
                name="donor_email"
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              สิ่งที่อยากบริจาค
            </label>
            <input
              name="item_name"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">หมวดหมู่</label>
              <select
                name="category"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="food">อาหาร</option>
                <option value="water">น้ำดื่ม</option>
                <option value="medicine">ยา</option>
                <option value="clothing">เสื้อผ้า</option>
                <option value="hygiene">ของใช้ส่วนตัว</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">จำนวน</label>
              <input
                name="quantity"
                type="number"
                min={1}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">หมายเหตุ</label>
            <textarea
              name="note"
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
          >
            ส่งคำร้อง
          </button>
        </form>
      </div>
    </main>
  )
}

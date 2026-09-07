// =====================================================================
// หน้าฟอร์มสาธารณะ — ขอความช่วยเหลือ (ผู้ใช้ทั่วไป)
//
// ไม่ต้อง login คู่กับ /pledge (บริจาค) แต่กลับทิศทาง — ผู้ขอเลือกศูนย์
// พักพิงที่เกี่ยวข้องเอง staff ของศูนย์นั้นจะมาตรวจสอบต่อที่ /help-requests
// (docs/sql/12_public_help_requests.sql)
//
// ตั้งใจให้ฟอร์มสั้นที่สุดเท่าที่จำเป็น — ผู้ใช้กลุ่มนี้อาจกำลังเดือดร้อน
// อยู่จริงๆ และมักใช้มือถือ จึงไม่ใส่ฟิลด์ที่ไม่จำเป็นเพิ่ม
// =====================================================================

import { createClient } from '@/lib/supabase/server'
import { submitHelpRequest } from './actions'
import { BrandMark } from '../brand-mark'

export default async function HelpRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const { ok, error } = await searchParams
  const supabase = await createClient()

  const { data: shelters } = await supabase
    .from('centers')
    .select('id, name')
    .eq('type', 'shelter')
    .eq('is_active', true)
    .order('name')

  return (
    <main className="brand-hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">ขอความช่วยเหลือ</h1>
          <p className="mt-1 text-sm text-slate-500">
            ไม่ต้องเข้าสู่ระบบ — เจ้าหน้าที่ศูนย์ที่คุณเลือกจะติดต่อกลับ
          </p>
        </div>

        {ok && (
          <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            ส่งคำขอเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!shelters || shelters.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-400">
            ยังไม่มีศูนย์พักพิงเปิดรับในระบบตอนนี้ กรุณาติดต่อเจ้าหน้าที่โดยตรง
          </p>
        ) : (
          <form
            action={submitHelpRequest}
            className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อของคุณ</label>
              <input
                name="requester_name"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                เบอร์โทรติดต่อกลับ
              </label>
              <input
                name="requester_phone"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ศูนย์พักพิงที่ใกล้คุณ
              </label>
              <select
                name="center_id"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">— เลือกศูนย์ —</option>
                {shelters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                สิ่งที่ต้องการความช่วยเหลือ
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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ความเร่งด่วน
              </label>
              <select
                name="urgency"
                defaultValue="medium"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="low">ไม่เร่งด่วน</option>
                <option value="medium">ปานกลาง</option>
                <option value="high">เร่งด่วนมาก</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                รายละเอียดเพิ่มเติม (ถ้ามี)
              </label>
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
              ส่งคำขอ
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

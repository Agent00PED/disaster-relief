import { createRequest } from '../actions'

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">สร้างคำขอ</h1>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={createRequest}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">สิ่งที่ต้องการ</label>
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
              name="quantity_requested"
              type="number"
              min={1}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ความเร่งด่วน</label>
          <select
            name="urgency"
            defaultValue="medium"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="low">ต่ำ</option>
            <option value="medium">ปานกลาง</option>
            <option value="high">สูง</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          ส่งคำขอ
        </button>
      </form>
    </main>
  )
}

import { createDonor } from '../actions'

export default function NewDonorPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">เพิ่มผู้บริจาค</h1>
      <form
        action={createDonor}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อ</label>
          <input
            name="name"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ประเภท</label>
          <select
            name="donor_type"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="individual">บุคคล</option>
            <option value="organization">องค์กร</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">เบอร์โทร</label>
            <input
              name="phone"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">อีเมล</label>
            <input
              name="email"
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ที่อยู่</label>
          <input
            name="address"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input name="is_anonymous" type="checkbox" className="rounded border-slate-300" />
          ไม่ประสงค์ออกนาม
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          บันทึก
        </button>
      </form>
    </main>
  )
}

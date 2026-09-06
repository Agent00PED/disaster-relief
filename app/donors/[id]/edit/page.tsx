import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateDonor } from '../../actions'

export default async function EditDonorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: donor } = await supabase.from('donors').select('*').eq('id', id).single()
  if (!donor) notFound()

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">แก้ไขผู้บริจาค</h1>
      <form
        action={updateDonor}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={donor.id} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อ</label>
          <input
            name="name"
            defaultValue={donor.name}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ประเภท</label>
          <select
            name="donor_type"
            defaultValue={donor.donor_type}
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
              defaultValue={donor.phone ?? ''}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">อีเมล</label>
            <input
              name="email"
              type="email"
              defaultValue={donor.email ?? ''}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ที่อยู่</label>
          <input
            name="address"
            defaultValue={donor.address ?? ''}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            name="is_anonymous"
            type="checkbox"
            defaultChecked={donor.is_anonymous}
            className="rounded border-slate-300"
          />
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

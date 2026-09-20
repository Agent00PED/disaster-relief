'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateDonor } from '../../actions'
import { useEffect, useState } from 'react'

// รายชื่อ 77 จังหวัดทั่วประเทศไทย
const provinces = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 
  'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 
  'ชัยภูมิ', 'ชุมพร', 'ตรัง', 'ตราด', 'ตาก', 
  'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 
  'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 
  'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 
  'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 
  'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 
  'มหาสารคาม', 'มุกดาหาร', 'ยะลา', 'ยโสธร', 'ร้อยเอ็ด', 
  'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 
  'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 
  'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 
  'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 
  'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 
  'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
]

export default function EditDonorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [donor, setDonor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params
      const resolvedSearch = await searchParams
      if (resolvedSearch?.error) {
        setErrorMsg(resolvedSearch.error)
      }

      const supabase = createClient()
      const { data, error } = await supabase.from('donors').select('*').eq('id', resolvedParams.id).single()
      
      if (error || !data) {
        setDonor(null)
      } else {
        setDonor(data)
      }
      setLoading(false)
    }
    loadData()
  }, [params, searchParams])

  if (loading) {
    return <div className="p-10 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</div>
  }

  if (!donor) {
    return <div className="p-10 text-center text-sm text-slate-500">ไม่พบข้อมูลผู้บริจาค</div>
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          แก้ไขข้อมูลผู้บริจาค
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          ปรับปรุงรายละเอียดและสถานะของผู้บริจาคในระบบ
        </p>
      </div>

      {errorMsg && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {errorMsg}
        </p>
      )}

      <form
        action={updateDonor}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <input type="hidden" name="id" value={donor.id} />
        
        {/* ช่องชื่อ (ห้ามพิมพ์ตัวเลข) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            ชื่อ <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            defaultValue={donor.name}
            required
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '')
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* ช่องเบอร์โทร (พิมพ์ได้เฉพาะตัวเลข) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            เบอร์โทร
          </label>
          <input
            name="phone"
            defaultValue={donor.phone ?? ''}
            inputMode="numeric"
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* ช่องเลือกจังหวัด (77 จังหวัด) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            จังหวัด
          </label>
          <select
            name="address"
            defaultValue={donor.address ?? ''}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">-- เลือกจังหวัด --</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              name="is_anonymous"
              type="checkbox"
              defaultChecked={donor.is_anonymous}
              value="true"
              className="rounded border-slate-300"
            />
            ไม่ประสงค์ออกนาม
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={donor.is_active}
              value="true"
              className="rounded border-slate-300"
            />
            <span>ใช้งาน</span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
          >
            บันทึกข้อมูล
          </button>
          <Link
            href="/donors"
            className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </main>
  )
}
'use client'

import Link from 'next/link'
import { createDonor } from '../actions'

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

export default function NewDonorPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        เพิ่มผู้บริจาคใหม่
      </h1>

      <form
        action={createDonor}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        {/* ช่องชื่อ (ห้ามพิมพ์ตัวเลข) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            ชื่อ <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="ระบุชื่อหรือนามสกุลผู้บริจาค"
            onInput={(e) => {
              // กรองตัวเลขออกทันทีถ้าผู้ใช้พยายามพิมพ์เข้ามา
              e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '')
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* ช่องเบอร์โทร (พิมพ์ได้เฉพาะตัวเลขเท่านั้น) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            เบอร์โทร
          </label>
          <input
            name="phone"
            inputMode="numeric"
            placeholder="0xxxxxxxx"
            onInput={(e) => {
              // กรองตัวอักษรอื่นๆ ออก ให้เหลือแค่ตัวเลข
              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* ช่องเลือกจังหวัด */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            จังหวัด
          </label>
          <select
            name="address"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">-- เลือกจังหวัด --</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              name="is_anonymous"
              type="checkbox"
              className="rounded border-slate-300"
            />
            ไม่ประสงค์ออกนาม
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
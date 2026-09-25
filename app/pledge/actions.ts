'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeUnit } from '@/lib/units'
import { normalizeDietary } from '@/lib/dietary'

// ไม่ต้อง login — RLS (pledges_public_insert) อนุญาต anon insert ได้อยู่แล้ว
export async function submitPledge(formData: FormData) {
  const supabase = await createClient()

  // ตำบลขึ้นก่อนจังหวัดเสมอ ให้ตรงกับรูปแบบที่ donors.address ใช้อยู่
  // (หน้าอื่นอ่านจังหวัดจากคำสุดท้าย ถ้าสลับลำดับจะอ่านผิดทั้งระบบ)
  const subdistrict = String(formData.get('subdistrict') || '').trim()
  const province = String(formData.get('province_name') || '').trim()
  const address = [subdistrict, province].filter(Boolean).join(' ') || null

  const { error } = await supabase.from('donation_pledges').insert({
    donor_name: String(formData.get('donor_name')),
    donor_phone: String(formData.get('donor_phone') || '') || null,
    donor_email: String(formData.get('donor_email') || '') || null,
    address,
    item_name: String(formData.get('item_name')),
    category: String(formData.get('category')),
    quantity: Number(formData.get('quantity')),
    unit: normalizeUnit(String(formData.get('unit') || '')) || 'ชิ้น',
    // ค่าที่ไม่รู้จักหรือไม่ได้ส่งมา ตกเป็น general ให้อัตโนมัติ
    // ฟอร์มยังไม่มีช่องนี้ก็ไม่พัง พอหน้าบ้านเพิ่ม input ชื่อนี้จะบันทึกได้ทันที
    dietary_type: normalizeDietary(String(formData.get('dietary_type') || '')),
    note: String(formData.get('note') || '') || null,
  })

  if (error) redirect('/pledge?error=' + encodeURIComponent(error.message))
  redirect('/pledge?ok=1')
}

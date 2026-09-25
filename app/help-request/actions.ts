'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeDietary } from '@/lib/dietary'

// ไม่ต้อง login — RLS (request_pledges_public_insert) อนุญาต anon insert ได้อยู่แล้ว
export async function submitHelpRequest(formData: FormData) {
  const supabase = await createClient()

  // ดึงค่าตำบลและจังหวัด จับมา trim() และต่อกัน (ตำบลขึ้นก่อนเสมอ)
  const subdistrict = String(formData.get('subdistrict') || '').trim()
  const province = String(formData.get('province_name') || '').trim()
  const address = [subdistrict, province].filter(Boolean).join(' ') || null

  const { error } = await supabase.from('request_pledges').insert({
    requester_name: String(formData.get('requester_name')),
    requester_phone: String(formData.get('requester_phone')),
    requester_email: String(formData.get('requester_email') || '') || null,
    address, // <--- ส่งที่อยู่ที่จัดรูปแบบแล้วเข้า database
    center_id: String(formData.get('center_id')),
    item_name: String(formData.get('item_name')),
    category: String(formData.get('category')),
    quantity: Number(formData.get('quantity')),
    // ค่าที่ไม่รู้จักหรือไม่ได้ส่งมา ตกเป็น general ให้อัตโนมัติ
    // ฟอร์มยังไม่มีช่องนี้ก็ไม่พัง พอหน้าบ้านเพิ่ม input ชื่อนี้จะบันทึกได้ทันที
    dietary_type: normalizeDietary(String(formData.get('dietary_type') || '')),
    urgency: String(formData.get('urgency') || 'medium'),
    note: String(formData.get('note') || '') || null,
  })

  if (error) redirect('/help-request?error=' + encodeURIComponent(error.message))
  redirect('/help-request?ok=1')
}
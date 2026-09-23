'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

// RLS (centers_write / profiles_admin_all) บังคับ is_admin() อยู่แล้วที่ DB
// แต่หน้าเรียกฟังก์ชันนี้แสดงเฉพาะกับ admin เท่านั้น (เช็คใน page.tsx)
export async function addCenter(formData: FormData) {
  const supabase = await createClient()
  const dict = getDictionary(await getLocale())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dict.admin.adminOnly }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: dict.admin.adminOnly }
  const name = String(formData.get('name') || '').trim()
  const type = String(formData.get('type') || '')
  const address = String(formData.get('address') || '').trim()
  const phone = String(formData.get('contact_phone') || '').trim()
  if (!name || name.length > 200 || !['warehouse', 'shelter'].includes(type) || address.length > 1000 || phone.length > 50) {
    return { error: dict.centerDashboard.invalid }
  }
  const { error } = await supabase.from('centers').insert({
    name, type, address: address || null, contact_phone: phone || null,
    is_active: formData.get('is_active') === 'on',
  })
  if (error) {
    return { error: dict.centerDashboard.saveError }
  }
  revalidatePath('/admin/centers')
  return { success: true }
}

export async function updateUser(formData: FormData) {
  const supabase = await createClient()
  const centerId = String(formData.get('center_id') || '')
  const firstName = String(formData.get('first_name') || '').trim()
  const lastName = String(formData.get('last_name') || '').trim()

  const payload: Record<string, unknown> = {
    role: String(formData.get('role')),
    center_id: centerId || null,
    // เบอร์ติดต่อเจ้าหน้าที่ — อาสาสมัครในศูนย์เดียวกันเห็นที่หน้า /volunteer
    phone: String(formData.get('phone') || '').trim() || null,
    first_name: firstName || null,
    last_name: lastName || null,
  }

  // full_name ยังเป็นคอลัมน์ที่ทั้งเว็บใช้แสดงชื่อ (แถบเมนู ใบเสร็จ ตารางนี้)
  // จึงต้องอัปเดตตามให้ตรงกัน ไม่งั้นแก้ชื่อในตารางแล้วที่อื่นยังเป็นชื่อเดิม
  // เขียนทับเฉพาะตอนที่กรอกมาอย่างน้อยหนึ่งช่อง — ถ้าเว้นว่างทั้งคู่ให้คง
  // full_name เดิมไว้ ไม่ล้างชื่อของบัญชีที่ยังไม่ได้แยกชื่อ-นามสกุล
  if (firstName || lastName) {
    payload.full_name = [firstName, lastName].filter(Boolean).join(' ')
  }

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', String(formData.get('id')))
  if (error) {
    redirect('/admin/centers?error=' + encodeURIComponent(error.message))
  }
  revalidatePath('/admin/centers')
}

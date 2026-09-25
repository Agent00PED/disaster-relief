'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

async function requireAdmin() {
  const supabase = await createClient()
  const dict = getDictionary(await getLocale())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, dict, user: null, error: dict.admin.adminOnly }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { supabase, dict, user: null, error: dict.admin.adminOnly }
  return { supabase, dict, user, error: '' }
}

function centerValues(formData: FormData) {
  const rawPhone = String(formData.get('contact_phone') || '').trim()
  const phone = rawPhone.replace(/[^0-9]/g, '')
  return {
    name: String(formData.get('name') || '').trim(),
    nameEn: String(formData.get('name_en') || '').trim(),
    type: String(formData.get('type') || ''),
    address: String(formData.get('address') || '').trim(),
    phone,
    isActive: formData.get('is_active') === 'on',
  }
}

function validCenter(values: ReturnType<typeof centerValues>) {
  return Boolean(values.name)
    && values.name.length <= 200
    && values.nameEn.length <= 200
    && ['warehouse', 'shelter'].includes(values.type)
    && values.address.length <= 1000
      && (!values.phone || /^[0-9]{9,10}$/.test(values.phone))
}

// RLS (centers_write / profiles_admin_all) บังคับ is_admin() อยู่แล้วที่ DB
// แต่หน้าเรียกฟังก์ชันนี้แสดงเฉพาะกับ admin เท่านั้น (เช็คใน page.tsx)
export async function addCenter(formData: FormData) {
  const { supabase, dict, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const values = centerValues(formData)
  if (!validCenter(values)) {
    return { error: dict.centerDashboard.invalid }
  }
  const { data: duplicate } = await supabase.from('centers').select('id').ilike('name', values.name).maybeSingle()
  if (duplicate) return { error: dict.centerDashboard.duplicate }
  const { error } = await supabase.from('centers').insert({
    name: values.name, name_en: values.nameEn || null, type: values.type,
    address: values.address || null, contact_phone: values.phone || null,
    is_active: values.isActive,
  })
  if (error) {
    return { error: dict.centerDashboard.saveError }
  }
  revalidatePath('/admin/centers')
  return { success: true }
}

export async function updateCenter(formData: FormData) {
  const { supabase, dict, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const id = String(formData.get('id') || '')
  const values = centerValues(formData)
  if (!id || !validCenter(values)) return { error: dict.centerDashboard.invalid }
  const { data: duplicate } = await supabase.from('centers').select('id').ilike('name', values.name).neq('id', id).maybeSingle()
  if (duplicate) return { error: dict.centerDashboard.duplicate }
  const { error } = await supabase.from('centers').update({
    name: values.name, name_en: values.nameEn || null, type: values.type,
    address: values.address || null, contact_phone: values.phone || null,
    is_active: values.isActive,
  }).eq('id', id)
  if (error) return { error: dict.centerDashboard.saveError }
  revalidatePath('/admin/centers')
  return { success: true }
}

export async function updateUser(formData: FormData) {
  const { supabase, dict, user, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const targetId = String(formData.get('id') || '')
  const centerId = String(formData.get('center_id') || '')
  const firstName = String(formData.get('first_name') || '').trim()
  const lastName = String(formData.get('last_name') || '').trim()
  const role = String(formData.get('role'))
  const phone = String(formData.get('phone') || '').trim()
  if (phone && !/^[0-9]{10}$/.test(phone)) return { error: dict.admin.phoneTenDigits }
  if (!['admin', 'staff', 'volunteer'].includes(role) || firstName.length > 100 || lastName.length > 100) {
    return { error: dict.centerDashboard.invalid }
  }
  if (targetId === user?.id && role !== 'admin') {
    return { error: dict.admin.cannotChangeOwnRole }
  }
  if (centerId) {
    const { data: center } = await supabase.from('centers').select('is_active').eq('id', centerId).maybeSingle()
    if (!center?.is_active) return { error: dict.admin.inactiveCenterAssignment }
  }
  const { data: target } = await supabase.from('profiles').select('role').eq('id', targetId).maybeSingle()
  if (!target) return { error: dict.centerDashboard.saveError }
  if (target.role === 'admin' && role !== 'admin') {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
    if ((count ?? 0) <= 1) return { error: dict.admin.lastAdmin }
  }

  const payload: Record<string, unknown> = {
    role,
    center_id: centerId || null,
    // เบอร์ติดต่อเจ้าหน้าที่ — อาสาสมัครในศูนย์เดียวกันเห็นที่หน้า /volunteer
    phone: phone || null,
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
    .eq('id', targetId)
  if (error) {
    return { error: dict.centerDashboard.saveError }
  }
  revalidatePath('/admin/centers')
  return { success: true }
}

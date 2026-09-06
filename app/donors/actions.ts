'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function donorPayload(formData: FormData) {
  return {
    name: String(formData.get('name')),
    donor_type: String(formData.get('donor_type') || 'individual'),
    phone: String(formData.get('phone') || '') || null,
    email: String(formData.get('email') || '') || null,
    address: String(formData.get('address') || '') || null,
    is_anonymous: formData.get('is_anonymous') === 'on',
  }
}

export async function createDonor(formData: FormData) {
  const supabase = await createClient()
  // ไม่ส่ง is_active ตอนสร้าง ปล่อยให้ DB ใช้ default (true) — ฟอร์มสร้างใหม่
  // ไม่มีช่องนี้ ถ้าไปอ่าน formData.get('is_active') ตรงนี้จะได้ null แล้วตีความ
  // เป็น false โดยไม่ตั้งใจ (ผู้บริจาคใหม่จะถูกสร้างมาเป็น "ปิดใช้งาน" ทันที)
  const { error } = await supabase.from('donors').insert(donorPayload(formData))
  if (error) {
    redirect('/donors/new?error=' + encodeURIComponent(error.message))
  }
  revalidatePath('/donors')
  redirect('/donors')
}

export async function updateDonor(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))
  const { error } = await supabase
    .from('donors')
    .update({ ...donorPayload(formData), is_active: formData.get('is_active') === 'on' })
    .eq('id', id)
  if (error) {
    redirect(`/donors/${id}/edit?error=` + encodeURIComponent(error.message))
  }
  revalidatePath('/donors')
  redirect('/donors')
}

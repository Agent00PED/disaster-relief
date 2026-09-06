'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// RLS (centers_write / profiles_admin_all) บังคับ is_admin() อยู่แล้วที่ DB
// แต่หน้าเรียกฟังก์ชันนี้แสดงเฉพาะกับ admin เท่านั้น (เช็คใน page.tsx)
export async function addCenter(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('centers').insert({
    name: String(formData.get('name')),
    type: String(formData.get('type')),
    address: String(formData.get('address') || '') || null,
    contact_phone: String(formData.get('contact_phone') || '') || null,
  })
  revalidatePath('/admin/centers')
}

export async function updateUser(formData: FormData) {
  const supabase = await createClient()
  const centerId = String(formData.get('center_id') || '')
  await supabase
    .from('profiles')
    .update({
      role: String(formData.get('role')),
      center_id: centerId || null,
    })
    .eq('id', String(formData.get('id')))
  revalidatePath('/admin/centers')
}

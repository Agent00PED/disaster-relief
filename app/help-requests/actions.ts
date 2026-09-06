'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ยืนยันคำขอ = สร้างแถวจริงใน requests โดยใช้ center_id ที่ผู้ขอเลือกไว้
// เอง (ไม่ใช่ศูนย์ของ staff ผู้ตรวจ) แล้วผูก converted_request_id ไว้ย้อนดูได้
export async function confirmHelpRequest(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id'))

  // RLS (request_pledges_staff_select) กรองให้แล้วว่า staff เห็นได้แค่
  // คำขอของศูนย์ตัวเอง — ถ้า query ไม่เจอแปลว่าไม่ใช่ของศูนย์นี้จริงๆ
  const { data: pledge } = await supabase
    .from('request_pledges')
    .select('*')
    .eq('id', id)
    .single()

  if (!pledge) redirect('/help-requests?error=' + encodeURIComponent('ไม่พบคำขอนี้'))

  const { data: request, error: requestError } = await supabase
    .from('requests')
    .insert({
      center_id: pledge.center_id,
      item_name: pledge.item_name,
      category: pledge.category,
      quantity_requested: pledge.quantity,
      urgency: pledge.urgency,
      requested_by: user.id,
    })
    .select('id')
    .single()

  if (requestError) {
    redirect('/help-requests?error=' + encodeURIComponent(requestError.message))
  }

  const { error: updateError } = await supabase
    .from('request_pledges')
    .update({
      status: 'confirmed',
      converted_request_id: request?.id,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    redirect('/help-requests?error=' + encodeURIComponent(updateError.message))
  }

  revalidatePath('/help-requests')
  revalidatePath('/requests')
  revalidatePath('/allocations')
  redirect('/help-requests')
}

export async function dismissHelpRequest(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('request_pledges')
    .update({ status: 'dismissed', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', String(formData.get('id')))

  if (error) {
    redirect('/help-requests?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/help-requests')
  redirect('/help-requests')
}

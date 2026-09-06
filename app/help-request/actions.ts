'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ไม่ต้อง login — RLS (request_pledges_public_insert) อนุญาต anon insert ได้อยู่แล้ว
export async function submitHelpRequest(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from('request_pledges').insert({
    requester_name: String(formData.get('requester_name')),
    requester_phone: String(formData.get('requester_phone')),
    requester_email: String(formData.get('requester_email') || '') || null,
    center_id: String(formData.get('center_id')),
    item_name: String(formData.get('item_name')),
    category: String(formData.get('category')),
    quantity: Number(formData.get('quantity')),
    urgency: String(formData.get('urgency') || 'medium'),
    note: String(formData.get('note') || '') || null,
  })

  if (error) redirect('/help-request?error=' + encodeURIComponent(error.message))
  redirect('/help-request?ok=1')
}

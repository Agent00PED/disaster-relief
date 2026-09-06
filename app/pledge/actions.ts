'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ไม่ต้อง login — RLS (pledges_public_insert) อนุญาต anon insert ได้อยู่แล้ว
export async function submitPledge(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from('donation_pledges').insert({
    donor_name: String(formData.get('donor_name')),
    donor_phone: String(formData.get('donor_phone') || '') || null,
    donor_email: String(formData.get('donor_email') || '') || null,
    item_name: String(formData.get('item_name')),
    category: String(formData.get('category')),
    quantity: Number(formData.get('quantity')),
    note: String(formData.get('note') || '') || null,
  })

  if (error) redirect('/pledge?error=' + encodeURIComponent(error.message))
  redirect('/pledge?ok=1')
}

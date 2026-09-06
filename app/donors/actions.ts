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
  await supabase.from('donors').insert(donorPayload(formData))
  revalidatePath('/donors')
  redirect('/donors')
}

export async function updateDonor(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('donors').update(donorPayload(formData)).eq('id', String(formData.get('id')))
  revalidatePath('/donors')
  redirect('/donors')
}

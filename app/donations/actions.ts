'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { findOrCreateDonor } from '@/lib/supabase/find-or-create-donor'

export async function createDonation(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('center_id')
    .eq('id', user.id)
    .single()

  if (!profile?.center_id) {
    redirect(
      '/donations/new?error=' +
        encodeURIComponent('บัญชีนี้ยังไม่ได้ผูกกับศูนย์ ให้ admin ตั้งค่าก่อน'),
    )
  }

  const donorName = String(formData.get('donor_name') || '').trim()
  const donorId = donorName ? await findOrCreateDonor(supabase, { name: donorName }) : null

  const quantity = Number(formData.get('quantity_received'))

  const { error } = await supabase.from('donations').insert({
    center_id: profile.center_id,
    donor_id: donorId,
    item_name: String(formData.get('item_name')),
    category: String(formData.get('category')),
    unit: String(formData.get('unit') || 'ชิ้น'),
    quantity_received: quantity,
    quantity_remaining: quantity,
    expiry_date: String(formData.get('expiry_date') || '') || null,
    received_by: user.id,
  })

  if (error) {
    redirect('/donations/new?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/donations')
  revalidatePath('/inventory')
  redirect('/donations')
}

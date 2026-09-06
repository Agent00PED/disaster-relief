'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createRequest(formData: FormData) {
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
    redirect('/requests/new?error=' + encodeURIComponent('บัญชีนี้ยังไม่ได้ผูกกับศูนย์'))
  }

  const { error } = await supabase.from('requests').insert({
    center_id: profile.center_id,
    item_name: String(formData.get('item_name')),
    category: String(formData.get('category')),
    quantity_requested: Number(formData.get('quantity_requested')),
    urgency: String(formData.get('urgency') || 'medium'),
    requested_by: user.id,
  })

  if (error) redirect('/requests/new?error=' + encodeURIComponent(error.message))

  revalidatePath('/requests')
  revalidatePath('/allocations')
  redirect('/requests')
}

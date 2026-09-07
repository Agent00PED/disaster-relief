'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ตัดจ่ายทั้งหมดเกิดขึ้นใน allocate_items (docs/sql/05_functions.sql)
// ฟังก์ชันเดียวคุมทุกกฎ + ล็อกแถวกัน race condition — หน้านี้แค่เรียกผ่าน rpc
export async function allocate(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('allocate_items', {
    p_request_id: String(formData.get('request_id')),
    p_donation_id: String(formData.get('donation_id')),
    p_quantity: Number(formData.get('quantity')),
  })

  if (error) {
    redirect('/allocations?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/allocations')
  revalidatePath('/allocations/history')
  revalidatePath('/requests')
  revalidatePath('/donations')
  revalidatePath('/inventory')
  redirect('/allocations')
}

export async function confirmDelivery(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_delivered', {
    p_allocation_id: String(formData.get('id')),
  })
  if (error) {
    redirect('/allocations/history?error=' + encodeURIComponent(error.message))
  }
  revalidatePath('/allocations/history')
  redirect('/allocations/history')
}

// ยกเลิกการจัดสรร — คืนยอดกลับทั้งสองฝั่งใน cancel_allocation (05_functions.sql)
// ฟังก์ชันบังคับ is_admin() เองอีกชั้นแล้ว ฝั่งนี้แค่เรียกผ่าน rpc
export async function cancelAllocation(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_allocation', {
    p_allocation_id: String(formData.get('id')),
  })
  if (error) {
    redirect('/allocations/history?error=' + encodeURIComponent(error.message))
  }
  revalidatePath('/allocations/history')
  revalidatePath('/requests')
  revalidatePath('/donations')
  revalidatePath('/inventory')
  redirect('/allocations/history')
}

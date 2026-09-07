'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// อาสาสมัครทำได้อย่างเดียวคือกดยืนยันว่าของถึงศูนย์แล้ว ใช้ RPC เดียวกับ
// หน้า /allocations/history ของ staff (mark_delivered ใน 05_functions.sql)
// แต่ redirect กลับมาที่ /volunteer แทน เพราะอาสาสมัครเข้าหน้า staff ไม่ได้
export async function confirmReceipt(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_delivered', {
    p_allocation_id: String(formData.get('id')),
  })
  if (error) {
    redirect('/volunteer?error=' + encodeURIComponent(error.message))
  }
  revalidatePath('/volunteer')
  redirect('/volunteer')
}

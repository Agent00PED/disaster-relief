'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { normalizeUnit } from '@/lib/units'
import { normalizeDietary } from '@/lib/dietary'
import { resolveCenterId } from '@/lib/center-choice'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { withNotice } from '@/lib/notice'

export async function createRequest(formData: FormData) {
  const supabase = await createClient()
  // งานชุดนี้เป็นของเจ้าหน้าที่ อาสาสมัครเรียกไม่ได้
  await requireStaffOrAdmin(supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const centerId = await resolveCenterId(supabase, user.id, formData)
  if (!centerId) {
    const dict = getDictionary(await getLocale())
    redirect('/requests/new?error=' + encodeURIComponent(dict.common.noCenter))
  }

  const { error } = await supabase.from('requests').insert({
    center_id: centerId,
    item_name: String(formData.get('item_name')),
    category: String(formData.get('category')),
    quantity_requested: Number(formData.get('quantity_requested')),
    // หน่วยไม่บังคับ — ถ้าระบุ allocate_items จะจ่ายจากล็อตหน่วยเดียวกันเท่านั้น
    unit: normalizeUnit(String(formData.get('unit') ?? '')) || null,
    urgency: String(formData.get('urgency') || 'medium'),
    dietary_type: normalizeDietary(String(formData.get('dietary_type') || '')),
    requested_by: user.id,
  })

  if (error) redirect('/requests/new?error=' + encodeURIComponent(error.message))

  revalidatePath('/requests')
  revalidatePath('/allocations')
  redirect('/requests')
}

export async function updateRequest(formData: FormData) {
  const supabase = await createClient()
  // งานชุดนี้เป็นของเจ้าหน้าที่ อาสาสมัครเรียกไม่ได้
  await requireStaffOrAdmin(supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  const quantity = Number(formData.get('quantity_requested'))
  const urgency = String(formData.get('urgency') ?? '')

  if (!id || !Number.isInteger(quantity) || quantity <= 0 || !['low', 'medium', 'high'].includes(urgency)) {
    const dict = getDictionary(await getLocale())
    redirect('/requests?error=' + encodeURIComponent(dict.requests.invalidUpdate))
  }

  const { data, error } = await supabase.rpc('update_request', {
    p_id: id,
    p_quantity: quantity,
    p_urgency: urgency,
  })

  if (error || !data) {
    const dict = getDictionary(await getLocale())
    redirect('/requests?error=' + encodeURIComponent(error?.message ?? dict.requests.updateNotAllowed))
  }

  revalidatePath('/requests')
  revalidatePath('/allocations')
  redirect(withNotice('/requests', 'request_updated'))
}

// ยกเลิกคำขอ — cancel_request (docs/sql/23_f5_improvements.sql) ตรวจสิทธิ์ศูนย์
// และคืนยอดรายการจัดสรรที่ยังไม่ส่งมอบให้ใน transaction เดียว
export async function cancelRequest(formData: FormData) {
  const supabase = await createClient()
  // งานชุดนี้เป็นของเจ้าหน้าที่ อาสาสมัครเรียกไม่ได้
  await requireStaffOrAdmin(supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('requests')
    .update({
      status: 'cancelled',
      cancel_reason: String(formData.get('reason') ?? '').trim() || null,
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', String(formData.get('id') ?? ''))
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (error || !data) {
    const dict = getDictionary(await getLocale())
    redirect('/requests?error=' + encodeURIComponent(error?.message ?? dict.requests.updateNotAllowed))
  }

  for (const path of ['/requests', '/allocations', '/allocations/history', '/inventory', '/donations', '/volunteer', '/']) {
    revalidatePath(path)
  }
  revalidatePath('/', 'layout')
  redirect(withNotice('/requests', 'request_cancelled'))
}

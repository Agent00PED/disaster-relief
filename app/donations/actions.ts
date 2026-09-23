'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { normalizeUnit } from '@/lib/units'
import { findOrCreateDonor } from '@/lib/supabase/find-or-create-donor'
import { resolveCenterId } from '@/lib/center-choice'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { requireStaffOrAdmin } from '@/lib/guard'

export async function createDonation(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const centerId = await resolveCenterId(supabase, user.id, formData)
  if (!centerId) {
    const dict = getDictionary(await getLocale())
    redirect('/donations/new?error=' + encodeURIComponent(dict.common.noCenter))
  }

  const donorName = String(formData.get('donor_name') || '').trim()
  const donorPhone = String(formData.get('phone') || '').trim()
  const donorId = donorName
    ? await findOrCreateDonor(supabase, { name: donorName, phone: donorPhone || undefined })
    : null

  const itemNames = formData.getAll('item_name').map((v) => String(v).trim())
  const categories = formData.getAll('category').map((v) => String(v).trim())
  const units = formData.getAll('unit').map((v) => String(v).trim())
  const quantityValues =
    formData.getAll('quantity_received').length > 0
      ? formData.getAll('quantity_received')
      : formData.getAll('quantity')
  const quantities = quantityValues.map((v) => Number(v))
  const expiryDates = formData.getAll('expiry_date').map((v) => String(v).trim() || null)
  const receivedDateRaw = String(formData.get('received_date') || '').trim()
  const receivedDate = receivedDateRaw || null

  const rows = itemNames
    .map((name, i) => {
      const quantity = quantities[i] || 0
      return {
        center_id: centerId,
        donor_id: donorId,
        item_name: name,
        category: categories[i] || 'other',
        unit: normalizeUnit(units[i] || '') || 'ชิ้น',
        quantity_received: quantity,
        quantity_remaining: quantity,
        expiry_date: expiryDates[i] || null,
        received_date: receivedDate,
        received_by: user.id,
      }
    })
    .filter((row) => row.item_name && row.quantity_received > 0)

  if (rows.length === 0) {
    redirect('/donations/new?error=' + encodeURIComponent('กรุณากรอกข้อมูลสิ่งของอย่างน้อย 1 รายการ'))
  }

  let { error } = await supabase.from('donations').insert(rows)

  // ถ้าตารางยังไม่ได้รัน migration 29_missing_columns.sql (ไม่มีคอลัมน์ received_date) ให้ลอง insert โดยตัด received_date ออก
  if (error && error.message && error.message.includes('received_date')) {
    const fallbackRows = rows.map((r) => ({
      center_id: r.center_id,
      donor_id: r.donor_id,
      item_name: r.item_name,
      category: r.category,
      unit: r.unit,
      quantity_received: r.quantity_received,
      quantity_remaining: r.quantity_remaining,
      expiry_date: r.expiry_date,
      received_by: r.received_by,
    }))
    const retry = await supabase.from('donations').insert(fallbackRows)
    error = retry.error
  }

  if (error) {
    redirect('/donations/new?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/donations')
  revalidatePath('/inventory')
  redirect('/donations')
}

export async function updateDonation(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') || '').trim()
  if (!id) redirect('/donations')

  const itemName = String(formData.get('item_name') || '').trim()
  const category = String(formData.get('category') || '').trim()
  const unit = normalizeUnit(String(formData.get('unit') || '')) || 'ชิ้น'
  const qtyReceived = Number(formData.get('quantity_received')) || 1
  const qtyRemaining = Number(formData.get('quantity_remaining')) || 0
  const expiryDate = String(formData.get('expiry_date') || '').trim() || null

  if (qtyRemaining > qtyReceived) {
    redirect(`/donations/${id}/receipt/edit?error=` + encodeURIComponent('จำนวนคงเหลือต้องไม่เกินจำนวนที่รับ'))
  }

  const { error } = await supabase
    .from('donations')
    .update({
      item_name: itemName,
      category,
      unit,
      quantity_received: qtyReceived,
      quantity_remaining: qtyRemaining,
      expiry_date: expiryDate,
    })
    .eq('id', id)

  if (error) {
    redirect(`/donations/${id}/receipt/edit?error=` + encodeURIComponent(error.message))
  }

  revalidatePath('/donations')
  revalidatePath('/inventory')
  revalidatePath(`/donations/${id}/receipt`)
  redirect(`/donations/${id}/receipt`)
}

export async function deleteDonation(formData: FormData) {
  const supabase = await createClient()
  await requireStaffOrAdmin(supabase)

  const id = String(formData.get('id') || '').trim()
  if (!id) return

  const { error } = await supabase.from('donations').delete().eq('id', id)
  if (error) {
    console.error('Error deleting donation:', error.message)
    return
  }

  revalidatePath('/donations')
  revalidatePath('/inventory')
  redirect('/donations')
}

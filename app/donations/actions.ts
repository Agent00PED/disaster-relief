'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { normalizeUnit } from '@/lib/units'
import { normalizeDietary } from '@/lib/dietary'
import { findOrCreateDonor } from '@/lib/supabase/find-or-create-donor'
import { resolveCenterId } from '@/lib/center-choice'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { requireStaffOrAdmin } from '@/lib/guard'


// วันที่วันนี้ตามเขตเวลาไทย ใช้ตรวจช่วงวันที่ฝั่งเซิร์ฟเวอร์
// ต้องตรวจซ้ำที่นี่ เพราะฟอร์มฝั่งหน้าเว็บถูกข้ามได้
function todayBangkok() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export async function createDonation(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const centerId = await resolveCenterId(
    supabase,
    user.id,
    formData,
  )

  if (!centerId) {
    const dict = getDictionary(await getLocale())

    redirect(
      '/donations/new?error=' +
        encodeURIComponent(dict.common.noCenter),
    )
  }

  // ============================================================
  // ข้อมูลผู้บริจาค
  // ============================================================

  const donorName = String(
    formData.get('donor_name') || '',
  ).trim()

  const donorPhone = String(
    formData.get('phone') || '',
  ).trim()

  // จังหวัด
  const province = String(
    formData.get('province_name') || '',
  ).trim()

  // ตำบล
  const subdistrict = String(
    formData.get('subdistrict') || '',
  ).trim()

  // รวมตำบล + จังหวัด เป็น address
  const address = [subdistrict, province]
    .filter(Boolean)
    .join(' ')

  const donorId = donorName
    ? await findOrCreateDonor(supabase, {
        name: donorName,
        phone: donorPhone || undefined,
        address: address || undefined,
      })
    : null

  // ============================================================
  // ข้อมูลรายการบริจาค
  // ============================================================

  const itemNames = formData
    .getAll('item_name')
    .map((v) => String(v).trim())

  const categories = formData
    .getAll('category')
    .map((v) => String(v).trim())

  const units = formData
    .getAll('unit')
    .map((v) => String(v).trim())

  const quantityValues =
    formData.getAll('quantity_received').length > 0
      ? formData.getAll('quantity_received')
      : formData.getAll('quantity')

  const quantities = quantityValues.map((v) => Number(v))

  const expiryDates = formData
    .getAll('expiry_date')
    .map((v) => String(v).trim() || null)

  const receivedDateRaw = String(
    formData.get('received_date') || '',
  ).trim()

  const receivedDate = receivedDateRaw || null

  // ข้อกำหนดด้านอาหารใช้ค่าเดียวกันทั้งใบ เพราะของที่รับมาครั้งเดียวกัน
  // มักมาจากผู้บริจาครายเดียวและมาตรฐานเดียวกัน
  const dietaryType = normalizeDietary(
    String(formData.get('dietary_type') || ''),
  )

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
        dietary_type: dietaryType,
        received_by: user.id,
      }
    })
    .filter(
      (row) =>
        row.item_name &&
        row.quantity_received > 0,
    )

  // ของที่หมดอายุไปแล้วรับเข้าคลังไม่ได้ เพราะจ่ายต่อไม่ได้อยู่แล้ว
  const today = todayBangkok()
  const expired = rows.find(
    (r) => r.expiry_date && r.expiry_date < today,
  )
  if (expired) {
    redirect(
      '/donations/new?error=' +
        encodeURIComponent(
          'วันหมดอายุของ "' + expired.item_name + '" ผ่านมาแล้ว กรุณาตรวจสอบอีกครั้ง',
        ),
    )
  }
  if (receivedDate && receivedDate > today) {
    redirect(
      '/donations/new?error=' +
        encodeURIComponent('วันที่รับของเป็นวันในอนาคตไม่ได้'),
    )
  }

  if (rows.length === 0) {
    redirect(
      '/donations/new?error=' +
        encodeURIComponent(
          'กรุณากรอกข้อมูลสิ่งของอย่างน้อย 1 รายการ',
        ),
    )
  }

  // ============================================================
  // บันทึกรายการบริจาค
  // ============================================================

  let { error } = await supabase
    .from('donations')
    .insert(rows)

  // ถ้าตารางยังไม่ได้รัน migration
  // 29_missing_columns.sql
  // (ไม่มีคอลัมน์ received_date)
  // ให้ลอง insert โดยตัด received_date ออก
  if (
    error &&
    error.message &&
    error.message.includes('received_date')
  ) {
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

    const retry = await supabase
      .from('donations')
      .insert(fallbackRows)

    error = retry.error
  }

  if (error) {
    redirect(
      '/donations/new?error=' +
        encodeURIComponent(error.message),
    )
  }

  revalidatePath('/donations')
  revalidatePath('/inventory')

  redirect('/donations')
}

// ============================================================
// แก้ไขรายการบริจาค
// หมายเหตุ: ห้ามแก้ quantity_received / quantity_remaining
// เพราะมี trigger ป้องกันการแก้ยอดสต็อกโดยตรง
// ============================================================

export async function updateDonation(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const id = String(
    formData.get('id') || '',
  ).trim()

  if (!id) {
    redirect('/donations')
  }

  const itemName = String(
    formData.get('item_name') || '',
  ).trim()

  const category = String(
    formData.get('category') || '',
  ).trim()

  const unit =
    normalizeUnit(
      String(formData.get('unit') || ''),
    ) || 'ชิ้น'

  const expiryDate =
    String(
      formData.get('expiry_date') || '',
    ).trim() || null

  if (expiryDate && expiryDate < todayBangkok()) {
    redirect(
      `/donations/${id}/receipt/edit?error=` +
        encodeURIComponent('วันหมดอายุผ่านมาแล้ว กรุณาตรวจสอบอีกครั้ง'),
    )
  }

  // ขอ .select() กลับมาด้วย เพื่อรู้ว่ามีแถวถูกแก้จริงหรือไม่
  // ถ้าเป็นล็อตของศูนย์อื่น RLS จะกรองทิ้งเงียบ ๆ โดยไม่คืน error
  // เดิมโค้ดเช็คแค่ error จึงพาไปหน้าใบรับของเหมือนบันทึกสำเร็จ
  const { data: updated, error } = await supabase
    .from('donations')
    .update({
      item_name: itemName,
      category,
      unit,
      expiry_date: expiryDate,
    })
    .eq('id', id)
    .select('id')

  if (!error && (!updated || updated.length === 0)) {
    redirect(
      `/donations/${id}/receipt/edit?error=` +
        encodeURIComponent(
          'แก้ไขไม่สำเร็จ รายการนี้เป็นของศูนย์อื่น คุณแก้ไขได้เฉพาะของศูนย์ที่ตัวเองสังกัด',
        ),
    )
  }

  if (error) {
    redirect(
      `/donations/${id}/receipt/edit?error=` +
        encodeURIComponent(error.message),
    )
  }

  revalidatePath('/donations')
  revalidatePath('/inventory')
  revalidatePath(`/donations/${id}/receipt`)

  redirect(`/donations/${id}/receipt`)
}

// ============================================================
// ลบรายการบริจาค
// ============================================================

export async function deleteDonation(formData: FormData) {
  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  const id = String(
    formData.get('id') || '',
  ).trim()

  if (!id) return

  const { error } = await supabase
    .from('donations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(
      'Error deleting donation:',
      error.message,
    )

    return
  }

  revalidatePath('/donations')
  revalidatePath('/inventory')

  redirect('/donations')
}
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'
import { findOrCreateDonor } from '@/lib/supabase/find-or-create-donor'

type DonationInsert = {
  center_id: string
  received_by: string
  donor_id: string | null
  item_name: string
  category: string
  unit: string
  quantity_received: number
  quantity_remaining: number
  expiry_date: string | null
}

const VALID_CATEGORIES = [
  'food',
  'water',
  'medicine',
  'clothing',
  'hygiene',
  'other',
] as const

// =====================================================
// สร้างรายการบริจาค
// =====================================================
export async function createDonation(formData: FormData) {
  const supabase = await createClient()

  // =====================================================
  // ตรวจสอบสิทธิ์
  // =====================================================
  await requireStaffOrAdmin(supabase)

  // =====================================================
  // ตรวจสอบผู้ใช้ที่ล็อกอิน
  // =====================================================
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // =====================================================
  // ดึง center_id จาก profile
  // =====================================================
  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('center_id')
      .eq('id', user.id)
      .single()

  if (profileError || !profile?.center_id) {
    redirect('/donations/new?error=no_center_assigned')
  }

  // =====================================================
  // ข้อมูลผู้บริจาค
  // =====================================================
  const donorName = String(
    formData.get('donor_name') || '',
  ).trim()

  const donorPhone = String(
    formData.get('phone') ||
      formData.get('donor_phone') ||
      '',
  ).trim()

  const donorId = donorName
    ? await findOrCreateDonor(supabase, {
        name: donorName,
        phone: donorPhone,
      })
    : null

  // =====================================================
  // เตรียมรายการบริจาค
  // =====================================================
  const itemsToInsert: DonationInsert[] = []

  let index = 0

  /*
    NewDonationForm ส่งข้อมูลมาในรูปแบบ:

    item_name_0
    category_0
    unit_0
    quantity_0
    expiry_date_0

    item_name_1
    category_1
    unit_1
    quantity_1
    expiry_date_1

    ดังนั้นไม่ต้องใช้ donation_type_x
  */

  while (
    formData.has(`item_name_${index}`) ||
    formData.has(`category_${index}`)
  ) {
    // ===================================================
    // ชื่อรายการ
    // ===================================================
    const itemName = String(
      formData.get(`item_name_${index}`) || '',
    ).trim()

    // ===================================================
    // หมวดหมู่
    // ===================================================
    const category = String(
      formData.get(`category_${index}`) || '',
    ).trim()

    // ===================================================
    // หน่วย
    // ===================================================
    const unit = String(
      formData.get(`unit_${index}`) || '',
    ).trim()

    // ===================================================
    // จำนวน
    // ===================================================
    const quantity = Number(
      formData.get(`quantity_${index}`) || 0,
    )

    // ===================================================
    // วันหมดอายุ
    // ===================================================
    const expiryDate =
      String(
        formData.get(`expiry_date_${index}`) || '',
      ).trim() || null

    // ===================================================
    // ตรวจสอบ category
    // ===================================================
    const isValidCategory =
      VALID_CATEGORIES.includes(
        category as (typeof VALID_CATEGORIES)[number],
      )

    // ===================================================
    // ตรวจสอบข้อมูล
    // ===================================================
    if (
      itemName &&
      isValidCategory &&
      unit &&
      Number.isFinite(quantity) &&
      quantity > 0
    ) {
      itemsToInsert.push({
        center_id: profile.center_id,
        received_by: user.id,

        donor_id: donorId,

        item_name: itemName,
        category: category,

        unit: unit,

        quantity_received: quantity,
        quantity_remaining: quantity,

        expiry_date: expiryDate,
      })
    }

    index++
  }

  // =====================================================
  // ไม่มีข้อมูลที่ถูกต้อง
  // =====================================================
  if (itemsToInsert.length === 0) {
    redirect(
      '/donations/new?error=invalid_donation_data',
    )
  }

  // =====================================================
  // บันทึกลง donations
  // =====================================================
  const { error } = await supabase
    .from('donations')
    .insert(itemsToInsert)

  if (error) {
    console.error(
      'Error creating donation:',
      error.message,
    )

    redirect(
      '/donations/new?error=' +
        encodeURIComponent(
          'ไม่สามารถบันทึกรายการบริจาคได้ กรุณาตรวจสอบข้อมูลอีกครั้ง',
        ),
    )
  }

  // =====================================================
  // อัปเดตหน้า
  // =====================================================
  revalidatePath('/donations')
  revalidatePath('/inventory')

  redirect('/donations')
}

// =====================================================
// ลบรายการบริจาค
// =====================================================
export async function deleteDonation(formData: FormData) {
  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  const id = String(
    formData.get('id') || '',
  ).trim()

  if (!id) {
    console.error(
      'Error deleting donation: donation id is missing',
    )
    return
  }

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

// =====================================================
// แก้ไขรายการบริจาค
// =====================================================
export async function updateDonation(formData: FormData) {
  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  const id = String(
    formData.get('id') || '',
  ).trim()

  const itemName = String(
    formData.get('item_name') || '',
  ).trim()

  const category = String(
    formData.get('category') || '',
  ).trim()

  const unit = String(
    formData.get('unit') || '',
  ).trim()

  const quantityReceived = Number(
    formData.get('quantity_received'),
  )

  const quantityRemaining = Number(
    formData.get('quantity_remaining'),
  )

  const expiryDate =
    String(
      formData.get('expiry_date') || '',
    ).trim() || null

  const isValidCategory = VALID_CATEGORIES.includes(
    category as (typeof VALID_CATEGORIES)[number],
  )

  if (
    !id ||
    !itemName ||
    !isValidCategory ||
    !unit ||
    !Number.isInteger(quantityReceived) ||
    quantityReceived < 1 ||
    !Number.isInteger(quantityRemaining) ||
    quantityRemaining < 0 ||
    quantityRemaining > quantityReceived
  ) {
    redirect(
      `/donations/${encodeURIComponent(
        id,
      )}/receipt/edit?error=invalid_donation_data`,
    )
  }

  const { error } = await supabase
    .from('donations')
    .update({
      item_name: itemName,
      category,
      unit,
      quantity_received: quantityReceived,
      quantity_remaining: quantityRemaining,
      expiry_date: expiryDate,
    })
    .eq('id', id)

  if (error) {
    console.error(
      'Error updating donation:',
      error.message,
    )

    redirect(
      `/donations/${encodeURIComponent(
        id,
      )}/receipt/edit?error=update_failed`,
    )
  }

  revalidatePath('/donations')
  revalidatePath('/inventory')
  revalidatePath(`/donations/${id}/receipt`)

  redirect('/donations')
}
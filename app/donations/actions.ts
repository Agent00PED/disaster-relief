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
  received_date: string
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
// Helper: อ่านค่าจาก FormData
// รองรับทั้ง
// item_name_0 / item_name_1 / ...
// และ
// item_name / item_name / ...
// =====================================================

function getFormValues(
  formData: FormData,
  fieldName: string,
): string[] {
  const indexedValues: string[] = []

  let index = 0

  while (
    formData.has(`${fieldName}_${index}`)
  ) {
    const value = String(
      formData.get(`${fieldName}_${index}`) || '',
    ).trim()

    indexedValues.push(value)
    index++
  }

  if (indexedValues.length > 0) {
    return indexedValues
  }

  return formData
    .getAll(fieldName)
    .map((value) => String(value).trim())
}

// =====================================================
// Helper: อ่านค่า item ตาม index
// =====================================================

function getItemValue(
  formData: FormData,
  fieldName: string,
  index: number,
): string {
  const indexedField = `${fieldName}_${index}`

  if (formData.has(indexedField)) {
    return String(
      formData.get(indexedField) || '',
    ).trim()
  }

  const values = formData
    .getAll(fieldName)
    .map((value) => String(value).trim())

  return values[index] ?? ''
}

// =====================================================
// Helper: ตรวจสอบข้อมูล item
//
// สำคัญ:
// ถ้ามีรายการใดรายการหนึ่งไม่ครบ
// จะไม่อนุญาตให้บันทึกรายการใดเลย
// =====================================================

function validateDonationItem(
  item: {
    itemName: string
    category: string
    unit: string
    quantity: number
  },
): boolean {
  const isValidCategory =
    VALID_CATEGORIES.includes(
      item.category as (typeof VALID_CATEGORIES)[number],
    )

  if (
    !item.itemName ||
    !isValidCategory ||
    !item.unit ||
    !Number.isFinite(item.quantity) ||
    !Number.isInteger(item.quantity) ||
    item.quantity < 1
  ) {
    return false
  }

  return true
}

// =====================================================
// สร้างรายการบริจาค
// =====================================================

export async function createDonation(
  formData: FormData,
) {
  const supabase = await createClient()

  // ===================================================
  // ตรวจสอบสิทธิ์
  // ===================================================

  await requireStaffOrAdmin(supabase)

  // ===================================================
  // ตรวจสอบผู้ใช้ที่ล็อกอิน
  // ===================================================

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ===================================================
  // ดึง center_id จาก profile
  // ===================================================

  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('center_id')
      .eq('id', user.id)
      .single()

  if (
    profileError ||
    !profile?.center_id
  ) {
    redirect(
      '/donations/new?error=no_center_assigned',
    )
  }

  // ===================================================
  // วันที่รับบริจาค
  // ===================================================

  const receivedDate = String(
    formData.get('received_date') || '',
  ).trim()

  // ===================================================
  // ตรวจสอบวันที่รับบริจาค
  // ===================================================

  if (!receivedDate) {
    redirect(
      '/donations/new?error=received_date_required',
    )
  }

  // ===================================================
  // ข้อมูลผู้บริจาค
  // ===================================================

  const donorName = String(
    formData.get('donor_name') || '',
  ).trim()

  const donorPhone = String(
    formData.get('phone') ||
      formData.get('donor_phone') ||
      '',
  ).trim()

  let donorId: string | null = null

  if (donorName) {
    try {
      donorId = await findOrCreateDonor(
        supabase,
        {
          name: donorName,
          phone: donorPhone,
        },
      )
    } catch (error) {
      console.error(
        'Error creating/finding donor:',
        error,
      )

      redirect(
        '/donations/new?error=donor_creation_failed',
      )
    }
  }

  // ===================================================
  // เตรียมข้อมูลรายการบริจาค
  // ===================================================

  const itemsToInsert: DonationInsert[] = []

  // ===================================================
  // อ่านข้อมูลจาก FormData
  // ===================================================

  const itemNames = getFormValues(
    formData,
    'item_name',
  )

  const categories = getFormValues(
    formData,
    'category',
  )

  const units = getFormValues(
    formData,
    'unit',
  )

  const quantities = getFormValues(
    formData,
    'quantity',
  )

  const expiryDates = getFormValues(
    formData,
    'expiry_date',
  )

  // ===================================================
  // จำนวนรายการ
  //
  // ใช้จำนวนสูงสุดเพื่อให้สามารถตรวจพบ
  // รายการที่ข้อมูลหายไปได้
  // ===================================================

  const itemCount = Math.max(
    itemNames.length,
    categories.length,
    units.length,
    quantities.length,
    expiryDates.length,
  )

  // ===================================================
  // ต้องมีอย่างน้อย 1 รายการ
  // ===================================================

  if (itemCount === 0) {
    redirect(
      '/donations/new?error=invalid_donation_data',
    )
  }

  // ===================================================
  // อ่านและตรวจสอบ "ทุก" รายการก่อนบันทึก
  //
  // สำคัญมาก:
  // ห้ามใช้ continue เมื่อเจอรายการผิด
  // เพราะจะทำให้รายการอื่นถูกบันทึกบางส่วน
  // ===================================================

  for (
    let index = 0;
    index < itemCount;
    index++
  ) {
    // -------------------------------------------------
    // ชื่อรายการ
    // -------------------------------------------------

    const itemName = getItemValue(
      formData,
      'item_name',
      index,
    )

    // -------------------------------------------------
    // หมวดหมู่
    // -------------------------------------------------

    const category = getItemValue(
      formData,
      'category',
      index,
    )

    // -------------------------------------------------
    // หน่วย
    // -------------------------------------------------

    const unit = getItemValue(
      formData,
      'unit',
      index,
    )

    // -------------------------------------------------
    // จำนวน
    // -------------------------------------------------

    const quantityRaw = getItemValue(
      formData,
      'quantity',
      index,
    )

    const quantity = Number(
      quantityRaw,
    )

    // -------------------------------------------------
    // วันหมดอายุ
    // -------------------------------------------------

    const expiryDateRaw =
      getItemValue(
        formData,
        'expiry_date',
        index,
      )

    const expiryDate =
      expiryDateRaw !== ''
        ? expiryDateRaw
        : null

    // -------------------------------------------------
    // ตรวจสอบข้อมูลรายการ
    // -------------------------------------------------

    const isValidItem =
      validateDonationItem({
        itemName,
        category,
        unit,
        quantity,
      })

    // =================================================
    // ถ้ารายการใดรายการหนึ่งผิด
    // ให้หยุดทั้งหมดทันที
    // =================================================

    if (!isValidItem) {
      console.error(
        'Invalid donation item. No items will be saved:',
        {
          index,
          itemNumber: index + 1,
          itemName,
          category,
          unit,
          quantityRaw,
          quantity,
          expiryDate,
          receivedDate,
        },
      )

      redirect(
        `/donations/new?error=invalid_item&item=${index + 1}`,
      )
    }

    // -------------------------------------------------
    // เพิ่มรายการเข้า array
    // -------------------------------------------------

    itemsToInsert.push({
      center_id: profile.center_id,
      received_by: user.id,

      donor_id: donorId,

      item_name: itemName,
      category,
      unit,

      quantity_received: quantity,
      quantity_remaining: quantity,

      expiry_date: expiryDate,

      received_date: receivedDate,
    })
  }

  // ===================================================
  // ตรวจสอบอีกครั้งว่าจำนวนรายการครบ
  // ===================================================

  if (
    itemsToInsert.length !== itemCount
  ) {
    console.error(
      'Donation item count mismatch. No items will be saved.',
      {
        itemCount,
        itemsToInsertLength:
          itemsToInsert.length,
      },
    )

    redirect(
      '/donations/new?error=invalid_donation_data',
    )
  }

  // ===================================================
  // Debug ก่อนบันทึก
  // ===================================================

  console.log(
    'Donation items to insert:',
    itemsToInsert,
  )

  // ===================================================
  // บันทึกลง donations
  //
  // จะมาถึงตรงนี้ได้ก็ต่อเมื่อ
  // "ทุก" รายการผ่าน validation แล้ว
  // ===================================================

  const { error } = await supabase
    .from('donations')
    .insert(itemsToInsert)

  // ===================================================
  // ตรวจสอบ Error
  // ===================================================

  if (error) {
    console.error(
      'Error creating donation:',
      error,
    )

    redirect(
      '/donations/new?error=' +
        encodeURIComponent(
          `ไม่สามารถบันทึกรายการบริจาคได้: ${error.message}`,
        ),
    )
  }

  // ===================================================
  // อัปเดต Cache
  // ===================================================

  revalidatePath('/donations')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  // ===================================================
  // กลับไปหน้ารายการบริจาค
  // ===================================================

  redirect('/donations')
}

// =====================================================
// ลบรายการบริจาค
// =====================================================

export async function deleteDonation(
  formData: FormData,
) {
  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  // ===================================================
  // ID
  // ===================================================

  const id = String(
    formData.get('id') || '',
  ).trim()

  if (!id) {
    console.error(
      'Error deleting donation: donation id is missing',
    )

    return
  }

  // ===================================================
  // ลบข้อมูล
  // ===================================================

  const { error } = await supabase
    .from('donations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(
      'Error deleting donation:',
      error,
    )

    return
  }

  // ===================================================
  // อัปเดต Cache
  // ===================================================

  revalidatePath('/donations')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  // ===================================================
  // กลับหน้ารายการ
  // ===================================================

  redirect('/donations')
}

// =====================================================
// แก้ไขรายการบริจาค
// =====================================================

export async function updateDonation(
  formData: FormData,
) {
  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  // ===================================================
  // ID
  // ===================================================

  const id = String(
    formData.get('id') || '',
  ).trim()

  // ===================================================
  // ชื่อรายการ
  // ===================================================

  const itemName = String(
    formData.get('item_name') || '',
  ).trim()

  // ===================================================
  // หมวดหมู่
  // ===================================================

  const category = String(
    formData.get('category') || '',
  ).trim()

  // ===================================================
  // หน่วย
  // ===================================================

  const unit = String(
    formData.get('unit') || '',
  ).trim()

  // ===================================================
  // จำนวนที่รับเข้า
  // ===================================================

  const quantityReceived = Number(
    formData.get(
      'quantity_received',
    ),
  )

  // ===================================================
  // จำนวนคงเหลือ
  // ===================================================

  const quantityRemaining = Number(
    formData.get(
      'quantity_remaining',
    ),
  )

  // ===================================================
  // วันหมดอายุ
  // ===================================================

  const expiryDateRaw = String(
    formData.get('expiry_date') ||
      '',
  ).trim()

  const expiryDate =
    expiryDateRaw !== ''
      ? expiryDateRaw
      : null

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
    !id ||
    !itemName ||
    !isValidCategory ||
    !unit ||
    !Number.isInteger(
      quantityReceived,
    ) ||
    quantityReceived < 1 ||
    !Number.isInteger(
      quantityRemaining,
    ) ||
    quantityRemaining < 0 ||
    quantityRemaining >
      quantityReceived
  ) {
    redirect(
      `/donations/${encodeURIComponent(
        id,
      )}/receipt/edit?error=invalid_donation_data`,
    )
  }

  // ===================================================
  // อัปเดตข้อมูล
  // ===================================================

  const { error } = await supabase
    .from('donations')
    .update({
      item_name: itemName,
      category,
      unit,
      quantity_received:
        quantityReceived,
      quantity_remaining:
        quantityRemaining,
      expiry_date: expiryDate,
    })
    .eq('id', id)

  // ===================================================
  // ตรวจสอบ Error
  // ===================================================

  if (error) {
    console.error(
      'Error updating donation:',
      error,
    )

    redirect(
      `/donations/${encodeURIComponent(
        id,
      )}/receipt/edit?error=update_failed`,
    )
  }

  // ===================================================
  // อัปเดต Cache
  // ===================================================

  revalidatePath('/donations')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
  revalidatePath(
    `/donations/${id}/receipt`,
  )

  // ===================================================
  // กลับหน้ารายการ
  // ===================================================

  redirect('/donations')
}
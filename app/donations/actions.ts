'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/guard'

type DonationInput = {
  item_name: string
  category: string
  quantity: number
  unit: string
  expiry_date: string | null
  note: string | null
}

type CreateDonationInput = {
  donorName: string
  donorPhone: string
  receivedDate: string
  items: DonationInput[]
}

export async function createDonation(
  input: CreateDonationInput,
) {
  const supabase = await createClient()

  await requireStaffOrAdmin(supabase)

  if (!input.receivedDate) {
    return {
      error: 'กรุณาเลือกวันที่รับของ',
    }
  }

  if (!input.items || input.items.length === 0) {
    return {
      error: 'กรุณาเพิ่มรายการของบริจาค',
    }
  }

  for (const item of input.items) {
    if (!item.item_name) {
      return {
        error: 'กรุณากรอกชื่อของบริจาค',
      }
    }

    if (!item.category) {
      return {
        error: 'กรุณาเลือกหมวดหมู่',
      }
    }

    if (!item.quantity || item.quantity <= 0) {
      return {
        error: 'จำนวนของบริจาคต้องมากกว่า 0',
      }
    }

    if (!item.unit) {
      return {
        error: 'กรุณาเลือกหน่วย',
      }
    }
  }

  let donorId: string | null = null

  /*
   * ถ้ามีชื่อผู้บริจาค
   * ให้สร้างข้อมูลใน donors ก่อน
   */
  if (input.donorName.trim()) {
    const { data: donor, error: donorError } =
      await supabase
        .from('donors')
        .insert({
          name: input.donorName.trim(),
          phone: input.donorPhone.trim() || null,
        })
        .select('id')
        .single()

    if (donorError) {
      console.error(donorError)

      return {
        error:
          'ไม่สามารถบันทึกข้อมูลผู้บริจาคได้',
      }
    }

    donorId = donor.id
  }

  /*
   * เตรียมรายการของบริจาค
   */
  const donationRows = input.items.map((item) => ({
    donor_id: donorId,
    item_name: item.item_name.trim(),
    category: item.category,
    unit: item.unit,
    quantity_received: item.quantity,
    quantity_remaining: item.quantity,
    expiry_date: item.expiry_date,
    received_date: input.receivedDate,
    note: item.note,
  }))

  /*
   * บันทึกลง donations
   */
  const { error: donationError } =
    await supabase
      .from('donations')
      .insert(donationRows)

  if (donationError) {
    console.error(donationError)

    return {
      error:
        'ไม่สามารถบันทึกรายการของบริจาคได้',
    }
  }

  revalidatePath('/donations')

  return {
    success: true,
  }
}
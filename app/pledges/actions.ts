'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { findOrCreateDonor } from '@/lib/supabase/find-or-create-donor'
import { resolveCenterId } from '@/lib/center-choice'
import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'

// ยืนยันคำร้อง = สร้างผู้บริจาค + ล็อตของบริจาคจริง
// และผูก converted_donation_id ไว้ย้อนดูคำร้องต้นทางได้

export async function confirmPledge(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect(
      '/pledges?error=' +
        encodeURIComponent('ไม่พบรหัสคำร้อง'),
    )
  }

  // หน่วยต้องถูกเลือกโดยเจ้าหน้าที่ตอนยืนยันคำร้อง
  const unit = String(formData.get('unit') ?? '').trim()

  if (!unit) {
    redirect(
      '/pledges?error=' +
        encodeURIComponent('กรุณาเลือกหน่วยก่อนยืนยันคำร้อง'),
    )
  }

  const { data: pledge, error: pledgeError } = await supabase
    .from('donation_pledges')
    .select('*')
    .eq('id', id)
    .single()

  if (pledgeError || !pledge) {
    redirect(
      '/pledges?error=' +
        encodeURIComponent('ไม่พบคำร้องนี้'),
    )
  }

  const centerId = await resolveCenterId(
    supabase,
    user.id,
    formData,
  )

  if (!centerId) {
    const dict = getDictionary(await getLocale())

    redirect(
      '/pledges?error=' +
        encodeURIComponent(dict.common.noCenter),
    )
  }

  const donorId = await findOrCreateDonor(supabase, {
    name: pledge.donor_name,
    phone: pledge.donor_phone,
    email: pledge.donor_email,
  })

  // สร้างรายการบริจาคจริง
  // ใช้ unit ที่เจ้าหน้าที่เลือกจากหน้า /pledges
  const { data: donation, error: donationError } = await supabase
    .from('donations')
    .insert({
      center_id: centerId,
      donor_id: donorId,
      item_name: pledge.item_name,
      category: pledge.category,
      unit,
      quantity_received: pledge.quantity,
      quantity_remaining: pledge.quantity,
      received_by: user.id,
    })
    .select('id')
    .single()

  if (donationError) {
    redirect(
      '/pledges?error=' +
        encodeURIComponent(donationError.message),
    )
  }

  // เปลี่ยนสถานะคำร้องเป็น confirmed
  // และเก็บ id ของ donation ที่สร้างจริงไว้
  const { error: updateError } = await supabase
    .from('donation_pledges')
    .update({
      status: 'confirmed',
      converted_donation_id: donation.id,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    redirect(
      '/pledges?error=' +
        encodeURIComponent(updateError.message),
    )
  }

  revalidatePath('/pledges')
  revalidatePath('/donations')
  revalidatePath('/inventory')

  redirect('/pledges')
}

export async function dismissPledge(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '').trim()

  if (!id) {
    redirect(
      '/pledges?error=' +
        encodeURIComponent('ไม่พบรหัสคำร้อง'),
    )
  }

  const { error } = await supabase
    .from('donation_pledges')
    .update({
      status: 'dismissed',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    redirect(
      '/pledges?error=' +
        encodeURIComponent(error.message),
    )
  }

  revalidatePath('/pledges')

  redirect('/pledges')
}
'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

// ไม่ต้อง login
// ผู้ใช้ทั่วไปสามารถส่งคำร้องผ่าน RLS policy ของ donation_pledges ได้

export async function submitPledge(formData: FormData) {
  const supabase = await createClient()

  const donorName = String(formData.get('donor_name') ?? '').trim()
  const donorPhone = String(formData.get('donor_phone') ?? '').trim()
  const donorEmail = String(formData.get('donor_email') ?? '').trim()
  const itemName = String(formData.get('item_name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const quantityValue = Number(formData.get('quantity'))
  const note = String(formData.get('note') ?? '').trim()

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!donorName || !itemName || !category) {
    redirect('/pledge?error=' + encodeURIComponent('กรุณากรอกข้อมูลที่จำเป็นให้ครบ'))
  }

  if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
    redirect('/pledge?error=' + encodeURIComponent('จำนวนต้องมากกว่า 0'))
  }

  const { error } = await supabase.from('donation_pledges').insert({
    donor_name: donorName,
    donor_phone: donorPhone || null,
    donor_email: donorEmail || null,
    item_name: itemName,
    category,
    quantity: quantityValue,
    note: note || null,
  })

  if (error) {
    redirect('/pledge?error=' + encodeURIComponent(error.message))
  }

  redirect('/pledge?ok=1')
}
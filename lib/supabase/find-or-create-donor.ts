import type { SupabaseClient } from '@supabase/supabase-js'

// ใช้ร่วมกันโดย app/donations/actions.ts และ app/pledges/actions.ts
// เดิมทั้งสองที่ insert ผู้บริจาคใหม่ทุกครั้งที่กรอกชื่อมา ทำให้คนบริจาคซ้ำ
// กลายเป็นหลายแถวแยกกันใน donors ประวัติเลยกระจัดกระจาย ไม่ตรงกับที่ F6
// ตั้งใจไว้ว่า donors คือ "ทะเบียน" สะสมประวัติของคนคนเดียว
//
// เทียบชื่อแบบ case-insensitive เท่านั้น (ไม่เทียบเบอร์โทร/อีเมล เพราะฟอร์ม
// รับของบริจาคหน้าเว็บไม่ได้บังคับกรอกสองอย่างนี้) ถ้าไม่พบค่อยสร้างใหม่
export async function findOrCreateDonor(
  supabase: SupabaseClient,
  info: { name: string; phone?: string | null; email?: string | null },
): Promise<string | null> {
  const name = info.name.trim()
  if (!name) return null

  const { data: existing } = await supabase
    .from('donors')
    .select('id')
    .ilike('name', name)
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('donors')
    .insert({ name, phone: info.phone ?? null, email: info.email ?? null })
    .select('id')
    .single()

  return created?.id ?? null
}

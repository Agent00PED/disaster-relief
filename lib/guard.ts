import { redirect } from 'next/navigation'
import type { createClient } from '@/lib/supabase/server'

// เรียกต้นๆ ของหน้าที่เป็นของ staff/admin เท่านั้น — กันอาสาสมัครเข้ามาเห็น
// หน้าที่ RLS ยอมให้ "อ่าน" ได้ (เพราะ center_id ตรงกัน) แต่ไม่ใช่หน้าของเขา
// ปุ่มกด/ฟอร์มในหน้าพวกนี้ RLS insert/update/delete บล็อกไว้อีกชั้นอยู่แล้ว
// (docs/sql/13_volunteer_role.sql) อันนี้แค่กันไม่ให้เห็นหน้าเปล่าๆ
export async function requireStaffOrAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'volunteer') redirect('/volunteer')

  return user
}

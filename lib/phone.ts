// =====================================================================
// เบอร์โทรศัพท์ — กติกาเดียวกันทั้งระบบ
//
// ทุกฟอร์มที่รับเบอร์ต้องใช้ไฟล์นี้ เพื่อให้เก็บและแสดงผลรูปแบบเดียวกัน
// คือตัวเลข 10 หลัก แสดงเป็น 000-000-0000
//
// เดิมแต่ละหน้าเขียนกฎของตัวเอง บางหน้ารับ 9 หลัก บางหน้าไม่ตัดอักขระ
// ทำให้ข้อมูลในฐานข้อมูลมีทั้งแบบมีขีดและไม่มีขีดปนกัน
// =====================================================================

export const PHONE_LENGTH = 10

/** ตัดทุกอย่างที่ไม่ใช่ตัวเลขทิ้ง และตัดให้ยาวไม่เกิน 10 หลัก */
export function phoneDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '').slice(0, PHONE_LENGTH)
}

/** จัดรูปแบบเป็น 000-000-0000 ใส่ขีดตามจำนวนหลักที่พิมพ์มาแล้ว */
export function formatPhone(value: string | null | undefined): string {
  const d = phoneDigits(value)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
}

/** ผ่านเมื่อเป็นตัวเลขครบ 10 หลักเท่านั้น */
export function isValidPhone(value: string | null | undefined): boolean {
  return phoneDigits(value).length === PHONE_LENGTH
}

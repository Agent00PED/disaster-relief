// =====================================================================
// ข้อกำหนดด้านอาหาร — รายการกลางของทั้งเว็บ
//
// ทำไมต้องมี: ผู้ประสบภัยบางกลุ่มรับอาหารได้เฉพาะบางแบบ เช่น มุสลิม
// ต้องการอาหารฮาลาล ถ้าจ่ายของผิดแบบออกไป ของจะถึงมือแต่กินไม่ได้
// เท่ากับของสูญเปล่าและเป็นการไม่เคารพผู้รับ
//
// เก็บเป็นคุณสมบัติของ "ของ" และ "คำขอ" ไม่ใช่ศาสนาของผู้บริจาค
// ศาสนาของคนไม่ได้บอกว่าของชิ้นนั้นฮาลาลหรือไม่ และเป็นข้อมูลส่วนตัว
// ที่ระบบไม่มีความจำเป็นต้องเก็บ
//
// ค่าที่เก็บในฐานข้อมูลเป็นภาษาอังกฤษ ส่วนป้ายภาษาไทย/อังกฤษใช้แสดงผล
// ต้องตรงกับ check constraint ใน docs/sql/33_dietary_type.sql เสมอ
// =====================================================================

export const DIETARY_TYPES = ['general', 'halal', 'vegetarian'] as const

export type DietaryType = (typeof DIETARY_TYPES)[number]

export const DEFAULT_DIETARY: DietaryType = 'general'

const LABEL_TH: Record<DietaryType, string> = {
  general: 'ทั่วไป',
  halal: 'ฮาลาล',
  vegetarian: 'มังสวิรัติ / เจ',
}

const LABEL_EN: Record<DietaryType, string> = {
  general: 'General',
  halal: 'Halal',
  vegetarian: 'Vegetarian',
}

// คำอธิบายสั้น ๆ ใต้ตัวเลือก ให้คนกรอกเลือกได้ถูกโดยไม่ต้องเดา
const HINT_TH: Record<DietaryType, string> = {
  general: 'ไม่ได้ระบุข้อกำหนดพิเศษ',
  halal: 'มีเครื่องหมายรับรองฮาลาล',
  vegetarian: 'ไม่มีส่วนผสมจากเนื้อสัตว์',
}

const HINT_EN: Record<DietaryType, string> = {
  general: 'No special requirement',
  halal: 'Carries halal certification',
  vegetarian: 'Contains no meat products',
}

function isDietary(value: string): value is DietaryType {
  return (DIETARY_TYPES as readonly string[]).includes(value)
}

/** ค่าที่ไม่รู้จัก (ข้อมูลเก่า/ถูกส่งมาจากนอกฟอร์ม) ให้ตกเป็น general */
export function normalizeDietary(value: string | null | undefined): DietaryType {
  const v = (value ?? '').trim().toLowerCase()
  return isDietary(v) ? v : DEFAULT_DIETARY
}

export function dietaryLabel(value: string | null | undefined, locale: string) {
  const v = normalizeDietary(value)
  return locale === 'en' ? LABEL_EN[v] : LABEL_TH[v]
}

export function dietaryHint(value: DietaryType, locale: string) {
  return locale === 'en' ? HINT_EN[value] : HINT_TH[value]
}

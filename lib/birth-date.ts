// =====================================================================
// วันเกิด — ใช้ตรวจอายุผู้สมัคร
//
// ระบบเปิดให้สมัครเป็นอาสาสมัครได้เฉพาะผู้ที่อายุ 18 ปีบริบูรณ์ขึ้นไป
// เพราะการลงพื้นที่ช่วยงานศูนย์ต้องรับผิดชอบตัวเองได้ตามกฎหมาย
//
// คิดอายุตามวันที่ในเขตเวลาไทย ไม่ใช่เขตเวลาของเครื่องผู้ใช้
// เพื่อให้คนที่เกิดวันนี้เมื่อ 18 ปีก่อนสมัครได้พอดีทุกเครื่อง
// =====================================================================

export const MIN_AGE = 18
const MAX_AGE = 120

function todayInBangkok(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

/** เลื่อนวันที่รูปแบบ YYYY-MM-DD ถอยหลังไป n ปี */
function shiftYears(isoDate: string, years: number): string {
  const [y, m, d] = isoDate.split('-')
  return `${Number(y) - years}-${m}-${d}`
}

/**
 * ช่วงวันเกิดที่กรอกได้ ใช้ใส่ min/max ให้ช่องเลือกวันที่
 * max คือวันที่ที่ทำให้อายุครบ 18 พอดี เลือกวันหลังจากนี้ไม่ได้
 */
export function birthDateBounds(now = new Date()) {
  const today = todayInBangkok(now)
  return { min: shiftYears(today, MAX_AGE), max: shiftYears(today, MIN_AGE) }
}

/** อายุเต็มปี ณ วันนี้ */
export function ageOn(value: string, now = new Date()): number {
  const today = todayInBangkok(now)
  let age = Number(today.slice(0, 4)) - Number(value.slice(0, 4))
  if (today.slice(5) < value.slice(5)) age -= 1
  return age
}

/** ผ่านเมื่อเป็นวันที่จริง ไม่อยู่ในอนาคต และอายุถึงเกณฑ์ */
export function isValidBirthDate(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false
  const { min, max } = birthDateBounds(now)
  return value >= min && value <= max
}

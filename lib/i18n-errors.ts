import { english, translate, type Language } from './i18n'

// Match the parameterized messages returned by the database functions.
// Parameters stay data: they are never interpreted as HTML or translation keys.
const databaseMessages = [
  { pattern: /^คำขอนี้ปิดแล้ว \(สถานะ: (.+)\) ไม่สามารถจัดสรรเพิ่มได้$/, key: 'คำขอนี้ปิดแล้ว (สถานะ: {status}) ไม่สามารถจัดสรรเพิ่มได้', params: ['status'] },
  { pattern: /^หมวดหมู่ไม่ตรงกัน \(ของ: (.+) \/ คำขอ: (.+)\)$/, key: 'หมวดหมู่ไม่ตรงกัน (ของ: {supply} / คำขอ: {request})', params: ['supply', 'request'] },
  { pattern: /^ของล็อตนี้หมดอายุแล้วเมื่อ (.+) ไม่สามารถจ่ายออกได้$/, key: 'ของล็อตนี้หมดอายุแล้วเมื่อ {date} ไม่สามารถจ่ายออกได้', params: ['date'] },
  { pattern: /^จ่ายเกินยอดคงเหลือ \(ขอจ่าย (\S+) แต่คงเหลือ (\S+) (.+)\)$/, key: 'จ่ายเกินยอดคงเหลือ (ขอจ่าย {quantity} แต่คงเหลือ {remaining} {unit})', params: ['quantity', 'remaining', 'unit'] },
  { pattern: /^จ่ายเกินจำนวนที่ขอ \(ขอ (\S+) จ่ายไปแล้ว (\S+) คงต้องจ่ายอีกไม่เกิน (\S+)\)$/, key: 'จ่ายเกินจำนวนที่ขอ (ขอ {requested} จ่ายไปแล้ว {fulfilled} คงต้องจ่ายอีกไม่เกิน {remaining})', params: ['requested', 'fulfilled', 'remaining'] },
]

export function translateError(language: Language, message: string) {
  if (Object.hasOwn(english, message)) return translate(language, message)
  for (const { pattern, key, params } of databaseMessages) {
    const match = message.match(pattern)
    if (match) {
      return translate(language, key, Object.fromEntries(params.map((param, index) => [
        param, param === 'unit' ? translate(language, match[index + 1]) : match[index + 1],
      ])))
    }
  }

  // Database/network errors may be English regardless of the selected language.
  // Show a localized explanation instead of exposing raw implementation details.
  const key = /row-level security|permission denied|not authorized|JWT expired/i.test(message)
    ? 'คุณไม่มีสิทธิ์ดำเนินการนี้ กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์'
    : /duplicate key|unique constraint/i.test(message)
      ? 'ข้อมูลนี้มีอยู่แล้ว กรุณาตรวจสอบข้อมูลที่กรอก'
      : /foreign key/i.test(message)
        ? 'ข้อมูลที่อ้างอิงไม่มีอยู่หรือมีการเปลี่ยนแปลง กรุณาโหลดหน้าใหม่'
        : /check constraint|not-null|null value|invalid input/i.test(message)
          ? 'ข้อมูลไม่ถูกต้องหรือไม่ครบถ้วน กรุณาตรวจสอบแล้วลองอีกครั้ง'
          : 'ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้งหรือติดต่อเจ้าหน้าที่'
  return translate(language, key)
}

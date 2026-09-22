// =====================================================================
// ช่องเลือกหน่วย — ใช้ร่วมกันทุกฟอร์มที่ต้องระบุหน่วยของสิ่งของ
// (รับของเข้าคลัง / สร้างคำขอ / ยืนยันคำร้องบริจาค)
//
// เป็น Server Component ธรรมดา ไม่มี state — แค่ <select> ที่ดึงตัวเลือก
// จากรายการกลาง lib/units.ts เพื่อให้ทุกฟอร์มบันทึกหน่วยด้วยคำเดียวกัน
// =====================================================================

import { UNITS, unitLabel } from '@/lib/units'

export function UnitSelect({
  id,
  name = 'unit',
  defaultValue = 'ชิ้น',
  locale,
  required,
  allowEmpty,
  emptyLabel,
  className,
  'aria-label': ariaLabel,
}: {
  id?: string
  name?: string
  defaultValue?: string
  locale: string
  required?: boolean
  /** คำขอไม่บังคับหน่วย — ถ้าเว้นว่าง ระบบจะจัดสรรจากล็อตหน่วยไหนก็ได้ */
  allowEmpty?: boolean
  emptyLabel?: string
  className?: string
  'aria-label'?: string
}) {
  // ค่าเดิมที่ไม่อยู่ในรายการ (ข้อมูลเก่าที่พิมพ์มือไว้) ต้องยังเลือกอยู่ได้
  // ไม่งั้นเปิดฟอร์มแก้ไขแล้วหน่วยจะเปลี่ยนเองโดยผู้ใช้ไม่รู้ตัว
  const current = defaultValue.trim()
  const extra = current && !(UNITS as readonly string[]).includes(current) ? current : null

  return (
    <select
      id={id}
      name={name}
      defaultValue={current}
      required={required}
      aria-label={ariaLabel}
      className={className}
    >
      {allowEmpty && <option value="">{emptyLabel ?? '—'}</option>}
      {extra && <option value={extra}>{extra}</option>}
      {UNITS.map((u) => (
        <option key={u} value={u}>
          {unitLabel(u, locale)}
        </option>
      ))}
    </select>
  )
}

// =====================================================================
// ช่องเลือกข้อกำหนดด้านอาหาร — ใช้ร่วมกันทั้งฝั่งรับของและฝั่งคำขอ
//
// Server Component ธรรมดา ดึงตัวเลือกจาก lib/dietary.ts
// เพื่อให้ทุกฟอร์มบันทึกด้วยค่าชุดเดียวกัน ไม่งั้นตอนจัดสรรจะจับคู่ไม่ติด
// =====================================================================

import { DIETARY_TYPES, dietaryHint, dietaryLabel, DEFAULT_DIETARY } from '@/lib/dietary'

export function DietarySelect({
  id,
  name = 'dietary_type',
  defaultValue = DEFAULT_DIETARY,
  locale,
  className,
  'aria-label': ariaLabel,
}: {
  id?: string
  name?: string
  defaultValue?: string
  locale: string
  className?: string
  'aria-label'?: string
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      aria-label={ariaLabel}
      className={className}
    >
      {DIETARY_TYPES.map((d) => (
        <option key={d} value={d}>
          {dietaryLabel(d, locale)} — {dietaryHint(d, locale)}
        </option>
      ))}
    </select>
  )
}

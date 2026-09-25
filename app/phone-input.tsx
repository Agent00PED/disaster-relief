// =====================================================================
// ช่องกรอกเบอร์โทรศัพท์ที่ใช้ร่วมกันทุกฟอร์ม
//
// พิมพ์ได้เฉพาะตัวเลข ใส่ขีดให้เองเป็น 000-000-0000 และหยุดที่ 10 หลัก
// จัดการตำแหน่งเคอร์เซอร์ตอนลบขีดให้ด้วย ไม่งั้นลบแล้วเคอร์เซอร์จะเด้ง
//
// เดิมโค้ดชุดนี้อยู่ในหน้าสมัครสมาชิกหน้าเดียว ฟอร์มอื่นเป็น input ธรรมดา
// จึงพิมพ์ตัวอักษรลงไปได้และไม่มีรูปแบบ ย้ายมาไว้ตรงนี้ให้ใช้ร่วมกัน
// =====================================================================

'use client'

import { useState } from 'react'
import { formatPhone, phoneDigits, PHONE_LENGTH } from '@/lib/phone'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  name: string
  defaultValue?: string
}

export function PhoneInput({ name, defaultValue, ...rest }: Props) {
  const [value, setValue] = useState(() => formatPhone(defaultValue))

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey || e.metaKey) return

    const navKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']

    if (navKeys.includes(e.key)) {
      const input = e.currentTarget
      const { selectionStart, selectionEnd } = input
      const collapsed = selectionStart !== null && selectionStart === selectionEnd

      // ลบถอยหลังทับขีด ให้ข้ามไปลบตัวเลขก่อนหน้าแทน
      if (e.key === 'Backspace' && collapsed && (selectionStart === 4 || selectionStart === 8)) {
        e.preventDefault()
        const next = input.value.slice(0, selectionStart - 2) + input.value.slice(selectionStart - 1)
        setValue(formatPhone(next))
        const pos = selectionStart - 2
        requestAnimationFrame(() => input.setSelectionRange(pos, pos))
      }
      // ลบไปข้างหน้าทับขีด ให้ข้ามไปลบตัวเลขถัดไปแทน
      if (e.key === 'Delete' && collapsed && (selectionStart === 3 || selectionStart === 7)) {
        e.preventDefault()
        const next = input.value.slice(0, selectionStart) + input.value.slice(selectionStart + 2)
        setValue(formatPhone(next))
        requestAnimationFrame(() => input.setSelectionRange(selectionStart, selectionStart))
      }
      return
    }

    if (!/^[0-9]$/.test(e.key)) { e.preventDefault(); return }

    const input = e.currentTarget
    const replacing = input.selectionStart !== input.selectionEnd
    if (!replacing && phoneDigits(input.value).length >= PHONE_LENGTH) e.preventDefault()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const caret = input.selectionStart ?? input.value.length
    const digitsBeforeCaret = phoneDigits(input.value.slice(0, caret)).length
    const formatted = formatPhone(input.value)
    setValue(formatted)

    // วางเคอร์เซอร์กลับหลังตัวเลขตัวเดิม ไม่ให้เด้งไปท้ายช่อง
    requestAnimationFrame(() => {
      if (digitsBeforeCaret === 0) return input.setSelectionRange(0, 0)
      let seen = 0
      let pos = formatted.length
      for (let i = 0; i < formatted.length; i++) {
        if (!/\d/.test(formatted[i])) continue
        seen++
        if (seen === digitsBeforeCaret) {
          pos = formatted[i + 1] === '-' ? i + 2 : i + 1
          break
        }
      }
      input.setSelectionRange(pos, pos)
    })
  }

  return (
    <input
      {...rest}
      name={name}
      type="tel"
      inputMode="numeric"
      autoComplete={rest.autoComplete ?? 'tel'}
      maxLength={12}
      pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
      title="000-000-0000"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
}

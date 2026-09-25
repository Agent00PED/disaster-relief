// =====================================================================
// หน้าสมัครสมาชิก — เปิดให้สมัครเองได้เฉพาะ "อาสาสมัคร" เท่านั้น
//
// staff/admin ยังคงสร้างบัญชีโดย admin เท่านั้นเหมือนเดิม (ผ่าน Supabase
// Dashboard + หน้า /admin/centers) — หน้านี้ส่ง role: 'volunteer' ไปใน
// signUp metadata เสมอ ฝั่ง DB (docs/sql/13_volunteer_role.sql) มี
// allowlist บังคับไว้อีกชั้นว่ารับได้แค่ค่านี้ค่าเดียวจาก client
// =====================================================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { birthDateBounds } from '@/lib/birth-date'
import styles from '../login/login.module.css'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { AtSign, Building2, CalendarDays, Camera, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'

type Center = { id: string; name: string; type: string }

function FieldIcon({ icon: Icon }: { icon: typeof UserRound }) {
  return <Icon className={styles.fieldIcon} aria-hidden="true" />
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function RegisterForm({ dict, onLogin }: { dict: Dictionary; onLogin: () => void }) {
  const supabase = createClient()

  const [centers, setCenters] = useState<Center[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const birthDateRange = birthDateBounds()
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [centerId, setCenterId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [photoUploadFailed, setPhotoUploadFailed] = useState(false)
  const [done, setDone] = useState(false)

  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey || e.metaKey) return

    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ]

    if (allowedKeys.includes(e.key)) {
      if (e.key === 'Backspace') {
        const input = e.currentTarget
        const { selectionStart, selectionEnd } = input
        if (selectionStart !== null && selectionStart === selectionEnd && (selectionStart === 4 || selectionStart === 8)) {
          e.preventDefault()
          const currentVal = input.value
          const nextDigits = (currentVal.slice(0, selectionStart - 2) + currentVal.slice(selectionStart - 1)).replace(/\D/g, '')
          const formatted = formatPhoneInput(nextDigits)
          setPhone(formatted)
          const targetPos = selectionStart - 2
          requestAnimationFrame(() => {
            input.setSelectionRange(targetPos, targetPos)
          })
        }
      } else if (e.key === 'Delete') {
        const input = e.currentTarget
        const { selectionStart, selectionEnd } = input
        if (selectionStart !== null && selectionStart === selectionEnd && (selectionStart === 3 || selectionStart === 7)) {
          e.preventDefault()
          const currentVal = input.value
          const nextDigits = (currentVal.slice(0, selectionStart) + currentVal.slice(selectionStart + 2)).replace(/\D/g, '')
          const formatted = formatPhoneInput(nextDigits)
          setPhone(formatted)
          requestAnimationFrame(() => {
            input.setSelectionRange(selectionStart, selectionStart)
          })
        }
      }
      return
    }

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      return
    }

    const input = e.currentTarget
    const { selectionStart, selectionEnd } = input
    const isReplacing = selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd
    const digitsOnly = input.value.replace(/\D/g, '')
    if (!isReplacing && digitsOnly.length >= 10) {
      e.preventDefault()
    }
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const rawVal = input.value
    const selStart = input.selectionStart ?? rawVal.length
    const digitsBefore = rawVal.slice(0, selStart).replace(/\D/g, '').length

    const formatted = formatPhoneInput(rawVal)
    setPhone(formatted)

    requestAnimationFrame(() => {
      let count = 0
      let newPos = formatted.length
      if (digitsBefore === 0) {
        newPos = 0
      } else {
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            count++
            if (count === digitsBefore) {
              newPos = i + 1
              if (formatted[newPos] === '-') {
                newPos++
              }
              break
            }
          }
        }
      }
      input.setSelectionRange(newPos, newPos)
    })
  }

  useEffect(() => {
    supabase
      .from('centers')
      .select('id, name, type')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setCenters(data ?? []))
  }, [supabase])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length !== 10) {
      setError(dict.register.errInvalid)
      return
    }
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        body: new FormData(e.currentTarget),
      })
      const result = await response.json()
      if (!response.ok) {
        const messages = {
          invalid: dict.register.errInvalid,
          photo: dict.register.errPhoto,
          alreadyRegistered: dict.register.errAlreadyRegistered,
          usernameTaken: dict.register.errUsernameTaken,
        }
        setError(messages[result.error as keyof typeof messages] ?? dict.register.errGeneric)
        return
      }
      setPhotoUploadFailed(Boolean(result.photoUploadFailed))
      setDone(true)
    } catch {
      setError(dict.register.errGeneric)
    } finally {
      setLoading(false)
    }

  }

  if (done) return (
    <div className={styles.success} role="status">
      <h2>{dict.register.successTitle}</h2>
      <p>{dict.register.successDesc}</p>
      {photoUploadFailed && <p role="alert">{dict.register.photoUploadFailed}</p>}
      <button type="button" onClick={onLogin} className={styles.submit}>{dict.register.goToLogin}</button>
    </div>
  )

  return <>
    <form onSubmit={handleSubmit} className={styles.form}>
      <div><label htmlFor="register-first-name"><FieldIcon icon={UserRound} />{dict.register.firstName}</label>
        <input id="register-first-name" name="first_name" autoComplete="given-name" placeholder={dict.register.firstNamePlaceholder} required maxLength={100} value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
      <div><label htmlFor="register-last-name"><FieldIcon icon={UserRound} />{dict.register.lastName}</label>
        <input id="register-last-name" name="last_name" autoComplete="family-name" placeholder={dict.register.lastNamePlaceholder} required maxLength={100} value={lastName} onChange={e => setLastName(e.target.value)} /></div>
      <div><label htmlFor="register-phone"><FieldIcon icon={Phone} />{dict.register.phone}</label>
        <input
          id="register-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="numeric"
          placeholder={dict.register.phonePlaceholder}
          required
          maxLength={12}
          pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
          title="000-000-0000"
          value={phone}
          onChange={handlePhoneChange}
          onKeyDown={handlePhoneKeyDown}
        />
        <p className={styles.hint}>{dict.register.phoneHint}</p></div>
      <div><label htmlFor="register-birth-date"><FieldIcon icon={CalendarDays} />{dict.register.birthDate}</label>
        <input id="register-birth-date" name="birth_date" type="date" autoComplete="bday" required min={birthDateRange.min} max={birthDateRange.max} /></div>
      <div><label htmlFor="register-photo"><FieldIcon icon={Camera} />{dict.register.identityPhoto}</label>
        <input id="register-photo" name="identity_photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="register-photo-hint" />
        <p id="register-photo-hint" className={styles.fieldHint}>{dict.register.photoHint}</p></div>
      <div><label htmlFor="register-username"><FieldIcon icon={AtSign} />{dict.register.username}</label>
        <input id="register-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder={dict.register.usernamePlaceholder} required value={username} onChange={e => setUsername(e.target.value)} /></div>
      <div><label htmlFor="register-email"><FieldIcon icon={Mail} />{dict.form.email}</label>
        <input id="register-email" name="email" type="email" autoComplete="email" placeholder={dict.register.emailPlaceholder} required value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div><label htmlFor="register-password"><FieldIcon icon={LockKeyhole} />{dict.register.password}</label>
        <input id="register-password" name="password" type="password" autoComplete="new-password" placeholder={dict.register.passwordPlaceholder} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
      <div><label htmlFor="register-center"><FieldIcon icon={Building2} />{dict.register.centerWanted}</label>
        <select id="register-center" name="center_id" required value={centerId} onChange={e => setCenterId(e.target.value)}>
          <option value="">{dict.form.selectCenterPlaceholder}</option>
          {centers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type === 'warehouse' ? dict.register.centerTypeWarehouse : dict.register.centerTypeShelter})</option>)}
        </select></div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button type="submit" disabled={loading} className={styles.submit}>{loading ? dict.register.submitting : dict.register.submit}</button>
    </form>
    <p className={styles.register}>{dict.register.haveAccount}{' '}<button type="button" onClick={onLogin}>{dict.register.loginLink}</button></p>
  </>
}

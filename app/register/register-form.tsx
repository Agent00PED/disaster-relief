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

type Center = { id: string; name: string; type: string }

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
  const [done, setDone] = useState(false)

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
      <button type="button" onClick={onLogin} className={styles.submit}>{dict.register.goToLogin}</button>
    </div>
  )

  return <>
    <form onSubmit={handleSubmit} className={styles.form}>
      <div><label htmlFor="register-first-name">{dict.register.firstName}</label>
        <input id="register-first-name" name="first_name" autoComplete="given-name" required maxLength={100} value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
      <div><label htmlFor="register-last-name">{dict.register.lastName}</label>
        <input id="register-last-name" name="last_name" autoComplete="family-name" required maxLength={100} value={lastName} onChange={e => setLastName(e.target.value)} /></div>
      <div><label htmlFor="register-phone">{dict.register.phone}</label>
        <input id="register-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={25} value={phone} onChange={e => setPhone(e.target.value)} />
        <p className={styles.hint}>{dict.register.phoneHint}</p></div>
      <div><label htmlFor="register-birth-date">{dict.register.birthDate}</label>
        <input id="register-birth-date" name="birth_date" type="date" autoComplete="bday" required min={birthDateRange.min} max={birthDateRange.max} /></div>
      <div><label htmlFor="register-photo">{dict.register.identityPhoto}</label>
        <input id="register-photo" name="identity_photo" type="file" accept="image/jpeg,image/png,image/webp" required aria-describedby="register-photo-hint" />
        <p id="register-photo-hint" className={styles.fieldHint}>{dict.register.photoHint}</p></div>
      <div><label htmlFor="register-username">{dict.register.username}</label>
        <input id="register-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={username} onChange={e => setUsername(e.target.value)} /></div>
      <div><label htmlFor="register-email">{dict.form.email}</label>
        <input id="register-email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div><label htmlFor="register-password">{dict.register.password}</label>
        <input id="register-password" name="password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
      <div><label htmlFor="register-center">{dict.register.centerWanted}</label>
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

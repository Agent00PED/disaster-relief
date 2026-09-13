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
import { BrandMark } from '../brand-mark'
import { BackHomeLink } from '../back-home-link'
import type { Dictionary } from '@/lib/i18n/dictionaries'

type Center = { id: string; name: string; type: string }

export function RegisterForm({ dict }: { dict: Dictionary }) {
  const supabase = createClient()

  const [centers, setCenters] = useState<Center[]>([])
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
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
      .order('name')
      .then(({ data }) => setCenters(data ?? []))
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username.trim(),
          role: 'volunteer',
          center_id: centerId || null,
        },
      },
    })

    if (error) {
      setError(
        error.message.includes('already registered')
          ? dict.register.errAlreadyRegistered
          : error.message.includes('duplicate') || error.message.includes('unique')
            ? dict.register.errUsernameTaken
            : dict.register.errGeneric,
      )
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <main className="brand-hero-bg flex min-h-screen items-center justify-center px-4 py-12">
        <div className="relative z-10 w-full max-w-sm">
          <BackHomeLink label={dict.common.backHome} />
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex justify-center">
              <BrandMark />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{dict.register.successTitle}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{dict.register.successDesc}</p>
            <a
              href="/login"
              className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
            >
              {dict.register.goToLogin}
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="brand-hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-sm">
        <BackHomeLink label={dict.common.backHome} />
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{dict.register.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{dict.register.subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.register.fullName}</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.register.username}</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.form.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.register.password}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.register.centerWanted}</label>
            <select
              required
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">{dict.form.selectCenterPlaceholder}</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'warehouse' ? dict.register.centerTypeWarehouse : dict.register.centerTypeShelter})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? dict.register.submitting : dict.register.submit}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          {dict.register.haveAccount}{' '}
          <a href="/login" className="font-medium text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            {dict.register.loginLink}
          </a>
        </p>
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandMark } from '../brand-mark'
import { BackHomeLink } from '../back-home-link'
import type { Dictionary } from '@/lib/i18n/dictionaries'

export function LoginForm({ dict }: { dict: Dictionary }) {
  const router = useRouter()
  const supabase = createClient()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault() // กันไม่ให้เบราว์เซอร์ reload หน้าเองตามพฤติกรรมเดิมของ form
    setLoading(true)
    setError(null)

    // Supabase Auth ผูกกับอีเมลเสมอ แต่แต่ละคนสมัครด้วยอีเมลจริงของตัวเอง
    // (คนละโดเมนกัน) เลยต้องแปลง username → อีเมลจริงก่อน ผ่าน RPC
    // (docs/sql/11_username_login.sql) แล้วค่อยเอาอีเมลนั้นไป signIn ตามปกติ
    const { data: email, error: lookupError } = await supabase.rpc(
      'get_email_by_username',
      { p_username: username.trim() },
    )

    if (lookupError || !email) {
      // ข้อความเดียวกับตอนรหัสผ่านผิด เพื่อไม่บอกคนนอกว่า username นี้มีอยู่จริงไหม
      setError(dict.login.invalidCreds)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(dict.login.invalidCreds)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh() // สั่งให้ Server Component ดึงข้อมูลใหม่ ไม่งั้นจะยังเห็นสถานะเดิม
  }

  return (
    <main className="brand-hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-sm">
        <BackHomeLink label={dict.common.backHome} />
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{dict.login.welcomeBack}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{dict.login.subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {dict.login.username}
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {dict.login.password}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* role="alert" ทำให้โปรแกรมอ่านหน้าจออ่านข้อความนี้ทันทีที่มันโผล่ */}
          {error && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? dict.login.submitting : dict.login.submit}
          </button>
        </form>

        <div className="mt-4 space-y-1 text-center text-sm text-slate-500">
          <p>
            {dict.login.noAccount}{' '}
            <a href="/register" className="font-medium text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              {dict.login.registerLink}
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

// =====================================================================
// หน้าเข้าสู่ระบบ
//
// เป็น Client Component เพราะต้องจับ state ของช่องกรอกและปุ่ม
// ('use client' = ให้ React ทำงานฝั่ง browser ได้)
//
// หมายเหตุ: หน้านี้เป็นของกลาง คนที่ทำ feat/auth จะมาต่อยอดเรื่อง
//           สมัครสมาชิก / ลืมรหัสผ่าน / จัดการสิทธิ์ ทีหลัง
// =====================================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandMark } from '../brand-mark'
import { BackHomeLink } from '../back-home-link'

export default function LoginPage() {
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
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh() // สั่งให้ Server Component ดึงข้อมูลใหม่ ไม่งั้นจะยังเห็นสถานะเดิม
  }

  return (
    <main className="brand-hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-sm">
        <BackHomeLink />
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">ยินดีต้อนรับกลับ</h1>
          <p className="mt-1 text-sm text-slate-500">
            สำหรับเจ้าหน้าที่ศูนย์รับบริจาคและศูนย์พักพิง
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              ชื่อผู้ใช้
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* role="alert" ทำให้โปรแกรมอ่านหน้าจออ่านข้อความนี้ทันทีที่มันโผล่ */}
          {error && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-4 space-y-1 text-center text-sm text-slate-500">
          <p>
            เป็นอาสาสมัครแต่ยังไม่มีบัญชี?{' '}
            <a href="/register" className="font-medium text-slate-700 underline hover:text-slate-900">
              สมัครสมาชิก
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

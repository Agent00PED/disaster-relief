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

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault() // กันไม่ให้เบราว์เซอร์ reload หน้าเองตามพฤติกรรมเดิมของ form
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      // ไม่บอกว่า "อีเมลผิด" หรือ "รหัสผ่านผิด" แยกกัน
      // เพราะจะกลายเป็นการบอกคนนอกว่าอีเมลนี้มีอยู่ในระบบจริง
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh() // สั่งให้ Server Component ดึงข้อมูลใหม่ ไม่งั้นจะยังเห็นสถานะเดิม
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-900">
            ระบบติดตามการบริจาคและกระจายสิ่งของ
          </h1>
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
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
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
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          อยากบริจาค?{' '}
          <a href="/pledge" className="font-medium text-slate-700 underline hover:text-slate-900">
            แจ้งความประสงค์โดยไม่ต้องเข้าสู่ระบบ
          </a>
        </p>
      </div>
    </main>
  )
}

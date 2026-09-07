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

type Center = { id: string; name: string; type: string }

export default function RegisterPage() {
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
          ? 'อีเมลนี้เคยสมัครไว้แล้ว'
          : error.message.includes('duplicate') || error.message.includes('unique')
            ? 'ชื่อผู้ใช้นี้ถูกใช้แล้ว ลองชื่ออื่น'
            : 'สมัครไม่สำเร็จ ลองอีกครั้ง',
      )
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">สมัครสำเร็จ</h1>
          <p className="mt-2 text-sm text-slate-500">
            ตรวจอีเมลเพื่อยืนยันบัญชี แล้วเข้าสู่ระบบด้วยชื่อผู้ใช้ที่ตั้งไว้ได้เลย
          </p>
          <a
            href="/login"
            className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            ไปหน้าเข้าสู่ระบบ
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-900">สมัครเป็นอาสาสมัคร</h1>
          <p className="mt-1 text-sm text-slate-500">
            ช่วยงานที่ศูนย์รับบริจาคหรือศูนย์พักพิงที่คุณเลือก
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อ-นามสกุล</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อผู้ใช้ (สำหรับเข้าสู่ระบบ)</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">รหัสผ่าน</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">ศูนย์ที่อยากช่วย</label>
            <select
              required
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            >
              <option value="">— เลือกศูนย์ —</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'warehouse' ? 'ศูนย์รับบริจาค' : 'ศูนย์พักพิง'})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          มีบัญชีแล้ว?{' '}
          <a href="/login" className="font-medium text-slate-700 underline hover:text-slate-900">
            เข้าสู่ระบบ
          </a>
        </p>
      </div>
    </main>
  )
}

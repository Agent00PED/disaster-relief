// =====================================================================
// การ์ด "รูปถ่ายยืนยันตัวตน" ในหน้าอาสาสมัคร
//
// ทำไมอัปโหลดที่นี่ ไม่ใช่ที่หน้าสมัคร:
// โปรเจกต์นี้เปิดให้ต้องยืนยันอีเมลก่อน (docs/sql/16_manually_confirm_user.sql)
// ตอนกด "สมัคร" เสร็จจึงยัง "ไม่มี session" — อัปโหลดไฟล์ขึ้น Storage
// ในจังหวะนั้นไม่ได้ นอกจากจะเปิดให้ anon เขียน bucket ได้ ซึ่งเท่ากับ
// เปิดช่องให้ใครก็ได้อัปไฟล์เข้าระบบ เราจึงให้กรอกข้อมูลตัวอักษรตอนสมัคร
// แล้วอัปรูปหลังเข้าสู่ระบบครั้งแรก ซึ่งตอนนั้นมี session จริงและ policy
// ผูก path กับ auth.uid() ได้ (docs/sql/28_volunteer_profile.sql)
// =====================================================================

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Dictionary } from '@/lib/i18n/dictionaries'

const BUCKET = 'volunteer-ids'
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export function IdPhotoCard({
  dict,
  userId,
  initialPath,
  panelClass,
  headingClass,
  mutedClass,
  buttonClass,
}: {
  dict: Dictionary
  userId: string
  initialPath: string | null
  panelClass: string
  headingClass: string
  mutedClass: string
  buttonClass: string
}) {
  const t = dict.volunteerDashboard
  const [path, setPath] = useState(initialPath)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function upload(file: File) {
    setError(null)

    // เช็คฝั่งเบราว์เซอร์ก่อนเพื่อบอกผู้ใช้ทันที — ของจริงบังคับที่ bucket
    // (file_size_limit / allowed_mime_types) อยู่แล้ว ตรงนี้แค่ทำให้ error
    // อ่านรู้เรื่องกว่าข้อความจาก API
    if (!ACCEPTED.includes(file.type)) {
      setError(t.idPhotoWrongType)
      return
    }
    if (file.size > MAX_BYTES) {
      setError(t.idPhotoTooBig)
      return
    }

    setBusy(true)
    const supabase = createClient()
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    // path ต้องขึ้นต้นด้วย user id — policy ใน storage ตรวจโฟลเดอร์แรก
    // เทียบกับ auth.uid() จึงเขียนทับของคนอื่นไม่ได้
    const objectPath = `${userId}/id.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError(t.idPhotoFailed)
      setBusy(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ id_photo_path: objectPath })
      .eq('id', userId)

    if (profileError) {
      setError(t.idPhotoFailed)
      setBusy(false)
      return
    }

    setPath(objectPath)
    setPreviewUrl(null)
    setBusy(false)
  }

  async function showPhoto() {
    if (!path) return
    setError(null)
    setBusy(true)
    const supabase = createClient()
    // bucket เป็น private จึงเปิดด้วย URL ตรง ๆ ไม่ได้ ต้องขอลิงก์ชั่วคราว
    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60)
    if (signError || !data) {
      setError(t.idPhotoFailed)
    } else {
      setPreviewUrl(data.signedUrl)
    }
    setBusy(false)
  }

  return (
    <section className={panelClass}>
      <h2 className={headingClass}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="11" r="2" />
          <path d="M5 17c.7-2 2.2-3 4-3s3.3 1 4 3M15 10h4M15 14h4" />
        </svg>
        {t.idPhotoTitle}
      </h2>

      <div className="space-y-4 p-5">
        {path ? (
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t.idPhotoDone}</p>
        ) : (
          <p className={mutedClass}>{t.idPhotoMissing}</p>
        )}
        <p className={mutedClass}>{t.idPhotoHint}</p>

        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <label className={`${buttonClass} cursor-pointer`}>
            {busy ? dict.common.saving : path ? t.idPhotoReplace : t.idPhotoUpload}
            <input
              type="file"
              accept={ACCEPTED.join(',')}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0]
                // ล้างค่าไว้ เพื่อให้เลือกไฟล์ชื่อเดิมซ้ำแล้ว onChange ยังทำงาน
                e.target.value = ''
                if (file) void upload(file)
              }}
            />
          </label>
          {path && (
            <button type="button" className={buttonClass} onClick={() => void showPhoto()} disabled={busy}>
              {t.idPhotoView}
            </button>
          )}
        </div>

        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="block">
            {/* ใช้ <img> ไม่ใช่ next/image เพราะเป็น signed URL ที่หมดอายุใน 60
                วินาที การให้ next/image ไป optimize แล้ว cache ไว้ไม่มีประโยชน์ */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={t.idPhotoTitle} className="max-h-64 rounded-lg border border-slate-200 dark:border-slate-700" />
          </a>
        )}
      </div>
    </section>
  )
}

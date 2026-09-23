// =====================================================================
// บล็อก "สิ่งที่ศูนย์ต้องการตอนนี้" บนหน้าแรก (/) — ผู้ใช้ทั่วไปที่ยัง
// ไม่ล็อกอินก็เห็นได้ และตัวเลขขยับเองแบบ realtime
//
// ข้อมูลมาจากตาราง public.public_needs (docs/sql/25_public_needs.sql)
// ซึ่งเป็นตารางสรุปรายหมวดหมู่ที่ trigger อัปเดตให้อัตโนมัติทุกครั้งที่
// requests หรือ donation_pledges เปลี่ยน — anon อ่านได้แต่เขียนไม่ได้
//
// ทำไมต้องเป็น Client Component: Supabase Realtime ต้อง subscribe จาก
// ฝั่งเบราว์เซอร์ ส่วนข้อมูลชุดแรกรับมาจาก Server Component ทาง props
// (initialNeeds) เพื่อไม่ให้หน้าแรกกะพริบว่างตอนโหลด
// =====================================================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import styles from './entry-hub.module.css'

export type NeedRow = {
  category: string
  shortage: number
  center_count: number
  pledged_count: number
}

// สีประจำหมวด ใช้ชุดเดียวกับการ์ดหลักด้านบน (data-tone ใน entry-hub.module.css)
const TONE: Record<string, string> = {
  water: 'blue',
  food: 'green',
  medicine: 'red',
  hygiene: 'blue',
  clothing: 'green',
  other: 'green',
}

function NeedIcon({ category }: { category: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {category === 'water' && <path d="M16 3s9 10 9 16a9 9 0 0 1-18 0c0-6 9-16 9-16Z" />}
      {category === 'food' && <><path d="M8 3v11a4 4 0 0 0 8 0V3M12 14v15" /><path d="M24 3c-2 0-4 3-4 8s2 6 4 6v12" /></>}
      {category === 'medicine' && <><rect x="3" y="11" width="26" height="14" rx="4" /><path d="M16 15v6M13 18h6M9 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" /></>}
      {category === 'clothing' && <path d="m12 4 4 3 4-3 8 5-3 5-2-1v15H9V13l-2 1-3-5 8-5Z" />}
      {category === 'hygiene' && <><rect x="9" y="12" width="14" height="17" rx="3" /><path d="M13 12V6a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v6M13 19h6" /></>}
      {category === 'other' && <path d="m16 3 13 6v15l-13 6-13-6V9l13-6ZM3 9l13 6 13-6M16 15v15" />}
    </svg>
  )
}

export function EntryNeeds({
  dict,
  initialNeeds,
}: {
  dict: Dictionary
  initialNeeds: NeedRow[]
}) {
  const copy = dict.entryHub
  const [needs, setNeeds] = useState<NeedRow[]>(initialNeeds)
  // true เมื่อ subscribe สำเร็จเท่านั้น — ถ้า realtime ใช้ไม่ได้
  // (ยังไม่ได้เปิด replication / เน็ตมีปัญหา) จะไม่ขึ้นป้าย "อัปเดตสด"
  // หลอกผู้ใช้ว่าเลขสด ทั้งที่มันค้างอยู่
  const [live, setLive] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    // คืนค่า true เมื่ออ่านตารางได้จริง — ใช้ยืนยันว่า migration ถูกรันแล้ว
    // และ RLS เปิดให้ anon อ่านได้ ก่อนจะกล้าขึ้นป้าย "อัปเดตสด"
    async function reload() {
      const { data, error } = await supabase
        .from('public_needs')
        .select('category, shortage, center_count, pledged_count')
      if (cancelled || error || !data) return false
      setNeeds(data as NeedRow[])
      return true
    }

    const channel = supabase
      .channel('public-needs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'public_needs' },
        // payload ส่งมาแค่แถวเดียวที่เปลี่ยน แต่เราดึงใหม่ทั้งตาราง (6 แถว)
        // เพราะการจัดสรรครั้งเดียวมักกระทบหลายหมวดพร้อมกัน
        () => { void reload() },
      )
      .subscribe((status) => {
        if (cancelled) return
        if (status !== 'SUBSCRIBED') {
          setLive(false)
          return
        }
        // ช่องทาง subscribe สำเร็จอย่างเดียวยังไม่พอ — Supabase ตอบ SUBSCRIBED
        // ได้แม้ตารางจะยังไม่ได้อยู่ใน publication (เช่น ยังไม่ได้รัน
        // docs/sql/25_public_needs.sql) ถ้าขึ้นป้าย "อัปเดตสด" ตอนนั้น
        // ผู้ใช้จะเข้าใจว่าเลขสดทั้งที่มันค้างอยู่ จึงยืนยันด้วยการอ่านตารางจริง
        void reload().then((ok) => { if (!cancelled) setLive(ok) })
      })

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [])

  const categoryLabel: Record<string, string> = {
    food: dict.form.categoryFood,
    water: dict.form.categoryWater,
    medicine: dict.form.categoryMedicine,
    clothing: dict.form.categoryClothing,
    hygiene: dict.form.categoryHygiene,
    other: dict.form.categoryOther,
  }

  // เรียงจากขาดมากสุด แล้วตัดเหลือ 3 อันดับแรกที่ยังขาดจริง
  const top = [...needs]
    .filter((n) => n.shortage > 0)
    .sort((a, b) => b.shortage - a.shortage)
    .slice(0, 3)

  return (
    <section className={styles.supplies} aria-labelledby="supplies-title">
      <header className={styles.suppliesHeader}>
        <span className={styles.smallIcon}><NeedIcon category="other" /></span>
        <div>
          <h2 id="supplies-title">{copy.needsTitle}</h2>
          <p>{copy.needsSubtitle}</p>
        </div>
        <span className={live ? styles.liveBadge : styles.staticBadge}>
          {live && <span className={styles.liveDot} aria-hidden="true" />}
          {live ? copy.needsLive : copy.needsOffline}
        </span>
      </header>

      {top.length === 0 ? (
        <p className={styles.needsEmpty}>{copy.needsEmpty}</p>
      ) : (
        <div className={styles.supplyGrid}>
          {top.map((need) => (
            <Link
              key={need.category}
              href={`/pledge?category=${need.category}`}
              className={styles.supplyCard}
              data-tone={TONE[need.category] ?? 'green'}
            >
              <div className={styles.supplyHeading}>
                <span className={styles.icon}><NeedIcon category={need.category} /></span>
                <div>
                  <h3>{categoryLabel[need.category] ?? need.category}</h3>
                  <p className={styles.needsShortage}>
                    {copy.needsShortage
                      .replace('{n}', need.shortage.toLocaleString())
                      .replace('{unit}', copy.needsUnit)}
                  </p>
                </div>
              </div>
              <ul className={styles.needsMeta}>
                <li>{copy.needsCenters.replace('{n}', String(need.center_count))}</li>
                {/* ยอดที่ยังขาดจะลดก็ต่อเมื่อเจ้าหน้าที่จัดสรรจริง บรรทัดนี้
                    จึงสำคัญ — บอกว่ามีคนแจ้งบริจาคเข้ามาแล้วกี่ราย เพื่อไม่ให้
                    ทุกคนเห็นเลขเดิมแล้วแห่บริจาคของอย่างเดียวกันซ้ำ ๆ */}
                {need.pledged_count > 0 && (
                  <li className={styles.needsPledged}>
                    {copy.needsPledged.replace('{n}', String(need.pledged_count))}
                  </li>
                )}
              </ul>
              <span className={styles.supplyAction}>
                {copy.donateCategory} <span aria-hidden="true">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

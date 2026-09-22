import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { BrandMark } from './brand-mark'
import styles from './entry-hub.module.css'
import controls from './public-controls.module.css'
import { EntryNeeds, type NeedRow } from './entry-needs'

type IconName = 'staff' | 'home' | 'heart' | 'help' | 'shield' | 'people' | 'box'

function EntryIcon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      {name === 'box' && <g stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="m16 3 13 6v15l-13 6-13-6V9l13-6ZM3 9l13 6 13-6M16 15v15M9 6l13 6v7" /></g>}
      {name === 'staff' && <><circle cx="16" cy="10" r="6" fill="currentColor" /><path d="M5 27v-3a11 9 0 0 1 22 0v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" fill="currentColor" /></>}
      {name === 'home' && <><path d="m3 14 13-11 13 11a2 2 0 0 1-2 3h-2v10a2 2 0 0 1-2 2h-5V19h-4v10H9a2 2 0 0 1-2-2V17H5a2 2 0 0 1-2-3Z" fill="currentColor" /></>}
      {name === 'heart' && <path d="M16 28S3 20 3 11a7 7 0 0 1 13-4 7 7 0 0 1 13 4c0 9-13 17-13 17Z" fill="currentColor" />}
      {name === 'help' && <><rect x="3" y="3" width="26" height="26" rx="6" fill="currentColor" /><path d="M10 12H7v4h3v4H7m18-8h-3v4h3v4h-3m-8-8h4v8h-4Z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></>}
      {name === 'shield' && <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 11 4v8c0 7-11 14-11 14S5 22 5 15V7l11-4Z" /><path d="m11 15 4 4 7-8" /></g>}
      {name === 'people' && <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="9" r="4" /><path d="M8 27v-3a8 8 0 0 1 16 0v3H8Z" /><path d="M7 6a4 4 0 0 0 0 8M25 6a4 4 0 0 1 0 8M5 19a6 6 0 0 0-3 5v2h3m22-7a6 6 0 0 1 3 5v2h-3" /></g>}
    </svg>
  )
}

export function EntryHub({ dict, needs }: { dict: Dictionary; needs: NeedRow[] }) {
  const copy = dict.entryHub
  const choices = [
    { href: '/register', icon: 'people', tone: 'green', label: copy.volunteerLabel, desc: copy.volunteerDesc, action: copy.volunteerAction },
    { href: '/help-request', icon: 'heart', tone: 'red', label: copy.helpLabel, desc: copy.helpDesc, action: copy.helpAction },
    { href: '/pledge', icon: 'box', tone: 'blue', label: copy.donateLabel, desc: copy.donateDesc, action: copy.donateAction },
  ] as const
  return <main className={styles.hero}>
    <div className={styles.artwork} aria-hidden="true" />
    <div className={styles.topbar}>
      <BrandMark size="lg" />
      <Link href="/login" className={`${controls.surface} ${styles.staffLink}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2" /></svg>
        {copy.staffLabel}
      </Link>
    </div>
    <div className={styles.content}>
      <header className={styles.header}><h1>{copy.title}</h1><p>{copy.landingSubtitle}</p></header>
      <div className={styles.choices}>
        {choices.map(choice => <Link key={choice.href} href={choice.href} className={styles.card} data-tone={choice.tone}>
          <span className={styles.icon}><EntryIcon name={choice.icon} /></span>
          <h2>{choice.label}</h2><p>{choice.desc}</p>
          <span className={styles.action}>{choice.action}<span aria-hidden="true">&rarr;</span></span>
        </Link>)}
      </div>
      <p className={styles.motto}>
        {copy.motto}
        <svg className={styles.mottoHeart} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 27C12 23 4 18 4 11C4 4 13 3 16 10C19 2 28 4 28 11C28 17 21 23 16 27Z" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg className={styles.mottoUnderline} viewBox="0 0 180 24" aria-hidden="true">
          <path d="M3 22C41 8 119 1 177 3C126 5 49 13 3 22Z" fill="currentColor" />
        </svg>
      </p>
      <EntryNeeds dict={dict} initialNeeds={needs} />
    </div>
  </main>
}

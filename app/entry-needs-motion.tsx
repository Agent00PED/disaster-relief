'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import styles from './entry-hub.module.css'

export function RevealNeedCard({ children, href, tone, index }: {
  children: ReactNode
  href: string
  tone: string
  index: number
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const revealed = useRef(false)

  useEffect(() => {
    const element = ref.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (revealed.current || !element || motion.matches || !('IntersectionObserver' in window) || !element.animate) return

    let animation: Animation | undefined
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      revealed.current = true
      if (motion.matches || element.matches(':focus')) return
      animation = element.animate(
        [{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }],
        { duration: 420, delay: (index % 3) * 70, easing: 'ease-out', fill: 'backwards' },
      )
    }, { threshold: 0.1 })

    // Content stays visible without JavaScript; keyboard focus never waits for animation.
    const cancel = () => { animation?.cancel() }
    element.addEventListener('focus', cancel)
    motion.addEventListener('change', cancel)
    observer.observe(element)
    return () => {
      observer.disconnect()
      animation?.cancel()
      element.removeEventListener('focus', cancel)
      motion.removeEventListener('change', cancel)
    }
  }, [index])

  return <Link ref={ref} href={href} className={styles.supplyCard} data-tone={tone}>{children}</Link>
}

export function UpdatedNeedValue({ value, children }: { value: number; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(value)

  useEffect(() => {
    const changed = previous.current !== value
    previous.current = value
    const element = ref.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!changed || !element || motion.matches || !element.animate) return

    const highlight = getComputedStyle(element).getPropertyValue('--needs-highlight').trim()
    const animation = element.animate(
      [{ backgroundColor: highlight }, { backgroundColor: 'transparent' }],
      { duration: 1400, easing: 'ease-out' },
    )
    const cancel = () => { animation.cancel() }
    motion.addEventListener('change', cancel)
    return () => {
      animation.cancel()
      motion.removeEventListener('change', cancel)
    }
  }, [value])

  return <span ref={ref} className={styles.updatedNeedValue}>{children}</span>
}

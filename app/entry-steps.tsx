'use client'

import { useId, useState } from 'react'
import styles from './entry-hub.module.css'

export function EntrySteps({ steps, label, viewLabel, hideLabel }: {
  steps: readonly string[]
  label: string
  viewLabel: string
  hideLabel: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return <div className={styles.steps} data-open={open}>
    <button type="button" className={styles.stepsButton} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      {open ? hideLabel : viewLabel}
      <span className={styles.stepsChevron} aria-hidden="true">⌄</span>
    </button>
    <div id={id} className={styles.stepsPanel} aria-hidden={!open} inert={!open}>
      <div className={styles.stepsInner}>
        <ol aria-label={`${viewLabel}: ${label}`}>
          {steps.map((step, index) => <li key={step}>
            <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
            <span>{step}</span>
          </li>)}
        </ol>
      </div>
    </div>
  </div>
}

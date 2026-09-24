'use client'

import { useId, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Labels = { title: string; view: string; missing: string; loading: string; failed: string; close: string }

export function IdentityPhotoButton({ path, name, labels }: { path: string | null; name: string; labels: Labels }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const requestVersion = useRef(0)
  const titleId = useId()
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  function clearPreview() {
    requestVersion.current += 1
    setUrl(null)
    setLoading(false)
  }

  async function openPhoto() {
    if (!path) return
    const version = ++requestVersion.current
    setUrl(null)
    setFailed(false)
    setLoading(true)
    dialog.current?.showModal()
    try {
      // Use the signed-in admin's session; private storage policies still apply.
      const { data, error } = await createClient().storage.from('volunteer-ids').createSignedUrl(path, 60)
      if (version !== requestVersion.current) return
      if (error || !data?.signedUrl) setFailed(true)
      else setUrl(data.signedUrl)
    } catch {
      if (version === requestVersion.current) setFailed(true)
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }

  if (!path) return <span className="text-xs text-slate-500 dark:text-slate-400">{labels.missing}</span>

  return <>
    <button type="button" onClick={() => void openPhoto()} aria-label={`${labels.view}: ${name}`}
      className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
      {labels.view}
    </button>
    <dialog ref={dialog} aria-labelledby={titleId} onClose={clearPreview}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-900/60 dark:bg-slate-900 dark:text-slate-100">
      <div className="mb-4 flex items-start justify-between gap-4 whitespace-normal">
        <h2 id={titleId} className="text-lg font-semibold">{labels.title} — {name}</h2>
        <button type="button" autoFocus onClick={() => dialog.current?.close()}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">{labels.close}</button>
      </div>
      {loading && <p role="status">{labels.loading}</p>}
      {failed && <p role="alert" className="whitespace-normal text-red-600 dark:text-red-400">{labels.failed}</p>}
      {url && !failed && (
        // Keep expiring private images out of the image optimization cache.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${labels.title}: ${name}`} referrerPolicy="no-referrer"
          onError={() => { setFailed(true); setUrl(null) }}
          className="mx-auto max-h-[65dvh] max-w-full rounded-lg object-contain" />
      )}
    </dialog>
  </>
}

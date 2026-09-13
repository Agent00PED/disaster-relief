'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { localizedMetadata, translate, type Language, type TranslationValues } from '@/lib/i18n'

const LanguageContext = createContext<{
  language: Language
  setLanguage: (language: Language) => void
}>({ language: 'th', setLanguage: () => {} })

export function LanguageProvider({ initialLanguage, children }: {
  initialLanguage: Language
  children: ReactNode
}) {
  const [language, updateLanguage] = useState(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    const metadata = localizedMetadata(language)
    document.title = metadata.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description)
  }, [language])

  function setLanguage(next: Language) {
    document.cookie = `walaitrack-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
    document.documentElement.lang = next
    updateLanguage(next)
  }

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  return {
    ...context,
    t: (text: string, values?: TranslationValues) => translate(context.language, text, values),
  }
}

// Can be rendered by server components without moving their data fetching to the client.
export function TranslatedText({ children, values }: { children: string; values?: TranslationValues }) {
  const { t } = useLanguage()
  return <>{t(children, values)}</>
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  return (
    <div role="group" aria-label="Language / ภาษา" className="inline-flex rounded-full border border-slate-300 bg-white p-1 shadow-lg">
      {(['th', 'en'] as const).map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-label={option === 'th' ? 'ภาษาไทย' : 'English'}
          aria-pressed={language === option}
          onClick={() => setLanguage(option)}
          className={`min-h-11 min-w-11 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${language === option ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100'}`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

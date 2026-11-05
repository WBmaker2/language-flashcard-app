import { createContext, useContext, useEffect } from "react"
import { useApp } from '../store/appStore'

const dict: Record<string, Record<string, string>> = {
  ko: {
    home: '홈', stats: '통계', settings: '설정', decks: '덱 목록', newDeck: '+ 새 덱',
    todayDue: '오늘 복습할 카드', study: '학습', back: '뒤로',
  },
  en: {
    home: 'Home', stats: 'Stats', settings: 'Settings', decks: 'Decks', newDeck: '+ New Deck',
    todayDue: 'Due today', study: 'Study', back: 'Back',
  },
}

const Ctx = createContext<{ t: (k: string) => string; locale: string }>({ t: (k) => k, locale: 'ko' })

export function I18nProvider({ children }: { children: any }) {
  const settings = useApp((s) => s.settings)
  const locale = settings?.locale ?? 'ko'
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  const t = (k: string) => dict[locale]?.[k] ?? dict.ko[k] ?? k
  return <Ctx.Provider value={{ t, locale }}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)

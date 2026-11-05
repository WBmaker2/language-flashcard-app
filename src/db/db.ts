import Dexie, { type Table } from 'dexie'

export interface Deck {
  id: string
  name: string
  lang: string
  cardCount: number
  createdAt: number
}

export type CardType = 'basic' | 'input' | 'mcq' | 'cloze'

export interface Card {
  id: string
  deckId: string
  type: CardType
  front: string
  back: string
  choices?: string[]
  image?: string
  tags: string[]
  createdAt: number
}

export interface Review {
  cardId: string
  state: 'new' | 'learning' | 'review' | 'relearning'
  step: number
  ease: number
  interval: number
  due: number
  reps: number
  lapses: number
  lastReviewed?: number
}

export interface Settings {
  id: 'settings'
  voice?: string
  autoPlay: boolean
  dailyGoal: number
  ttsLang?: string
  theme: 'dark' | 'light'
  locale: 'ko' | 'en'
}

class FlashcardDB extends Dexie {
  decks!: Table<Deck, string>
  cards!: Table<Card, string>
  reviews!: Table<Review, string>
  settings!: Table<Settings, string>

  constructor() {
    super('flashcard-db')
    this.version(1).stores({
      decks: 'id, name, lang, createdAt',
      cards: 'id, deckId, createdAt',
      reviews: 'cardId, due',
      settings: 'id',
    })
    this.version(2).stores({
      decks: 'id, name, lang, createdAt',
      cards: 'id, deckId, createdAt',
      reviews: 'cardId, due',
      settings: 'id',
    }).upgrade(async () => {
      // no-op migration placeholder
    })
    this.version(3).stores({
      decks: 'id, name, lang, createdAt',
      cards: 'id, deckId, createdAt',
      reviews: 'cardId, due',
      settings: 'id',
    }).upgrade(async (tx) => {
      await tx.table('cards').toCollection().modify((c: any) => {
        if (!c.type) c.type = 'basic'
      })
      await tx.table('reviews').toCollection().modify((r: any) => {
        if (!r.state) { r.state = r.reps ? 'review' : 'new'; r.step = 0 }
      })
      await tx.table('settings').toCollection().modify((s: any) => {
        if (!s.theme) s.theme = 'dark'
        if (!s.locale) s.locale = 'ko'
      })
    })
  }
}

export const db = new FlashcardDB()

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('settings')
  if (s) return s
  const def: Settings = { id: 'settings', autoPlay: false, dailyGoal: 20, theme: 'dark', locale: 'ko' }
  await db.settings.put(def)
  return def
}

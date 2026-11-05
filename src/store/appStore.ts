import { create } from 'zustand'
import { db, getSettings, type Deck, type Card, type Review, type Settings } from '../db/db'
import { nextReview } from '../lib/srs'

// fallback uuid if no lib: use crypto
function id() {
  return crypto.randomUUID()
}

interface State {
  decks: Deck[]
  cards: Card[]
  reviews: Record<string, Review>
  settings: Settings | null
  loading: boolean
  load: () => Promise<void>
  createDeck: (name: string, lang: string) => Promise<string>
  deleteDeck: (id: string) => Promise<void>
  renameDeck: (id: string, name: string) => Promise<void>
  addCard: (deckId: string, front: string, back: string, tags?: string[], image?: string, type?: any, choices?: string[]) => Promise<void>
  updateCard: (card: Card) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  rateCard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => Promise<void>
  restoreReview: (cardId: string, review: any) => Promise<void>
  importCards: (deckId: string, rows: { front: string; back: string; tags?: string[] }[]) => Promise<number>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  cardsByDeck: (deckId: string) => Card[]
  dueCards: (deckId?: string) => Card[]
}

export const useApp = create<State>((set, get) => ({
  decks: [],
  cards: [],
  reviews: {},
  settings: null,
  loading: true,
  load: async () => {
    const [decks, cards, reviewsArr, settings] = await Promise.all([
      db.decks.toArray(),
      db.cards.toArray(),
      db.reviews.toArray(),
      getSettings(),
    ])
    const reviews: Record<string, Review> = {}
    for (const r of reviewsArr) reviews[r.cardId] = r
    set({ decks, cards, reviews, settings, loading: false })
  },
  createDeck: async (name, lang) => {
    const d: Deck = { id: id(), name, lang, cardCount: 0, createdAt: Date.now() }
    await db.decks.put(d)
    set({ decks: [...get().decks, d] })
    return d.id
  },
  deleteDeck: async (id) => {
    const cardIds = get().cards.filter((c) => c.deckId === id).map((c) => c.id)
    await db.transaction('rw', db.decks, db.cards, db.reviews, async () => {
      await db.decks.delete(id)
      await db.cards.where('deckId').equals(id).delete()
      for (const cid of cardIds) await db.reviews.delete(cid)
    })
    set({
      decks: get().decks.filter((d) => d.id !== id),
      cards: get().cards.filter((c) => c.deckId !== id),
      reviews: Object.fromEntries(Object.entries(get().reviews).filter(([k]) => !cardIds.includes(k))),
    })
  },
  renameDeck: async (id, name) => {
    await db.decks.update(id, { name })
    set({ decks: get().decks.map((d) => (d.id === id ? { ...d, name } : d)) })
  },
  addCard: async (deckId, front, back, tags = [], image, type = 'basic', choices) => {
    const c: Card = { id: id(), deckId, type, front, back, tags, image, choices, createdAt: Date.now() }
    await db.cards.put(c)
    const deck = get().decks.find((d) => d.id === deckId)
    if (deck) {
      const count = get().cards.filter((x) => x.deckId === deckId).length + 1
      await db.decks.update(deckId, { cardCount: count })
    }
    set({ cards: [...get().cards, c] })
    // update deck count
    set({
      decks: get().decks.map((d) =>
        d.id === deckId ? { ...d, cardCount: get().cards.filter((x) => x.deckId === deckId).length } : d,
      ),
    })
  },
  updateCard: async (card) => {
    await db.cards.put(card)
    set({ cards: get().cards.map((c) => (c.id === card.id ? card : c)) })
  },
  deleteCard: async (id) => {
    const card = get().cards.find((c) => c.id === id)
    await db.cards.delete(id)
    await db.reviews.delete(id)
    set({
      cards: get().cards.filter((c) => c.id !== id),
      reviews: Object.fromEntries(Object.entries(get().reviews).filter(([k]) => k !== id)),
    })
    if (card) {
      const deckId = card.deckId
      const count = get().cards.filter((c) => c.deckId === deckId).length
      await db.decks.update(deckId, { cardCount: count })
      set({ decks: get().decks.map((d) => (d.id === deckId ? { ...d, cardCount: count } : d)) })
    }
  },
  rateCard: async (cardId, rating) => {
    const prev = get().reviews[cardId]
    const nr = nextReview(prev, rating)
    nr.cardId = cardId
    await db.reviews.put(nr)
    set({ reviews: { ...get().reviews, [cardId]: nr } })
  },
  restoreReview: async (cardId, review) => {
    if (review) { await db.reviews.put(review); set({ reviews: { ...get().reviews, [cardId]: review } }) }
    else { await db.reviews.delete(cardId); const r = { ...get().reviews }; delete r[cardId]; set({ reviews: r }) }
  },
  importCards: async (deckId, rows) => {
    let n = 0
    for (const r of rows) {
      await get().addCard(deckId, r.front, r.back, r.tags)
      n++
    }
    return n
  },
  updateSettings: async (patch) => {
    const cur = get().settings ?? (await getSettings())
    const next = { ...cur, ...patch, id: 'settings' as const }
    await db.settings.put(next)
    set({ settings: next })
  },
  cardsByDeck: (deckId) => get().cards.filter((c) => c.deckId === deckId),
  dueCards: (deckId) => {
    const now = Date.now()
    return get().cards.filter((c) => {
      if (deckId && c.deckId !== deckId) return false
      const r = get().reviews[c.id]
      return !r || r.due <= now
    })
  },
}))

// remove unused import
export type { Deck, Card, Review, Settings }

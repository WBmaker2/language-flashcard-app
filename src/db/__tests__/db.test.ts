import { describe, it, expect, beforeEach } from 'vitest'
import { db, getSettings } from '../db'

describe('DB', () => {
  beforeEach(async () => {
    await db.decks.clear()
    await db.cards.clear()
    await db.reviews.clear()
    await db.settings.clear()
  })
  it('creates settings default', async () => {
    const s = await getSettings()
    expect(s.id).toBe('settings')
    expect(s.dailyGoal).toBe(20)
  })
  it('deck crud', async () => {
    await db.decks.put({ id: 'd1', name: 'Deck', lang: 'en-US', cardCount: 0, createdAt: 1 })
    const d = await db.decks.get('d1')
    expect(d?.name).toBe('Deck')
    await db.decks.delete('d1')
    expect(await db.decks.get('d1')).toBeUndefined()
  })
})

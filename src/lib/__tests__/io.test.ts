import { describe, it, expect } from 'vitest'
import { parseCSV, toCSV } from '../io'

describe('CSV', () => {
  it('round trip', () => {
    const rows = [{ front: 'a', back: 'b', tags: ['x', 'y'] }]
    const csv = toCSV(rows)
    const parsed = parseCSV(csv)
    expect(parsed).toEqual(rows)
  })
  it('skips header', () => {
    const parsed = parseCSV('front,back,tags\nq,r,t')
    expect(parsed).toHaveLength(1)
    expect(parsed[0].front).toBe('q')
  })
})

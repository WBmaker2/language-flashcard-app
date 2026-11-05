import { describe, it, expect } from 'vitest'
import { nextReview } from '../srs'

describe('SRS', () => {
  it('new card good advances learning step', () => {
    const r = nextReview(undefined, 'good')
    expect(r.state).toBe('learning')
    expect(r.step).toBe(1)
    expect(r.reps).toBe(0)
  })
  it('new card easy graduates', () => {
    const r = nextReview(undefined, 'easy')
    expect(r.state).toBe('review')
    expect(r.interval).toBe(4)
    expect(r.reps).toBe(1)
  })
  it('again resets to learning', () => {
    const first = nextReview(undefined, 'easy')
    const r = nextReview(first, 'again')
    expect(r.state).toBe('relearning')
    expect(r.reps).toBe(0)
    expect(r.lapses).toBe(1)
  })
  it('ease lower bound 1.3', () => {
    let r = nextReview(undefined, 'again')
    for (let i = 0; i < 10; i++) r = nextReview(r, 'again')
    expect(r.ease).toBeGreaterThanOrEqual(1.3)
  })
})

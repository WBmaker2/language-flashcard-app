const MIN = 60000
const DAY = 86400000
const LEARN_STEPS = [1, 10]
const RELEARN_STEPS = [10]

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

export function nextReview(prev: any, rating: 'again' | 'hard' | 'good' | 'easy'): any {
  const now = Date.now()
  const base = prev ?? { state: 'new', step: 0, ease: 2.5, interval: 0, reps: 0, lapses: 0, cardId: '' }
  let state = base.state ?? 'new'
  let step = base.step ?? 0
  let ease = base.ease ?? 2.5
  let interval = base.interval ?? 0
  let reps = base.reps ?? 0
  let lapses = base.lapses ?? 0

  if (state === 'new') state = 'learning'

  if (state === 'learning' || state === 'relearning') {
    const steps = state === 'learning' ? LEARN_STEPS : RELEARN_STEPS
    if (rating === 'again') {
      step = 0
    } else if (rating === 'hard') {
      step = Math.min(step, steps.length - 1)
    } else if (rating === 'good') {
      if (step + 1 >= steps.length) {
        state = 'review'
        reps = Math.max(1, reps + 1)
        interval = state === 'relearning'
          ? Math.max(1, Math.round((interval || 1) * 0.8))
          : (reps === 1 ? 1 : reps === 2 ? 6 : Math.max(1, Math.round(interval * ease)))
        step = 0
        ease = clamp(ease, 1.3, 3.0)
        return { cardId: base.cardId, state, step, ease, interval, due: now + interval * DAY, reps, lapses, lastReviewed: now }
      }
      step += 1
    } else if (rating === 'easy') {
      state = 'review'
      reps = Math.max(1, reps + 1)
      interval = state === 'relearning'
        ? Math.max(1, Math.round((interval || 1) * 0.8))
        : 4
      if (reps > 2) interval = Math.max(interval, Math.round(interval * ease))
      step = 0
      ease = clamp(ease + 0.15, 1.3, 3.0)
      return { cardId: base.cardId, state, step, ease, interval, due: now + interval * DAY, reps, lapses, lastReviewed: now }
    }
    // learning due
    const curStep = steps[Math.min(step, steps.length - 1)]
    let mins = curStep
    if (rating === 'hard') mins = Math.round(curStep * 1.5)
    if (rating === 'again') mins = steps[0]
    return { cardId: base.cardId, state, step, ease: clamp(ease, 1.3, 3.0), interval, due: now + mins * MIN, reps, lapses, lastReviewed: now }
  }

  // review
  if (rating === 'again') {
    lapses += 1
    state = 'relearning'
    step = 0
    interval = Math.max(1, Math.round((interval || 1) * 0.5))
    return { cardId: base.cardId, state, step, ease: clamp(ease - 0.2, 1.3, 3.0), interval, due: now + RELEARN_STEPS[0] * MIN, reps: 0, lapses, lastReviewed: now }
  }
  if (rating === 'hard') {
    interval = Math.max(1, Math.round((interval || 1) * 1.2))
    reps += 1
    ease = clamp(ease - 0.15, 1.3, 3.0)
  } else if (rating === 'good') {
    if (reps === 0 || interval === 0) interval = 1
    else if (reps === 1) interval = 6
    else interval = Math.max(1, Math.round(interval * ease))
    reps += 1
  } else if (rating === 'easy') {
    if (reps === 0 || interval === 0) interval = 4
    else if (reps === 1) interval = 6
    else interval = Math.max(1, Math.round(interval * ease * 1.3))
    reps += 1
    ease = clamp(ease + 0.15, 1.3, 3.0)
  }
  if (interval > 1) {
    const fuzz = Math.round(interval * 0.05)
    interval += Math.floor(Math.random() * (fuzz * 2 + 1)) - fuzz
    interval = Math.max(1, interval)
  }
  return { cardId: base.cardId, state: 'review', step: 0, ease: clamp(ease, 1.3, 3.0), interval, due: now + interval * DAY, reps, lapses, lastReviewed: now }
}

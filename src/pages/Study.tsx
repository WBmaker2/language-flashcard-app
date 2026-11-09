import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../store/appStore'
import { speak } from '../lib/tts'

type Counts = { again: number; hard: number; good: number; easy: number }

export default function Study() {
  const { deckId } = useParams()
  const navigate = useNavigate()
  const cards = useApp((s) => s.cards)
  const decks = useApp((s) => s.decks)
  const reviews = useApp((s) => s.reviews)
  const settings = useApp((s) => s.settings)
  const rateCard = useApp((s) => s.rateCard)
  const restoreReview = useApp((s) => s.restoreReview)
  const deck = decks.find((d) => d.id === deckId)
  const deckCards = cards.filter((c) => c.deckId === deckId)

  const [queue, setQueue] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const [shuffle, setShuffle] = useState(true)
  const [allMode, setAllMode] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [answer, setAnswer] = useState('')
  const [graded, setGraded] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [history, setHistory] = useState<{ cardId: string; prev: any; rating: keyof Counts }[]>([])
  const [counts, setCounts] = useState<Counts>({ again: 0, hard: 0, good: 0, easy: 0 })
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const now = Date.now()
    let pool = deckCards
    if (!allMode) pool = deckCards.filter((c) => {
      const r = reviews[c.id]
      return !r || r.due <= now
    })
    let ids = pool.map((c) => c.id)
    if (shuffle) ids = [...ids].sort(() => Math.random() - 0.5)
    const goal = settings?.dailyGoal ?? ids.length
    ids = ids.slice(0, Math.max(1, goal))
    setQueue(ids)
    setIdx(0)
    setDone(0)
    setFlipped(false)
    setHistory([])
    setCounts({ again: 0, hard: 0, good: 0, easy: 0 })
    setAnnouncement(ids.length ? `${ids.length}장 학습 시작` : '복습할 카드가 없습니다')
  }, [deckId, shuffle, allMode, settings?.dailyGoal])

  const current = queue[idx] ? cards.find((c) => c.id === queue[idx]) : undefined

  useEffect(() => {
    if (current && settings?.autoPlay) speak(current.front, deck?.lang, settings?.voice)
  }, [current?.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!current) return
      if (e.code === 'Space' && current.type === 'basic') { e.preventDefault(); setFlipped((f) => !f) }
      if (flipped && current && !graded) {
        // rating shortcuts only after flip for basic
      }
      if ((flipped || graded) && current) {
        if (e.key === '1') rate('again')
        if (e.key === '2') rate('hard')
        if (e.key === '3') rate('good')
        if (e.key === '4') rate('easy')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [flipped, graded, current])

  const grade = () => {
    if (!current) return
    const ok = normalize(answer) === normalize(current.back)
    setCorrect(ok)
    setGraded(true)
    setFlipped(true)
    setAnnouncement(ok ? '정답' : '오답')
    if (ok) speak('Correct', deck?.lang, settings?.voice)
  }

  const rate = async (r: 'again' | 'hard' | 'good' | 'easy') => {
    if (!current) return
    const prev = reviews[current.id] ?? null
    setHistory((h) => [...h, { cardId: current.id, prev, rating: r }])
    await rateCard(current.id, r)
    setCounts((c) => ({ ...c, [r]: c[r] + 1 }))
    setDone((d) => d + 1)
    setFlipped(false)
    setGraded(false)
    setCorrect(null)
    setAnswer('')
    setIdx((i) => i + 1)
    setAnnouncement(`${r} 평가`)
  }

  const undo = async () => {
    const last = history[history.length - 1]
    if (!last) return
    await restoreReview(last.cardId, last.prev)
    setHistory((h) => h.slice(0, -1))
    setCounts((c) => ({ ...c, [last.rating]: Math.max(0, c[last.rating] - 1) }))
    setIdx((i) => Math.max(0, i - 1))
    setDone((d) => Math.max(0, d - 1))
    setFlipped(false)
    setGraded(false)
    setCorrect(null)
    setAnswer('')
    setAnnouncement('실행 취소')
  }

  const normalize = (s: string) => s.trim().toLowerCase()

  if (!deck) return null
  if (queue.length === 0) return (
    <div className="empty card">
      <h2>복습할 카드가 없습니다</h2>
      <p className="small">새 카드를 추가하거나 ‘전체 복습’을 켜보세요.</p>
      <button className="btn" onClick={() => navigate(`/deck/${deckId}`)}>덱으로</button>
    </div>
  )
  if (idx >= queue.length) return (
    <div className="empty card" aria-live="polite">
      <h2>완료! {done}장 학습</h2>
      <div className="card" style={{ maxWidth: 360, margin: '12px auto' }}>
        <p>Again {counts.again} · Hard {counts.hard} · Good {counts.good} · Easy {counts.easy}</p>
      </div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn" onClick={() => navigate(`/deck/${deckId}`)}>덱으로</button>
        <button className="btn secondary" onClick={() => { setAllMode((v) => !v) }}>전체 복습</button>
      </div>
    </div>
  )
  if (!current) return null

  const isGradedType = current.type && current.type !== 'basic'
  const progress = queue.length ? Math.round((idx / queue.length) * 100) : 0

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button className="btn secondary" onClick={() => navigate(`/deck/${deckId}`)}>뒤로</button>
        <span className="small" aria-live="polite">{idx + 1} / {queue.length}</span>
      </div>

      <div className="progress" style={{ margin: '8px 0 12px' }} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="row" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
        <label className="small"><input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} /> 셔플</label>
        <label className="small"><input type="checkbox" checked={allMode} onChange={(e) => setAllMode(e.target.checked)} /> 전체 복습</label>
        <button className="btn secondary" onClick={undo} disabled={history.length === 0}>Undo</button>
        <span className="sr-only" aria-live="polite">{announcement}</span>
      </div>

      <div
        className="flashcard"
        style={{ marginTop: 16 }}
        role="button"
        tabIndex={0}
        aria-label="플래시카드"
        onClick={() => current.type === 'basic' && setFlipped((f) => !f)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (current.type === 'basic') setFlipped((f) => !f) } }}
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return
          const dx = e.changedTouches[0].clientX - touchStart
          if (Math.abs(dx) > 50) setFlipped((f) => !f)
          setTouchStart(null)
        }}
      >
        <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-face">
            {current.type === 'cloze' ? current.front.replace(/\{\{.*?\}\}/g, '_____') : current.front}
            {isGradedType && !graded && (
              <div style={{ marginTop: 12, width: '100%' }}>
                {current.type === 'mcq' ? (
                  <div className="row" style={{ justifyContent: 'center' }}>
                    {(current.choices ?? []).map((ch, i) => (
                      <button
                        key={i}
                        className="btn secondary"
                        onClick={(e) => { e.stopPropagation(); setAnswer(ch) }}
                        aria-pressed={answer === ch}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    className="input"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="답 입력"
                    aria-label="답 입력"
                    onKeyDown={(e) => { if (e.key === 'Enter') grade() }}
                  />
                )}
                <button className="btn" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); grade() }} disabled={current.type !== 'mcq' && !answer.trim()}>제출</button>
                {answer && current.type === 'mcq' && <p className="small">선택: {answer}</p>}
              </div>
            )}
          </div>
          <div className="flashcard-face flashcard-back">
            {current.back}
            {graded && correct !== null && (
              <p className="small" style={{ color: correct ? 'var(--good)' : 'var(--again)', fontWeight: 700 }}>
                {correct ? '정답!' : '오답'}
              </p>
            )}
            {current.image && <img src={current.image} alt="" style={{ maxHeight: 120, marginTop: 8, borderRadius: 8 }} />}
          </div>
        </div>
      </div>

      <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
        <button className="btn secondary" onClick={() => speak(current.front, deck.lang, settings?.voice)}>🔊 앞</button>
        <button className="btn secondary" onClick={() => speak(current.back, deck.lang, settings?.voice)}>🔊 뒤</button>
      </div>

      {(flipped || graded) && (
        <div className="rating-row" role="group" aria-label="숙련도 평가">
          <button className="r-again" onClick={() => rate('again')}>Again</button>
          <button className="r-hard" onClick={() => rate('hard')}>Hard</button>
          <button className="r-good" onClick={() => rate('good')}>Good</button>
          <button className="r-easy" onClick={() => rate('easy')}>Easy</button>
        </div>
      )}
      {!flipped && !graded && current.type === 'basic' && <p className="small" style={{ textAlign: 'center', marginTop: 12 }}>카드를 탭해 뒤집기 · 스페이스바로 뒤집기</p>}
    </div>
  )
}
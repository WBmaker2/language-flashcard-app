import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/appStore'
import { LANGS } from '../lib/tts'

export default function Home() {
  const decks = useApp((s) => s.decks)
  const cards = useApp((s) => s.cards)
  const reviews = useApp((s) => s.reviews)
  const createDeck = useApp((s) => s.createDeck)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [lang, setLang] = useState('en-US')
  const navigate = useNavigate()

  const todayDue = cards.filter((c) => {
    const r = reviews[c.id]
    return !r || r.due <= Date.now()
  }).length

  const submit = async () => {
    if (!name.trim()) return
    const id = await createDeck(name.trim(), lang)
    setOpen(false)
    setName('')
    navigate(`/deck/${id}`)
  }

  return (
    <div>
      <h1 style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(0,0,0,0)' }}>언어 학습 플래시카드</h1>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h2>덱 목록</h2>
        <button className="btn" onClick={() => setOpen(true)}>+ 새 덱</button>
      </div>
      <p className="small">오늘 복습할 카드: {todayDue}장</p>
      {decks.length === 0 && <div className="empty">덱이 없습니다. 새로 만들어보세요.</div>}
      <div className="grid">
        {decks.map((d) => {
          const dcards = cards.filter((c) => c.deckId === d.id)
          const due = dcards.filter((c) => {
            const r = reviews[c.id]
            return !r || r.due <= Date.now()
          }).length
          return (
            <div key={d.id} className="deck-card" onClick={() => navigate(`/deck/${d.id}`)}>
              <h3>{d.name}</h3>
              <p className="small">{LANGS.find((l) => l.code === d.lang)?.label ?? d.lang}</p>
              <p>{d.cardCount}장 · 오늘 {due}장</p>
              <button className="btn" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); navigate(`/study/${d.id}`) }}>학습</button>
            </div>
          )
        })}
      </div>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>새 덱</h3>
            <input className="input" placeholder="덱 이름" value={name} onChange={(e) => setName(e.target.value)} />
            <select className="input" style={{ marginTop: 8 }} value={lang} onChange={(e) => setLang(e.target.value)}>
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={submit}>만들기</button>
              <button className="btn secondary" onClick={() => setOpen(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

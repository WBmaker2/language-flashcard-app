import { useState, useEffect, useRef } from 'react'
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
  const modalRef = useRef<HTMLDivElement>(null)

  const todayDue = cards.filter((c) => {
    const r = reviews[c.id]
    return !r || r.due <= Date.now()
  }).length

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    const first = modalRef.current?.querySelector<HTMLElement>('input, select, button')
    first?.focus()
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const submit = async () => {
    if (!name.trim()) return
    const id = await createDeck(name.trim(), lang)
    setOpen(false)
    setName('')
    navigate(`/deck/${id}`)
  }

  return (
    <div>
      <header className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>언어 학습 플래시카드</h1>
        <p style={{ margin: 0 }}>인터넷 없이도 동작하는 다국어 플래시카드 앱입니다. 간격 반복(SRS)으로 복습 시점을 자동 계산하고, Web Speech API로 발음을 들려줍니다.</p>
        <h2 style={{ marginTop: 16, marginBottom: 4, fontSize: '1rem' }}>이 앱은 이런 프로그램입니다</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>덱(단어장) 단위로 카드를 관리합니다.</li>
          <li>앞/뒤 뒤집기와 Again/Hard/Good/Easy 평가로 SRS 복습을 진행합니다.</li>
          <li>오프라인 PWA로 설치해 모바일/데스크톱에서 사용할 수 있습니다.</li>
        </ul>
        <h2 style={{ marginTop: 12, marginBottom: 4, fontSize: '1rem' }}>사용 방법</h2>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>「+ 새 덱」으로 단어장을 만들고 언어를 선택합니다.</li>
          <li>덱 화면에서 앞(질문)/뒤(답) 카드를 추가합니다. (입력형/객관식/클로즈 지원)</li>
          <li>「학습」을 눌러 오늘 복습할 카드를 SRS로 학습합니다.</li>
          <li>카드를 뒤집고 평가 버튼으로 숙련도를 기록합니다.</li>
          <li>통계 화면에서 학습량과 연속일을 확인합니다.</li>
        </ol>
        <p className="small" style={{ marginTop: 12, marginBottom: 0 }}>주요 기능: CSV/JSON 가져오기·내보내기, 백업/복원, 이미지 첨부, 덱 공유(QR), 테마/언어 설정, 키보드 단축키.</p>
      </header>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>덱 목록</h2>
        <button className="btn" onClick={() => setOpen(true)}>+ 새 덱</button>
      </div>
      <p className="small" style={{ marginTop: 0 }}>오늘 복습할 카드: <strong>{todayDue}</strong>장</p>

      {decks.length === 0 && (
        <div className="empty card">
          <h3>덱이 없습니다</h3>
          <p>상단의 「+ 새 덱」으로 첫 단어장을 만들어보세요.</p>
        </div>
      )}

      <div className="grid">
        {decks.map((d) => {
          const dcards = cards.filter((c) => c.deckId === d.id)
          const due = dcards.filter((c) => {
            const r = reviews[c.id]
            return !r || r.due <= Date.now()
          }).length
          return (
            <div
              key={d.id}
              className="deck-card"
              role="button"
              tabIndex={0}
              aria-label={`${d.name} 덱, ${d.cardCount}장, 오늘 ${due}장`}
              onClick={() => navigate(`/deck/${d.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/deck/${d.id}`) } }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 4 }}>{d.name}</h3>
              <p className="small" style={{ margin: 0 }}>{LANGS.find((l) => l.code === d.lang)?.label ?? d.lang}</p>
              <p style={{ margin: '8px 0 0' }}>{d.cardCount}장 · 오늘 {due}장</p>
              <button
                className="btn"
                style={{ marginTop: 12 }}
                onClick={(e) => { e.stopPropagation(); navigate(`/study/${d.id}`) }}
              >
                학습
              </button>
            </div>
          )
        })}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-labelledby="new-deck-title">
          <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <h3 id="new-deck-title" style={{ marginTop: 0 }}>새 덱</h3>
            <div className="field">
              <label htmlFor="deck-name">덱 이름</label>
              <input
                id="deck-name"
                className="input"
                placeholder="덱 이름"
                aria-label="덱 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              />
            </div>
            <div className="field" style={{ marginTop: 8 }}>
              <label htmlFor="deck-lang">언어</label>
              <select id="deck-lang" className="input" aria-label="언어" value={lang} onChange={(e) => setLang(e.target.value)}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
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
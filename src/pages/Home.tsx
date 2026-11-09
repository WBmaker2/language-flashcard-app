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
      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>언어 학습 플래시카드</h2>
        <p>인터넷 없이도 동작하는 다국어 플래시카드 앱입니다. 간격 반복(SRS)으로 복습 시점을 자동 계산하고, Web Speech API로 발음을 들려줍니다.</p>
        <h3>이 앱은 이런 프로그램입니다</h3>
        <ul>
          <li>덱(단어장) 단위로 카드를 관리합니다.</li>
          <li>앞/뒤 뒤집기와 Again/Hard/Good/Easy 평가로 SRS 복습을 진행합니다.</li>
          <li>오프라인 PWA로 설치해 모바일/데스크톱에서 사용할 수 있습니다.</li>
        </ul>
        <h3>사용 방법</h3>
        <ol>
          <li>「+ 새 덱」으로 단어장을 만들고 언어를 선택합니다.</li>
          <li>덱 화면에서 앞(질문)/뒤(답) 카드를 추가합니다. (입력형/객관식/클로즈 지원)</li>
          <li>「학습」을 눌러 오늘 복습할 카드를 SRS로 학습합니다.</li>
          <li>카드를 뒤집고 평가 버튼으로 숙련도를 기록합니다.</li>
          <li>통계 화면에서 학습량과 연속일을 확인합니다.</li>
        </ol>
        <h3>주요 기능</h3>
        <p className="small">CSV/JSON 가져오기·내보내기, 백업/복원, 이미지 첨부, 덱 공유(QR), 테마/언어 설정, 키보드 단축키.</p>
      </section>
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

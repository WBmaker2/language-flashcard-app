import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../store/appStore'
import { parseCSV, toCSV, downloadFile } from '../lib/io'
import QRCode from 'qrcode'

export default function DeckPage() {
  const { id } = useParams()
  const deckId = id!
  const decks = useApp((s) => s.decks)
  const cards = useApp((s) => s.cards)
  const addCard = useApp((s) => s.addCard)
  const updateCard = useApp((s) => s.updateCard)
  const deleteCard = useApp((s) => s.deleteCard)
  const deleteDeck = useApp((s) => s.deleteDeck)
  const renameDeck = useApp((s) => s.renameDeck)
  const importCards = useApp((s) => s.importCards)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [qr, setQr] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState('')

  const deck = decks.find((d) => d.id === deckId)
  const allDeckCards = cards.filter((c) => c.deckId === deckId)
  const allTags = Array.from(new Set(allDeckCards.flatMap((c) => c.tags)))
  const deckCards = allDeckCards.filter((c) => {
    const q = query.trim().toLowerCase()
    if (q && !c.front.toLowerCase().includes(q) && !c.back.toLowerCase().includes(q) && !c.tags.some((t) => t.toLowerCase().includes(q))) return false
    if (tagFilter && !c.tags.includes(tagFilter)) return false
    return true
  })

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [tags, setTags] = useState('')
  const [type, setType] = useState('basic')
  const [choices, setChoices] = useState('')
  const [image, setImage] = useState<string | undefined>()
  const [editing, setEditing] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!deck) navigate('/') }, [deck, navigate])

  const onImage = (file?: File) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => setImage(r.result as string)
    r.readAsDataURL(file)
  }

  const submit = async () => {
    if (!front.trim() || !back.trim()) return
    await addCard(deckId, front.trim(), back.trim(), tags.split(',').map((t) => t.trim()).filter(Boolean), image, type, choices.split('\n').map((c) => c.trim()).filter(Boolean))
    setFront(''); setBack(''); setTags(''); setImage(undefined); setType('basic'); setChoices('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const startEdit = (c: any) => {
    setEditing(c.id); setEditFront(c.front); setEditBack(c.back)
  }
  const saveEdit = async (c: any) => {
    await updateCard({ ...c, front: editFront, back: editBack })
    setEditing(null)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    let rows: { front: string; back: string; tags?: string[] }[] = []
    if (file.name.endsWith('.json')) {
      const data = JSON.parse(text)
      rows = Array.isArray(data) ? data.map((x: any) => ({ front: x.front, back: x.back, tags: x.tags ?? [] })) : []
    } else {
      rows = parseCSV(text)
    }
    await importCards(deckId, rows)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleExport = (fmt: 'csv' | 'json') => {
    const data = deckCards.map((c) => ({ front: c.front, back: c.back, tags: c.tags }))
    if (fmt === 'csv') downloadFile(`${deck?.name}.csv`, toCSV(data), 'text/csv')
    else downloadFile(`${deck?.name}.json`, JSON.stringify(data, null, 2), 'application/json')
  }

  const handleShare = async () => {
    if (!deck) return
    const data = { deck: { name: deck.name, lang: deck.lang }, cards: deckCards.map((c) => ({ type: c.type, front: c.front, back: c.back, tags: c.tags, choices: c.choices })) }
    const json = JSON.stringify(data)
    downloadFile(`${deck.name}.share.json`, json, 'application/json')
    try {
      if (navigator.share) {
        const file = new File([json], `${deck.name}.share.json`, { type: 'application/json' })
        await navigator.share({ title: deck.name, files: [file] })
      }
    } catch {}
    if (json.length < 2500) {
      try { setQr(await QRCode.toDataURL(json)) } catch { setQr(null) }
    } else {
      setQr(null)
    }
  }

  if (!deck) return null
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <h2 style={{ margin: 0 }}>{deck.name}</h2>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => navigate(`/study/${deckId}`)}>학습</button>
          <button className="btn secondary" onClick={handleShare}>공유</button>
          <button className="btn secondary" onClick={() => {
            const n = prompt('덱 이름', deck.name)
            if (n) renameDeck(deckId, n)
          }}>이름변경</button>
          <button className="btn danger" onClick={() => { if (confirm('덱을 삭제할까요?')) { deleteDeck(deckId); navigate('/') } }}>삭제</button>
        </div>
      </div>

      <section className="card" aria-labelledby="add-card-title">
        <h3 id="add-card-title" style={{ marginTop: 0 }}>카드 추가</h3>
        <div className="field">
          <label htmlFor="card-front">앞 (질문)</label>
          <input id="card-front" className="input" placeholder="앞 (질문)" aria-label="앞 (질문)" value={front} onChange={(e) => setFront(e.target.value)} />
        </div>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="card-back">뒤 (답)</label>
          <textarea id="card-back" className="input" placeholder="뒤 (답)" aria-label="뒤 (답)" value={back} onChange={(e) => setBack(e.target.value)} />
        </div>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="card-tags">태그 (쉼표)</label>
          <input id="card-tags" className="input" placeholder="태그 (쉼표)" aria-label="태그 (쉼표)" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="card-type">유형</label>
          <select id="card-type" className="input" aria-label="유형" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="basic">기본</option>
            <option value="input">입력형</option>
            <option value="mcq">객관식</option>
            <option value="cloze">클로즈</option>
          </select>
        </div>
        {type === 'mcq' && (
          <div className="field" style={{ marginTop: 8 }}>
            <label htmlFor="card-choices">선택지 (줄바꿈)</label>
            <textarea id="card-choices" className="input" placeholder="선택지 (줄바꿈)" aria-label="선택지 (줄바꿈)" value={choices} onChange={(e) => setChoices(e.target.value)} />
          </div>
        )}
        <div className="row" style={{ marginTop: 8 }}>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            aria-label="이미지 첨부"
            onChange={(e) => onImage(e.target.files?.[0])}
          />
          {image && (
            <>
              <img src={image} alt="첨부 미리보기" style={{ height: 40, borderRadius: 6 }} />
              <button className="btn ghost" onClick={() => { setImage(undefined); if (imageInputRef.current) imageInputRef.current.value = '' }}>제거</button>
            </>
          )}
        </div>
        <button className="btn" style={{ marginTop: 12 }} onClick={submit} disabled={!front.trim() || !back.trim()}>추가</button>
      </section>

      <section className="card" aria-labelledby="io-title">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 id="io-title" style={{ margin: 0 }}>가져오기/내보내기</h3>
          <div className="row">
            <input ref={fileRef} type="file" accept=".csv,.json" aria-label="가져올 파일" onChange={handleImport} />
            <button className="btn secondary" onClick={() => handleExport('csv')}>CSV</button>
            <button className="btn secondary" onClick={() => handleExport('json')}>JSON</button>
          </div>
        </div>
      </section>

      <section className="card" aria-labelledby="filter-title">
        <div className="row">
          <label className="sr-only" htmlFor="card-search">검색</label>
          <input id="card-search" className="input" placeholder="검색 (앞/뒤/태그)" aria-label="검색 (앞/뒤/태그)" value={query} onChange={(e) => setQuery(e.target.value)} />
          <label className="sr-only" htmlFor="tag-filter">태그 필터</label>
          <select id="tag-filter" className="input" aria-label="태그 필터" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">모든 태그</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </section>

      {qr && (
        <section className="card">
          <img src={qr} alt="덱 공유 QR 코드" style={{ maxWidth: 200 }} />
        </section>
      )}

      <h3>카드 ({deckCards.length})</h3>
      {deckCards.length === 0 && (
        <div className="empty">카드가 없습니다. 위에서 추가해보세요.</div>
      )}
      {deckCards.map((c) => (
        <article key={c.id} className="card">
          {editing === c.id ? (
            <>
              <div className="field">
                <label htmlFor={`edit-front-${c.id}`}>앞 (질문)</label>
                <input id={`edit-front-${c.id}`} className="input" aria-label="앞 (질문)" value={editFront} onChange={(e) => setEditFront(e.target.value)} />
              </div>
              <div className="field" style={{ marginTop: 8 }}>
                <label htmlFor={`edit-back-${c.id}`}>뒤 (답)</label>
                <textarea id={`edit-back-${c.id}`} className="input" aria-label="뒤 (답)" value={editBack} onChange={(e) => setEditBack(e.target.value)} />
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => saveEdit(c)}>저장</button>
                <button className="btn secondary" onClick={() => setEditing(null)}>취소</button>
              </div>
            </>
          ) : (
            <>
              <div><strong>{c.front}</strong></div>
              <div className="small">{c.back}</div>
              {c.tags.length > 0 && <div className="small">#{c.tags.join(' #')}</div>}
              {c.image && <img src={c.image} alt="" style={{ height: 60, marginTop: 4, borderRadius: 6 }} />}
              {c.type !== 'basic' && <div className="small" style={{ marginTop: 4 }}>유형: {c.type}</div>}
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn secondary" onClick={() => startEdit(c)}>편집</button>
                <button className="btn danger" onClick={() => { if (confirm('카드를 삭제할까요?')) deleteCard(c.id) }}>삭제</button>
              </div>
            </>
          )}
        </article>
      ))}
    </div>
  )
}
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
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h2>{deck.name}</h2>
        <div className="row">
          <button className="btn" onClick={() => navigate(`/study/${deckId}`)}>학습</button>
          <button className="btn secondary" onClick={handleShare}>공유</button>
          <button className="btn secondary" onClick={() => {
            const n = prompt('덱 이름', deck.name)
            if (n) renameDeck(deckId, n)
          }}>이름변경</button>
          <button className="btn danger" onClick={() => { if (confirm('덱 삭제?')) { deleteDeck(deckId); navigate('/') } }}>삭제</button>
        </div>
      </div>

      <div className="card">
        <h3>카드 추가</h3>
        <input className="input" placeholder="앞 (질문)" value={front} onChange={(e) => setFront(e.target.value)} />
        <textarea className="input" style={{ marginTop: 8 }} placeholder="뒤 (답)" value={back} onChange={(e) => setBack(e.target.value)} />
        <input className="input" style={{ marginTop: 8 }} placeholder="태그 (쉼표)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <select className="input" style={{ marginTop: 8 }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="basic">기본</option>
          <option value="input">입력형</option>
          <option value="mcq">객관식</option>
          <option value="cloze">클로즈</option>
        </select>
        {type === 'mcq' && <textarea className="input" style={{ marginTop: 8 }} placeholder="선택지 (줄바꿈)" value={choices} onChange={(e) => setChoices(e.target.value)} />}
        <div className="row" style={{ marginTop: 8 }}>
          <input type="file" accept="image/*" onChange={(e) => onImage(e.target.files?.[0])} />
          {image && <img src={image} alt="" style={{ height: 40 }} />}
        </div>
        <button className="btn" style={{ marginTop: 8 }} onClick={submit}>추가</button>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>가져오기/내보내기</h3>
          <div className="row">
            <input ref={fileRef} type="file" accept=".csv,.json" onChange={handleImport} />
            <button className="btn secondary" onClick={() => handleExport('csv')}>CSV</button>
            <button className="btn secondary" onClick={() => handleExport('json')}>JSON</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <input className="input" placeholder="검색 (앞/뒤/태그)" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="input" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">모든 태그</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      {qr && <div className="card"><img src={qr} alt="QR" style={{ maxWidth: 200 }} /></div>}
      <h3>카드 ({deckCards.length})</h3>
      {deckCards.map((c) => (
        <div key={c.id} className="card">
          {editing === c.id ? (
            <>
              <input className="input" value={editFront} onChange={(e) => setEditFront(e.target.value)} />
              <textarea className="input" style={{ marginTop: 8 }} value={editBack} onChange={(e) => setEditBack(e.target.value)} />
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
              {c.image && <img src={c.image} alt="" style={{ height: 60, marginTop: 4 }} />}
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn secondary" onClick={() => startEdit(c)}>편집</button>
                <button className="btn danger" onClick={() => deleteCard(c.id)}>삭제</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

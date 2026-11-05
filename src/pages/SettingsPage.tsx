import { useEffect, useState } from 'react'
import { useApp } from '../store/appStore'
import { db } from '../db/db'
import { downloadFile } from '../lib/io'
import { LANGS } from '../lib/tts'

export default function SettingsPage() {
  const settings = useApp((s) => s.settings)
  const updateSettings = useApp((s) => s.updateSettings)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [msg, setMsg] = useState('')
  const [quota, setQuota] = useState('')

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() ?? [])
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load)
  }, [])

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then((e) => {
        if (e.usage && e.quota) {
          const pct = Math.round((e.usage / e.quota) * 100)
          setQuota(`저장소 사용량: ${pct}%`)
          if (pct > 80) setMsg('저장소 용량이 부족합니다. 백업 후 정리하세요.')
        }
      })
    }
  }, [])
  if (!settings) return null
  const filtered = settings?.ttsLang ? voices.filter((v) => v.lang.toLowerCase().startsWith(settings.ttsLang!.toLowerCase().slice(0, 2))) : voices

  const backup = async () => {
    const data = {
      decks: await db.decks.toArray(),
      cards: await db.cards.toArray(),
      reviews: await db.reviews.toArray(),
      settings: await db.settings.toArray(),
    }
    downloadFile('flashcard-backup.json', JSON.stringify(data, null, 2), 'application/json')
    setMsg('백업 파일 저장됨')
  }

  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      await db.transaction('rw', db.decks, db.cards, db.reviews, db.settings, async () => {
        await db.decks.clear(); await db.cards.clear(); await db.reviews.clear(); await db.settings.clear()
        if (data.decks) await db.decks.bulkPut(data.decks)
        if (data.cards) await db.cards.bulkPut(data.cards)
        if (data.reviews) await db.reviews.bulkPut(data.reviews)
        if (data.settings) await db.settings.bulkPut(data.settings)
      })
      setMsg('복원 완료. 새로고침하세요.')
    } catch {
      setMsg('복원 실패')
    }
    e.target.value = ''
  }

  return (
    <div>
      <h2>설정</h2>
      <div className="card">
        <label className="small">TTS 언어</label>
        <select className="input" value={settings.ttsLang ?? 'en-US'} onChange={(e) => updateSettings({ ttsLang: e.target.value, voice: undefined })}>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <label className="small" style={{ marginTop: 8, display: 'block' }}>음성</label>
        <select className="input" value={settings.voice ?? ''} onChange={(e) => updateSettings({ voice: e.target.value })}>
          <option value="">기본</option>
          {filtered.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
        </select>
        <label className="row" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={settings.autoPlay} onChange={(e) => updateSettings({ autoPlay: e.target.checked })} />
          자동 발음 재생
        </label>
        <label className="small" style={{ marginTop: 8, display: 'block' }}>일일 목표</label>
        <input className="input" type="number" value={settings.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })} />
        <label className="small" style={{ marginTop: 8, display: 'block' }}>테마</label>
        <select className="input" value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as any })}>
          <option value="dark">다크</option>
          <option value="light">라이트</option>
        </select>
        <label className="small" style={{ marginTop: 8, display: 'block' }}>언어</label>
        <select className="input" value={settings.locale} onChange={(e) => updateSettings({ locale: e.target.value as any })}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h3>백업/복원</h3>
        <div className="row">
          <button className="btn secondary" onClick={backup}>백업(JSON)</button>
          <input type="file" accept=".json" onChange={restore} />
        </div>
        {msg && <p className="small">{msg}</p>}
        {quota && <p className="small">{quota}</p>}
      </div>
    </div>
  )
}

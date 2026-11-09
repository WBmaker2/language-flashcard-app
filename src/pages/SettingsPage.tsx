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
  const [quota, setQuota] = useState<{ used: number; total: number } | null>(null)

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
          setQuota({ used: e.usage, total: e.quota })
          const pct = Math.round((e.usage / e.quota) * 100)
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

  const quotaPct = quota ? Math.round((quota.used / quota.total) * 100) : 0

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>설정</h2>
      <section className="card">
        <div className="field">
          <label htmlFor="tts-lang">TTS 언어</label>
          <select id="tts-lang" className="input" value={settings.ttsLang ?? 'en-US'} onChange={(e) => updateSettings({ ttsLang: e.target.value, voice: undefined })}>
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="tts-voice">음성</label>
          <select id="tts-voice" className="input" value={settings.voice ?? ''} onChange={(e) => updateSettings({ voice: e.target.value })}>
            <option value="">기본</option>
            {filtered.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
          </select>
        </div>
        <label className="row" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={settings.autoPlay} onChange={(e) => updateSettings({ autoPlay: e.target.checked })} />
          자동 발음 재생
        </label>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="daily-goal">일일 목표</label>
          <input id="daily-goal" className="input" type="number" min={1} value={settings.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })} />
        </div>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="theme">테마</label>
          <select id="theme" className="input" value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as any })}>
            <option value="dark">다크</option>
            <option value="light">라이트</option>
          </select>
        </div>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="locale">언어</label>
          <select id="locale" className="input" value={settings.locale} onChange={(e) => updateSettings({ locale: e.target.value as any })}>
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>백업/복원</h3>
        <div className="row">
          <button className="btn secondary" onClick={backup}>백업(JSON)</button>
          <input type="file" accept=".json" aria-label="복원할 백업 파일" onChange={restore} />
        </div>
        {msg && <p className="small" role="status">{msg}</p>}
        {quota && (
          <div style={{ marginTop: 12 }}>
            <p className="small">저장소 사용량: {quotaPct}%</p>
            <div className="progress" aria-hidden="true"><span style={{ width: `${quotaPct}%` }} /></div>
          </div>
        )}
      </section>
    </div>
  )
}
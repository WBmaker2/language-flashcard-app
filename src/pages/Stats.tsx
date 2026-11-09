import { useMemo } from 'react'
import { useApp } from '../store/appStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Stats() {
  const decks = useApp((s) => s.decks)
  const cards = useApp((s) => s.cards)
  const reviews = useApp((s) => s.reviews)

  const deckData = useMemo(() => decks.map((d) => ({
    name: d.name,
    cards: cards.filter((c) => c.deckId === d.id).length,
  })), [decks, cards])

  const proficiency = useMemo(() => {
    const buckets = { New: 0, Learning: 0, Mature: 0 }
    for (const c of cards) {
      const r = reviews[c.id]
      if (!r || r.reps === 0) buckets.New++
      else if (r.interval < 21) buckets.Learning++
      else buckets.Mature++
    }
    return Object.entries(buckets).map(([name, value]) => ({ name, value }))
  }, [cards, reviews])

  const daily = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of Object.values(reviews)) {
      if (r.lastReviewed) {
        const d = new Date(r.lastReviewed).toISOString().slice(0, 10)
        map[d] = (map[d] ?? 0) + 1
      }
    }
    return Object.entries(map).sort().map(([date, count]) => ({ date, count }))
  }, [reviews])

  const streak = useMemo(() => {
    const days = new Set(Object.keys(
      Object.values(reviews).reduce((acc, r) => {
        if (r.lastReviewed) acc[new Date(r.lastReviewed).toISOString().slice(0, 10)] = true
        return acc
      }, {} as Record<string, boolean>)
    ))
    let s = 0
    const d = new Date()
    for (;;) {
      const key = d.toISOString().slice(0, 10)
      if (days.has(key)) { s++; d.setDate(d.getDate() - 1) } else break
    }
    return s
  }, [reviews])

  const COLORS = ['var(--accent)', 'var(--hard)', 'var(--good)']

  if (cards.length === 0) {
    return (
      <div className="empty card">
        <h2>통계가 없습니다</h2>
        <p className="small">카드를 추가하고 학습을 시작하면 통계가 표시됩니다.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>통계</h2>
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card"><strong>총 카드</strong><div className="value">{cards.length}</div></div>
        <div className="stat-card"><strong>덱</strong><div className="value">{decks.length}</div></div>
        <div className="stat-card"><strong>연속일</strong><div className="value">{streak}</div></div>
        <div className="stat-card"><strong>오늘 학습</strong><div className="value">{daily.length ? daily[daily.length - 1].count : 0}</div></div>
      </div>
      <section className="card">
        <h3 style={{ marginTop: 0 }}>덱별 카드 수</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={deckData}>
            <XAxis dataKey="name" stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 12 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <Bar dataKey="cards" fill="var(--accent)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="card">
        <h3 style={{ marginTop: 0 }}>숙련도</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={proficiency} dataKey="value" nameKey="name" outerRadius={80} label={{ fill: 'var(--text)', fontSize: 12 }}>
              {proficiency.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </PieChart>
        </ResponsiveContainer>
      </section>
      <section className="card">
        <h3 style={{ marginTop: 0 }}>일별 학습량</h3>
        {daily.length === 0 ? (
          <p className="small">아직 학습 기록이 없습니다.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily}>
              <XAxis dataKey="date" stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <Bar dataKey="count" fill="var(--good)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  )
}
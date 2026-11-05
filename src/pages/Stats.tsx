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

  const COLORS = ['#38bdf8', '#f59e0b', '#22c55e']

  return (
    <div>
      <h2>통계</h2>
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="card" style={{ flex: 1 }}><strong>총 카드</strong><div style={{ fontSize: 24 }}>{cards.length}</div></div>
        <div className="card" style={{ flex: 1 }}><strong>덱</strong><div style={{ fontSize: 24 }}>{decks.length}</div></div>
        <div className="card" style={{ flex: 1 }}><strong>연속일</strong><div style={{ fontSize: 24 }}>{streak}</div></div>
      </div>
      <div className="card">
        <h3>덱별 카드 수</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={deckData}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="cards" fill="#38bdf8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3>숙련도</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={proficiency} dataKey="value" nameKey="name" outerRadius={80} label>
              {proficiency.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3>일별 학습량</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={daily}>
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="count" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

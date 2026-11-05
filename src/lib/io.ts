export function parseCSV(text: string): { front: string; back: string; tags: string[] }[] {
  const lines = text.trim().split(/\r?\n/)
  const rows: { front: string; back: string; tags: string[] }[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    const cols = splitCsvLine(line)
    const front = cols[0] ?? ''
    const back = cols[1] ?? ''
    const tags = (cols[2] ?? '').split(/[;,]/).map((t) => t.trim()).filter(Boolean)
    if (!front && !back) continue
    rows.push({ front, back, tags })
  }
  // skip header
  if (rows.length && /front/i.test(rows[0].front) && /back/i.test(rows[0].back)) rows.shift()
  return rows
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQ = false
      else cur += ch
    } else {
      if (ch === '"') inQ = true
      else if (ch === ',') { out.push(cur); cur = '' }
      else cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

export function toCSV(cards: { front: string; back: string; tags: string[] }[]): string {
  const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"'
  const lines = ['front,back,tags']
  for (const c of cards) lines.push([esc(c.front), esc(c.back), esc(c.tags.join(';'))].join(','))
  return lines.join('\n')
}

export function downloadFile(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

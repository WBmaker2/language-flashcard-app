import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useApp } from './store/appStore'
import Home from './pages/Home'
import DeckPage from './pages/DeckPage'
import Study from './pages/Study'
import Stats from './pages/Stats'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const load = useApp((s) => s.load)
  const loading = useApp((s) => s.loading)
  const settings = useApp((s) => s.settings)
  useEffect(() => { load() }, [load])
  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme ?? 'dark'
  }, [settings?.theme])
  if (loading) return (
    <div className="app" role="status" aria-live="polite">
      <div className="card" style={{ textAlign: 'center' }}>불러오는 중…</div>
    </div>
  )
  return (
    <BrowserRouter>
      <div className="app">
        <Nav />
        <main id="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/deck/:id" element={<DeckPage />} />
            <Route path="/study/:deckId" element={<Study />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function Nav() {
  return (
    <nav className="nav" aria-label="주요 메뉴">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>홈</NavLink>
      <NavLink to="/stats" className={({ isActive }) => (isActive ? 'active' : '')}>통계</NavLink>
      <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>설정</NavLink>
    </nav>
  )
}

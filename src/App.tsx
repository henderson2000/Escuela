import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { ComponentsPage } from './pages/ComponentsPage'
import { ComponentDetail } from './pages/ComponentDetail'
import { TheoryPage, TopicPage } from './pages/TheoryPage'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { GamesPage } from './pages/GamesPage'
import { GameRoute } from './pages/GameRoute'
import { RankingPage } from './pages/RankingPage'
import { PlayerBadge } from './components/PlayerBadge'

const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/componentes', label: 'Componentes 3D' },
  { to: '/teoria', label: 'Teoría' },
  { to: '/actividades', label: 'Actividades' },
  { to: '/juegos', label: 'Juegos' },
  { to: '/ranking', label: 'Ranking' },
]

export default function App() {
  return (
    <HashRouter>
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-icon">⚡</span>
          <span>
            Electrónica <strong>3D</strong>
          </span>
        </NavLink>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <PlayerBadge />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/componentes" element={<ComponentsPage />} />
          <Route path="/componentes/:id" element={<ComponentDetail />} />
          <Route path="/teoria" element={<TheoryPage />} />
          <Route path="/teoria/:id" element={<TopicPage />} />
          <Route path="/actividades" element={<ActivitiesPage />} />
          <Route path="/juegos" element={<GamesPage />} />
          <Route path="/juegos/:id" element={<GameRoute />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </HashRouter>
  )
}

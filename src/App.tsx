import { useEffect } from 'react'
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { LegacyRedirect, SubjectLayout, TopNav, YearPage, YearsHome } from './pages/Structure'
import { PlayerBadge } from './components/PlayerBadge'
import { ErrorBoundary } from './components/ErrorBoundary'

/** al cambiar de página, volver arriba */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

/** si una página falla, sólo esa página muestra el error (y se limpia al cambiar de página) */
function RouteBoundary({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-icon">🛠</span>
          <span>
            Escuela <strong>Técnica</strong>
          </span>
        </NavLink>
        <TopNav />
        <PlayerBadge />
      </header>
      <main>
        <RouteBoundary>
        <Routes>
          <Route path="/" element={<YearsHome />} />
          {['componentes', 'teoria', 'actividades', 'juegos', 'ranking'].map((p) => (
            <Route key={p} path={`/${p}/*`} element={<LegacyRedirect />} />
          ))}
          <Route path="/:anio" element={<YearPage />} />
          <Route path="/:anio/:materia/*" element={<SubjectLayout />} />
          <Route path="*" element={<YearsHome />} />
        </Routes>
        </RouteBoundary>
      </main>
    </HashRouter>
  )
}

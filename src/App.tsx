import { useEffect } from 'react'
import { HashRouter, MemoryRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { LegacyRedirect, SubjectLayout, TopNav, YearPage, YearsHome } from './pages/Structure'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BulbBadge } from './components/Bulbs'

/**
 * Dentro de otra página (por ejemplo, la vista previa de Claude) la dirección del marco no se puede
 * cambiar con seguridad: ahí la navegación se guarda en memoria. Publicada sola (GitHub Pages) usa
 * la dirección con # para que los links se puedan compartir.
 */
const inFrame = (() => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
})()
const Router = inFrame ? MemoryRouter : HashRouter

/** al cambiar de página, volver arriba */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** si una página falla, sólo esa página muestra el error (y se limpia al cambiar de página) */
function RouteBoundary({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
}

export default function App() {
  return (
    <ErrorBoundary>
    <Router>
      <ScrollToTop />
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-icon">🛠</span>
          <span>
            ITS <strong>Villada</strong>
          </span>
        </NavLink>
        <TopNav />
        <BulbBadge />
      </header>
      <main>
        <RouteBoundary>
        <Routes>
          <Route path="/" element={<YearsHome />} />
          {['componentes', 'teoria', 'actividades', 'juegos'].map((p) => (
            <Route key={p} path={`/${p}/*`} element={<LegacyRedirect />} />
          ))}
          <Route path="/:anio" element={<YearPage />} />
          <Route path="/:anio/:materia/*" element={<SubjectLayout />} />
          <Route path="*" element={<YearsHome />} />
        </Routes>
        </RouteBoundary>
      </main>
    </Router>
    </ErrorBoundary>
  )
}

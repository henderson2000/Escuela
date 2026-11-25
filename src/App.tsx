import { Suspense, useEffect } from 'react'
import { HashRouter, MemoryRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { DocumentTitle, LegacyRedirect, PageLoading, SubjectLayout, TopNav, YearPage, YearsHome } from './pages/Structure'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BulbBadge } from './components/Bulbs'
import { lazyNamed } from './lib/lazy'

const ProgressPage = lazyNamed(() => import('./pages/ProgressPage'), 'ProgressPage')

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

/**
 * Al cambiar de página, volver arriba. Elegir otro componente dentro del laboratorio no cuenta
 * como cambiar de página: la pantalla se queda donde estaba.
 */
const scrollKey = (p: string) => p.replace(/\/laboratorio\/(?!mesa$|misiones)[^/]+$/, '/laboratorio')
function ScrollToTop() {
  const { pathname } = useLocation()
  const key = scrollKey(pathname)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [key])
  return null
}

/** si una página falla, sólo esa página muestra el error (y se limpia al cambiar de página) */
function RouteBoundary({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  // elegir otro componente del laboratorio no es otra página: no se vuelve a armar todo
  return <ErrorBoundary key={scrollKey(pathname)}>{children}</ErrorBoundary>
}

export default function App() {
  return (
    <ErrorBoundary>
    <Router>
      <ScrollToTop />
      <DocumentTitle />
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
          <Route
            path="/progreso"
            element={
              <Suspense fallback={<PageLoading />}>
                <ProgressPage />
              </Suspense>
            }
          />
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

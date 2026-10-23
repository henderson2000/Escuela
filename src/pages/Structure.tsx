import { Suspense, use, useEffect, useRef } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { SUBJECTS, YEARS, getRotation, getYear } from '../data/curriculum'
import { BaseContext } from '../lib/nav'
import { SubjectContext } from '../lib/subject'
import { lazyNamed } from '../lib/lazy'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { SUBJECT_NAV, hasSubjectContent, loadSubject, subjectKey } from '../subjects'

// páginas comunes a todos los talleres: se descargan recién cuando se abren
const ComponentsPage = lazyNamed(() => import('./ComponentsPage'), 'ComponentsPage')
const ComponentDetail = lazyNamed(() => import('./ComponentDetail'), 'ComponentDetail')
const TheoryPage = lazyNamed(() => import('./TheoryPage'), 'TheoryPage')
const TopicPage = lazyNamed(() => import('./TheoryPage'), 'TopicPage')
const ActivitiesPage = lazyNamed(() => import('./ActivitiesPage'), 'ActivitiesPage')
const GamesPage = lazyNamed(() => import('./GamesPage'), 'GamesPage')
const GameRoute = lazyNamed(() => import('./GameRoute'), 'GameRoute')

function prefetchSubject(anio: string, materia: string) {
  if (hasSubjectContent(anio, materia)) loadSubject(subjectKey(anio, materia)).catch(() => undefined)
}

/** Cartel mientras se descarga una parte de la página. */
export function PageLoading() {
  return (
    <div className="page page-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden />
      Cargando…
    </div>
  )
}

/* ------------------------------------------------------------------ inicio: elegir año */

export function YearsHome() {
  return (
    <div className="page years-home">
      <section className="years-hero">
        <h1>
          Plataforma de <span className="accent">talleres</span>
        </h1>
        <p className="lead">Elegí tu año para ver los talleres.</p>
      </section>
      <div className="year-buttons">
        {YEARS.map((y) => {
          const subjects = y.rotations.map((r) => r.subject).filter(Boolean) as string[]
          const ready = y.rotations.filter((r) => r.ready && hasSubjectContent(y.id, r.subject ?? '')).length
          return (
            <Link key={y.id} to={`/${y.id}`} className={`year-btn ${ready ? '' : 'soon'}`}>
              <span className="year-num">{y.short}</span>
              <span className="year-name">{y.name}</span>
              <span className="year-detail">
                {subjects.length ? subjects.map((s) => SUBJECTS[s].name).join(' · ') : 'Próximamente'}
              </span>
              <span className={`pill ${ready ? 'ok' : ''}`}>{ready ? `${ready} ${ready === 1 ? 'taller disponible' : 'talleres disponibles'}` : 'Próximamente'}</span>
            </Link>
          )
        })}
      </div>
      <div className="home-footer-links">
        <Link to="/progreso" className="btn ghost">
          📊 Progreso de esta computadora
        </Link>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ año: las 4 rotaciones */

export function YearPage() {
  const { anio } = useParams()
  const year = getYear(anio)
  if (!year) return <Navigate to="/" replace />
  return (
    <div className="page">
      <Link to="/" className="back">
        ← Elegir año
      </Link>
      <h1>{year.name}</h1>
      <p className="lead">Elegí el taller.</p>
      <div className="rotation-grid">
        {year.rotations.map((r) => {
          const s = r.subject ? SUBJECTS[r.subject] : null
          const content = (
            <>
              {s ? (
                <>
                  <span className="rotation-icon">{s.icon}</span>
                  <strong>{s.name}</strong>
                  <span className="rotation-desc">{r.ready ? r.desc : 'Contenido en preparación.'}</span>
                  <span className={`pill ${r.ready ? 'ok' : ''}`}>{r.ready ? 'Disponible' : 'Próximamente'}</span>
                </>
              ) : (
                <>
                  <span className="rotation-icon muted">＋</span>
                  <strong>Sin taller asignado</strong>
                  <span className="rotation-desc">Todavía no hay contenido para esta rotación.</span>
                  <span className="pill">Próximamente</span>
                </>
              )}
            </>
          )
          return s ? (
            <Link
              key={r.n}
              to={`/${year.id}/${s.id}`}
              className={`rotation-card ${r.ready ? '' : 'soon'}`}
              // el taller empieza a descargarse apenas se apunta a la tarjeta
              onPointerEnter={() => prefetchSubject(year.id, s.id)}
              onFocus={() => prefetchSubject(year.id, s.id)}
              onTouchStart={() => prefetchSubject(year.id, s.id)}
            >
              {content}
            </Link>
          ) : (
            <div key={r.n} className="rotation-card soon" aria-disabled>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ taller */

function ComingSoon({ yearId, subjectId }: { yearId: string; subjectId: string }) {
  const s = SUBJECTS[subjectId]
  return (
    <div className="page narrow">
      <Link to={`/${yearId}`} className="back">
        ← Talleres
      </Link>
      <div className="card coming-soon">
        <span className="rotation-icon">{s.icon}</span>
        <h1>{s.name}</h1>
        <p>Este taller todavía no tiene contenido. Muy pronto vas a encontrar acá la teoría, las actividades y los juegos.</p>
        <Link to={`/${yearId}`} className="btn primary">
          Volver a los talleres
        </Link>
      </div>
    </div>
  )
}

/** Contenido de un taller (sólo los que tienen contenido cargado tienen páginas). */
export function SubjectLayout() {
  const { anio = '', materia = '' } = useParams()
  const year = getYear(anio)
  const subject = SUBJECTS[materia]
  const rotation = getRotation(anio, materia)
  if (!year || !subject || !rotation) return <Navigate to={year ? `/${anio}` : '/'} replace />
  if (!rotation.ready || !hasSubjectContent(anio, materia)) return <ComingSoon yearId={anio} subjectId={materia} />
  const key = subjectKey(anio, materia)
  return (
    <ErrorBoundary key={key}>
      <Suspense fallback={<PageLoading />}>
        <SubjectRoutes subjectKey={key} base={`/${anio}/${materia}`} />
      </Suspense>
    </ErrorBoundary>
  )
}

function SubjectRoutes({ subjectKey: key, base }: { subjectKey: string; base: string }) {
  const content = use(loadSubject(key))
  const Home = content.Home
  return (
    <SubjectContext.Provider value={content}>
      <BaseContext.Provider value={base}>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route index element={<Home />} />
            {content.catalog.length > 0 && (
              <>
                <Route path="componentes" element={<ComponentsPage />} />
                <Route path="componentes/:id" element={<ComponentDetail />} />
              </>
            )}
            {content.topics.length > 0 && (
              <>
                <Route path="teoria" element={<TheoryPage />} />
                <Route path="teoria/:id" element={<TopicPage />} />
                <Route path="actividades" element={<ActivitiesPage />} />
              </>
            )}
            <Route path="juegos" element={<GamesPage />} />
            <Route path="juegos/:id" element={<GameRoute />} />
            {content.routes?.map(({ path, Page }) => <Route key={path} path={path} element={<Page />} />)}
            <Route path="*" element={<Navigate to={base} replace />} />
          </Routes>
        </Suspense>
      </BaseContext.Provider>
    </SubjectContext.Provider>
  )
}

/** Links viejos (#/componentes, #/juegos…) siguen funcionando: van a 3er año › Electrónica. */
export function LegacyRedirect() {
  const { pathname } = useLocation()
  return <Navigate to={`/3/electronica${pathname}`} replace />
}

/* ------------------------------------------------------------------ barra superior */

/** Migas (Año › Taller) y, dentro de un taller con contenido, su menú. */
export function TopNav() {
  const { pathname } = useLocation()
  const [, anio, materia] = pathname.split('/')
  const year = getYear(anio)
  const subject = year && materia ? SUBJECTS[materia] : undefined
  const base = subject ? `/${anio}/${materia}` : ''
  const nav = SUBJECT_NAV[subjectKey(anio, materia)]
  const navRef = useRef<HTMLElement>(null)

  // en pantallas angostas el menú se desliza: que se vea la sección activa
  useEffect(() => {
    const el = navRef.current
    const a = el?.querySelector<HTMLElement>('a.active')
    if (!el || !a) return
    const left = a.offsetLeft - (el.clientWidth - a.offsetWidth) / 2
    el.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [pathname])

  return (
    <div className="topnav">
      {year && (
        <nav className="crumbs" aria-label="Ubicación">
          <NavLink to={`/${year.id}`} end>
            {year.name}
          </NavLink>
          {subject && (
            <>
              <span aria-hidden>›</span>
              <NavLink to={base} end>
                {subject.icon} {subject.name}
              </NavLink>
            </>
          )}
        </nav>
      )}
      {subject && getRotation(anio, materia)?.ready && nav && (
        <nav className="nav" aria-label="Secciones del taller" ref={navRef}>
          {nav.map((n) => (
            <NavLink key={n.to} to={base + n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

/** Título de la pestaña según dónde se está (ej. "Juegos · Electrónica · 3er año · ITS Villada"). */
export function DocumentTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const [, anio, materia, ...rest] = pathname.split('/')
    const parts: string[] = []
    if (anio === 'progreso') parts.push('Progreso')
    const year = getYear(anio)
    const subject = year && materia ? SUBJECTS[materia] : undefined
    if (subject) {
      const nav = SUBJECT_NAV[subjectKey(anio, materia)] ?? []
      const here = '/' + rest.join('/')
      const section = nav.filter((n) => n.to && (here === n.to || here.startsWith(n.to + '/'))).sort((a, b) => b.to.length - a.to.length)[0]
      if (section) parts.push(section.label)
      parts.push(subject.name)
    }
    if (year) parts.push(year.name)
    parts.push('ITS Villada · Talleres')
    document.title = parts.join(' · ')
  }, [pathname])
  return null
}

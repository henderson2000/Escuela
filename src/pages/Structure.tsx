import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { SUBJECTS, YEARS, getRotation, getYear } from '../data/curriculum'
import { BaseContext } from '../lib/nav'
import { SubjectContext } from '../lib/subject'
import { getSubjectContent } from '../subjects'
import { SimulatorPage } from '../logo/pages/SimulatorPage'
import { GuidePage } from '../logo/pages/GuidePage'
import { ExercisePage } from '../logo/pages/ExercisePage'
import { TrackPage } from '../compu/pages/TrackPage'
import { LessonPage } from '../compu/pages/LessonPage'
import { PlaygroundPage } from '../compu/pages/PlaygroundPage'
import { TornoGuidePage } from '../torno/pages/TornoGuidePage'
import { ComponentsPage } from './ComponentsPage'
import { ComponentDetail } from './ComponentDetail'
import { TheoryPage, TopicPage } from './TheoryPage'
import { ActivitiesPage } from './ActivitiesPage'
import { GamesPage } from './GamesPage'
import { GameRoute } from './GameRoute'
import { RankingPage } from './RankingPage'

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
          return (
            <Link key={y.id} to={`/${y.id}`} className="year-btn">
              <span className="year-num">{y.short}</span>
              <span className="year-name">{y.name}</span>
              <span className="year-detail">
                {subjects.length ? subjects.map((s) => SUBJECTS[s].name).join(' · ') : 'Próximamente'}
              </span>
            </Link>
          )
        })}
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
            <Link key={r.n} to={`/${year.id}/${s.id}`} className={`rotation-card ${r.ready ? '' : 'soon'}`}>
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

/** Contenido de un taller (sólo los que figuran en SUBJECT_CONTENT tienen páginas). */
export function SubjectLayout() {
  const { anio = '', materia = '' } = useParams()
  const year = getYear(anio)
  const subject = SUBJECTS[materia]
  const rotation = getRotation(anio, materia)
  if (!year || !subject || !rotation) return <Navigate to={year ? `/${anio}` : '/'} replace />
  const content = getSubjectContent(anio, materia)
  if (!rotation.ready || !content) return <ComingSoon yearId={anio} subjectId={materia} />
  const Home = content.Home

  return (
    <SubjectContext.Provider value={content}>
    <BaseContext.Provider value={`/${anio}/${materia}`}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="componentes" element={<ComponentsPage />} />
        <Route path="componentes/:id" element={<ComponentDetail />} />
        <Route path="teoria" element={<TheoryPage />} />
        <Route path="teoria/:id" element={<TopicPage />} />
        <Route path="actividades" element={<ActivitiesPage />} />
        <Route path="juegos" element={<GamesPage />} />
        <Route path="juegos/:id" element={<GameRoute />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="simulador" element={<SimulatorPage />} />
        <Route path="guia" element={<GuidePage />} />
        <Route path="guia/:id" element={<ExercisePage />} />
        <Route path="curso/:track" element={<TrackPage />} />
        <Route path="curso/:track/:lesson" element={<LessonPage />} />
        <Route path="taller-libre" element={<PlaygroundPage />} />
        <Route path="ejercicios" element={<TornoGuidePage />} />
        <Route path="*" element={<Navigate to={`/${anio}/${materia}`} replace />} />
      </Routes>
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
  const content = getSubjectContent(anio, materia)

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
      {subject && getRotation(anio, materia)?.ready && content && (
        <nav className="nav">
          {content.nav.map((n) => (
            <NavLink key={n.to} to={base + n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

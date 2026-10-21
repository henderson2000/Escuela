import { Link, useParams } from 'react-router-dom'
import { useSubject } from '../lib/subject'
import { ActivityList } from '../components/ActivityList'
import { useSub } from '../lib/nav'

export function TheoryPage() {
  const sub = useSub()
  const { topics: TOPICS, catalog: CATALOG } = useSubject()
  return (
    <div className="page">
      <h1>Teoría</h1>
      <p className="lead">Los conceptos que vemos en clase, con ejemplos y calculadoras para experimentar.</p>
      <h2 className="section-title">Conceptos</h2>
      <div className="grid cards">
        {TOPICS.map((t, i) => (
          <Link key={t.id} to={sub(`/teoria/${t.id}`)} className="comp-card">
            <span className="comp-icon">{t.icon}</span>
            <strong>
              {i + 1}. {t.title}
            </strong>
            <span>{t.summary}</span>
          </Link>
        ))}
      </div>
      <h2 className="section-title">Teoría de cada componente</h2>
      <div className="grid cards small">
        {CATALOG.map((c) => (
          <Link key={c.id} to={sub(`/componentes/${c.id}`)} className="comp-card">
            <span className="comp-icon">{c.icon}</span>
            <strong>{c.name}</strong>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function TopicPage() {
  const sub = useSub()
  const { id = '' } = useParams()
  const { topics: TOPICS } = useSubject()
  const t = TOPICS.find((x) => x.id === id)
  if (!t) return <div className="page">Tema no encontrado.</div>
  const idx = TOPICS.indexOf(t)
  const next = TOPICS[idx + 1]
  return (
    <div className="page narrow">
      <Link to={sub('/teoria')} className="back">
        ← Teoría
      </Link>
      <h1>
        <span className="icon">{t.icon}</span> {t.title}
      </h1>
      <article className="card prose">{t.content}</article>
      <h2 className="section-title">Actividades</h2>
      <section className="card">
        <ActivityList activities={t.activities} />
      </section>
      {next && (
        <Link to={sub(`/teoria/${next.id}`)} className="btn primary">
          Siguiente tema: {next.title} →
        </Link>
      )}
    </div>
  )
}

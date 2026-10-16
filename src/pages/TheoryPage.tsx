import { Link, useParams } from 'react-router-dom'
import { TOPICS, getTopic } from '../data/theory'
import { CATALOG } from '../catalog'
import { ActivityList } from '../components/ActivityList'

export function TheoryPage() {
  return (
    <div className="page">
      <h1>Teoría</h1>
      <p className="lead">Los conceptos que vemos en clase, con ejemplos y calculadoras para experimentar.</p>
      <h2 className="section-title">Conceptos</h2>
      <div className="grid cards">
        {TOPICS.map((t, i) => (
          <Link key={t.id} to={`/teoria/${t.id}`} className="comp-card">
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
          <Link key={c.id} to={`/componentes/${c.id}`} className="comp-card">
            <span className="comp-icon">{c.icon}</span>
            <strong>{c.name}</strong>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function TopicPage() {
  const { id = '' } = useParams()
  const t = getTopic(id)
  if (!t) return <div className="page">Tema no encontrado.</div>
  const idx = TOPICS.indexOf(t)
  const next = TOPICS[idx + 1]
  return (
    <div className="page narrow">
      <Link to="/teoria" className="back">
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
        <Link to={`/teoria/${next.id}`} className="btn primary">
          Siguiente tema: {next.title} →
        </Link>
      )}
    </div>
  )
}

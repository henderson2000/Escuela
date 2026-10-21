import { Link } from 'react-router-dom'
import { useSubject } from '../lib/subject'
import { useSub } from '../lib/nav'

export function ComponentsPage() {
  const sub = useSub()
  const { catalog: CATALOG, labels } = useSubject()
  const cats = [...new Set(CATALOG.map((c) => c.category))]
  return (
    <div className="page">
      <h1>{labels?.components ?? 'Componentes en 3D'}</h1>
      <p className="lead">
        {labels?.componentsLead ?? 'Elegí un componente para verlo en 3D, modificarlo, despiezarlo y descubrir para qué sirve cada parte.'}
      </p>
      {cats.map((cat) => (
        <section key={cat}>
          <h2 className="section-title">{cat}</h2>
          <div className="grid cards">
            {CATALOG.filter((c) => c.category === cat).map((c) => (
              <Link key={c.id} to={sub(`/componentes/${c.id}`)} className="comp-card">
                <span className="comp-icon">{c.icon}</span>
                <strong>{c.name}</strong>
                <span>{c.short}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

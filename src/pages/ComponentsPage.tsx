import { Link } from 'react-router-dom'
import { CATALOG } from '../catalog'

export function ComponentsPage() {
  const cats = [...new Set(CATALOG.map((c) => c.category))]
  return (
    <div className="page">
      <h1>Componentes en 3D</h1>
      <p className="lead">
        Elegí un componente para verlo en 3D, modificarlo, despiezarlo y descubrir para qué sirve cada parte.
      </p>
      {cats.map((cat) => (
        <section key={cat}>
          <h2 className="section-title">{cat}</h2>
          <div className="grid cards">
            {CATALOG.filter((c) => c.category === cat).map((c) => (
              <Link key={c.id} to={`/componentes/${c.id}`} className="comp-card">
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

import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { partsOf } from '../catalog'
import { useSubject } from '../lib/subject'
import { Viewer } from '../three/Viewer'
import { ActivityList } from '../components/ActivityList'
import { useSub } from '../lib/nav'
import { NotFound } from '../components/ui'

type Tab = '3d' | 'teoria' | 'actividades'

export function ComponentDetail() {
  const { id = '' } = useParams()
  // la key reinicia todo el estado al cambiar de componente
  return <Detail key={id} id={id} />
}

function Detail({ id }: { id: string }) {
  const sub = useSub()
  const { catalog, labels: texts } = useSubject()
  const def = catalog.find((c) => c.id === id)
  const [params, setParams] = useState(def?.defaultParams ?? {})
  const [explode, setExplode] = useState(0)
  const [labels, setLabels] = useState(false)
  const [hidden, setHidden] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('3d')

  const parts = def ? partsOf(def, params) : []
  const names = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, p.name])), [parts])

  if (!def) {
    return <NotFound what="ese componente" back={sub('/componentes')} backLabel={`Ver ${texts?.componentsBack ?? 'Componentes'}`} />
  }

  const sel = parts.find((p) => p.id === selected)

  return (
    <div className="page detail">
      <div className="detail-head">
        <Link to={sub('/componentes')} className="back">
          ← {texts?.componentsBack ?? 'Componentes'}
        </Link>
        <h1>
          <span className="icon">{def.icon}</span> {def.name}
        </h1>
        <p className="lead">{def.short}</p>
        <div className="tabs" role="tablist">
          {(
            [
              ['3d', 'Ver en 3D'],
              ['teoria', 'Teoría'],
              ['actividades', `Actividades (${def.activities.length})`],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === '3d' && (
        <div className="lab">
          <div className="lab-view">
            <div className="lab-stage">
            <Viewer
              key={def.id}
              camera={def.camera}
              target={def.target}
              shadowY={def.shadowY}
              parts={{ explode, labels, hidden, selected, names, onSelect: (pid) => setSelected(pid === selected ? null : pid) }}
              onBackgroundClick={() => setSelected(null)}
            >
              {def.render(params)}
            </Viewer>
              <div className="explode-bar">
                <label className="explode-range">
                  <span>Despiezar</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(explode * 100)}
                    onChange={(e) => setExplode(Number(e.target.value) / 100)}
                    aria-label="Despiezar"
                  />
                  <b>{Math.round(explode * 100)} %</b>
                </label>
                <button type="button" className="btn small" onClick={() => setExplode(explode > 0.5 ? 0 : 1)}>
                  {explode > 0.5 ? 'Armar' : 'Despiezar'}
                </button>
                <button type="button" className={`btn small ${labels ? 'primary' : ''}`} onClick={() => setLabels(!labels)} aria-pressed={labels}>
                  🏷 Nombres
                </button>
              </div>
            </div>
            <div className="viewer-help">
              <span className="only-mouse">🖱️ Arrastrá para girar · rueda para zoom · clic derecho para mover · clic en una pieza para ver qué es</span>
              <span className="only-touch">👆 Deslizá para girar · pellizcá para zoom · dos dedos para mover · tocá una pieza para ver qué es</span>
            </div>
          </div>

          <aside className="lab-panel">
            <section className="card">
              <h3>Modificar</h3>
              <def.Controls params={params} set={(patch) => setParams((p) => ({ ...p, ...patch }))} />
            </section>

            <section className="card">
              <h3>Partes</h3>
              <p className="hint">Tildá o destildá para mostrar u ocultar cada pieza. Tocá el nombre para ver qué es.</p>
              <ul className="parts-list">
                {parts.map((p) => (
                  <li key={p.id} className={selected === p.id ? 'active' : ''}>
                    <input
                      type="checkbox"
                      checked={!hidden[p.id]}
                      title={hidden[p.id] ? 'Mostrar' : 'Ocultar'}
                      onChange={(e) => setHidden((h) => ({ ...h, [p.id]: !e.target.checked }))}
                    />
                    <button type="button" onClick={() => setSelected(selected === p.id ? null : p.id)}>
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="row">
                <button className="btn small" type="button" onClick={() => setHidden({})}>
                  Mostrar todo
                </button>
              </div>
              {sel && (
                <div className="part-info">
                  <h4>{sel.name}</h4>
                  <p>{sel.desc}</p>
                </div>
              )}
            </section>
          </aside>
        </div>
      )}

      {tab === 'teoria' && (
        <article className="card prose">
          {def.theory}
          <h4>Partes del componente</h4>
          <dl className="parts-dl">
            {parts.map((p) => (
              <div key={p.id}>
                <dt>{p.name}</dt>
                <dd>{p.desc}</dd>
              </div>
            ))}
          </dl>
          <button className="btn primary" type="button" onClick={() => setTab('actividades')}>
            Ir a las actividades →
          </button>
        </article>
      )}

      {tab === 'actividades' && (
        <section className="card">
          <ActivityList activities={def.activities} />
        </section>
      )}
    </div>
  )
}

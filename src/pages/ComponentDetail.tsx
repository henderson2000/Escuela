import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getComponent, partsOf } from '../catalog'
import { Viewer } from '../three/Viewer'
import { ActivityList } from '../components/ActivityList'
import { Slider, Toggle } from '../components/ui'
import { useSub } from '../lib/nav'

type Tab = '3d' | 'teoria' | 'actividades'

export function ComponentDetail() {
  const { id = '' } = useParams()
  // la key reinicia todo el estado al cambiar de componente
  return <Detail key={id} id={id} />
}

function Detail({ id }: { id: string }) {
  const sub = useSub()
  const def = getComponent(id)
  const [params, setParams] = useState(def?.defaultParams ?? {})
  const [explode, setExplode] = useState(0)
  const [labels, setLabels] = useState(false)
  const [hidden, setHidden] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('3d')

  const parts = def ? partsOf(def, params) : []
  const names = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, p.name])), [parts])

  if (!def) {
    return (
      <div className="page">
        <p>No encontramos ese componente.</p>
        <Link to={sub('/componentes')}>Volver</Link>
      </div>
    )
  }

  const sel = parts.find((p) => p.id === selected)

  return (
    <div className="page detail">
      <div className="detail-head">
        <Link to={sub('/componentes')} className="back">
          ← Componentes
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
            <div className="viewer-help">🖱️ Arrastrá para girar · rueda para zoom · clic derecho para mover · clic en una pieza para ver qué es</div>
          </div>

          <aside className="lab-panel">
            <section className="card">
              <h3>Modificar</h3>
              <def.Controls params={params} set={(patch) => setParams((p) => ({ ...p, ...patch }))} />
            </section>

            <section className="card">
              <h3>Partes</h3>
              <Toggle label="Mostrar nombres de las partes" value={labels} onChange={setLabels} />
              <Slider label="Despiezar" value={Math.round(explode * 100)} min={0} max={100} onChange={(v) => setExplode(v / 100)} format={(v) => `${v} %`} />
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
                <button className="btn small" type="button" onClick={() => setExplode(explode > 0.5 ? 0 : 1)}>
                  {explode > 0.5 ? 'Armar' : 'Despiezar'}
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

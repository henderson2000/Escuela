import { useMemo, useRef, useState } from 'react'
// (el entorno 3D de cada taller viene del contenido del taller: subject.environment)
import { Link, useNavigate, useParams } from 'react-router-dom'
import { partsOf, type ComponentDef } from '../catalog/types'
import { useSubject } from '../lib/subject'
import { useSub } from '../lib/nav'
import { LabScene, type CameraRequest, type ViewName } from './LabScene'
import { BOARD_PINS, GROUP_INFO, PinsOverlay, SPECS } from './boardInfo'
import './lab.css'

type Tab = 'partes' | 'usar' | 'ficha'

const VIEWS: [ViewName, string][] = [
  ['iso', 'Iso'],
  ['top', 'Arriba'],
  ['front', 'Frente'],
  ['side', 'Costado'],
  ['fit', 'Encuadrar'],
]

/** Laboratorio: mesa de trabajo en 3D con todos los componentes del taller. */
export function LabPage() {
  const { id } = useParams()
  const { catalog } = useSubject()
  const first = catalog.find((c) => c.category === 'Placas') ?? catalog[0]
  const def = catalog.find((c) => c.id === id) ?? first
  // la biblioteca queda fija (no pierde su desplazamiento); la key reinicia sólo la mesa y el panel
  return (
    <div className="labx">
      <Library current={def.id} />
      <Lab key={def.id} def={def} />
    </div>
  )
}

/** Biblioteca de componentes, agrupada por categoría y con buscador. */
function Library({ current }: { current: string }) {
  const sub = useSub()
  const navigate = useNavigate()
  const { catalog } = useSubject()
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = catalog.filter((c) => !q || `${c.name} ${c.short} ${c.category}`.toLowerCase().includes(q))
    const m = new Map<string, ComponentDef[]>()
    for (const c of list) m.set(c.category, [...(m.get(c.category) ?? []), c])
    return [...m.entries()]
  }, [catalog, query])
  return (
    <aside className="labx-lib">
      <input className="input labx-search" type="search" placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar en la biblioteca" />
      <div className="labx-lib-list">
        {groups.map(([cat, items]) => (
          <section key={cat}>
            <h4>{cat}</h4>
            {items.map((c) => (
              <button key={c.id} type="button" className={`labx-item ${c.id === current ? 'active' : ''}`} onClick={() => navigate(sub(`/laboratorio/${c.id}`), { replace: true })}>
                <span className="labx-item-icon">{c.icon}</span>
                <span>
                  <b>{c.name}</b>
                  <small>{c.short}</small>
                </span>
              </button>
            ))}
          </section>
        ))}
        {groups.length === 0 && <p className="hint">No hay nada con ese nombre.</p>}
      </div>
    </aside>
  )
}

function Lab({ def }: { def: ComponentDef }) {
  const sub = useSub()
  const { nav, environment } = useSubject()
  const hasBench = nav.some((n) => n.to === '/laboratorio/mesa')
  const [params, setParams] = useState(def.defaultParams)
  const [explode, setExplode] = useState(0)
  const [labels, setLabels] = useState(false)
  const [hidden, setHidden] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [cam, setCam] = useState<CameraRequest>({ view: 'iso', n: 1 })
  const [tab, setTab] = useState<Tab>('partes')
  const [pinsOn, setPinsOn] = useState(false)
  const [hoverPin, setHoverPin] = useState<string | null>(null)
  const stage = useRef<HTMLDivElement>(null)

  const parts = partsOf(def, params)
  const names = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, p.name])), [parts])
  const board = BOARD_PINS[def.id]
  const isUno = !!board
  const specs = SPECS[def.id]

  const pick = (pid: string | null) => {
    setSelected(pid)
    if (pid) setCam((c) => ({ part: pid, n: c.n + 1 }))
  }
  const view = (v: ViewName) => {
    setSelected(null)
    setCam((c) => ({ view: v, n: c.n + 1 }))
  }

  const sel = parts.find((p) => p.id === selected)
  const pin = hoverPin && board ? board.info(hoverPin) : null

  const fullscreen = () => {
    const el = stage.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen?.()
  }

  return (
    <>
      {/* ---------------- mesa 3D */}
      <div className="labx-stage" ref={stage}>
        <div className="labx-toolbar">
          <div className="labx-views" role="group" aria-label="Vistas">
            {VIEWS.map(([v, label]) => (
              <button key={v} type="button" className="btn small" onClick={() => view(v)}>
                {label}
              </button>
            ))}
          </div>
          <div className="labx-tools">
            <button type="button" className={`btn small ${labels ? 'primary' : ''}`} aria-pressed={labels} onClick={() => setLabels(!labels)}>
              Nombres
            </button>
            {isUno && (
              <button type="button" className={`btn small ${pinsOn ? 'primary' : ''}`} aria-pressed={pinsOn} onClick={() => setPinsOn(!pinsOn)}>
                Pines
              </button>
            )}
            <button type="button" className={`btn small ${explode > 0.5 ? 'primary' : ''}`} onClick={() => setExplode(explode > 0.5 ? 0 : 1)}>
              {explode > 0.5 ? 'Armar' : 'Despiezar'}
            </button>
            <button type="button" className="btn small" onClick={fullscreen} title="Pantalla completa">
              ⛶
            </button>
          </div>
        </div>

        <LabScene
          environment={def.environment ?? environment}
          mount={def.mount}
          modelKey={def.id}
          camera={cam}
          parts={{ explode, labels, hidden, selected, names, onSelect: (pid) => pick(pid === selected ? null : pid) }}
          onBackgroundClick={() => setSelected(null)}
          overlay={board && pinsOn ? <PinsOverlay board={board} hover={hoverPin} onHover={setHoverPin} /> : null}
        >
          {def.render(params)}
        </LabScene>

        {isUno && pinsOn && (
          <div className="labx-pin-card">
            {pin && hoverPin && board ? (
              <>
                <span className="labx-dot" style={{ background: GROUP_INFO[board.group(hoverPin)].color }} />
                <b>{pin.title}</b>
                <p>{pin.text}</p>
              </>
            ) : (
              <>
                <b>Pasá el mouse por un pin</b>
                <div className="labx-legend">
                  {(['power', 'ground', 'digital', 'pwm', 'analog', 'bus', 'control'] as const).map((g) => (
                    <span key={g}>
                      <span className="labx-dot" style={{ background: GROUP_INFO[g].color }} /> {GROUP_INFO[g].label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {sel && (
          <div className="labx-part-card">
            <button type="button" className="labx-close" onClick={() => setSelected(null)} aria-label="Cerrar">
              ×
            </button>
            <b>
              {parts.indexOf(sel) + 1}. {sel.name}
            </b>
            <p>{sel.desc}</p>
          </div>
        )}
        <div className="labx-help">Arrastrá para girar · rueda para acercar · clic derecho para mover · clic en una pieza para ver qué es</div>
      </div>

      {/* ---------------- panel del componente */}
      <aside className="labx-panel">
        <div className="labx-head">
          <span className="labx-head-icon">{def.icon}</span>
          <div>
            <h2>{def.name}</h2>
            <p>{def.short}</p>
          </div>
        </div>
        <div className="tabs" role="tablist">
          {(
            [
              ['partes', `Partes (${parts.length})`],
              ['usar', 'Usar'],
              ...(specs ? ([['ficha', 'Ficha']] as [Tab, string][]) : []),
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'partes' && (
          <ol className="labx-parts">
            {parts.map((p, i) => (
              <li key={p.id} className={selected === p.id ? 'active' : ''}>
                <button type="button" onClick={() => pick(selected === p.id ? null : p.id)}>
                  <span className="labx-num">{i + 1}</span>
                  <span>
                    <b>{p.name}</b>
                    {selected === p.id && <small>{p.desc}</small>}
                  </span>
                </button>
                <input
                  type="checkbox"
                  checked={!hidden[p.id]}
                  title={hidden[p.id] ? 'Mostrar' : 'Ocultar'}
                  aria-label={`Mostrar ${p.name}`}
                  onChange={(e) => setHidden((h) => ({ ...h, [p.id]: !e.target.checked }))}
                />
              </li>
            ))}
          </ol>
        )}

        {tab === 'usar' && (
          <div className="labx-controls">
            <def.Controls params={params} set={(patch) => setParams((p) => ({ ...p, ...patch }))} />
          </div>
        )}

        {tab === 'ficha' && specs && (
          <div className="labx-specs">
            <table>
              <tbody>
                {specs.rows.map(([k, v]) => (
                  <tr key={k}>
                    <th>{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h4>Ventajas</h4>
            <ul>
              {specs.good.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <h4>Cuidado con…</h4>
            <ul className="labx-careful">
              {specs.careful.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="labx-more row wrap">
          {hasBench && (
            <Link className="btn small primary" to={sub('/laboratorio/mesa')}>
              🛠 Usarlo en la mesa de trabajo
            </Link>
          )}
          <Link className="btn small" to={sub(`/componentes/${def.id}`)}>
            Teoría y actividades →
          </Link>
        </div>
      </aside>
    </>
  )
}

import { useEffect, useState } from 'react'
import type { Topic } from '../../data/theory'
import { Field, Formula, Readout, Segmented, Slider } from '../../components/ui'
import { ELEMENTS, KIND_NAMES, SHELL_MAX, SHELL_NAMES, shellsWithCharge } from './atoms'
import './e1.css'

const fmt = (n: number, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace('.', ',') : '—')

/* ------------------------------------------------------------------ simuladores chicos */

function AtomShells() {
  const [sym, setSym] = useState('Si')
  const [charge, setCharge] = useState(0)
  const el = ELEMENTS.find((e) => e.sym === sym)!
  const shells = shellsWithCharge(el, charge)
  const total = shells.reduce((a, b) => a + b, 0)
  const R = [34, 56, 78, 100]
  return (
    <div className="calc e1-atom">
      <div className="row wrap">
        <select className="input" value={sym} onChange={(e) => (setSym(e.target.value), setCharge(0))} aria-label="Elemento">
          {ELEMENTS.map((e) => (
            <option key={e.sym} value={e.sym}>
              {e.name} ({e.sym})
            </option>
          ))}
        </select>
        <Segmented<number>
          value={charge}
          onChange={setCharge}
          options={[
            { value: 1, label: 'Pierde 1 e⁻' },
            { value: 0, label: 'Neutro' },
            { value: -1, label: 'Gana 1 e⁻' },
          ]}
        />
      </div>
      <svg viewBox="-112 -112 224 224" className="e1-atom-svg" role="img" aria-label={`Átomo de ${el.name}`}>
        {shells.map((n, i) => (
          <g key={i}>
            <circle r={R[i]} className={`orbit ${i === shells.length - 1 ? 'val' : ''}`} />
            {Array.from({ length: n }, (_, k) => {
              const a = (k / n) * Math.PI * 2 - Math.PI / 2
              return <circle key={k} cx={Math.cos(a) * R[i]} cy={Math.sin(a) * R[i]} r={4.2} className={`el ${i === shells.length - 1 ? 'val' : ''}`} />
            })}
            <text x={R[i] * 0.72} y={-R[i] * 0.72} className="shell-name">
              {SHELL_NAMES[i]}
            </text>
          </g>
        ))}
        <circle r={16} className="nuc" />
        <text y={4} className="nuc-t">
          {el.z}+
        </text>
      </svg>
      <div className="e1-shell-table">
        {shells.map((n, i) => (
          <span key={i} className={i === shells.length - 1 ? 'val' : ''}>
            {SHELL_NAMES[i]}: {n}/{SHELL_MAX[i]}
          </span>
        ))}
      </div>
      <Readout label="Protones / electrones" value={`${el.z} / ${total}`} />
      <Readout label="Electrones de valencia" value={shells[shells.length - 1]} />
      <Readout label="Carga" value={charge === 0 ? 'neutro' : charge > 0 ? 'ion positivo' : 'ion negativo'} />
      <p className="hint">
        {el.note} ({KIND_NAMES[el.kind]})
      </p>
    </div>
  )
}

const MATERIALS: { name: string; kind: 'conductor' | 'semiconductor' | 'aislante' }[] = [
  { name: 'Plata', kind: 'conductor' },
  { name: 'Cobre', kind: 'conductor' },
  { name: 'Oro', kind: 'conductor' },
  { name: 'Aluminio', kind: 'conductor' },
  { name: 'Silicio', kind: 'semiconductor' },
  { name: 'Germanio', kind: 'semiconductor' },
  { name: 'Vidrio', kind: 'aislante' },
  { name: 'Cerámica', kind: 'aislante' },
  { name: 'Papel', kind: 'aislante' },
  { name: 'Goma', kind: 'aislante' },
  { name: 'PVC', kind: 'aislante' },
  { name: 'Madera seca', kind: 'aislante' },
]

function MaterialSorter() {
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const kinds = [
    { id: 'conductor', label: 'Conductor' },
    { id: 'semiconductor', label: 'Semiconductor' },
    { id: 'aislante', label: 'Aislante' },
  ]
  const ok = MATERIALS.filter((m) => picked[m.name] === m.kind).length
  return (
    <div className="calc">
      <p className="hint">Elegí qué es cada material y tocá «Comprobar».</p>
      <div className="e1-sorter">
        {MATERIALS.map((m) => (
          <div key={m.name} className={`e1-sort-row ${checked ? (picked[m.name] === m.kind ? 'ok' : 'bad') : ''}`}>
            <strong>{m.name}</strong>
            <Segmented<string>
              value={picked[m.name] ?? ''}
              onChange={(v) => {
                setPicked({ ...picked, [m.name]: v })
                setChecked(false)
              }}
              options={kinds.map((k) => ({ value: k.id, label: k.label }))}
            />
          </div>
        ))}
      </div>
      <div className="row">
        <button type="button" className="btn primary small" onClick={() => setChecked(true)} disabled={Object.keys(picked).length < MATERIALS.length}>
          Comprobar
        </button>
        {checked && (
          <span className={`feedback ${ok === MATERIALS.length ? 'ok' : 'bad'}`}>
            {ok === MATERIALS.length ? '✔ ¡Todos bien!' : `${ok} de ${MATERIALS.length} bien. Los rojos están mal.`}
          </span>
        )}
      </div>
    </div>
  )
}

const CABLE_CODES = {
  ca: [
    { c: '#7a4a24', n: 'Marrón', f: 'Fase (L1)' },
    { c: '#1b1b1d', n: 'Negro', f: 'Fase (L2)' },
    { c: '#c1121f', n: 'Rojo', f: 'Fase (L3)' },
    { c: '#4fb3e8', n: 'Celeste', f: 'Neutro (N)' },
    { c: 'vy', n: 'Verde y amarillo', f: 'Puesta a tierra (PE)' },
    { c: '#f2f2ee', n: 'Blanco', f: 'Retorno de iluminación (R)' },
  ],
  cc: [
    { c: '#d62828', n: 'Rojo', f: 'Positivo (+)' },
    { c: '#1b1b1d', n: 'Negro', f: 'Negativo (−)' },
  ],
}

function CableColors() {
  const [mode, setMode] = useState<'ca' | 'cc'>('ca')
  return (
    <div className="calc">
      <Segmented<'ca' | 'cc'>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'ca', label: 'Corriente alterna' },
          { value: 'cc', label: 'Corriente continua' },
        ]}
      />
      <div className="e1-cables">
        {CABLE_CODES[mode].map((x) => (
          <div key={x.n + x.f} className="e1-cable-row">
            <span className={`e1-wire ${x.c === 'vy' ? 'vy' : ''}`} style={x.c === 'vy' ? undefined : { background: x.c }} />
            <span>
              <b>{x.n}</b> → {x.f}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FieldDemo() {
  const [a, setA] = useState<1 | -1>(-1)
  const [b, setB] = useState<1 | -1>(1)
  const [d, setD] = useState(120)
  const attract = a !== b
  const f = 4000 / (d * d) // proporcional a 1/d²
  const arrow = Math.min(60, 18 + f * 70)
  const xa = 150 - d / 2
  const xb = 150 + d / 2
  return (
    <div className="calc">
      <svg viewBox="0 0 300 120" className="e1-field" role="img" aria-label={attract ? 'Las cargas se atraen' : 'Las cargas se repelen'}>
        {[xa, xb].map((x, i) => {
            const s = i === 0 ? a : b
            return Array.from({ length: 8 }, (_, j) => {
              const ang = (j / 8) * Math.PI * 2
              const r1 = 20
              const r2 = 34
              return (
                <line
                  key={`${i}-${j}`}
                  x1={x + Math.cos(ang) * (s > 0 ? r1 : r2)}
                  y1={60 + Math.sin(ang) * (s > 0 ? r1 : r2)}
                  x2={x + Math.cos(ang) * (s > 0 ? r2 : r1)}
                  y2={60 + Math.sin(ang) * (s > 0 ? r2 : r1)}
                  className="fl"
                  markerEnd="url(#e1-arr)"
                />
              )
            })
          })}
        <defs>
          <marker id="e1-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L10 5 L0 10z" className="fl-head" />
          </marker>
          <marker id="e1-arrF" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0 0 L10 5 L0 10z" className="force-head" />
          </marker>
        </defs>
        {[
          [xa, a],
          [xb, b],
        ].map(([x, s], i) => (
          <g key={i}>
            <circle cx={x} cy={60} r={15} className={s > 0 ? 'q-pos' : 'q-neg'} />
            <text x={x} y={66} className="q-t">
              {s > 0 ? '+' : '−'}
            </text>
          </g>
        ))}
        <line x1={xa} y1={100} x2={xa + (attract ? arrow : -arrow)} y2={100} className="force" markerEnd="url(#e1-arrF)" />
        <line x1={xb} y1={100} x2={xb + (attract ? -arrow : arrow)} y2={100} className="force" markerEnd="url(#e1-arrF)" />
      </svg>
      <div className="row wrap">
        <Field label="Carga de la izquierda">
          <Segmented<1 | -1> value={a} onChange={setA} options={[{ value: 1, label: 'Protón (+)' }, { value: -1, label: 'Electrón (−)' }]} />
        </Field>
        <Field label="Carga de la derecha">
          <Segmented<1 | -1> value={b} onChange={setB} options={[{ value: 1, label: 'Protón (+)' }, { value: -1, label: 'Electrón (−)' }]} />
        </Field>
      </div>
      <Slider label="Distancia" value={d} min={70} max={220} step={5} onChange={setD} format={(x) => (x < 110 ? 'muy cerca' : x < 170 ? 'media' : 'lejos')} />
      <Readout label="Se" value={attract ? 'atraen (cargas distintas)' : 'repelen (cargas iguales)'} />
      <Readout label="Fuerza" value={f > 0.35 ? 'grande' : f > 0.15 ? 'media' : 'chica'} />
    </div>
  )
}

function OhmLaw() {
  const [solve, setSolve] = useState<'U' | 'I' | 'R'>('I')
  const [u, setU] = useState(220)
  const [i, setI] = useState(2)
  const [r, setR] = useState(110)
  const U = solve === 'U' ? i * r : u
  const I = solve === 'I' ? u / r : i
  const R = solve === 'R' ? u / i : r
  return (
    <div className="calc">
      <div className="ohm-triangle" aria-hidden>
        <span className={solve === 'U' ? 'on' : ''}>U</span>
        <span className={solve === 'I' ? 'on' : ''}>I</span>
        <span className={solve === 'R' ? 'on' : ''}>R</span>
      </div>
      <Segmented<'U' | 'I' | 'R'>
        value={solve}
        onChange={setSolve}
        options={[
          { value: 'U', label: 'Calcular U' },
          { value: 'I', label: 'Calcular I' },
          { value: 'R', label: 'Calcular R' },
        ]}
      />
      {solve !== 'U' && <Slider label="Tensión U" value={u} min={1.5} max={380} step={0.5} onChange={setU} format={(x) => `${fmt(x, 1)} V`} />}
      {solve !== 'I' && <Slider label="Corriente I" value={i} min={0.1} max={20} step={0.1} onChange={setI} format={(x) => `${fmt(x, 1)} A`} />}
      {solve !== 'R' && <Slider label="Resistencia R" value={r} min={1} max={1000} step={1} onChange={setR} format={(x) => `${x} Ω`} />}
      <Formula>
        {solve === 'U' && (
          <>
            U = I · R = {fmt(I, 1)} A · {fmt(R, 0)} Ω = <strong>{fmt(U, 1)} V</strong>
          </>
        )}
        {solve === 'I' && (
          <>
            I = U / R = {fmt(U, 1)} V / {fmt(R, 0)} Ω = <strong>{fmt(I, 3)} A</strong>
          </>
        )}
        {solve === 'R' && (
          <>
            R = U / I = {fmt(U, 1)} V / {fmt(I, 1)} A = <strong>{fmt(R, 1)} Ω</strong>
          </>
        )}
      </Formula>
    </div>
  )
}

function Waves() {
  const [mode, setMode] = useState<'cc' | 'ca'>('ca')
  const [t, setT] = useState(0)
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = window.setInterval(() => setT((x) => (x + 0.04) % 1), 60)
    return () => window.clearInterval(id)
  }, [])
  const W = 300
  const H = 140
  const mid = 70
  const amp = 50
  let d = ''
  for (let x = 0; x <= W; x += 3) {
    const y = mode === 'cc' ? mid - 34 : mid - amp * Math.sin(((x / W) * 2 + t * 2) * Math.PI * 2)
    d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)} `
  }
  const flowDir = mode === 'cc' ? 1 : Math.sin((t * 2 + 0.5) * Math.PI * 2) >= 0 ? 1 : -1
  return (
    <div className="calc">
      <Segmented<'cc' | 'ca'>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'cc', label: 'Continua (CC)' },
          { value: 'ca', label: 'Alterna (CA)' },
        ]}
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="e1-wave" role="img" aria-label={mode === 'cc' ? 'Tensión continua' : 'Tensión alterna'}>
        <line x1={0} x2={W} y1={mid} y2={mid} className="axis" />
        <text x={4} y={14} className="lbl">
          +
        </text>
        <text x={4} y={H - 6} className="lbl">
          −
        </text>
        <path d={d} className={`wave ${mode}`} />
      </svg>
      <Readout label="Sentido de los electrones" value={flowDir > 0 ? '→ siempre igual' : '← cambia de sentido'} />
      <Readout label="Ejemplos" value={mode === 'cc' ? 'pila AA 1,5 V · USB 5 V · batería de auto 12 V' : 'casas en Argentina 220 V – 50 Hz · trifásica 380 V'} />
    </div>
  )
}

function ReqCalc() {
  const [mode, setMode] = useState<'serie' | 'paralelo'>('serie')
  const [rs, setRs] = useState([100, 220])
  const req = mode === 'serie' ? rs.reduce((a, b) => a + b, 0) : 1 / rs.reduce((a, b) => a + 1 / b, 0)
  return (
    <div className="calc">
      <Segmented<'serie' | 'paralelo'>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'serie', label: 'Serie' },
          { value: 'paralelo', label: 'Paralelo' },
        ]}
      />
      {rs.map((r, k) => (
        <Slider key={k} label={`R${k + 1}`} value={r} min={10} max={1000} step={10} onChange={(v) => setRs(rs.map((x, j) => (j === k ? v : x)))} format={(x) => `${x} Ω`} />
      ))}
      <div className="row">
        <button type="button" className="btn small" disabled={rs.length >= 5} onClick={() => setRs([...rs, 100])}>
          + Agregar resistencia
        </button>
        <button type="button" className="btn small" disabled={rs.length <= 2} onClick={() => setRs(rs.slice(0, -1))}>
          − Quitar
        </button>
      </div>
      <Formula>
        {mode === 'serie' ? (
          <>
            RT = {rs.join(' + ')} = <strong>{fmt(req, 1)} Ω</strong>
          </>
        ) : rs.length === 2 ? (
          <>
            RT = R1·R2 / (R1+R2) = {rs[0] * rs[1]} / {rs[0] + rs[1]} = <strong>{fmt(req, 1)} Ω</strong>
          </>
        ) : (
          <>
            1/RT = {rs.map((r) => `1/${r}`).join(' + ')} → RT = <strong>{fmt(req, 1)} Ω</strong>
          </>
        )}
      </Formula>
      <p className="hint">
        {mode === 'serie'
          ? 'En serie la equivalente siempre es MAYOR que la más grande.'
          : 'En paralelo la equivalente siempre es MENOR que la más chica.'}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ temas */

export const ELECTRICIDAD1_TOPICS: Topic[] = [
  {
    id: 'e1-atomo',
    title: 'El átomo',
    icon: '⚛️',
    summary: 'Protones, neutrones y electrones; capas K, L, M, N y electrones de valencia.',
    content: (
      <>
        <p>
          El <b>átomo</b> es la unidad más pequeña de la materia que conserva las propiedades de un elemento químico. Está formado por
          un <b>núcleo</b>, con <b>protones</b> y <b>neutrones</b>, y por <b>electrones</b> que se encuentran alrededor del núcleo.
        </p>
        <ul>
          <li>
            <b>Protones</b>: carga eléctrica positiva (+).
          </li>
          <li>
            <b>Electrones</b>: carga eléctrica negativa (−).
          </li>
          <li>
            <b>Neutrones</b>: no tienen carga.
          </li>
        </ul>
        <p>
          Si un átomo tiene igual cantidad de protones y de electrones es <b>eléctricamente neutro</b>. Si pierde o gana electrones se
          transforma en un <b>ion</b>, con carga positiva o negativa.
        </p>
        <h4>Capas electrónicas</h4>
        <p>
          Los electrones se distribuyen en niveles de energía o <b>capas</b>: K, L, M, N… empezando por la más cercana al núcleo. Cada
          una admite un máximo: <b>K hasta 2</b>, <b>L hasta 8</b>, <b>M hasta 18</b> y <b>N hasta 32</b>. Dentro de cada capa hay
          orbitales (s, p, d, f) que exceden este curso.
        </p>
        <p>
          Los electrones de la capa más externa se llaman <b>electrones de valencia</b>: participan en los enlaces químicos y tienen gran
          influencia en las propiedades eléctricas del material. Los átomos tienden a completar su capa externa; en los elementos
          livianos esto se resume en la <b>regla del octeto</b> (8 electrones en la última capa).
        </p>
        <AtomShells />
      </>
    ),
    activities: [
      { id: 'e1-t1-1', type: 'mc', q: '¿Qué partículas forman el núcleo del átomo?', options: ['Protones y neutrones', 'Electrones y protones', 'Sólo electrones', 'Neutrones y electrones'], answer: 0, explain: 'El núcleo tiene protones y neutrones; los electrones están en las capas.' },
      { id: 'e1-t1-2', type: 'mc', q: '¿Qué carga tiene el neutrón?', options: ['No tiene carga', 'Positiva', 'Negativa', 'Depende de la capa'], answer: 0, explain: 'Por eso se llama neutrón.' },
      { id: 'e1-t1-3', type: 'num', q: '¿Cuántos electrones entran como máximo en la capa M?', answer: 18, tolerance: 0, unit: 'electrones', explain: 'K 2, L 8, M 18, N 32.' },
      { id: 'e1-t1-4', type: 'mc', q: 'Un átomo gana un electrón. Se convierte en…', options: ['Un ion negativo', 'Un ion positivo', 'Un átomo neutro', 'Un protón'], answer: 0, explain: 'Tiene un electrón (−) de más: carga total negativa.' },
      { id: 'e1-t1-5', type: 'mc', q: '¿Cómo se llaman los electrones de la capa más externa?', options: ['Electrones de valencia', 'Electrones libres del núcleo', 'Neutrones', 'Iones'], answer: 0, explain: 'Son los que participan en los enlaces y en la conducción.' },
      { id: 'e1-t1-6', type: 'num', q: 'El silicio tiene 14 electrones (K: 2, L: 8, M: ?). ¿Cuántos tiene en la capa M?', answer: 4, tolerance: 0, unit: 'electrones', explain: '14 − 2 − 8 = 4 electrones de valencia: típico de un semiconductor.' },
    ],
  },
  {
    id: 'e1-materiales',
    title: 'Conductores, semiconductores y aislantes',
    icon: '🧱',
    summary: 'Por qué el cobre conduce, el PVC aísla y el silicio está en el medio.',
    content: (
      <>
        <h4>Conductores</h4>
        <p>
          Ofrecen <b>poca resistencia</b> al movimiento de las cargas. Tienen electrones externos poco ligados que pueden desplazarse
          cuando se aplica una tensión. En general tienen pocos electrones de valencia (con muchas excepciones). Ejemplos:{' '}
          <b>plata, cobre, oro, aluminio</b>.
        </p>
        <h4>Semiconductores</h4>
        <p>
          Tienen una conductividad <b>intermedia</b>. Normalmente conducen poco, pero conducen mucho más si reciben energía: calor, luz,
          un campo eléctrico o radiación. Muchos tienen <b>4 electrones de valencia</b>. Son la base de diodos, transistores, circuitos
          integrados, LED y paneles solares. Ejemplos: <b>silicio, germanio</b>.
        </p>
        <h4>Aislantes</h4>
        <p>
          Presentan una <b>gran oposición</b> al movimiento de las cargas: sus electrones están fuertemente ligados. Las corrientes que
          pasan son tan pequeñas que, en la práctica, se consideran no conductores. Ejemplos: <b>vidrio, cerámica, papel, goma, PVC, madera seca</b>.
        </p>
        <p className="hint">La conductividad no depende sólo de los electrones de valencia: también de cómo están enlazados y ordenados los átomos.</p>
        <MaterialSorter />
      </>
    ),
    activities: [
      { id: 'e1-t2-1', type: 'mc', q: '¿Cuál de estos materiales es un buen conductor?', options: ['Cobre', 'Vidrio', 'PVC', 'Madera seca'], answer: 0, explain: 'El cobre es el conductor más usado en los cables.' },
      { id: 'e1-t2-2', type: 'mc', q: '¿Cuál es un semiconductor?', options: ['Silicio', 'Aluminio', 'Goma', 'Oro'], answer: 0, explain: 'Silicio y germanio son semiconductores.' },
      { id: 'e1-t2-3', type: 'mc', q: '¿Por qué el PVC se usa para recubrir cables?', options: ['Porque es aislante: sus electrones están muy ligados', 'Porque conduce muy bien', 'Porque es un semiconductor', 'Porque es un metal'], answer: 0, explain: 'La aislación impide que la corriente pase de un conductor a otro o a las personas.' },
      { id: 'e1-t2-4', type: 'mc', q: 'Un semiconductor conduce mucho más cuando…', options: ['Recibe energía: calor, luz o un campo eléctrico', 'Se moja', 'Se lo pinta', 'Se lo enfría a 0 °C siempre'], answer: 0, explain: 'Al recibir energía, algunos electrones pueden desplazarse y transportar corriente.' },
      { id: 'e1-t2-5', type: 'mc', q: '¿Qué dispositivo NO está hecho con semiconductores?', options: ['Un cable de cobre', 'Un LED', 'Un transistor', 'Un panel solar'], answer: 0, explain: 'LED, transistores y paneles solares usan semiconductores; el cable es un conductor.' },
      { id: 'e1-t2-6', type: 'mc', q: '¿Cuántos electrones de valencia tienen muchos semiconductores?', options: ['4', '1', '8', '18'], answer: 0, explain: 'Silicio y germanio tienen 4.' },
    ],
  },
  {
    id: 'e1-cables',
    title: 'El cable eléctrico',
    icon: '🧵',
    summary: 'Colores, conductores, hebras, sección, material, tensión, aislación y aplicación.',
    content: (
      <>
        <p>
          Se llama <b>cable eléctrico</b> a una manguera de material aislante y protector que contiene un conductor aislado o un conjunto
          de conductores aislados, generalmente de <b>cobre</b> o <b>aluminio</b>. Se clasifican de muchas formas:
        </p>
        <h4>Según el color</h4>
        <CableColors />
        <h4>Según la cantidad de conductores</h4>
        <p>
          Unipolar, bipolar, tripolar, tetrapolar y pentapolar. En realidad un cable no tiene polos: tiene <b>conductores</b>.
        </p>
        <h4>Según la cantidad de hebras</h4>
        <p>
          <b>Unifilar</b> (un solo alambre) o <b>multifilar</b> (varias hebras). A igual sección conducen prácticamente lo mismo; los
          multifilares son más flexibles.
        </p>
        <h4>Según la sección</h4>
        <p>
          En las casas: <b>1; 1,5; 2,5; 4; 6 y 10 mm²</b>. En instalaciones comerciales e industriales hay secciones que superan
          ampliamente los 100 mm².
        </p>
        <h4>Según el material y la tensión</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tensión</th>
                <th>Rango</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Baja tensión (BT)</td>
                <td>hasta 1000 V en alterna o 1500 V en continua</td>
              </tr>
              <tr>
                <td>Media tensión (MT)</td>
                <td>más de 1 kV y hasta 33 kV</td>
              </tr>
              <tr>
                <td>Alta tensión (AT)</td>
                <td>más de 33 kV y hasta 132 kV</td>
              </tr>
              <tr>
                <td>Muy alta tensión (MAT)</td>
                <td>más de 132 kV</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>En las casas se usa sobre todo cobre, por su alta conductividad y lo fácil que es conectarlo. A más tensión, más aislación.</p>
        <h4>Según la aislación</h4>
        <ul>
          <li>
            <b>Desnudo</b>: sin aislación (líneas aéreas, puesta a tierra).
          </li>
          <li>
            <b>Esmaltado</b>: barniz finísimo (bobinas de transformadores, motores, relés).
          </li>
          <li>
            <b>PVC</b>: el más usado en las casas; buena resistencia a bajo costo.
          </li>
          <li>
            <b>XLPE</b> (polietileno reticulado): mejor que el PVC; industrias y cables subterráneos.
          </li>
          <li>
            <b>Goma o EPR</b>: flexible, resiste humedad y temperatura.
          </li>
          <li>
            <b>Silicona</b> y <b>fibra de vidrio</b>: para altas y muy altas temperaturas (hornos, resistencias).
          </li>
        </ul>
        <h4>Según la aplicación</h4>
        <ul>
          <li>
            <b>TPR</b> (taller pesado reforzado): herramientas, alargues y máquinas portátiles.
          </li>
          <li>
            <b>Subterráneo</b> y <b>sumergible</b> (bombas).
          </li>
          <li>
            <b>Libre de halógenos (LSZH)</b>: en un incendio hace poco humo y no libera gases tóxicos. Edificios públicos.
          </li>
          <li>
            <b>Resistente al fuego</b>: sigue funcionando un tiempo en el fuego. Sistemas de emergencia.
          </li>
        </ul>
      </>
    ),
    activities: [
      { id: 'e1-t3-1', type: 'mc', q: 'En una casa, ¿de qué color es el cable de fase (L1)?', options: ['Marrón', 'Celeste', 'Verde y amarillo', 'Blanco'], answer: 0, explain: 'Fase L1 = marrón.' },
      { id: 'e1-t3-2', type: 'mc', q: 'El cable blanco en una instalación de iluminación es…', options: ['El retorno', 'El neutro', 'La tierra', 'La fase L3'], answer: 0, explain: 'Blanco = retorno de iluminación (R).' },
      { id: 'e1-t3-3', type: 'mc', q: '¿Hasta qué tensión alterna se considera baja tensión?', options: ['1000 V', '220 V', '33 kV', '132 kV'], answer: 0, explain: 'BT: hasta 1000 V en CA o 1500 V en CC.' },
      { id: 'e1-t3-4', type: 'mc', q: 'Para un edificio público conviene un cable…', options: ['Libre de halógenos (LSZH)', 'Desnudo', 'Esmaltado', 'Sumergible'], answer: 0, explain: 'En un incendio genera poco humo y no libera gases tóxicos.' },
      { id: 'e1-t3-5', type: 'mc', q: 'Un cable de 5 conductores se llama…', options: ['Pentapolar', 'Tetrapolar', 'Tripolar', 'Multifilar'], answer: 0, explain: 'Penta = 5. (Multifilar habla de las hebras, no de los conductores).' },
      { id: 'e1-t3-6', type: 'mc', q: 'Para conectar una resistencia de un horno, ¿qué aislación conviene?', options: ['Silicona o fibra de vidrio', 'PVC', 'Papel', 'Ninguna'], answer: 0, explain: 'Son aislaciones aptas para altas temperaturas.' },
      { id: 'e1-t3-7', type: 'mc', q: 'En corriente continua, ¿de qué color es el negativo?', options: ['Negro', 'Rojo', 'Celeste', 'Blanco'], answer: 0, explain: 'CC: rojo positivo, negro negativo.' },
    ],
  },
  {
    id: 'e1-campo',
    title: 'Campo eléctrico',
    icon: '🧲',
    summary: 'Toda carga crea a su alrededor una zona que atrae o repele a otras cargas.',
    content: (
      <>
        <p>
          Toda carga eléctrica genera a su alrededor una región llamada <b>campo eléctrico</b>, que ejerce fuerzas sobre otras cargas que
          estén dentro de él. Podemos imaginarlo como una influencia invisible que empuja o atrae cargas.
        </p>
        <p>
          Cuanto mayor es la carga, o más cerca estamos de ella, más intenso es el campo. Dos electrones se <b>repelen</b>; un electrón y
          un protón se <b>atraen</b>.
        </p>
        <FieldDemo />
      </>
    ),
    activities: [
      { id: 'e1-t4-1', type: 'mc', q: 'Acercás dos electrones. ¿Qué pasa?', options: ['Se repelen', 'Se atraen', 'No pasa nada', 'Se convierten en protones'], answer: 0, explain: 'Cargas iguales se repelen.' },
      { id: 'e1-t4-2', type: 'mc', q: 'Un protón y un electrón…', options: ['Se atraen', 'Se repelen', 'No se afectan', 'Se anulan y desaparecen'], answer: 0, explain: 'Cargas distintas se atraen.' },
      { id: 'e1-t4-3', type: 'mc', q: 'Si alejás dos cargas, la fuerza entre ellas…', options: ['Disminuye', 'Aumenta', 'No cambia', 'Cambia de signo'], answer: 0, explain: 'Cuanto más cerca, más intenso el campo; más lejos, más débil.' },
      { id: 'e1-t4-4', type: 'mc', q: '¿Qué es el campo eléctrico?', options: ['La región alrededor de una carga donde actúan fuerzas sobre otras cargas', 'Un cable', 'Un terreno con antenas', 'La corriente que pasa por un cable'], answer: 0, explain: 'Es una influencia invisible que atrae o empuja cargas.' },
    ],
  },
  {
    id: 'e1-magnitudes',
    title: 'Tensión, corriente y resistencia',
    icon: '🔋',
    summary: 'Las tres magnitudes fundamentales y cómo una pila hace circular la corriente.',
    content: (
      <>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Magnitud</th>
                <th>Qué es</th>
                <th>Letra</th>
                <th>Unidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Corriente</td>
                <td>Flujo de electrones que circulan por un material</td>
                <td>I</td>
                <td>ampere [A]</td>
              </tr>
              <tr>
                <td>Tensión</td>
                <td>La fuerza que impulsa a los electrones</td>
                <td>U (también E o V)</td>
                <td>volt [V]</td>
              </tr>
              <tr>
                <td>Resistencia</td>
                <td>Oposición de un material al paso de la corriente</td>
                <td>R</td>
                <td>ohm [Ω]</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h4>¿Cómo aparece la corriente?</h4>
        <ol>
          <li>Las cargas eléctricas generan campos eléctricos.</li>
          <li>Una pila o batería separa cargas positivas y negativas mediante una reacción química.</li>
          <li>Esta separación genera una diferencia de potencial (tensión) y un campo eléctrico.</li>
          <li>El campo eléctrico ejerce una fuerza sobre los electrones.</li>
          <li>Al cerrarse el circuito, los electrones se mueven y aparece la corriente eléctrica.</li>
        </ol>
        <p className="hint">Probalo en el circuito 3D: con el interruptor abierto no hay corriente aunque la pila tenga tensión.</p>
      </>
    ),
    activities: [
      { id: 'e1-t5-1', type: 'mc', q: '¿En qué unidad se mide la corriente?', options: ['Ampere (A)', 'Volt (V)', 'Ohm (Ω)', 'Watt (W)'], answer: 0, explain: 'Corriente I en amperes.' },
      { id: 'e1-t5-2', type: 'mc', q: '¿Qué letra usamos en electricidad para la tensión?', options: ['U', 'I', 'R', 'T'], answer: 0, explain: 'U (también se ve E o V). Se mide en volts.' },
      { id: 'e1-t5-3', type: 'mc', q: 'La oposición de un material al paso de la corriente se llama…', options: ['Resistencia', 'Tensión', 'Corriente', 'Campo'], answer: 0, explain: 'Resistencia R, en ohms.' },
      { id: 'e1-t5-4', type: 'mc', q: '¿Qué hace una pila?', options: ['Separa cargas por una reacción química y genera tensión', 'Fabrica electrones de la nada', 'Guarda corriente alterna', 'Aumenta la resistencia'], answer: 0, explain: 'Esa separación de cargas es la diferencia de potencial.' },
      { id: 'e1-t5-5', type: 'mc', q: 'Una pila conectada a una lámpara con el interruptor abierto. ¿Hay corriente?', options: ['No: el circuito no está cerrado', 'Sí, igual', 'Sólo si la pila es grande', 'Sí, pero alterna'], answer: 0, explain: 'Los electrones se mueven sólo cuando el circuito se cierra.' },
      { id: 'e1-t5-6', type: 'num', q: '¿Cuántos amperes son 500 mA?', answer: 0.5, tolerance: 0, unit: 'A', explain: '500 / 1000 = 0,5 A.' },
    ],
  },
  {
    id: 'e1-ohm',
    title: 'Ley de Ohm',
    icon: 'Ω',
    summary: 'U = I · R. Calculá la tensión, la corriente o la resistencia.',
    content: (
      <>
        <p>
          La ley de Ohm, de Georg Simon Ohm, dice que la tensión (U) aplicada entre los extremos de un conductor es directamente
          proporcional a la corriente (I) que circula por él. La resistencia (R) es el factor de proporcionalidad:
        </p>
        <Formula>U = I · R &nbsp;&nbsp;·&nbsp;&nbsp; I = U / R &nbsp;&nbsp;·&nbsp;&nbsp; R = U / I</Formula>
        <p>
          Truco del <b>triángulo</b>: U arriba, I y R abajo. Tapás lo que querés calcular: si quedan uno arriba del otro se divide; si
          quedan uno al lado del otro se multiplica.
        </p>
        <OhmLaw />
      </>
    ),
    activities: [
      { id: 'e1-t6-1', type: 'num', q: 'Una plancha de 44 Ω se conecta a 220 V. ¿Qué corriente circula?', answer: 5, tolerance: 0.01, unit: 'A', explain: 'I = U / R = 220 / 44 = 5 A.' },
      { id: 'e1-t6-2', type: 'num', q: 'Por una resistencia de 100 Ω circulan 0,12 A. ¿Qué tensión tiene aplicada?', answer: 12, tolerance: 0.01, unit: 'V', explain: 'U = I · R = 0,12 · 100 = 12 V.' },
      { id: 'e1-t6-3', type: 'num', q: 'Una lámpara conectada a 12 V consume 0,5 A. ¿Cuál es su resistencia?', answer: 24, tolerance: 0.01, unit: 'Ω', explain: 'R = U / I = 12 / 0,5 = 24 Ω.' },
      { id: 'e1-t6-4', type: 'mc', q: 'Si con la misma tensión aumenta la resistencia, la corriente…', options: ['Disminuye', 'Aumenta', 'No cambia', 'Se vuelve alterna'], answer: 0, explain: 'I = U / R: más R, menos I.' },
      { id: 'e1-t6-5', type: 'num', q: 'Un puerto USB da 5 V a un circuito de 250 Ω. ¿Cuántos miliamperes circulan?', answer: 20, tolerance: 0.01, unit: 'mA', explain: 'I = 5 / 250 = 0,02 A = 20 mA.' },
    ],
  },
  {
    id: 'e1-cc-ca',
    title: 'Corriente continua y alterna',
    icon: '〰️',
    summary: 'CC: siempre el mismo sentido. CA: cambia de sentido (220 V – 50 Hz en Argentina).',
    content: (
      <>
        <h4>Corriente continua (CC o DC)</h4>
        <p>
          Los electrones circulan <b>siempre en el mismo sentido</b> y la tensión mantiene la misma polaridad: hay un borne positivo (+)
          y uno negativo (−). Viene de pilas, baterías, paneles solares y fuentes electrónicas. La usan celulares, notebooks, linternas,
          el sistema eléctrico de los autos y los juguetes. Ejemplos: pila AA <b>1,5 V</b>, batería de auto <b>12 V</b>, puerto USB{' '}
          <b>5 V</b>. Es ideal para guardar energía en baterías.
        </p>
        <h4>Corriente alterna (CA o AC)</h4>
        <p>
          Los electrones <b>cambian periódicamente de sentido</b> y la tensión cambia todo el tiempo de valor y de polaridad. La generan
          los alternadores de las centrales eléctricas. Su gran ventaja: con <b>transformadores</b> se puede subir o bajar fácilmente, y así
          se transporta muy lejos con pocas pérdidas. Es la de las casas, comercios e industrias: en Argentina <b>220 V – 50 Hz</b>; las
          redes trifásicas, <b>380 V – 50 Hz</b>.
        </p>
        <Waves />
      </>
    ),
    activities: [
      { id: 'e1-t7-1', type: 'mc', q: '¿Qué tipo de corriente da una pila?', options: ['Continua', 'Alterna', 'Trifásica', 'Ninguna'], answer: 0, explain: 'Pilas, baterías y paneles solares dan corriente continua.' },
      { id: 'e1-t7-2', type: 'mc', q: '¿Qué tensión hay en los enchufes de una casa en Argentina?', options: ['220 V – 50 Hz', '110 V – 60 Hz', '12 V continua', '380 V continua'], answer: 0, explain: '220 V de corriente alterna a 50 Hz.' },
      { id: 'e1-t7-3', type: 'mc', q: '¿Por qué se usa corriente alterna para transportar la energía?', options: ['Porque con transformadores se sube y baja fácilmente y se pierde menos', 'Porque no tiene polaridad', 'Porque es más segura de tocar', 'Porque se guarda en baterías'], answer: 0, explain: 'Elevar la tensión permite transportar mucha energía lejos con menores pérdidas.' },
      { id: 'e1-t7-4', type: 'num', q: '¿Cuántos volts tiene un puerto USB?', answer: 5, tolerance: 0, unit: 'V', explain: 'USB: 5 V de continua.' },
      { id: 'e1-t7-5', type: 'mc', q: 'En la corriente alterna los electrones…', options: ['Cambian de sentido periódicamente', 'Van siempre para el mismo lado', 'No se mueven', 'Sólo se mueven de noche'], answer: 0, explain: 'A 50 Hz cambian de sentido 100 veces por segundo.' },
    ],
  },
  {
    id: 'e1-serie-paralelo',
    title: 'Circuitos en serie y en paralelo',
    icon: '🔀',
    summary: 'Resistencia equivalente: en serie se suman; en paralelo se combinan.',
    content: (
      <>
        <p>
          Con varias resistencias en un circuito, la <b>resistencia equivalente</b> (o total) es una sola resistencia que podría
          reemplazarlas a todas para simplificar el circuito.
        </p>
        <h4>En serie</h4>
        <p>Una a continuación de la otra: hay un solo camino. La equivalente es la suma:</p>
        <Formula>RT = R1 + R2 + … + Rn</Formula>
        <h4>En paralelo</h4>
        <p>Todas conectadas entre los mismos dos puntos: la corriente se reparte. Para dos resistencias:</p>
        <Formula>RT = R1 · R2 / (R1 + R2)</Formula>
        <p>Para más de dos:</p>
        <Formula>1 / RT = 1/R1 + 1/R2 + 1/R3 + … + 1/Rn</Formula>
        <ReqCalc />
        <p className="hint">Para ver cómo cambia el brillo de las lámparas, abrí el circuito en 3D y pasá de serie a paralelo.</p>
      </>
    ),
    activities: [
      { id: 'e1-t8-1', type: 'num', q: 'R1 = 100 Ω y R2 = 220 Ω en serie. ¿Cuánto vale RT?', answer: 320, tolerance: 0, unit: 'Ω', explain: '100 + 220 = 320 Ω.' },
      { id: 'e1-t8-2', type: 'num', q: 'R1 = 100 Ω y R2 = 100 Ω en paralelo. ¿Cuánto vale RT?', answer: 50, tolerance: 0, unit: 'Ω', explain: '100·100 / 200 = 50 Ω.' },
      { id: 'e1-t8-3', type: 'num', q: 'R1 = 30 Ω y R2 = 60 Ω en paralelo. ¿Cuánto vale RT?', answer: 20, tolerance: 0, unit: 'Ω', explain: '30·60 / 90 = 1800 / 90 = 20 Ω.' },
      { id: 'e1-t8-4', type: 'num', q: 'Tres resistencias de 10, 20 y 30 Ω en serie. ¿RT?', answer: 60, tolerance: 0, unit: 'Ω', explain: '10 + 20 + 30 = 60 Ω.' },
      { id: 'e1-t8-5', type: 'num', q: 'Tres resistencias de 60 Ω en paralelo. ¿RT?', answer: 20, tolerance: 0.01, unit: 'Ω', explain: '1/RT = 3/60 → RT = 20 Ω.' },
      { id: 'e1-t8-6', type: 'mc', q: 'En paralelo, la resistencia equivalente es siempre…', options: ['Menor que la más chica', 'Mayor que la más grande', 'Igual a la suma', 'Igual al promedio'], answer: 0, explain: 'Cada rama nueva es otro camino para la corriente: baja la resistencia total.' },
    ],
  },
]

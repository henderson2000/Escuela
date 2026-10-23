import { useMemo, useState } from 'react'
import { SubLink } from '../../lib/nav'
import type { Topic } from '../../data/theory'
import { Field, Formula, Readout, Segmented, Slider } from '../../components/ui'
import { shuffle } from '../../games/QuizGame'
import { CircuitoSvg, SIMBOLOS, Simbolo, TresEsquemas, resolver, type CircuitoGuia } from './Esquemas'
import './e2.css'

const fmt = (n: number, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace('.', ',') : '—')

/* ------------------------------------------------------------------ simuladores */

function OhmCalc() {
  const [que, setQue] = useState<'U' | 'I' | 'R'>('R')
  const [u, setU] = useState(12)
  const [i, setI] = useState(2)
  const [r, setR] = useState(6)
  const res = que === 'U' ? i * r : que === 'I' ? u / r : u / i
  return (
    <div className="calc">
      <Field label="¿Qué querés calcular?">
        <Segmented<'U' | 'I' | 'R'>
          value={que}
          onChange={setQue}
          options={[
            { value: 'U', label: 'Tensión U' },
            { value: 'I', label: 'Corriente I' },
            { value: 'R', label: 'Resistencia R' },
          ]}
        />
      </Field>
      {que !== 'U' && <Slider label="Tensión U" value={u} min={1} max={380} step={1} onChange={setU} format={(x) => `${x} V`} />}
      {que !== 'I' && <Slider label="Corriente I" value={i} min={0.1} max={20} step={0.1} onChange={setI} format={(x) => `${fmt(x, 1)} A`} />}
      {que !== 'R' && <Slider label="Resistencia R" value={r} min={1} max={1000} step={1} onChange={setR} format={(x) => `${x} Ω`} />}
      <Formula>{que === 'U' ? `U = I × R = ${fmt(i, 1)} A × ${r} Ω` : que === 'I' ? `I = U / R = ${u} V / ${r} Ω` : `R = U / I = ${u} V / ${fmt(i, 1)} A`}</Formula>
      <Readout label="Resultado" value={`${fmt(res)} ${que === 'U' ? 'V' : que === 'I' ? 'A' : 'Ω'}`} />
    </div>
  )
}

function Nodo() {
  const [a, setA] = useState(3)
  const [b, setB] = useState(2)
  const [c, setC] = useState(1.5)
  const out = a + b - c
  return (
    <div className="calc">
      <svg viewBox="0 0 260 150" className="e2-svg" role="img" aria-label="Nodo con corrientes que entran y salen">
        <circle cx={130} cy={75} r={6} className="node" />
        <line x1={20} y1={30} x2={130} y2={75} className="wire" />
        <line x1={20} y1={120} x2={130} y2={75} className="wire" />
        <line x1={240} y1={30} x2={130} y2={75} className="wire" />
        <line x1={240} y1={120} x2={130} y2={75} className="wire" />
        <text x={50} y={34} className="lbl">I1 = {fmt(a, 1)} A →</text>
        <text x={50} y={128} className="lbl">I2 = {fmt(b, 1)} A →</text>
        <text x={204} y={34} className="lbl">→ I3 = {fmt(c, 1)} A</text>
        <text x={200} y={128} className="lbl">→ I4 = ?</text>
      </svg>
      <Slider label="I1 (entra)" value={a} min={0} max={5} step={0.5} onChange={setA} format={(x) => `${fmt(x, 1)} A`} />
      <Slider label="I2 (entra)" value={b} min={0} max={5} step={0.5} onChange={setB} format={(x) => `${fmt(x, 1)} A`} />
      <Slider label="I3 (sale)" value={c} min={0} max={5} step={0.5} onChange={setC} format={(x) => `${fmt(x, 1)} A`} />
      <Formula>I1 + I2 = I3 + I4 → I4 = {fmt(out, 1)} A</Formula>
      {out < 0 && <p className="hint">Da negativa: en realidad I4 también entra al nodo.</p>}
    </div>
  )
}

function Laboratorio() {
  const [tipo, setTipo] = useState<CircuitoGuia['tipo']>('serie')
  const [r1, setR1] = useState(20)
  const [r2, setR2] = useState(40)
  const [r3, setR3] = useState(60)
  const [u, setU] = useState(220)
  const c: CircuitoGuia = { n: 0, tipo, r: [r1, r2, r3], u, sola: 0 }
  const s = resolver(c)
  return (
    <div className="calc">
      <Segmented<CircuitoGuia['tipo']>
        value={tipo}
        onChange={setTipo}
        options={[
          { value: 'serie', label: 'Serie' },
          { value: 'paralelo', label: 'Paralelo' },
          { value: 'mixto', label: 'Mixto' },
        ]}
      />
      <CircuitoSvg c={c} />
      <Slider label="R1" value={r1} min={5} max={300} step={5} onChange={setR1} format={(x) => `${x} Ω`} />
      <Slider label="R2" value={r2} min={5} max={300} step={5} onChange={setR2} format={(x) => `${x} Ω`} />
      <Slider label="R3" value={r3} min={5} max={300} step={5} onChange={setR3} format={(x) => `${x} Ω`} />
      <Field label="Tensión">
        <Segmented<number>
          value={u}
          onChange={setU}
          options={[
            { value: 12, label: '12 V' },
            { value: 220, label: '220 V' },
            { value: 380, label: '380 V' },
          ]}
        />
      </Field>
      <Readout label="Resistencia total RT" value={`${fmt(s.rt)} Ω`} />
      <Readout label="Corriente total IT" value={`${fmt(s.it, 3)} A`} />
      <table className="e2-table">
        <thead>
          <tr>
            <th />
            <th>R1</th>
            <th>R2</th>
            <th>R3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>I</td>
            {s.i.map((x, k) => (
              <td key={k}>{fmt(x, 3)} A</td>
            ))}
          </tr>
          <tr>
            <td>U</td>
            {s.v.map((x, k) => (
              <td key={k}>{fmt(x, 1)} V</td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="hint">
        {tipo === 'serie'
          ? 'Serie: la corriente es la misma en todas; la tensión se divide. RT = R1 + R2 + R3.'
          : tipo === 'paralelo'
            ? 'Paralelo: la tensión es la misma en todas; la corriente se divide. 1/RT = 1/R1 + 1/R2 + 1/R3.'
            : 'Mixto: primero se calcula el paralelo de R2 y R3, después se suma R1 en serie.'}
      </p>
    </div>
  )
}

const REGLAS = [
  'Desconexión: corte efectivo de todas las fuentes de tensión',
  'Prevenir la realimentación: bloqueo (candado) y señalización',
  'Verificar la ausencia de tensión',
  'Puesta a tierra y en cortocircuito',
  'Señalización de la zona de trabajo',
]

function ReglasDeOro() {
  const mezcla = useMemo(() => shuffle(REGLAS.map((r, k) => ({ r, k }))), [])
  const [orden, setOrden] = useState<number[]>([])
  const [mal, setMal] = useState<number | null>(null)
  const listo = orden.length === REGLAS.length
  return (
    <div className="calc">
      <p className="hint">Tocá las reglas en el orden correcto.</p>
      <div className="e2-rules">
        {mezcla.map(({ r, k }) => {
          const pos = orden.indexOf(k)
          return (
            <button
              key={k}
              type="button"
              className={`btn ${pos >= 0 ? 'ok' : ''} ${mal === k ? 'bad' : ''}`}
              disabled={pos >= 0}
              onClick={() => {
                if (k === orden.length) {
                  setOrden([...orden, k])
                  setMal(null)
                } else setMal(k)
              }}
            >
              {pos >= 0 ? `${pos + 1}. ` : ''}
              {r}
            </button>
          )
        })}
      </div>
      {mal !== null && <p className="hint">✘ Esa no va ahora. Pensá: ¿qué hay que hacer antes?</p>}
      {listo && <p className="hint">✔ ¡Perfecto! Ese es el orden de las 5 reglas de oro.</p>}
      {orden.length > 0 && (
        <button type="button" className="btn" onClick={() => setOrden([])}>
          Empezar de nuevo
        </button>
      )}
    </div>
  )
}

/** Sección (mm²) y corriente admisible aproximada de cables unipolares en cañería. */
const CABLES: [number, number][] = [
  [1.5, 15],
  [2.5, 21],
  [4, 28],
  [6, 36],
]
const PIAS = [6, 10, 16, 20, 25, 32]

function Seleccion() {
  const [ib, setIb] = useState(8)
  const [inn, setIn] = useState(10)
  const [sec, setSec] = useState(1)
  const iz = CABLES[sec][1]
  const ok1 = ib <= inn
  const ok2 = inn <= iz
  return (
    <div className="calc">
      <Slider label="IB: corriente del circuito" value={ib} min={1} max={30} step={1} onChange={setIb} format={(x) => `${x} A`} />
      <Field label="In: termomagnético">
        <select className="input" value={inn} onChange={(e) => setIn(Number(e.target.value))}>
          {PIAS.map((x) => (
            <option key={x} value={x}>
              {x} A
            </option>
          ))}
        </select>
      </Field>
      <Field label="Cable (IZ aproximada)">
        <select className="input" value={sec} onChange={(e) => setSec(Number(e.target.value))}>
          {CABLES.map(([s, i], k) => (
            <option key={s} value={k}>
              {String(s).replace('.', ',')} mm² · {i} A
            </option>
          ))}
        </select>
      </Field>
      <Formula>
        IB {ok1 ? '≤' : '>'} In {ok2 ? '≤' : '>'} IZ → {ib} A {ok1 ? '≤' : '>'} {inn} A {ok2 ? '≤' : '>'} {iz} A
      </Formula>
      <p className="hint">
        {ok1 && ok2
          ? '✔ Bien elegido: el interruptor deja pasar la corriente del circuito y corta antes de que el cable se recaliente.'
          : !ok1
            ? '✘ El interruptor es chico: va a cortar aunque el circuito funcione normal.'
            : '✘ Peligro: el cable se recalentaría antes de que corte el interruptor. Hay que poner uno más chico o un cable más grueso.'}
      </p>
      <p className="hint">Los valores de IZ son aproximados; en una instalación real se toman de la reglamentación (AEA).</p>
    </div>
  )
}

const MATERIALES: [string, boolean][] = [
  ['Cobre', true],
  ['Plata', true],
  ['Aluminio', true],
  ['Oro', true],
  ['Hierro', true],
  ['Grafito', true],
  ['Agua con sal', true],
  ['PVC (plástico)', false],
  ['Cerámica / porcelana', false],
  ['Goma', false],
  ['Vidrio', false],
  ['Madera seca', false],
]

function Clasificar() {
  const items = useMemo(() => shuffle(MATERIALES), [])
  const [ans, setAns] = useState<Record<string, boolean>>({})
  const hits = items.filter(([n, c]) => ans[n] === c).length
  return (
    <div className="calc">
      <div className="e2-sorter">
        {items.map(([n, c]) => (
          <div key={n} className={`e2-sort-row ${n in ans ? (ans[n] === c ? 'ok' : 'bad') : ''}`}>
            <span>{n}</span>
            <span>
              <button type="button" className="btn small" onClick={() => setAns({ ...ans, [n]: true })}>
                Conductor
              </button>{' '}
              <button type="button" className="btn small" onClick={() => setAns({ ...ans, [n]: false })}>
                Aislante
              </button>
            </span>
          </div>
        ))}
      </div>
      <Readout label="Bien clasificados" value={`${hits} de ${items.length}`} />
    </div>
  )
}

/* ------------------------------------------------------------------ temas */

export const ELECTRICIDAD2_TOPICS: Topic[] = [
  {
    id: 'e2-magnitudes',
    title: 'Tensión, intensidad y resistencia',
    icon: '⚡',
    summary: 'Las tres magnitudes eléctricas: qué son, con qué letra se escriben y en qué se miden.',
    content: (
      <>
        <h4>Tensión eléctrica</h4>
        <p>
          La <b>tensión</b> o diferencia de potencial es la fuerza con la que son empujados los electrones a través de un conductor. Se mide en{' '}
          <b>volt [V]</b> y se escribe con las letras <b>E, V o U</b>. Aparece de dos formas:
        </p>
        <ul>
          <li>
            <b>Fuerza electromotriz (f.e.m.)</b>: la tensión que genera una fuente (una batería, un generador).
          </li>
          <li>
            <b>Caída de tensión</b>: la tensión que se "pierde" en los receptores.
          </li>
        </ul>
        <h4>Intensidad de corriente</h4>
        <p>
          Es el <b>flujo ordenado de electrones</b> por un conductor. Se escribe <b>I</b> y se mide en <b>ampere [A]</b>.
        </p>
        <h4>Resistencia eléctrica</h4>
        <p>
          Es la <b>oposición</b> que presenta un cuerpo al paso de la corriente. Se escribe <b>R</b> y se mide en <b>ohm [Ω]</b>.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t1-1', type: 'mc', q: '¿En qué unidad se mide la tensión?', options: ['Volt (V)', 'Ampere (A)', 'Ohm (Ω)', 'Watt (W)'], answer: 0, explain: 'Se escribe E, V o U.' },
      { id: 'e2-t1-2', type: 'mc', q: '¿Qué es la caída de tensión?', options: ['La tensión que se pierde en los receptores', 'La tensión que genera una batería', 'Un cortocircuito', 'La corriente que se escapa'], answer: 0, explain: 'La que genera la fuente es la f.e.m.' },
      { id: 'e2-t1-3', type: 'mc', q: 'La oposición al paso de la corriente es…', options: ['La resistencia', 'La tensión', 'La intensidad', 'La potencia'], answer: 0, explain: 'Se mide en ohm.' },
      { id: 'e2-t1-4', type: 'mc', q: '¿Con qué letra se representa la intensidad?', options: ['I', 'U', 'R', 'P'], answer: 0, explain: 'Se mide en ampere.' },
    ],
  },
  {
    id: 'e2-ohm',
    title: 'Ley de Ohm',
    icon: '🧮',
    summary: 'U = I × R. La corriente es proporcional a la tensión e inversamente proporcional a la resistencia.',
    content: (
      <>
        <p>
          La postuló el físico alemán <b>Georg Simon Ohm</b>: "En un circuito eléctrico, la intensidad de corriente que lo recorre es{' '}
          <b>directamente proporcional a la tensión</b> aplicada e <b>inversamente proporcional a la resistencia</b>."
        </p>
        <Formula>U = I × R · I = U / R · R = U / I</Formula>
        <p>
          <b>Ejemplo del apunte:</b> un circuito de 12 V con una corriente de 2 A. La resistencia de la lámpara es R = 12 V / 2 A = <b>6 Ω</b>.
        </p>
        <OhmCalc />
      </>
    ),
    activities: [
      { id: 'e2-t2-1', type: 'num', q: 'Una lámpara a 12 V consume 2 A. ¿Cuál es su resistencia? (Ω)', answer: 6, tolerance: 0.01, unit: 'Ω', explain: 'R = U / I = 12 / 2.' },
      { id: 'e2-t2-2', type: 'num', q: 'Una resistencia de 110 Ω conectada a 220 V. ¿Qué corriente circula? (A)', answer: 2, tolerance: 0.01, unit: 'A', explain: 'I = 220 / 110.' },
      { id: 'e2-t2-3', type: 'num', q: 'Por una resistencia de 50 Ω circulan 4 A. ¿Qué tensión tiene? (V)', answer: 200, tolerance: 0.01, unit: 'V', explain: 'U = 4 × 50.' },
      { id: 'e2-t2-4', type: 'mc', q: 'Si se duplica la tensión y la resistencia queda igual, la corriente…', options: ['Se duplica', 'Se reduce a la mitad', 'Queda igual', 'Se hace cero'], answer: 0, explain: 'Es directamente proporcional a la tensión.' },
    ],
  },
  {
    id: 'e2-kirchhoff',
    title: 'Ley de Kirchhoff',
    icon: '🔀',
    summary: 'Nodo, rama y malla. Lo que entra a un nodo es igual a lo que sale.',
    content: (
      <>
        <ul>
          <li>
            <b>Nodo</b>: punto donde se conectan dos o más elementos.
          </li>
          <li>
            <b>Rama</b>: los elementos comprendidos entre dos nodos consecutivos.
          </li>
          <li>
            <b>Malla</b>: cualquier camino cerrado del circuito.
          </li>
        </ul>
        <p>
          <b>Ley de Kirchhoff de las corrientes</b>: la suma de las corrientes que <b>llegan</b> a un nodo es igual a la suma de las que{' '}
          <b>salen</b>. Si las que entran se toman positivas y las que salen negativas, la suma da <b>0</b>.
        </p>
        <Nodo />
        <p className="hint">Esta ley es la base del interruptor diferencial: compara lo que entra con lo que sale.</p>
      </>
    ),
    activities: [
      { id: 'e2-t3-1', type: 'num', q: 'A un nodo llegan 3 A y 2 A, y sale una corriente de 1 A por un cable. ¿Cuánto sale por el otro? (A)', answer: 4, tolerance: 0, unit: 'A', explain: '3 + 2 = 1 + I → I = 4 A.' },
      { id: 'e2-t3-2', type: 'mc', q: '¿Qué es una malla?', options: ['Cualquier camino cerrado del circuito', 'Un punto de conexión', 'Un elemento', 'Un cable'], answer: 0, explain: 'El punto de conexión es el nodo.' },
      { id: 'e2-t3-3', type: 'mc', q: '¿Qué es una rama?', options: ['Los elementos entre dos nodos consecutivos', 'Un camino cerrado', 'Un tipo de cable', 'Una fuente'], answer: 0, explain: 'Entre nodo y nodo.' },
    ],
  },
  {
    id: 'e2-serie-paralelo',
    title: 'Circuitos en serie, paralelo y mixtos',
    icon: '🔗',
    summary: 'En serie la corriente se mantiene y la tensión se divide; en paralelo, al revés.',
    content: (
      <>
        <p>
          <b>Serie</b>: el borne de salida de un elemento se conecta con el de entrada del siguiente. <b>La intensidad se mantiene y la tensión se
          divide.</b>
        </p>
        <p>
          <b>Paralelo</b>: todos los bornes de entrada están unidos entre sí, y también los de salida. <b>La tensión se mantiene y la corriente se
          divide.</b>
        </p>
        <Laboratorio />
      </>
    ),
    activities: [
      { id: 'e2-t4-1', type: 'num', q: 'Tres resistencias de 10, 20 y 30 Ω en serie. ¿RT? (Ω)', answer: 60, tolerance: 0, unit: 'Ω', explain: 'Se suman.' },
      { id: 'e2-t4-2', type: 'num', q: 'Dos resistencias de 100 Ω en paralelo. ¿RT? (Ω)', answer: 50, tolerance: 0.01, unit: 'Ω', explain: 'Dos iguales en paralelo: la mitad.' },
      { id: 'e2-t4-3', type: 'mc', q: 'En un circuito en paralelo…', options: ['La tensión es la misma en todos los elementos', 'La corriente es la misma en todos', 'La resistencia total aumenta', 'Si uno se corta, se apagan todos'], answer: 0, explain: 'La corriente se divide.' },
      { id: 'e2-t4-4', type: 'mc', q: 'En serie, si se quema una lámpara…', options: ['Se apagan todas', 'Las demás siguen igual', 'Las demás brillan más', 'Salta el diferencial'], answer: 0, explain: 'Se corta el único camino.' },
    ],
  },
  {
    id: 'e2-materiales',
    title: 'Aislantes y conductores',
    icon: '🧱',
    summary: 'Qué materiales dejan pasar la corriente y cuáles no.',
    content: (
      <>
        <p>
          Un <b>aislante</b> conduce muy poco la electricidad. Se usa para separar conductores (evitar cortocircuitos) y para que las personas no
          toquen partes con tensión. Los más usados: <b>plásticos y cerámicas</b>.
        </p>
        <p>
          Un <b>conductor</b> ofrece poca resistencia al movimiento de las cargas. Los mejores son metales: <b>plata, cobre, oro, aluminio y
          hierro</b>. También conducen el grafito y las soluciones salinas.
        </p>
        <Clasificar />
      </>
    ),
    activities: [
      { id: 'e2-t5-1', type: 'mc', q: '¿Cuáles son los aislantes más usados?', options: ['Plásticos y cerámicas', 'Cobre y aluminio', 'Grafito y agua salada', 'Hierro y oro'], answer: 0, explain: 'Por ejemplo, el PVC de los cables.' },
      { id: 'e2-t5-2', type: 'mc', q: '¿Cuál de estos NO es un metal pero conduce?', options: ['El grafito', 'El cobre', 'La cerámica', 'El PVC'], answer: 0, explain: 'También las soluciones salinas.' },
    ],
  },
  {
    id: 'e2-esquemas',
    title: 'Esquemas funcional, unifilar y multifilar',
    icon: '📐',
    summary: 'Tres maneras de dibujar la misma instalación.',
    content: (
      <>
        <ul>
          <li>
            <b>Funcional</b>: representa todos los elementos con todas sus conexiones. Es sencillo y facilita entender el funcionamiento.
          </li>
          <li>
            <b>Unifilar</b>: todos los conductores de un circuito se representan con <b>una única línea</b> (la canalización), sin importar cuántos
            sean.
          </li>
          <li>
            <b>Multifilar</b>: se dibuja <b>una línea por cada conductor</b>.
          </li>
        </ul>
        <TresEsquemas />
      </>
    ),
    activities: [
      { id: 'e2-t6-1', type: 'mc', q: '¿En qué esquema una sola línea representa a todos los conductores de la cañería?', options: ['Unifilar', 'Multifilar', 'Funcional', 'Ninguno'], answer: 0, explain: 'Los trazos cortos indican cuántos conductores hay.' },
      { id: 'e2-t6-2', type: 'mc', q: '¿Cuál es el más fácil para entender cómo funciona el circuito?', options: ['Funcional', 'Unifilar', 'Multifilar', 'Todos igual'], answer: 0, explain: 'Muestra todas las conexiones entre fase y neutro.' },
      { id: 'e2-t6-3', type: 'mc', q: 'En el multifilar…', options: ['Hay una línea por cada conductor', 'Hay una línea por cañería', 'No se dibujan los cables', 'Sólo se dibuja la fase'], answer: 0, explain: 'Fase, neutro, retorno y tierra por separado.' },
    ],
  },
  {
    id: 'e2-simbolos',
    title: 'Simbología eléctrica',
    icon: '🔣',
    summary: 'Lámpara, caja de derivación, interruptores, protecciones y más.',
    content: (
      <>
        <p>Los planos de la instalación se dibujan con símbolos normalizados (lámina "Simbología eléctrica" del taller):</p>
        <div className="e2-symbols">
          {SIMBOLOS.map((s) => (
            <figure key={s.id}>
              <Simbolo id={s.id} />
              <figcaption>
                <b>{s.name}</b>
                <span>{s.desc}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="hint">Practicá en el juego "Símbolos eléctricos".</p>
      </>
    ),
    activities: [
      { id: 'e2-t7-1', type: 'mc', q: '¿Qué símbolo es un círculo con una cruz adentro?', options: ['Lámpara', 'Caja de derivación', 'Interruptor', 'Tomacorriente'], answer: 0, explain: 'La caja de derivación es un círculo vacío.' },
      { id: 'e2-t7-2', type: 'mc', q: '¿Qué indica la marca IΔ?', options: ['Interruptor diferencial', 'Termomagnético', 'Fusible', 'Lámpara'], answer: 0, explain: 'Δ = diferencia.' },
      { id: 'e2-t7-3', type: 'mc', q: '¿Qué indica la marca I> en un interruptor?', options: ['Que corta por sobrecorriente (termomagnético)', 'Que es un diferencial', 'Que es una lámpara', 'Que es una tierra'], answer: 0, explain: 'I mayor que la nominal.' },
    ],
  },
  {
    id: 'e2-seguridad',
    title: 'Seguridad: las 5 reglas de oro',
    icon: '🦺',
    summary: 'El procedimiento para trabajar sin tensión. Riesgo eléctrico, contacto directo e indirecto.',
    content: (
      <>
        <p>Las reglas de oro son el procedimiento más común para trabajar sin tensión, en este orden:</p>
        <ol>
          <li>
            <b>Desconexión</b>, corte efectivo: se desconectan todas las fuentes de tensión de la zona de trabajo.
          </li>
          <li>
            <b>Prevenir la realimentación</b>: bloqueo (por ejemplo, con un candado) y señalización.
          </li>
          <li>
            <b>Verificar la ausencia de tensión</b>, aun habiendo hecho los pasos anteriores.
          </li>
          <li>
            <b>Puesta a tierra y en cortocircuito</b> de los conductores activos.
          </li>
          <li>
            <b>Señalización de la zona de trabajo</b>, en superficie y altura.
          </li>
        </ol>
        <ReglasDeOro />
        <h4>Riesgo eléctrico</h4>
        <p>Es la probabilidad de un contacto con una instalación eléctrica, teniendo en cuenta la gravedad de sus consecuencias.</p>
        <ul>
          <li>
            <b>Contacto directo</b>: se tocan directamente partes activas de la instalación (por ejemplo, un cable pelado).
          </li>
          <li>
            <b>Contacto indirecto</b>: se tocan partes que quedaron bajo tensión por una <b>falla de aislamiento</b> (por ejemplo, la carcasa de un
            lavarropas).
          </li>
        </ul>
      </>
    ),
    activities: [
      { id: 'e2-t8-1', type: 'mc', q: '¿Cuál es la primera regla de oro?', options: ['Desconexión: corte efectivo', 'Verificar ausencia de tensión', 'Señalizar la zona', 'Poner a tierra'], answer: 0, explain: 'Primero se corta.' },
      { id: 'e2-t8-2', type: 'mc', q: '¿Para qué se pone un candado en el interruptor?', options: ['Para evitar que alguien lo vuelva a conectar', 'Para medir la tensión', 'Para que no se robe', 'Para marcar la zona'], answer: 0, explain: 'Regla 2: prevenir la realimentación.' },
      { id: 'e2-t8-3', type: 'mc', q: 'Tocar la carcasa de una heladera que quedó con tensión por una falla es un contacto…', options: ['Indirecto', 'Directo', 'Seguro', 'Magnético'], answer: 0, explain: 'La carcasa no debería tener tensión.' },
      { id: 'e2-t8-4', type: 'mc', q: '¿Hace falta verificar la ausencia de tensión si ya se cortó y se bloqueó?', options: ['Sí, siempre', 'No', 'Sólo de noche', 'Sólo en 380 V'], answer: 0, explain: 'Regla 3.' },
    ],
  },
  {
    id: 'e2-fallas',
    title: 'Cortocircuito y sobrecarga',
    icon: '💥',
    summary: 'Las dos fallas que cortan las protecciones de la instalación.',
    content: (
      <>
        <p>
          <b>Cortocircuito</b>: un conductor o componente ofrece un camino de <b>muy baja resistencia</b> entre dos puntos de distinto potencial (por
          ejemplo, se tocan fase y neutro). La corriente sube muchísimo: puede dañar equipos, recalentar y provocar incendios. Lo causan cables dañados,
          conexiones defectuosas o fallas en componentes.
        </p>
        <p>
          <b>Sobrecarga</b>: el circuito lleva <b>más corriente de la que puede manejar</b> durante un tiempo prolongado, por ejemplo por conectar
          demasiados artefactos. Calienta los conductores, degrada los aislantes y también puede causar incendios.
        </p>
        <p>
          Los <b>fusibles</b> y los <b>termomagnéticos</b> interrumpen la corriente en estos casos.{' '}
          <SubLink to="/componentes/instalacion">Simulalas en 3D</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t9-1', type: 'mc', q: 'Enchufar estufa, pava y microondas en la misma zapatilla puede provocar…', options: ['Una sobrecarga', 'Un contacto indirecto', 'Un cortocircuito seguro', 'Nada'], answer: 0, explain: 'Demasiada corriente por el mismo circuito.' },
      { id: 'e2-t9-2', type: 'mc', q: 'Se tocan los cables de fase y neutro: es un…', options: ['Cortocircuito', 'Sobrecarga', 'Contacto indirecto', 'Circuito en serie'], answer: 0, explain: 'Camino de resistencia casi cero.' },
      { id: 'e2-t9-3', type: 'mc', q: '¿Qué daño produce una sobrecarga prolongada?', options: ['Recalienta los cables y degrada el aislante', 'Ninguno', 'Baja la tensión a cero', 'Enfría los cables'], answer: 0, explain: 'Puede terminar en incendio.' },
    ],
  },
  {
    id: 'e2-protecciones',
    title: 'Elementos de protección',
    icon: '🛡️',
    summary: 'Fusible, interruptor diferencial y termomagnético. Cómo elegir el PIA: IB ≤ In ≤ IZ.',
    content: (
      <>
        <p>Protegen a las personas, a los animales y a la propia instalación.</p>
        <ul>
          <li>
            <b>Fusible</b>: un filamento de metal de bajo punto de fusión que <b>se funde</b> cuando la corriente supera cierto valor (cortocircuito o
            exceso de carga). Hay que reemplazarlo.
          </li>
          <li>
            <b>Interruptor diferencial</b>: protege a las <b>personas</b> de contactos directos e indirectos. Se dispara cuando la diferencia entre la
            corriente que entra y la que sale supera su sensibilidad.
          </li>
          <li>
            <b>Interruptor termomagnético (PIA)</b>: protege al <b>circuito</b> contra sobrecargas (parte térmica) y cortocircuitos (parte magnética).
            Se rearma con la palanca.
          </li>
        </ul>
        <h4>Características normativas de un PIA</h4>
        <p>
          Marca, modelo, <b>curva de disparo</b>, <b>corriente de empleo</b>, tensión de empleo, ámbito de aplicación, <b>capacidad máxima de
          cortocircuito</b>, posición de los contactos y número de norma.
        </p>
        <h4>Para elegirlo bien</h4>
        <Formula>IB ≤ In ≤ IZ</Formula>
        <p>
          <b>IB</b>: corriente de servicio del circuito · <b>In</b>: corriente nominal del interruptor · <b>IZ</b>: corriente que soporta el cable en
          forma permanente.
        </p>
        <Seleccion />
      </>
    ),
    activities: [
      { id: 'e2-t10-1', type: 'mc', q: '¿Qué protección cuida a las PERSONAS?', options: ['El diferencial', 'El termomagnético', 'El fusible', 'El tablero'], answer: 0, explain: 'Contactos directos e indirectos.' },
      { id: 'e2-t10-2', type: 'mc', q: 'Un circuito consume 12 A y su cable soporta 21 A. ¿Qué termomagnético va?', options: ['16 A', '10 A', '25 A', '32 A'], answer: 0, explain: '12 ≤ 16 ≤ 21.' },
      { id: 'e2-t10-3', type: 'mc', q: '¿Qué hay que hacer cuando se funde un fusible?', options: ['Reemplazarlo (después de reparar la falla)', 'Subir la palanca', 'Puentearlo con un alambre', 'Nada'], answer: 0, explain: 'Nunca se puentea.' },
      { id: 'e2-t10-4', type: 'mc', q: 'En IB ≤ In ≤ IZ, ¿qué es IZ?', options: ['La corriente admisible del cable', 'La corriente del circuito', 'La nominal del interruptor', 'La de cortocircuito'], answer: 0, explain: 'Lo que soporta el conductor en forma permanente.' },
    ],
  },
  {
    id: 'e2-multimetro',
    title: 'El multímetro',
    icon: '📟',
    summary: 'Tensión en paralelo, corriente en serie y resistencia sin tensión.',
    content: (
      <>
        <p>
          El <b>multímetro</b> (tester) es un instrumento portátil para medir magnitudes <b>activas</b> (tensión, intensidad) y <b>pasivas</b>{' '}
          (resistencia), en continua o en alterna y en varios rangos. Los hay analógicos y digitales.
        </p>
        <ul>
          <li>
            Para medir <b>intensidad</b>, se coloca <b>en serie</b> con el elemento.
          </li>
          <li>
            Para medir <b>tensión</b>, se coloca <b>en paralelo</b>.
          </li>
        </ul>
        <p>
          Con las dos mediciones se puede calcular la resistencia: <b>R = U / I</b>. <SubLink to="/componentes/multimetro">Probalo en 3D</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t11-1', type: 'mc', q: 'Para medir la corriente de una lámpara, el amperímetro va…', options: ['En serie', 'En paralelo', 'Entre fase y tierra', 'Sin conectar'], answer: 0, explain: 'La corriente tiene que pasar por él.' },
      { id: 'e2-t11-2', type: 'num', q: 'El voltímetro marca 220 V y el amperímetro 0,5 A. ¿Cuál es la resistencia? (Ω)', answer: 440, tolerance: 0.01, unit: 'Ω', explain: 'R = 220 / 0,5.' },
    ],
  },
  {
    id: 'e2-planos',
    title: 'Los planos del taller',
    icon: '🗂️',
    summary: 'Los cuatro circuitos que se arman y el rótulo de las láminas.',
    content: (
      <>
        <p>En el taller se dibujan y se arman, con sus esquemas funcional, multifilar y unifilar:</p>
        <ol>
          <li>Conexión de una lámpara con un interruptor.</li>
          <li>Conexión de dos lámparas en serie comandadas mediante un interruptor.</li>
          <li>Conexión de dos lámparas en paralelo comandadas mediante un interruptor.</li>
          <li>Conexión de dos lámparas en escalera comandadas mediante dos interruptores.</li>
        </ol>
        <p>
          Cada lámina lleva el <b>rótulo</b> del taller (175 mm de ancho, con fecha, apellido, dibujó/revisó/aprobó, escala, denominación, plano Nº,
          material, cantidad y curso) según las normas <b>IRAM 4501</b> (símbolo ISO) e <b>IRAM 4508</b> (espesores de líneas).
        </p>
        <p>
          <SubLink to="/componentes/instalacion">Armá los cuatro circuitos en 3D</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t12-1', type: 'mc', q: '¿Cuántas llaves de combinación lleva el circuito de escalera?', options: ['Dos', 'Una', 'Tres', 'Ninguna'], answer: 0, explain: 'Una en cada lugar de comando.' },
      { id: 'e2-t12-2', type: 'num', q: '¿Qué ancho tiene el rótulo de las láminas? (mm)', answer: 175, tolerance: 0, unit: 'mm', explain: 'Modelo de rótulo del taller.' },
    ],
  },
]

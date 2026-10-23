import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Topic } from '../../data/theory'
import { Readout, Segmented, Slider } from '../../components/ui'
import { useSub } from '../../lib/nav'
import { sectionShape, FORMA_INFO, type Forma } from '../../three/models/primero/Lima'
import { ETAPAS } from '../../three/models/primero/Martillo'
import './a1.css'

/* ------------------------------------------------------------------ simuladores chicos */

type Stage = 'desbastado' | 'afinado' | 'pulido'
const STAGE_INFO: Record<Stage, { lima: string; text: string; amp: number; step: number }> = {
  desbastado: { lima: 'Lima basta', text: 'Arranca virutas grandes. Quedan rayas profundas y marcadas: es trabajo de fuerza y volumen, no de estética.', amp: 9, step: 14 },
  afinado: { lima: 'Entrefina y después fina', text: 'Los dientes más densos actúan como una lija metálica: nivelan los picos. Las marcas dejan de verse a simple vista.', amp: 3, step: 7 },
  pulido: { lima: 'Sólo lima fina, con tiza', text: 'Muy poca presión. La tiza en el picado evita que las limaduras se claven y rayen. Superficie lisa, brillante y precisa.', amp: 0.6, step: 4 },
}

function SurfaceDemo({ stages = ['desbastado', 'afinado', 'pulido'] as Stage[] }) {
  const [st, setSt] = useState<Stage>(stages[0])
  const info = STAGE_INFO[st]
  const d = useMemo(() => {
    let s = 'M0 70 '
    let seed = 7
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) - 0.5
    for (let x = 0; x <= 300; x += info.step / 2) s += `L${x} ${(40 + (x % info.step < info.step / 2 ? -1 : 1) * info.amp + rnd() * info.amp).toFixed(1)} `
    return s + 'L300 70 Z'
  }, [info])
  return (
    <div className="calc">
      <Segmented<Stage>
        value={st}
        onChange={setSt}
        options={stages.map((s) => ({ value: s, label: s === 'desbastado' ? (stages.length === 2 ? 'Desbastado' : '1. Desbastado') : s === 'afinado' ? '2. Afinado' : stages.length === 2 ? 'Acabado' : '3. Pulido' }))}
      />
      <svg viewBox="0 0 300 80" className="a1-surface" role="img" aria-label="Perfil de la superficie">
        <path d={d} className={`surf ${st}`} />
      </svg>
      <Readout label="Herramienta" value={info.lima} />
      <p className="hint">{info.text}</p>
    </div>
  )
}

function SizeDemo() {
  const [pieza, setPieza] = useState(60)
  const [lima, setLima] = useState(8)
  const cuerpo = lima * 25.4
  const ratio = cuerpo / pieza
  const verdict = ratio < 1.6 ? { ok: false, t: 'Caso A: lima muy chica para la pieza. El acabado queda irregular.' } : ratio > 6 ? { ok: false, t: 'Caso B: lima muy grande para la pieza. Se pierde el control y la lima se tambalea.' } : { ok: true, t: 'Buen tamaño: la lima cubre bien la superficie y se controla.' }
  return (
    <div className="calc">
      <Slider label="Largo de la superficie a limar" value={pieza} min={15} max={200} step={5} onChange={setPieza} format={(x) => `${x} mm`} />
      <Slider label="Tamaño de la lima" value={lima} min={3} max={20} step={1} onChange={setLima} format={(x) => `${x}" (${Math.round(x * 25.4)} mm de cuerpo)`} />
      <svg viewBox="0 0 320 70" className="a1-size" role="img" aria-label="Lima sobre la pieza">
        <rect x={160 - pieza * 0.6} y={40} width={pieza * 1.2} height={22} className="piece" />
        <rect x={160 - cuerpo * 0.3} y={30} width={cuerpo * 0.6} height={8} className={`file ${verdict.ok ? 'ok' : 'bad'}`} />
      </svg>
      <p className={`feedback ${verdict.ok ? 'ok' : 'bad'}`}>{verdict.t}</p>
    </div>
  )
}

const FORMS: Forma[] = ['plana', 'paralela', 'mediacana', 'redonda', 'cuadrada', 'triangular']

function SectionsGrid() {
  const [sel, setSel] = useState<Forma>('plana')
  return (
    <div className="calc">
      <div className="a1-sections">
        {FORMS.map((f) => {
          const pts = sectionShape(f)
          return (
            <button key={f} type="button" className={`a1-sec ${sel === f ? 'on' : ''}`} onClick={() => setSel(f)} aria-pressed={sel === f}>
              <svg viewBox="-1.2 -1 2.4 2" aria-hidden>
                <polygon points={pts.map(([y, z]) => `${y},${-z}`).join(' ')} />
              </svg>
              <span>{FORMA_INFO[f].name}</span>
            </button>
          )
        })}
      </div>
      <p>
        <b>{FORMA_INFO[sel].name}:</b> {FORMA_INFO[sel].uso}
      </p>
    </div>
  )
}

function PicadoDemo() {
  const [picado, setPicado] = useState<'simple' | 'doble' | 'escofina' | 'fresado'>('doble')
  const [dientes, setDientes] = useState(150)
  const step = Math.max(3, 34 - Math.log(dientes) * 4.6)
  const lines = (angle: number, cls: string, k = 1) => {
    const out = []
    for (let x = -120; x < 300; x += step * k) out.push(<line key={`${cls}${x}`} x1={x} y1={0} x2={x + Math.tan(angle) * 90} y2={90} className={cls} />)
    return out
  }
  const grade = dientes < 60 ? 'Basta (gruesa)' : dientes < 250 ? 'Bastarda (entrefina)' : dientes < 600 ? 'Fina' : 'Extrafina'
  return (
    <div className="calc">
      <Segmented
        value={picado}
        onChange={setPicado}
        options={[
          { value: 'simple', label: 'Simple' },
          { value: 'doble', label: 'Doble' },
          { value: 'escofina', label: 'Escofina' },
          { value: 'fresado', label: 'Dientes fresados' },
        ]}
      />
      <svg viewBox="0 0 220 90" className="a1-teeth" role="img" aria-label={`Picado ${picado}`}>
        <rect width={220} height={90} className="bg" />
        {picado === 'simple' && lines(0.55, 't1')}
        {picado === 'doble' && (
          <>
            {lines(0.55, 't1')}
            {lines(-0.8, 't2', 1.3)}
          </>
        )}
        {picado === 'fresado' && lines(0, 't3', 1.4)}
        {picado === 'escofina' &&
          Array.from({ length: Math.ceil(90 / step) }, (_, r) =>
            Array.from({ length: Math.ceil(220 / step) }, (_, c) => {
              const x = c * step + (r % 2) * step * 0.5
              const y = r * step
              return <path key={`${r}-${c}`} d={`M${x} ${y} l${step * 0.45} ${step * 0.35} l${-step * 0.45} ${step * 0.25}z`} className="t4" />
            }),
          )}
      </svg>
      <Slider label="Grado de corte" value={dientes} min={18} max={1200} step={1} onChange={setDientes} format={(x) => `${x} dientes por cm²`} />
      <Readout label="Clasificación" value={grade} />
      <p className="hint">
        {picado === 'simple' && 'Una sola fila de surcos paralelos: metales blandos (aluminio, plomo, estaño) y afilado.'}
        {picado === 'doble' && 'Dos filas cruzadas: dientes de diamante que rompen la viruta. El estándar para hierro y acero.'}
        {picado === 'escofina' && 'Dientes individuales, triangulares y muy salientes: madera, caucho o cuero.'}
        {picado === 'fresado' && 'Dientes curvos tallados con fresa: arrancan mucho en metales blandos.'}
      </p>
    </div>
  )
}

function PostureDemo() {
  const [mano, setMano] = useState<'diestro' | 'zurdo'>('diestro')
  const flip = mano === 'zurdo' ? -1 : 1
  return (
    <div className="calc">
      <Segmented
        value={mano}
        onChange={setMano}
        options={[
          { value: 'diestro', label: 'Soy diestro/a' },
          { value: 'zurdo', label: 'Soy zurdo/a' },
        ]}
      />
      <svg viewBox="-150 -10 300 200" className="a1-posture" role="img" aria-label={`Posición de los pies para ${mano}`}>
        <rect x={-120} y={0} width={240} height={26} className="bench" />
        <rect x={-22} y={20} width={44} height={20} className="vise" />
        <text x={0} y={16} className="lbl">
          banco y morsa
        </text>
        <g transform={`scale(${flip} 1)`}>
          {/* pie adelantado (izquierdo en diestros) y pie atrás */}
          <g transform="translate(-34 92) rotate(-20)">
            <ellipse rx={13} ry={26} className="foot front" />
          </g>
          <g transform="translate(30 150) rotate(45)">
            <ellipse rx={13} ry={26} className="foot" />
          </g>
          <line x1={-34} y1={92} x2={30} y2={150} className="dash" />
        </g>
        <text x={-flip * 92} y={58} className="lbl">
          {mano === 'diestro' ? 'pie izquierdo adelante' : 'pie derecho adelante'}
        </text>
        <text x={flip * 70} y={185} className="lbl">
          ~45° con el banco
        </text>
      </svg>
      <ul>
        <li>Torso inclinado unos 60° respecto de la morsa.</li>
        <li>Codo formando 90° para transmitir bien la fuerza.</li>
        <li>
          Mano hábil en el mango: pulgar arriba, dedos por debajo. Mano inhábil apoyada en la punta, presionando contra la pieza.
        </li>
        <li>Presión constante sólo en el avance; el retorno se hace sin presión (levantando un poco la lima).</li>
      </ul>
    </div>
  )
}

function DirectionDemo() {
  const [pass, setPass] = useState(0)
  const [anim, setAnim] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setAnim((a) => (a + 1) % 40), 60)
    return () => window.clearInterval(id)
  }, [])
  const strokes = (angle: number, cls: string) => {
    const out = []
    for (let k = -160; k < 160; k += 12) {
      const dx = Math.cos(angle) * 200
      const dy = Math.sin(angle) * 200
      const cx = Math.cos(angle + Math.PI / 2) * k
      const cy = Math.sin(angle + Math.PI / 2) * k
      out.push(<line key={k} x1={80 + cx - dx} y1={60 + cy - dy} x2={80 + cx + dx} y2={60 + cy + dy} className={cls} />)
    }
    return out
  }
  const a1 = Math.PI / 4
  const a2 = -Math.PI / 4
  const t = anim / 40
  const fa = pass === 0 ? a1 : a2
  return (
    <div className="calc">
      <Segmented
        value={pass}
        onChange={setPass}
        options={[
          { value: 0, label: '1ª pasada (45°)' },
          { value: 1, label: '2ª pasada (cambio de dirección)' },
        ]}
      />
      <svg viewBox="0 0 160 120" className="a1-dir" role="img" aria-label="Dirección del limado">
        <defs>
          <clipPath id="a1-clip">
            <rect x={20} y={15} width={120} height={90} rx={3} />
          </clipPath>
        </defs>
        <rect x={20} y={15} width={120} height={90} rx={3} className="face" />
        <g clipPath="url(#a1-clip)">
          {strokes(a1, 's1')}
          {pass === 1 && strokes(a2, 's2')}
        </g>
        <g transform={`translate(${80 + Math.cos(fa) * (t - 0.5) * 70} ${60 + Math.sin(fa) * (t - 0.5) * 70}) rotate(${(fa * 180) / Math.PI})`}>
          <rect x={-30} y={-4} width={60} height={8} rx={2} className="file" />
        </g>
      </svg>
      <p className="hint">
        Las rayas cruzadas muestran dónde se sacó material: cuando desaparecen las de la pasada anterior, la superficie quedó pareja.
      </p>
    </div>
  )
}

function CicloTable() {
  const sub = useSub()
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Operaciones</th>
              <th>Qué se hace</th>
            </tr>
          </thead>
          <tbody>
            {ETAPAS.map((e) => (
              <tr key={e.id}>
                <td>
                  <b>{e.name}</b>
                </td>
                <td>{e.ops}</td>
                <td>{e.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <Link to={sub('/componentes/martillo')} className="btn primary">
          🔨 Ver el martillo etapa por etapa en 3D
        </Link>
      </p>
    </>
  )
}

/* ------------------------------------------------------------------ temas */

export const AJUSTE1_TOPICS: Topic[] = [
  {
    id: 'a1-limado',
    title: '¿Qué es el limado?',
    icon: '🪚',
    summary: 'Operación manual que quita pequeñas cantidades de metal. Desbastado y acabado.',
    content: (
      <>
        <p>
          El <b>limado</b> es una operación manual mediante la cual se desprenden pequeñas cantidades de metal para darle a una pieza la{' '}
          <b>forma</b> y las <b>dimensiones</b> deseadas.
        </p>
        <p>En el taller se hacen dos tipos de trabajo:</p>
        <ul>
          <li>
            <b>Desbastado</b>: se desprende mucho material y las huellas de la lima son visibles. Se usa para acercarse a las medidas
            finales.
          </li>
          <li>
            <b>Acabado</b>: se desprende poco material. La terminación es lisa: no se ven huellas a simple vista.
          </li>
        </ul>
        <SurfaceDemo stages={['desbastado', 'pulido']} />
      </>
    ),
    activities: [
      { id: 'a1-t1-1', type: 'mc', q: '¿Qué es el limado?', options: ['Una operación manual que quita pequeñas cantidades de metal', 'Una forma de soldar', 'Cortar chapa con tijera', 'Pintar una pieza'], answer: 0, explain: 'Sirve para dar forma y dimensiones a una pieza.' },
      { id: 'a1-t1-2', type: 'mc', q: 'En el desbastado…', options: ['Se saca mucho material y se ven las huellas', 'Se saca poco material y queda liso', 'No se saca material', 'Se pule con tiza'], answer: 0, explain: 'Es para acercarse a las medidas finales.' },
      { id: 'a1-t1-3', type: 'mc', q: 'En el acabado…', options: ['Se saca poco material y no se ven huellas', 'Se saca mucho material', 'Se usa la lima más gruesa', 'Se corta con sierra'], answer: 0, explain: 'La terminación es lisa.' },
    ],
  },
  {
    id: 'a1-lima',
    title: 'La lima y sus partes',
    icon: '🔧',
    summary: 'Varilla de acero templado con dientes: mango, espiga, cuerpo y punta.',
    content: (
      <>
        <p>
          La <b>lima</b> es una varilla de <b>acero templado</b> de sección variada, cuyas caras tienen un estriado (dientes) para rebajar y
          pulir superficies.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Parte</th>
                <th>Qué es</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mango</td>
                <td>La empuñadura. Tiene que estar siempre en buen estado.</td>
              </tr>
              <tr>
                <td>Espiga</td>
                <td>Extremo puntiagudo que se inserta dentro del mango.</td>
              </tr>
              <tr>
                <td>Cuerpo</td>
                <td>La parte activa, con los dientes o picado.</td>
              </tr>
              <tr>
                <td>Punta</td>
                <td>El extremo opuesto al mango.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="hint">Nunca se lima con una lima sin mango: la espiga puede clavarse en la mano.</p>
      </>
    ),
    activities: [
      { id: 'a1-t2-1', type: 'mc', q: '¿De qué material es la lima?', options: ['Acero templado', 'Aluminio', 'Bronce', 'Plástico duro'], answer: 0, explain: 'Tiene que ser más dura que el material que lima.' },
      { id: 'a1-t2-2', type: 'mc', q: '¿Cuál es la parte activa de la lima?', options: ['El cuerpo', 'El mango', 'La espiga', 'La virola'], answer: 0, explain: 'Es la que tiene los dientes.' },
      { id: 'a1-t2-3', type: 'mc', q: 'El extremo opuesto al mango se llama…', options: ['Punta', 'Espiga', 'Talón', 'Cuerpo'], answer: 0, explain: 'Punta.' },
      { id: 'a1-t2-4', type: 'mc', q: '¿Por qué el mango tiene que estar en buen estado?', options: ['Porque sin él la espiga puede lastimar la mano', 'Por estética', 'Para que la lima corte más', 'No importa'], answer: 0, explain: 'Es una regla de seguridad básica.' },
    ],
  },
  {
    id: 'a1-tamano-forma',
    title: 'Tamaño y forma de las limas',
    icon: '📏',
    summary: 'El tamaño se elige según la superficie; la forma, según la geometría de la pieza.',
    content: (
      <>
        <p>Para un trabajo de ajuste no se usa cualquier lima: la elección depende de cuatro factores. Los dos primeros:</p>
        <h4>Tamaño</h4>
        <p>
          Es la longitud del <b>cuerpo</b> (la parte estriada), en <b>pulgadas</b>. En el taller se usan de 6", 8" o 10", pero hay de 3" a
          20". Se elige según la amplitud de la superficie: una lima muy chica en una pieza grande deja un acabado <b>irregular</b> (caso A);
          una muy grande en una pieza chica <b>quita control</b> (caso B).
        </p>
        <SizeDemo />
        <h4>Forma (sección transversal)</h4>
        <p>Es la figura que se vería si se cortara la lima por la mitad. Se elige según la geometría de la pieza:</p>
        <SectionsGrid />
      </>
    ),
    activities: [
      { id: 'a1-t3-1', type: 'mc', q: 'Usar una lima de 3" en una pieza enorme…', options: ['Deja un acabado irregular', 'Da más control', 'Es lo ideal', 'Pule mejor'], answer: 0, explain: 'Es el caso A del apunte.' },
      { id: 'a1-t3-2', type: 'mc', q: 'Usar una lima de 20" en una pieza diminuta…', options: ['Hace perder el control', 'Deja un acabado espejo', 'Es lo recomendado', 'No cambia nada'], answer: 0, explain: 'Es el caso B: la lima se tambalea.' },
      { id: 'a1-t3-3', type: 'mc', q: 'Para un chavetero (ranura cuadrada) se usa la lima…', options: ['Cuadrada', 'Redonda', 'Media caña', 'Triangular'], answer: 0, explain: 'Su sección es un cuadrado perfecto.' },
      { id: 'a1-t3-4', type: 'mc', q: 'La lima triangular sirve para…', options: ['Ángulos agudos e internos', 'Agrandar agujeros redondos', 'Superficies curvas exteriores', 'Madera'], answer: 0, explain: 'Sus caras forman ángulos de 60°.' },
      { id: 'a1-t3-5', type: 'mc', q: 'La media caña tiene…', options: ['Una cara plana y otra curva', 'Tres caras iguales', 'Sección redonda', 'Sección cuadrada'], answer: 0, explain: 'Sirve para pasar de superficies planas a curvas.' },
      { id: 'a1-t3-6', type: 'mc', q: '¿Cuál es la forma de lima más común, para superficies planas exteriores?', options: ['Plana', 'Redonda', 'Triangular', 'Cuadrada'], answer: 0, explain: 'Su sección es un rectángulo.' },
    ],
  },
  {
    id: 'a1-picado',
    title: 'Picado y grado de corte',
    icon: '🦷',
    summary: 'Cómo están tallados los dientes y cuántos hay por cm².',
    content: (
      <>
        <h4>Picado o tallado</h4>
        <p>Es la forma en que se tallaron los dientes. De esto depende cómo arranca la viruta:</p>
        <ul>
          <li>
            <b>Simple</b>: una sola fila de surcos paralelos. Para metales blandos (aluminio, plomo, estaño) o para afilar: el material blando
            no se "clava" tanto.
          </li>
          <li>
            <b>Doble</b>: dos filas de surcos que se cruzan y forman dientes de diamante que rompen la viruta en trozos chicos. Es el
            estándar para metales duros como el hierro y el acero.
          </li>
          <li>
            <b>Escofina</b>: dientes individuales, triangulares y muy salientes. Sólo para materiales muy blandos: madera, caucho o cuero.
          </li>
          <li>
            También existen el <b>simple largo</b> y los <b>dientes fresados</b>.
          </li>
        </ul>
        <h4>Grado de corte</h4>
        <p>
          Depende de la cantidad de dientes por cm² (de <b>18 a 1200</b>): <b>bastas o gruesas</b> (pocos dientes grandes, desbaste
          agresivo), <b>entrefinas o bastardas</b> (dientes medianos), <b>finas</b> (muchos dientes chicos, buen acabado) y{' '}
          <b>extrafinas</b> (máxima calidad y precisión).
        </p>
        <PicadoDemo />
      </>
    ),
    activities: [
      { id: 'a1-t4-1', type: 'mc', q: 'Para limar una pieza de aluminio conviene picado…', options: ['Simple', 'Doble', 'Escofina', 'Ninguno'], answer: 0, explain: 'El material blando no se clava tanto en una sola fila de dientes.' },
      { id: 'a1-t4-2', type: 'mc', q: 'Para dar forma a un mango de madera se usa…', options: ['Una escofina', 'Una lima de picado doble extrafina', 'Una lima redonda fina', 'Una lima triangular'], answer: 0, explain: 'Dientes muy salientes para un arranque agresivo en materiales blandos.' },
      { id: 'a1-t4-3', type: 'mc', q: 'El grado de corte se mide en…', options: ['Dientes por cm²', 'Pulgadas', 'Kilos', 'Grados'], answer: 0, explain: 'De 18 a 1200 dientes por cm².' },
      { id: 'a1-t4-4', type: 'mc', q: 'Una lima con pocos dientes grandes es…', options: ['Basta (gruesa)', 'Fina', 'Extrafina', 'Bastarda'], answer: 0, explain: 'Se usa para el desbaste.' },
      { id: 'a1-t4-5', type: 'mc', q: '¿Por qué el picado doble es el estándar para el acero?', options: ['Porque sus dientes de diamante rompen la viruta en trozos chicos', 'Porque es más barato', 'Porque no se gasta nunca', 'Porque es más liviano'], answer: 0, explain: 'Así la viruta no empasta los dientes.' },
    ],
  },
  {
    id: 'a1-etapas',
    title: 'Las tres etapas del limado',
    icon: '✨',
    summary: 'Desbastado, afinado y pulido: cada etapa prepara la superficie para la siguiente.',
    content: (
      <>
        <p>El grado de corte define la función de la lima dentro de tres etapas sucesivas, del arranque bruto al acabado espejo:</p>
        <ol>
          <li>
            <b>Desbastado (aproximación)</b>: con <b>lima basta</b> se elimina rápido el material sobrante. Quedan rayas profundas.
          </li>
          <li>
            <b>Afinado (nivelación)</b>: con lima <b>entrefina</b> y después <b>fina</b> se borran las huellas del desbaste.
          </li>
          <li>
            <b>Pulido o acabado (terminación espejo)</b>: sólo <b>lima fina</b>. <b>Técnica de la tiza</b>: se frota tiza sobre el picado
            hasta llenar los dientes, así las limaduras no se clavan y no rayan la pieza. Se aplica muy poca presión.
          </li>
        </ol>
        <SurfaceDemo />
      </>
    ),
    activities: [
      { id: 'a1-t5-1', type: 'mc', q: '¿Cuál es la primera etapa del limado?', options: ['Desbastado', 'Pulido', 'Afinado', 'Trazado'], answer: 0, explain: 'Primero se saca el material sobrante.' },
      { id: 'a1-t5-2', type: 'mc', q: '¿Para qué se frota tiza en la lima fina?', options: ['Para que las limaduras no se claven y rayen la pieza', 'Para marcar la pieza', 'Para que corte más rápido', 'Para que no se oxide'], answer: 0, explain: 'La tiza llena los dientes.' },
      { id: 'a1-t5-3', type: 'mc', q: 'En el pulido se aplica…', options: ['Muy poca presión', 'Toda la fuerza posible', 'Presión sólo al volver', 'Golpes con martillo'], answer: 0, explain: 'Es la etapa de precisión.' },
      { id: 'a1-t5-4', type: 'mc', q: '¿Qué limas se usan en el afinado?', options: ['Entrefina y después fina', 'Sólo basta', 'Escofina', 'Ninguna'], answer: 0, explain: 'Las filas de dientes más densas nivelan las rayas.' },
    ],
  },
  {
    id: 'a1-tecnica',
    title: 'Técnica: postura y agarre',
    icon: '🧍',
    summary: 'Pies, torso a 60°, codo a 90°, mano hábil en el mango y presión sólo en el avance.',
    content: (
      <>
        <p>Una postura correcta hace el limado más eficaz, preciso y seguro, y evita lesiones.</p>
        <ul>
          <li>
            <b>Pies</b>: separados a la altura de los hombros, formando unos 45° con el banco. Diestro: <b>pie izquierdo adelante</b>; zurdo:
            pie derecho adelante.
          </li>
          <li>
            <b>Cuerpo</b>: el torso inclinado unos <b>60°</b> respecto de la morsa. El movimiento sale de la cadera y los hombros, no sólo de
            los brazos: así se cansa menos.
          </li>
          <li>
            <b>Brazo</b>: el codo forma un ángulo de <b>90°</b>.
          </li>
          <li>
            <b>Agarre</b>: la mano hábil toma el mango (pulgar arriba, dedos por debajo); la inhábil se apoya en la punta y presiona contra la
            pieza.
          </li>
          <li>
            <b>Ciclo de corte</b>: presión constante y pareja <b>sólo en la carrera de avance</b>, que disminuye al final del recorrido. En el
            retorno se alivia la presión o se levanta un poco la lima para no desafilar los dientes: el material se desprende sólo en el
            avance.
          </li>
        </ul>
        <PostureDemo />
      </>
    ),
    activities: [
      { id: 'a1-t6-1', type: 'mc', q: 'Si sos diestro, ¿qué pie va adelante?', options: ['El izquierdo', 'El derecho', 'Los dos juntos', 'Da igual'], answer: 0, explain: 'Diestro: izquierdo adelante; zurdo: derecho.' },
      { id: 'a1-t6-2', type: 'num', q: '¿Qué ángulo tiene que formar el codo?', answer: 90, tolerance: 0, unit: '°', explain: 'Así se transmite bien la fuerza.' },
      { id: 'a1-t6-3', type: 'num', q: '¿Cuántos grados se inclina el torso respecto de la morsa?', answer: 60, tolerance: 0, unit: '°', explain: 'Aproximadamente 60°.' },
      { id: 'a1-t6-4', type: 'mc', q: '¿Cuándo se hace presión con la lima?', options: ['Sólo en la carrera de avance', 'Sólo al volver', 'En los dos sentidos', 'Nunca'], answer: 0, explain: 'En el retorno se alivia o se levanta para no desafilar los dientes.' },
      { id: 'a1-t6-5', type: 'mc', q: '¿Dónde va la mano inhábil?', options: ['Apoyada en la punta, presionando', 'En el mango, junto a la otra', 'En el bolsillo', 'Sosteniendo la pieza'], answer: 0, explain: 'La hábil toma el mango; la inhábil presiona en la punta.' },
    ],
  },
  {
    id: 'a1-direccion',
    title: 'Dirección del limado y superficies',
    icon: '↗️',
    summary: 'Pasadas cruzadas a 45° y la lima justa para cada superficie.',
    content: (
      <>
        <p>
          La lima se inclina <b>45°</b> en la primera pasada y se <b>cambia de dirección</b> en la segunda: así la superficie queda
          uniforme y se ve dónde falta limar.
        </p>
        <DirectionDemo />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Superficie</th>
                <th>Lima</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Planas exteriores</td>
                <td>Limas de gran tamaño</td>
              </tr>
              <tr>
                <td>Planas interiores</td>
                <td>Limas pequeñas</td>
              </tr>
              <tr>
                <td>Agujeros ciegos</td>
                <td>Limas pequeñas de perfil adecuado</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
    activities: [
      { id: 'a1-t7-1', type: 'num', q: '¿Con qué ángulo se inclina la lima en la primera pasada?', answer: 45, tolerance: 0, unit: '°', explain: 'Después se cambia de dirección.' },
      { id: 'a1-t7-2', type: 'mc', q: '¿Para qué se cambia de dirección en la segunda pasada?', options: ['Para lograr una superficie uniforme', 'Para descansar el brazo', 'Para afilar la lima', 'No se cambia nunca'], answer: 0, explain: 'Las rayas cruzadas muestran dónde se sacó material.' },
      { id: 'a1-t7-3', type: 'mc', q: 'Para una superficie plana interior conviene…', options: ['Una lima pequeña', 'La lima más grande', 'Una escofina', 'Un martillo'], answer: 0, explain: 'Una grande no entra o se pierde el control.' },
      { id: 'a1-t7-4', type: 'mc', q: 'Para superficies planas exteriores se usan…', options: ['Limas de gran tamaño', 'Limas de 3"', 'Sólo limas redondas', 'Limas triangulares chicas'], answer: 0, explain: 'Cubren mejor la superficie.' },
    ],
  },
  {
    id: 'a1-martillo',
    title: 'El martillo de peña: ciclo de fabricación',
    icon: '🔨',
    summary: 'Del plano a la pieza terminada: numerar caras, limar, trazar, perforar, cortar y pulir.',
    content: (
      <>
        <p>
          El proyecto del taller es un <b>martillo de peña</b> de acero <b>IRAM 1010</b>, con una barra de <b>□22 mm</b> y <b>95 mm</b> de
          largo. El <b>ciclo de fabricación</b> ordena las operaciones (numeradas de 10 en 10) con sus herramientas e instrumentos.
        </p>
        <p>
          Primero se <b>numeran las caras como un dado</b>: las opuestas suman 7 (1-6, 2-5, 3-4) y la identificación de la pieza va en la
          cara 6.
        </p>
        <CicloTable />
      </>
    ),
    activities: [
      { id: 'a1-t8-1', type: 'mc', q: '¿Qué cara se lima primero?', options: ['La cara 1, a lo largo, quitando la escoria', 'La cara 6', 'La peña', 'El ojo'], answer: 0, explain: 'Op. 20: se controla el paralelismo con la regla.' },
      { id: 'a1-t8-2', type: 'mc', q: '¿Con qué se pinta la pieza antes de trazar?', options: ['Sulfato de cobre', 'Barniz', 'Tiza', 'Aceite'], answer: 0, explain: 'Op. 70: así las líneas trazadas se ven bien.' },
      { id: 'a1-t8-3', type: 'mc', q: '¿Cómo se hace el ojo oblongo?', options: ['Perforando con mechas sucesivas y terminando con lima redonda', 'Con un solo golpe de granete', 'Con la sierra', 'Con lima plana'], answer: 0, explain: 'Op. 90, en el taladro de banco.' },
      { id: 'a1-t8-4', type: 'mc', q: '¿Con qué se corta el sobrante de la peña?', options: ['Con la sierra, y se termina a lima', 'Con el granete', 'Con la tijera', 'Con la regla'], answer: 0, explain: 'Op. 100.' },
      { id: 'a1-t8-5', type: 'mc', q: '¿Qué se hace al final?', options: ['Pulir, colocar el cabo y barnizar', 'Trazar', 'Numerar las caras', 'Cortar la barra'], answer: 0, explain: 'Op. 110.' },
      { id: 'a1-t8-6', type: 'num', q: 'Con el gramil se traza el eje de la cara 1. ¿A cuántos mm se fija?', answer: 11, tolerance: 0, unit: 'mm', explain: 'La mitad de 22 mm.' },
    ],
  },
]

import type { ComponentDef } from '../../catalog/types'
import { Field, Readout, Segmented, Slider, Toggle } from '../../components/ui'
import {
  CORDON_PARTS,
  CordonModel,
  ELECTRODO_PARTS,
  EPP_PARTS,
  EQUIPO_PARTS,
  ElectrodoModel,
  EppModel,
  EquipoModel,
  UNION_PARTS,
  UnionModel,
  designacion,
  diagnosticar,
  filtroDin,
  recomendada,
  type CordonParams,
  type ElectrodoParams,
  type EppParams,
  type EquipoParams,
  type Posicion,
  type Union,
  type UnionParams,
} from '../../three/models/segundo/Soldadura'

const DIAMS = [2, 2.5, 3.25, 4, 5]
const fmtD = (d: number) => String(d).replace('.', ',')

/* ------------------------------------------------------------------ equipo */

function EquipoControls({ params, set }: { params: EquipoParams; set: (p: Partial<EquipoParams>) => void }) {
  const { din } = filtroDin(params.amperaje)
  const diam = DIAMS.find((d) => params.amperaje <= 40 * d) ?? 5
  return (
    <>
      <Toggle label="Máquina encendida" value={params.encendido} onChange={(encendido) => set({ encendido, soldando: encendido && params.soldando })} />
      <Slider label="Intensidad de corriente" value={params.amperaje} min={40} max={200} step={5} onChange={(amperaje) => set({ amperaje })} format={(x) => `${x} A`} />
      <Toggle label="Encender el arco" value={params.soldando} onChange={(soldando) => set({ soldando: params.encendido && soldando })} />
      {!params.encendido && <p className="hint">Primero encendé la máquina.</p>}
      <Readout label="Electrodo que corresponde (35–40 A/mm)" value={`ø ${fmtD(diam)} mm`} />
      <Readout label="Filtro de la máscara" value={`DIN ${din}`} />
      {params.soldando && params.encendido && <p className="hint">⚠ El arco llega a unos 4000 °C y emite rayos ultravioleta e infrarrojos: nunca se mira sin máscara.</p>}
    </>
  )
}

const equipo: ComponentDef = {
  id: 'equipo',
  name: 'Equipo de soldadura por arco',
  category: 'Equipo de soldadura',
  icon: '⚡',
  short: 'Máquina, cables, pinza porta electrodo, pinza de masa y la pieza en la mesa. Regulá la intensidad y encendé el arco.',
  parts: EQUIPO_PARTS,
  camera: [3, 6, 11],
  target: [0, 0.6, 0],
  shadowY: -3.9,
  defaultParams: { amperaje: 90, encendido: true, soldando: true } satisfies EquipoParams,
  render: (p) => <EquipoModel {...(p as EquipoParams)} />,
  Controls: EquipoControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        La máquina de soldar provee la corriente. Se conecta con un cable a la <b>pieza</b> (pinza de masa) y con otro a la <b>pinza porta electrodo</b>,
        donde se sujeta el electrodo.
      </p>
      <p>
        Al encender el arco, la temperatura sube casi al instante entre la punta del electrodo y la pieza. El metal del electrodo se funde y es proyectado
        en gotitas hacia un pequeño cráter fundido de la pieza: el <b>charco de fusión</b>. Al avanzar, las gotas solidificadas forman el{' '}
        <b>cordón de soldadura</b>.
      </p>
    </>
  ),
  activities: [
    { id: 's2-eq-1', type: 'mc', q: '¿Para qué sirve la pinza de masa?', options: ['Cierra el circuito entre la máquina, la pieza y el electrodo', 'Sostiene el electrodo', 'Regula la corriente', 'Apaga el arco'], answer: 0, explain: 'Se conecta lo más cerca posible de la soldadura.' },
    { id: 's2-eq-2', type: 'mc', q: '¿Por qué la mesa de soldar tiene ranuras?', options: ['Para que caigan las chispas y la escoria caliente', 'Para que pese menos', 'Para enfriar el electrodo', 'Para medir'], answer: 0, explain: 'Es una norma de seguridad contra incendios.' },
    { id: 's2-eq-3', type: 'num', q: 'Aproximadamente, ¿qué temperatura alcanza el arco eléctrico? (°C)', answer: 4000, tolerance: 0.1, unit: '°C', explain: 'Unos 4000 °C.' },
  ],
}

/* ------------------------------------------------------------------ electrodo */

function ElectrodoControls({ params, set }: { params: ElectrodoParams; set: (p: Partial<ElectrodoParams>) => void }) {
  const [lo, hi] = recomendada(params.diametro)
  return (
    <>
      <Field label="Diámetro del electrodo (del alma)">
        <Segmented<number> value={params.diametro} onChange={(diametro) => set({ diametro })} options={DIAMS.map((d) => ({ value: d, label: `${fmtD(d)} mm` }))} />
      </Field>
      <Toggle label="Corte del revestimiento" value={params.corte} onChange={(corte) => set({ corte })} />
      <Readout label="Intensidad recomendada (35–40 A por mm)" value={`${Math.round(lo)} – ${Math.round(hi)} A`} />
      <Readout label="Filtro DIN de la máscara" value={`${filtroDin(lo).din}${filtroDin(hi).din !== filtroDin(lo).din ? ` – ${filtroDin(hi).din}` : ''}`} />
    </>
  )
}

const electrodo: ComponentDef = {
  id: 'electrodo',
  name: 'Electrodo revestido',
  category: 'Equipo de soldadura',
  icon: '🥢',
  short: 'Alma metálica y revestimiento. Elegí el diámetro y mirá qué intensidad le corresponde.',
  parts: ELECTRODO_PARTS,
  camera: [0, 2.5, 11],
  target: [0, 0.6, 0],
  shadowY: -0.4,
  defaultParams: { diametro: 2.5, corte: true } satisfies ElectrodoParams,
  render: (p) => <ElectrodoModel {...(p as ElectrodoParams)} />,
  Controls: ElectrodoControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        El electrodo cumple una doble función: es <b>conductor de la corriente</b> y <b>material de aporte</b>. Está formado por un <b>alma</b> metálica y
        un <b>revestimiento</b>.
      </p>
      <p>Funciones del revestimiento:</p>
      <ul>
        <li>Facilita el encendido y mantiene el arco: al fundirse forma un gas que conduce la electricidad.</li>
        <li>Genera una atmósfera protectora que aísla el charco del oxígeno, el hidrógeno y el nitrógeno del aire.</li>
        <li>Agrega elementos que eliminan óxidos e impurezas del baño.</li>
        <li>Forma la escoria, que hace de molde y retarda el enfriamiento del cordón.</li>
        <li>Influye en el aspecto del cordón, la penetración y la facilidad para soldar.</li>
      </ul>
      <p>
        <b>Regla práctica:</b> entre <b>35 y 40 A por cada mm</b> de diámetro.
      </p>
    </>
  ),
  activities: [
    { id: 's2-el-1', type: 'mc', q: '¿Qué es el diámetro de un electrodo?', options: ['El diámetro del alma metálica', 'El diámetro con el revestimiento', 'El largo', 'El ancho del cordón'], answer: 0, explain: 'Se mide el alma.' },
    { id: 's2-el-2', type: 'num', q: 'Electrodo de 3,25 mm: ¿intensidad máxima con la regla de 40 A/mm? (A)', answer: 130, tolerance: 0.01, unit: 'A', explain: '3,25 × 40 = 130 A.' },
    { id: 's2-el-3', type: 'mc', q: '¿Qué función NO cumple el revestimiento?', options: ['Conducir la corriente a la pinza de masa', 'Proteger el charco del aire', 'Formar la escoria', 'Facilitar el encendido del arco'], answer: 0, explain: 'Eso lo hacen el cable y la pinza de masa.' },
  ],
}

/* ------------------------------------------------------------------ simulador del cordón */

function CordonControls({ params, set }: { params: CordonParams; set: (p: Partial<CordonParams>) => void }) {
  const d = diagnosticar(params)
  const [lo, hi] = recomendada(params.diametro)
  return (
    <>
      <Field label="Electrodo">
        <Segmented<number> value={params.diametro} onChange={(diametro) => set({ diametro, corriente: Math.round(37.5 * diametro) })} options={DIAMS.slice(0, 4).map((x) => ({ value: x, label: `${fmtD(x)} mm` }))} />
      </Field>
      <Slider label="Intensidad" value={params.corriente} min={40} max={200} step={5} onChange={(corriente) => set({ corriente })} format={(x) => `${x} A`} />
      <p className="hint">
        Recomendada: {Math.round(lo)} – {Math.round(hi)} A.
      </p>
      <Slider label="Longitud del arco" value={params.arco} min={0.4} max={2.5} step={0.1} onChange={(arco) => set({ arco })} format={(x) => `${fmtD(Math.round(x * params.diametro * 10) / 10)} mm (${fmtD(x)} × ø)`} />
      <Slider label="Velocidad de avance" value={params.velocidad} min={0.4} max={2} step={0.05} onChange={(velocidad) => set({ velocidad })} format={(x) => (x < 0.7 ? 'muy lenta' : x > 1.35 ? 'muy rápida' : 'constante y correcta')} />
      <Slider label="Ángulo de avance" value={params.angulo} min={30} max={90} step={5} onChange={(angulo) => set({ angulo })} format={(x) => `${x}°`} />
      <Toggle label="Escoria encima (sin picar)" value={params.escoria} onChange={(escoria) => set({ escoria })} />
      <Readout label="Nota del cordón" value={`${d.nota} / 10`} />
      {d.problemas.length === 0 ? (
        <p className="hint">✔ Cordón parejo, con buena penetración y sin salpicaduras.</p>
      ) : (
        <ul className="hint">
          {d.problemas.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )}
    </>
  )
}

const cordon: ComponentDef = {
  id: 'cordon',
  name: 'Simulador del cordón',
  category: 'Equipo de soldadura',
  icon: '〰️',
  short: 'Cambiá la intensidad, la longitud del arco, la velocidad y el ángulo, y mirá cómo queda el cordón y cuánto penetra.',
  parts: CORDON_PARTS,
  camera: [4.5, 4, 5.5],
  target: [0, 0, 0],
  shadowY: -0.62,
  defaultParams: { diametro: 2.5, corriente: 95, arco: 1, velocidad: 1, angulo: 70, escoria: false } satisfies CordonParams,
  render: (p) => <CordonModel {...(p as CordonParams)} />,
  Controls: CordonControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>La calidad del cordón depende de cuatro factores que maneja el soldador:</p>
      <ul>
        <li>
          <b>Intensidad</b>: 35 a 40 A por mm de diámetro. Alta: salpicaduras, mordeduras y riesgo de perforar. Baja: el arco se apaga y no hay fusión.
        </li>
        <li>
          <b>Longitud del arco</b>: aproximadamente igual al diámetro del electrodo. Corto: se pega. Largo: poca penetración y gotas gruesas.
        </li>
        <li>
          <b>Velocidad de avance</b>: constante. Si se frena, el cordón se ensancha; si se apura, se angosta.
        </li>
        <li>
          <b>Ángulo</b>: a tope, transversal 90° y de avance 60° a 80°. Menos de 45° reduce mucho la penetración.
        </li>
      </ul>
    </>
  ),
  activities: [
    { id: 's2-co-1', type: 'mc', q: '¿Qué longitud de arco se recomienda?', options: ['Aproximadamente igual al diámetro del electrodo', 'El doble del diámetro', 'Lo más largo posible', 'Cero: tocando la pieza'], answer: 0, explain: 'Hay que ir bajando la pinza a medida que se consume el electrodo.' },
    { id: 's2-co-2', type: 'mc', q: 'Si hacés una pausa en el avance, el cordón…', options: ['Se ensancha', 'Se angosta', 'Queda igual', 'Desaparece'], answer: 0, explain: 'Se deposita más material en ese lugar.' },
    { id: 's2-co-3', type: 'mc', q: 'Aparecen mordeduras a los costados y muchas salpicaduras. ¿Qué pasa?', options: ['Intensidad demasiado alta', 'Intensidad baja', 'Avance lento', 'Arco corto'], answer: 0, explain: 'Hay que bajar la intensidad.' },
  ],
}

/* ------------------------------------------------------------------ protección personal */

function EppControls({ params, set }: { params: EppParams; set: (p: Partial<EppParams>) => void }) {
  const f = filtroDin(params.amperaje)
  return (
    <>
      <Slider label="Intensidad de trabajo" value={params.amperaje} min={40} max={450} step={5} onChange={(amperaje) => set({ amperaje })} format={(x) => `${x} A`} />
      <Readout label="Filtro (grado de protección DIN)" value={f.din} />
      <Readout label="Rango" value={f.rango} />
      <p className="hint">Cuanto más intensidad, más luz y radiación: el filtro tiene que ser más oscuro (número más alto).</p>
    </>
  )
}

const epp: ComponentDef = {
  id: 'epp',
  name: 'Protección personal',
  category: 'Seguridad',
  icon: '🥽',
  short: 'Máscara con vidrio inactínico, lentes, guantes y delantal de cuero y zapatos de seguridad.',
  parts: EPP_PARTS,
  camera: [2, 3, 10],
  target: [0, 0.8, 0],
  shadowY: -2.4,
  defaultParams: { amperaje: 90 } satisfies EppParams,
  render: (p) => <EppModel {...(p as EppParams)} />,
  Controls: EppControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        Al soldar se desprenden proyecciones incandescentes y radiaciones que dañan ojos, piel y vías respiratorias. Se previene con el equipo de
        protección: <b>máscara</b>, <b>lentes de seguridad</b>, <b>guantes de cuero</b> de puño largo, <b>delantal de cuero</b> y{' '}
        <b>zapatos de seguridad</b>. Para soldar en vertical o sobre cabeza se agregan cofia, polainas y mangas o casaca de cuero.
      </p>
      <p>El equipo de protección es de uso personal: no se presta.</p>
      <table className="s2-table">
        <thead>
          <tr>
            <th>Intensidad</th>
            <th>40 – 79 A</th>
            <th>80 – 174 A</th>
            <th>175 – 299 A</th>
            <th>300 – 499 A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Filtro DIN</td>
            <td>10</td>
            <td>11</td>
            <td>12</td>
            <td>13</td>
          </tr>
        </tbody>
      </table>
    </>
  ),
  activities: [
    { id: 's2-epp-1', type: 'mc', q: '¿Qué protege el delantal de cuero?', options: ['El torso, de chispas y escoria', 'Los ojos', 'Las manos', 'Los oídos'], answer: 0, explain: 'Los guantes protegen manos y muñecas.' },
    { id: 's2-epp-2', type: 'num', q: '¿Qué filtro DIN corresponde a 150 A?', answer: 11, tolerance: 0, unit: '', explain: '80 – 174 A → DIN 11.' },
    { id: 's2-epp-3', type: 'mc', q: '¿Por qué se pone un vidrio transparente delante del inactínico?', options: ['Para que las chispas no dañen el filtro', 'Para ver más oscuro', 'Para ver más claro', 'Por estética'], answer: 0, explain: 'Se reemplaza cada vez que hace falta.' },
  ],
}

/* ------------------------------------------------------------------ uniones y posiciones */

const UNIONES: Record<Union, string> = { tope: 'A tope', angulo: 'En ángulo', t: 'En T', solapada: 'Solapada' }
const POSICIONES: Record<Posicion, string> = { plana: 'Plana', horizontal: 'Horizontal', vertical: 'Vertical', sobrecabeza: 'Sobre cabeza' }

function UnionControls({ params, set }: { params: UnionParams; set: (p: Partial<UnionParams>) => void }) {
  const code = designacion(params)
  const dificultad = { plana: 'la más fácil y la de mejor calidad: siempre que se pueda, se acomoda la pieza así', horizontal: params.union === 'tope' ? 'común, pero más difícil (2G)' : 'común y accesible (2F)', vertical: 'requiere mucha habilidad, ascendente o descendente', sobrecabeza: 'poco común, muy difícil: requiere gran experiencia' }[params.posicion]
  return (
    <>
      <Field label="Tipo de unión">
        <Segmented<Union> value={params.union} onChange={(union) => set({ union })} options={(Object.keys(UNIONES) as Union[]).map((u) => ({ value: u, label: UNIONES[u] }))} />
      </Field>
      <Field label="Posición">
        <Segmented<Posicion> value={params.posicion} onChange={(posicion) => set({ posicion })} options={(Object.keys(POSICIONES) as Posicion[]).map((u) => ({ value: u, label: POSICIONES[u] }))} />
      </Field>
      <Readout label="Designación" value={code} />
      <p className="hint">
        El número es la posición (1 plana, 2 horizontal, 3 vertical, 4 sobre cabeza) y la letra el tipo: <b>G</b> a tope (ranura) y <b>F</b> en ángulo
        (filete). Esta posición es {dificultad}.
      </p>
    </>
  )
}

const uniones: ComponentDef = {
  id: 'uniones',
  name: 'Uniones y posiciones',
  category: 'Uniones y posiciones',
  icon: '📐',
  short: 'A tope, en ángulo, en T y solapada; en posición plana, horizontal, vertical o sobre cabeza (1G, 2F, 3G…).',
  parts: UNION_PARTS,
  camera: [6, 4, 7],
  target: [0, 0.6, 0],
  shadowY: -1.45,
  defaultParams: { union: 'tope', posicion: 'plana' } satisfies UnionParams,
  render: (p) => <UnionModel {...(p as UnionParams)} />,
  Controls: UnionControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        El <b>tipo de unión</b> es cómo están ubicadas las piezas una respecto de la otra: <b>a tope</b>, <b>en ángulo</b>, <b>en T</b> o{' '}
        <b>solapadas</b> (un caso particular de unión en ángulo).
      </p>
      <p>
        La <b>posición</b> es cómo se presentan las piezas a soldar: <b>plana</b>, <b>horizontal</b>, <b>vertical</b> o <b>sobre cabeza</b>.
      </p>
      <p>
        Lo más común son las uniones en ángulo (1F, 2F) o en T (2F) y después a tope (1G). La plana es la más fácil y da el mejor cordón: siempre que se
        pueda, se acomoda la pieza en posición plana.
      </p>
    </>
  ),
  activities: [
    { id: 's2-un-1', type: 'mc', q: '¿Qué significa 3G?', options: ['Unión a tope en posición vertical', 'Unión en ángulo sobre cabeza', 'Unión a tope plana', 'Tres cordones'], answer: 0, explain: '3 = vertical, G = a tope.' },
    { id: 's2-un-2', type: 'mc', q: '¿Cuál es la posición más fácil?', options: ['Plana', 'Vertical', 'Sobre cabeza', 'Horizontal a tope'], answer: 0, explain: 'Y da la mejor terminación.' },
    { id: 's2-un-3', type: 'mc', q: 'La unión solapada es un caso particular de unión…', options: ['En ángulo', 'A tope', 'Vertical', 'Plana'], answer: 0, explain: 'El cordón va en el vértice.' },
  ],
}

export const SOLDADURA2_CATALOG: ComponentDef[] = [equipo, electrodo, cordon, epp, uniones]

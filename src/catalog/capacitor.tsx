import type { ComponentDef, PartInfo } from './types'
import { CapacitorModel, ceramicCode, formatCap, type CapType } from '../three/models/Capacitor'
import { Field, Formula, Readout, Segmented, Slider } from '../components/ui'

const ELECTRO_VALUES = [1, 10, 47, 100, 470, 1000, 2200]
const CERAMIC_VALUES = [0.000022, 0.0001, 0.001, 0.01, 0.1]

function fmtTime(s: number) {
  if (s >= 1) return `${s.toFixed(2).replace('.', ',')} s`
  if (s >= 1e-3) return `${(s * 1e3).toFixed(2).replace('.', ',')} ms`
  return `${(s * 1e6).toFixed(2).replace('.', ',')} µs`
}

function CapControls({ params, set }: { params: { type: CapType; uF: number; volts: number; rk: number }; set: (p: object) => void }) {
  const values = params.type === 'electrolitico' ? ELECTRO_VALUES : CERAMIC_VALUES
  const tau = params.rk * 1000 * params.uF * 1e-6
  const energy = 0.5 * params.uF * 1e-6 * params.volts ** 2
  return (
    <>
      <Field label="Tipo">
        <Segmented<CapType>
          value={params.type}
          options={[
            { value: 'electrolitico', label: 'Electrolítico' },
            { value: 'ceramico', label: 'Cerámico' },
          ]}
          onChange={(type) => set({ type, uF: type === 'electrolitico' ? 100 : 0.1, volts: type === 'electrolitico' ? 25 : 50 })}
        />
      </Field>
      <Field label="Capacidad">
        <select className="input" value={params.uF} onChange={(e) => set({ uF: Number(e.target.value) })}>
          {values.map((v) => (
            <option key={v} value={v}>
              {formatCap(v)}
              {params.type === 'ceramico' ? ` (código ${ceramicCode(v)})` : ''}
            </option>
          ))}
        </select>
      </Field>
      {params.type === 'electrolitico' && (
        <Field label="Tensión máxima">
          <Segmented<number>
            value={params.volts}
            options={[10, 16, 25, 50].map((v) => ({ value: v, label: `${v} V` }))}
            onChange={(volts) => set({ volts })}
          />
        </Field>
      )}
      <Readout label="Energía almacenada a tensión máxima" value={`${(energy * 1000).toFixed(3).replace('.', ',')} mJ`} />
      <h4 className="panel-sub">Carga a través de una resistencia</h4>
      <Slider label="Resistencia" value={params.rk} min={1} max={100} onChange={(rk) => set({ rk })} format={(v) => `${v} kΩ`} />
      <Formula>τ = R × C = {fmtTime(tau)}</Formula>
      <Readout label="Carga completa (≈ 5τ)" value={fmtTime(5 * tau)} />
    </>
  )
}

const electroParts: PartInfo[] = [
  { id: 'funda', name: 'Funda plástica', desc: 'Termocontraíble con los datos impresos: capacidad, tensión máxima y temperatura. La franja con signos “−” marca la pata NEGATIVA.' },
  { id: 'lata', name: 'Lata de aluminio', desc: 'Envase que contiene el bobinado y el electrolito.' },
  { id: 'valvula', name: 'Válvula de seguridad', desc: 'Las ranuras en cruz de la tapa: si el capacitor se conecta al revés o se sobrecarga, se infla y se abre por ahí en lugar de explotar.' },
  { id: 'armaduras', name: 'Armaduras (placas)', desc: 'Dos tiras de papel de aluminio enrolladas. Son las “placas” donde se acumulan las cargas + y −.' },
  { id: 'dielectrico', name: 'Dieléctrico', desc: 'Papel embebido en electrolito, más una capa finísima de óxido de aluminio, que separa las placas. Es aislante: no deja pasar la corriente continua.' },
  { id: 'tapon', name: 'Tapón de goma', desc: 'Sella la lata por abajo y deja salir los terminales.' },
  { id: 'positivo', name: 'Terminal positivo (+)', desc: 'Pata más larga.' },
  { id: 'negativo', name: 'Terminal negativo (−)', desc: 'Pata más corta, del lado de la franja. ¡Si se invierte la polaridad puede explotar!' },
]

const ceramicParts: PartInfo[] = [
  { id: 'cuerpo', name: 'Recubrimiento', desc: 'Capa de resina color ocre con el código impreso. Ej.: 104 = 10 × 10⁴ pF = 100 nF.' },
  { id: 'placas', name: 'Placas metálicas', desc: 'Dos capas de metal (plata) a cada lado del disco cerámico.' },
  { id: 'dielectrico', name: 'Disco cerámico (dieléctrico)', desc: 'Material aislante entre las placas. Los cerámicos NO tienen polaridad.' },
  { id: 'terminales', name: 'Terminales', desc: 'Se pueden conectar en cualquier sentido.' },
]

export const capacitor: ComponentDef = {
  id: 'capacitor',
  name: 'Capacitor',
  category: 'Componentes básicos',
  icon: '⫴',
  short: 'Almacena energía en un campo eléctrico. Puede tener polaridad (electrolítico).',
  camera: [4.6, 1.6, 9.2],
  target: [0, -1.4, 0],
  shadowY: -5.32,
  defaultParams: { type: 'electrolitico', uF: 100, volts: 25, rk: 10 },
  render: (p) => <CapacitorModel type={p.type} uF={p.uF} volts={p.volts} />,
  Controls: CapControls as ComponentDef['Controls'],
  parts: (p) => (p.type === 'electrolitico' ? electroParts : ceramicParts),
  theory: (
    <>
      <p>
        Un <strong>capacitor</strong> (o condensador) son <strong>dos placas conductoras separadas por un aislante</strong>
        (dieléctrico). Al conectarlo a una tensión, se acumulan cargas positivas en una placa y negativas en la otra:
        guarda energía como una “pequeña batería” muy rápida.
      </p>
      <p>
        Su capacidad se mide en <strong>faradios (F)</strong>; como es una unidad enorme, usamos microfaradios (µF),
        nanofaradios (nF) y picofaradios (pF).
      </p>
      <Formula>Q = C × V &nbsp;&nbsp; E = ½ × C × V²</Formula>
      <h4>Carga y descarga</h4>
      <p>
        Si se carga a través de una resistencia, tarda un tiempo que depende de la <strong>constante de tiempo τ = R × C</strong>.
        En 1 τ llega al 63 % y en 5 τ está prácticamente cargado.
      </p>
      <h4>Tipos</h4>
      <ul>
        <li><strong>Electrolítico</strong>: valores grandes (µF). <strong>Tiene polaridad</strong>: la franja marca el negativo.</li>
        <li><strong>Cerámico</strong>: valores chicos (pF, nF). Sin polaridad. Se leen con un código: 104 = 100 nF.</li>
      </ul>
      <p className="tip">Usos típicos: filtrar ruido en la alimentación, temporizadores (con el 555), antirrebote de pulsadores.</p>
    </>
  ),
  activities: [
    { id: 'cap-1', type: 'mc', q: '¿En qué unidad se mide la capacidad?', options: ['Henrios', 'Faradios', 'Ohms', 'Coulombs'], answer: 1, explain: 'La capacidad se mide en faradios (F).' },
    { id: 'cap-2', type: 'mc', q: 'En un capacitor electrolítico, la franja con signos “−” indica…', options: ['El terminal positivo', 'El terminal negativo', 'La tensión máxima', 'Nada, es decoración'], answer: 1, explain: 'La franja marca el terminal negativo.' },
    { id: 'cap-3', type: 'mc', q: 'Un capacitor cerámico dice “104”. ¿Cuál es su valor?', options: ['104 pF', '10 nF', '100 nF', '1 µF'], answer: 2, explain: '10 × 10⁴ pF = 100 000 pF = 100 nF.' },
    { id: 'cap-4', type: 'num', q: 'Con R = 10 kΩ y C = 100 µF, ¿cuánto vale τ en segundos?', answer: 1, tolerance: 0.02, unit: 's', explain: 'τ = R × C = 10 000 × 0,0001 = 1 s.' },
    { id: 'cap-5', type: 'mc', q: '¿Cuál es el aislante entre las placas?', options: ['El dieléctrico', 'La lata', 'El electrolito conductor', 'Las patas'], answer: 0, explain: 'El dieléctrico es el material aislante entre las placas.' },
    { id: 'cap-6', type: 'mc', q: '¿Qué puede pasar si conectamos un electrolítico al revés?', options: ['Nada', 'Se carga más rápido', 'Se calienta, se infla y puede explotar', 'Cambia de color'], answer: 2, explain: 'Invertir la polaridad lo daña: se infla y la válvula se abre.' },
  ],
}

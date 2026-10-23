import type { ComponentDef } from '../../catalog/types'
import './c2.css'
import { Field, Readout, Segmented, Slider, Toggle } from '../../components/ui'
import { NODOS, PANTALLA_PARTS, PantallaModel, RED_PARTS, RedModel, VN_PARTS, VN_PASOS, VonNeumannModel, type PantallaParams, type RedParams, type Topologia, type VonNeumannParams } from '../../three/models/segundo/Compu2'

/* ------------------------------------------------------------------ Von Neumann */

function VnControls({ params, set }: { params: VonNeumannParams; set: (p: Partial<VonNeumannParams>) => void }) {
  return (
    <>
      <Slider label="Número A" value={params.a} min={0} max={9} step={1} onChange={(a) => set({ a, paso: 0 })} />
      <Slider label="Número B" value={params.b} min={0} max={9} step={1} onChange={(b) => set({ b, paso: 0 })} />
      <Readout label="Paso" value={`${params.paso} de ${VN_PASOS.length - 1}`} />
      <p className="hint">{VN_PASOS[params.paso]}</p>
      <div className="row-btns">
        <button type="button" className="btn" disabled={params.paso === 0} onClick={() => set({ paso: params.paso - 1 })}>
          ← Anterior
        </button>
        <button type="button" className="btn primary" onClick={() => set({ paso: (params.paso + 1) % VN_PASOS.length })}>
          {params.paso === VN_PASOS.length - 1 ? 'Empezar de nuevo' : 'Siguiente paso →'}
        </button>
      </div>
    </>
  )
}

const vonNeumann: ComponentDef = {
  id: 'von-neumann',
  name: 'Modelo de Von Neumann',
  category: 'La computadora',
  icon: '🧠',
  short: 'Unidad de control, ALU, memoria, entrada y salida. Seguí paso a paso cómo se ejecuta un programa que suma dos números.',
  parts: VN_PARTS,
  camera: [0, 8, 14],
  target: [0, 0.8, 0],
  shadowY: -0.6,
  defaultParams: { paso: 0, a: 3, b: 4 } satisfies VonNeumannParams,
  render: (p) => <VonNeumannModel {...(p as VonNeumannParams)} />,
  Controls: VnControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        El matemático húngaro <b>John Von Neumann</b> definió la arquitectura de las computadoras modernas. Su idea clave: los <b>datos y los programas se
        guardan en la misma memoria</b> (antes, el programa se armaba con cables e interruptores).
      </p>
      <p>
        Tiene cinco partes: <b>unidad de control</b>, <b>unidad de memoria</b>, <b>unidad aritmético-lógica</b>, <b>dispositivos de entrada</b> y{' '}
        <b>dispositivos de salida</b>.
      </p>
    </>
  ),
  activities: [
    { id: 'c2-vn-1', type: 'mc', q: '¿Qué novedad trajo el modelo de Von Neumann?', options: ['Datos y programas en la misma memoria', 'El uso de transistores', 'Internet', 'El mouse'], answer: 0, explain: 'Antes los programas se hacían con cables.' },
    { id: 'c2-vn-2', type: 'mc', q: '¿Qué parte hace las cuentas y las comparaciones?', options: ['La unidad aritmético-lógica', 'La unidad de control', 'La memoria', 'El monitor'], answer: 0, explain: 'ALU.' },
    { id: 'c2-vn-3', type: 'mc', q: '¿Qué parte controla todas las operaciones?', options: ['La unidad de control', 'La ALU', 'El teclado', 'La memoria'], answer: 0, explain: 'Busca e interpreta las instrucciones.' },
  ],
}

/* ------------------------------------------------------------------ red */

const TOPO: Record<Topologia, string> = {
  estrella: 'Estrella: todos los nodos se conectan a un equipo central (switch). Si se corta un cable, sólo queda afuera ese nodo. Es la más usada en las LAN.',
  bus: 'Bus: todos los nodos cuelgan de un único cable troncal. Es simple, pero si se corta el troncal, se cae la red.',
  anillo: 'Anillo: cada nodo se conecta con el siguiente y los datos dan la vuelta en un sentido. Si se corta un tramo, se interrumpe el anillo.',
}

function RedControls({ params, set }: { params: RedParams; set: (p: Partial<RedParams>) => void }) {
  return (
    <>
      <Field label="Topología">
        <Segmented<Topologia>
          value={params.topologia}
          onChange={(topologia) => set({ topologia })}
          options={[
            { value: 'estrella', label: 'Estrella' },
            { value: 'bus', label: 'Bus' },
            { value: 'anillo', label: 'Anillo' },
          ]}
        />
      </Field>
      <p className="hint">{TOPO[params.topologia]}</p>
      <Field label="Envía">
        <select className="input" value={params.desde} onChange={(e) => set({ desde: Number(e.target.value) })}>
          {NODOS.map((n, k) => (
            <option key={n} value={k}>
              {n} (192.168.0.{10 + k})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Recibe">
        <select className="input" value={params.hasta} onChange={(e) => set({ hasta: Number(e.target.value) })}>
          {NODOS.map((n, k) => (
            <option key={n} value={k}>
              {n} (192.168.0.{10 + k})
            </option>
          ))}
        </select>
      </Field>
      {params.desde === params.hasta && <p className="hint">Elegí dos nodos distintos para ver viajar el paquete.</p>}
      <Readout label="Tipo de red" value="LAN (red de área local)" />
    </>
  )
}

const red: ComponentDef = {
  id: 'red',
  name: 'Una red de computadoras',
  category: 'Redes',
  icon: '🌐',
  short: 'Nodos, enlaces y un switch. Cambiá la topología (estrella, bus, anillo) y mandá un paquete de un nodo a otro.',
  parts: (p) => ((p as RedParams).topologia === 'estrella' ? RED_PARTS : RED_PARTS.filter((x) => x.id !== 'switch')),
  camera: [0, 9, 10],
  target: [0, 0.4, 0],
  shadowY: -0.2,
  defaultParams: { topologia: 'estrella', desde: 0, hasta: 4 } satisfies RedParams,
  render: (p) => <RedModel {...(p as RedParams)} />,
  Controls: RedControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        Una <b>red de computadoras</b> es un conjunto de dispositivos (computadoras, impresoras, servidores) <b>interconectados</b> para compartir información
        y recursos. Sus componentes son los <b>nodos</b> (con su dirección IP), los <b>enlaces</b> (cable, fibra óptica, Wi-Fi) y los{' '}
        <b>protocolos de comunicación</b> (como IP y TCP).
      </p>
      <p>La forma en que se conectan los nodos se llama topología: estrella, bus, anillo, entre otras.</p>
    </>
  ),
  activities: [
    { id: 'c2-red-1', type: 'mc', q: '¿Qué identifica a cada nodo de la red?', options: ['Su dirección IP', 'Su color', 'El largo del cable', 'Su marca'], answer: 0, explain: 'Es única en la red.' },
    { id: 'c2-red-2', type: 'mc', q: 'En una topología de estrella, todos los nodos se conectan…', options: ['A un equipo central', 'En un círculo', 'A un único cable troncal', 'Sin cables'], answer: 0, explain: 'Por ejemplo, un switch.' },
    { id: 'c2-red-3', type: 'mc', q: '¿Qué son los protocolos?', options: ['Reglas que fijan cómo se comunican los nodos', 'Los cables', 'Las computadoras', 'Los programas de dibujo'], answer: 0, explain: 'Por ejemplo, TCP/IP.' },
  ],
}

/* ------------------------------------------------------------------ pantalla */

function PantallaControls({ params, set }: { params: PantallaParams; set: (p: Partial<PantallaParams>) => void }) {
  const n = params.resolucion
  return (
    <>
      <Field label="Resolución">
        <Segmented<number>
          value={n}
          onChange={(resolucion) => set({ resolucion })}
          options={[
            { value: 8, label: '8 × 8' },
            { value: 16, label: '16 × 16' },
            { value: 32, label: '32 × 32' },
            { value: 64, label: '64 × 64' },
          ]}
        />
      </Field>
      <Toggle label="Lupa: ver los subpíxeles R, G, B" value={params.zoom} onChange={(zoom) => set({ zoom })} />
      <Readout label="Píxeles" value={`${n} × ${n} = ${n * n}`} />
      <Readout label="Tamaño sin comprimir (24 bits = 3 bytes por píxel)" value={`${(n * n * 3).toLocaleString('es-AR')} bytes`} />
      <p className="hint">Con más píxeles la carita se ve más nítida; con pocos, "pixelada". Pero el archivo ocupa más.</p>
    </>
  )
}

const pantalla: ComponentDef = {
  id: 'pantalla',
  name: 'Píxeles de cerca',
  category: 'La computadora',
  icon: '🟩',
  short: 'La misma imagen con más o menos píxeles, y la lupa para ver las luces roja, verde y azul de cada píxel.',
  parts: PANTALLA_PARTS,
  camera: [0, 3.4, 10],
  target: [0, 3.4, 0],
  shadowY: -0.4,
  defaultParams: { resolucion: 16, zoom: false } satisfies PantallaParams,
  render: (p) => <PantallaModel {...(p as PantallaParams)} />,
  Controls: PantallaControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        Un <b>píxel</b> es el ladrillo más pequeño de una imagen digital: cada uno muestra un color. La <b>resolución</b> es cuántos píxeles hay a lo ancho y
        a lo alto: cuantos más, más nítida la imagen.
      </p>
      <p>
        En la pantalla, cada píxel tiene tres luces (<b>rojo, verde y azul</b>): mezclándolas se forman todos los colores.
      </p>
    </>
  ),
  activities: [
    { id: 'c2-pan-1', type: 'num', q: '¿Cuántos píxeles tiene una imagen de 16 × 16?', answer: 256, tolerance: 0, unit: 'píxeles', explain: '16 × 16 = 256.' },
    { id: 'c2-pan-2', type: 'mc', q: '¿Qué colores tienen los subpíxeles de una pantalla?', options: ['Rojo, verde y azul', 'Rojo, amarillo y azul', 'Blanco y negro', 'Cian, magenta y amarillo'], answer: 0, explain: 'RGB.' },
    { id: 'c2-pan-3', type: 'mc', q: 'Con menos resolución, la imagen se ve…', options: ['Pixelada o borrosa', 'Más nítida', 'Igual', 'Más grande'], answer: 0, explain: 'Hay menos "piezas" para los detalles.' },
  ],
}

export const COMPU2_CATALOG: ComponentDef[] = [vonNeumann, red, pantalla]

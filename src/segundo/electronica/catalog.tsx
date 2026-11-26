import { lazyModel } from '../../three/lazy3d'
import type { ComponentDef } from '../../catalog/types'
import { Field, Readout, Segmented, Slider, Toggle } from '../../components/ui'
import { FUENTE_ETAPAS, FUENTE_PARTS, PCB_ETAPAS, PUNTO_PARTS, SOLDADOR_PARTS, diagnosticarPunto, fuenteValores, pcbParts } from '../../three/models/segundo/Electronica2.data'
import type { Estano, Etapa, FuenteParams, PcbParams, PuntoParams, SoldadorParams } from '../../three/models/segundo/Electronica2'
import './el2.css'

const FuenteModel = lazyModel(() => import('../../three/models/segundo/Electronica2'), 'FuenteModel')
const PcbModel = lazyModel(() => import('../../three/models/segundo/Electronica2'), 'PcbModel')
const PuntoModel = lazyModel(() => import('../../three/models/segundo/Electronica2'), 'PuntoModel')
const SoldadorModel = lazyModel(() => import('../../three/models/segundo/Electronica2'), 'SoldadorModel')

const f = (n: number, d = 1) => Number(n.toFixed(d)).toString().replace('.', ',')

/* ------------------------------------------------------------------ estación de soldado */

function SoldadorControls({ params, set }: { params: SoldadorParams; set: (p: Partial<SoldadorParams>) => void }) {
  const t = params.temperatura
  const uso = t < 280 ? 'Muy baja: el estaño no llega a fundirse bien (soldaduras frías).' : t <= 360 ? 'Ideal para estaño-plomo (60/40) y componentes comunes.' : t <= 400 ? 'Para estaño sin plomo o pads grandes.' : 'Demasiado alta para electrónica: daña la punta, los pads y los componentes.'
  return (
    <>
      <Toggle label="Encendida" value={params.encendido} onChange={(encendido) => set({ encendido })} />
      <Slider label="Temperatura" value={t} min={200} max={480} step={10} format={(v) => `${v} °C`} onChange={(temperatura) => set({ temperatura })} />
      <Readout label="Para qué sirve" value={uso} />
      <p className="hint">El estaño 60/40 funde a unos 190 °C; la punta se usa a 320–350 °C para que el calor pase rápido al pad y a la pata.</p>
    </>
  )
}

const soldador: ComponentDef = {
  id: 'soldador',
  name: 'Estación de soldado',
  category: 'Soldadura con estaño',
  icon: '🔥',
  short: 'Soldador con control de temperatura, soporte con esponja y estaño con flux. Encendela y elegí la temperatura.',
  parts: SOLDADOR_PARTS,
  camera: [6, 14, 26],
  target: [1, 2.5, 1],
  shadowY: 0,
  environment: 'electronica',
  defaultParams: { encendido: true, temperatura: 330 } satisfies SoldadorParams,
  render: (p) => <SoldadorModel {...(p as SoldadorParams)} />,
  Controls: SoldadorControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        El <b>soldador</b> calienta una <b>punta</b> de cobre con una <b>resistencia</b> (efecto Joule). Las estaciones tienen un sensor y un control que
        mantienen la temperatura que se elige.
      </p>
      <p>
        Siempre se deja en el <b>soporte</b>, nunca sobre la mesa. La punta se limpia en la <b>esponja húmeda</b> y se mantiene <b>estañada</b>: así
        transmite bien el calor y no se oxida.
      </p>
    </>
  ),
  activities: [
    { id: 'en2-sol-1', type: 'mc', q: '¿Dónde se deja el soldador caliente mientras no se usa?', options: ['En su soporte', 'Apoyado en la mesa', 'Sobre la placa', 'En la esponja'], answer: 0, explain: 'Así no quema la mesa, los cables ni a nadie.' },
    { id: 'en2-sol-2', type: 'mc', q: '¿Para qué sirve la esponja húmeda?', options: ['Para limpiar la punta', 'Para enfriar la placa', 'Para apagar el soldador', 'Para guardar el estaño'], answer: 0, explain: 'Húmeda, no empapada: si tiene mucha agua enfría la punta.' },
    { id: 'en2-sol-3', type: 'num', q: '¿A qué temperatura aproximada funde el estaño 60/40? (°C)', answer: 190, tolerance: 0.05, unit: '°C', explain: 'Entre 183 y 190 °C; la punta se usa más caliente para que el calor pase rápido.' },
  ],
}

/* ------------------------------------------------------------------ punto de soldadura */

function PuntoControls({ params, set }: { params: PuntoParams; set: (p: Partial<PuntoParams>) => void }) {
  const d = diagnosticarPunto(params)
  return (
    <>
      <Slider label="Temperatura de la punta" value={params.temperatura} min={220} max={460} step={10} format={(v) => `${v} °C`} onChange={(temperatura) => set({ temperatura })} />
      <Slider label="Tiempo calentando" value={params.tiempo} min={0.5} max={8} step={0.5} format={(v) => `${f(v)} s`} onChange={(tiempo) => set({ tiempo })} />
      <Field label="Cantidad de estaño">
        <Segmented<Estano>
          value={params.estano}
          onChange={(estano) => set({ estano })}
          options={[
            { value: 'poco', label: 'Poco' },
            { value: 'justo', label: 'Justo' },
            { value: 'mucho', label: 'Mucho' },
          ]}
        />
      </Field>
      <Toggle label="Punta limpia y estañada" value={params.puntaLimpia} onChange={(puntaLimpia) => set({ puntaLimpia })} />
      <div className={`el2-verdict ${d.ok ? 'ok' : 'bad'}`}>
        <b>{d.ok ? '✔' : '✘'} {d.titulo}</b>
        <p>{d.texto}</p>
      </div>
    </>
  )
}

const punto: ComponentDef = {
  id: 'punto',
  name: 'El punto de soldadura',
  category: 'Soldadura con estaño',
  icon: '🌋',
  short: 'Simulador: elegí temperatura, tiempo y cantidad de estaño, y mirá si queda una buena soldadura o una fría, con exceso o con puente.',
  parts: PUNTO_PARTS,
  camera: [4, 7, 12],
  target: [0, 0.4, 0],
  shadowY: -5.5,
  environment: 'electronica',
  defaultParams: { temperatura: 340, tiempo: 2.5, estano: 'justo', puntaLimpia: true } satisfies PuntoParams,
  render: (p) => <PuntoModel {...(p as PuntoParams)} />,
  Controls: PuntoControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        Pasos: 1) apoyar la punta tocando a la vez el <b>pad</b> y la <b>pata</b>; 2) a los 1–2 segundos, acercar el estaño del lado opuesto a la punta
        (que lo funda el calor de la pieza, no el soldador); 3) retirar el estaño; 4) retirar el soldador; 5) no mover nada hasta que solidifique.
      </p>
      <p>
        Una buena soldadura es <b>cóncava, lisa y brillante</b>, con forma de volcán. Si quedó opaca y como una bolita, está <b>fría</b>.
      </p>
    </>
  ),
  activities: [
    { id: 'en2-pt-1', type: 'mc', q: '¿Cómo se ve una buena soldadura de un componente THT?', options: ['Cóncava, lisa y brillante, como un volcán', 'Una bola grande que tapa la pata', 'Opaca y granulada', 'Con el cobre del pad a la vista'], answer: 0, explain: 'El estaño moja todo el pad y sube por la pata.' },
    { id: 'en2-pt-2', type: 'mc', q: '¿Qué se calienta con la punta antes de poner el estaño?', options: ['El pad y la pata a la vez', 'Sólo el estaño', 'Sólo el componente', 'La placa del lado de los componentes'], answer: 0, explain: 'El estaño tiene que fundirse al tocar la pieza caliente.' },
    { id: 'en2-pt-3', type: 'mc', q: 'Quedó una soldadura opaca y granulada. ¿Qué pasó?', options: ['Faltó calor (soldadura fría)', 'Sobró calor', 'Era estaño sin plomo', 'Está perfecta'], answer: 0, explain: 'Se vuelve a calentar con la punta limpia y un poquito de estaño nuevo (con flux).' },
  ],
}

/* ------------------------------------------------------------------ circuito impreso */

function PcbControls({ params, set }: { params: PcbParams; set: (p: Partial<PcbParams>) => void }) {
  const e = PCB_ETAPAS[params.etapa]
  return (
    <>
      <Readout label="Paso" value={`${params.etapa + 1} de ${PCB_ETAPAS.length}: ${e.name}`} />
      <p className="hint">{e.text}</p>
      <div className="row-btns">
        <button type="button" className="btn" disabled={params.etapa === 0} onClick={() => set({ etapa: params.etapa - 1 })}>
          ← Anterior
        </button>
        <button type="button" className="btn primary" onClick={() => set({ etapa: (params.etapa + 1) % PCB_ETAPAS.length })}>
          {params.etapa === PCB_ETAPAS.length - 1 ? 'Empezar de nuevo' : 'Siguiente paso →'}
        </button>
      </div>
    </>
  )
}

const pcb: ComponentDef = {
  id: 'pcb',
  name: 'Fabricar un circuito impreso',
  category: 'Circuito impreso',
  icon: '🟩',
  short: 'Del cobre virgen a la placa armada: transferencia del diseño, ataque con percloruro, perforado y soldado de un LED intermitente con 555.',
  parts: (p) => pcbParts(p as PcbParams),
  camera: [3, 8, 9],
  target: [0, 0.4, 0],
  shadowY: 0,
  environment: 'electronica',
  defaultParams: { etapa: 0 } satisfies PcbParams,
  render: (p) => <PcbModel {...(p as PcbParams)} />,
  Controls: PcbControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        Un <b>circuito impreso</b> (PCB) reemplaza los cables por <b>pistas de cobre</b> pegadas a una placa aislante. Los componentes <b>THT</b> pasan
        sus patas por agujeros; los <b>SMD</b> se sueldan sobre la superficie.
      </p>
      <p>
        En el taller se hacen con el <b>método del planchado</b>: el diseño impreso en láser se transfiere al cobre con calor, se ataca con{' '}
        <b>percloruro férrico</b>, se limpia y se perfora.
      </p>
    </>
  ),
  activities: [
    { id: 'en2-pcb-1', type: 'mc', q: '¿Qué hace el percloruro férrico?', options: ['Disuelve el cobre que no está protegido', 'Pega el tóner', 'Perfora la placa', 'Suelda los componentes'], answer: 0, explain: 'Por eso el diseño tiene que tapar las pistas y los pads.' },
    { id: 'en2-pcb-2', type: 'mc', q: 'En una placa simple faz, ¿de qué lado van los componentes THT?', options: ['Del lado sin cobre; se sueldan del lado del cobre', 'Del lado del cobre', 'Adentro de la placa', 'Es indistinto'], answer: 0, explain: 'Las patas atraviesan los agujeros y se sueldan sobre los pads.' },
    { id: 'en2-pcb-3', type: 'mc', q: '¿Por qué el diseño se imprime espejado?', options: ['Porque se lo mira desde el lado del cobre, que queda del otro lado', 'Para ahorrar tóner', 'Porque la impresora lo pide', 'No se imprime espejado'], answer: 0, explain: 'Al planchar la hoja boca abajo, el dibujo queda derecho mirando el cobre.' },
  ],
}

/* ------------------------------------------------------------------ fuente de alimentación */

function FuenteControls({ params, set }: { params: FuenteParams; set: (p: Partial<FuenteParams>) => void }) {
  const v = fuenteValores(params.carga)
  return (
    <>
      <Field label="¿Dónde mide el osciloscopio?">
        <Segmented<Etapa> value={params.etapa} onChange={(etapa) => set({ etapa })} options={FUENTE_ETAPAS.map((e) => ({ value: e.id, label: e.name }))} />
      </Field>
      <Slider label="Corriente de la carga" value={params.carga} min={0} max={1500} step={50} format={(x) => `${x} mA`} onChange={(carga) => set({ carga })} />
      <Readout label="Pico del secundario (12 V × √2)" value={`${f(v.vp)} V`} />
      <Readout label="Después del puente (− 1,4 V de dos diodos)" value={`${f(v.vrect)} V`} />
      <Readout label="Ripple = I ÷ (100 Hz × 2200 µF)" value={`${f(v.ripple, 2)} V`} />
      <Readout label="Salida" value={v.regula ? '12,0 V (regulada)' : `${f(v.vout)} V: ¡no le alcanza al 7812!`} />
    </>
  )
}

const fuente: ComponentDef = {
  id: 'fuente',
  name: 'Fuente de alimentación de 12 V',
  category: 'Fuentes de alimentación',
  icon: '🔋',
  short: 'Transformador, puente rectificador, capacitor de filtro y regulador 7812. Medí con el osciloscopio cómo cambia la señal en cada etapa.',
  parts: FUENTE_PARTS,
  camera: [4, 12, 20],
  target: [0, 2, -1.5],
  shadowY: 0,
  environment: 'electronica',
  defaultParams: { etapa: 'secundario', carga: 500 } satisfies FuenteParams,
  render: (p) => <FuenteModel {...(p as FuenteParams)} />,
  Controls: FuenteControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        Una fuente lineal convierte los <b>220 V de alterna</b> en una <b>continua fija</b>, en cuatro etapas: <b>transformación</b> (baja la tensión),{' '}
        <b>rectificación</b> (puente de diodos), <b>filtrado</b> (capacitor) y <b>regulación</b> (integrado 78xx).
      </p>
      <p>
        El capacitor se descarga un poco entre pico y pico: esa ondulación es el <b>ripple</b> y crece con la corriente de la carga. El regulador necesita
        unos 2 V más que su salida, incluso en el punto más bajo del ripple.
      </p>
    </>
  ),
  activities: [
    { id: 'en2-fu-1', type: 'num', q: 'Un secundario de 12 V eficaces, ¿qué tensión pico tiene? (V)', answer: 16.97, tolerance: 0.02, unit: 'V', explain: 'Vp = Vef × √2 = 12 × 1,414.' },
    { id: 'en2-fu-2', type: 'mc', q: '¿Qué hace el puente rectificador?', options: ['Convierte la alterna en continua pulsante', 'Baja la tensión', 'Elimina el ripple', 'Fija la salida en 12 V'], answer: 0, explain: 'Con 4 diodos, aprovecha los dos semiciclos (onda completa).' },
    { id: 'en2-fu-3', type: 'mc', q: '¿Qué pasa con el ripple si la carga pide más corriente?', options: ['Aumenta', 'Disminuye', 'No cambia', 'Desaparece'], answer: 0, explain: 'Vr ≈ I ÷ (f × C): más corriente, más ondulación.' },
  ],
}

export const ELECTRONICA2_CATALOG: ComponentDef[] = [soldador, punto, pcb, fuente]

import type { ReactNode } from 'react'
import type { ComponentDef, Params, PartInfo } from '../catalog/types'
import { Field, Formula, Readout, Segmented, Slider, Toggle } from '../components/ui'
import { RPMS, TornoModel, tornoLayout, type Avance, type Montaje, type TornoParams } from '../three/models/Torno'
import { HerramientasModel, PlatosModel, PuntosModel, type PlatoKind, type PuntoKind, type ToolKind } from '../three/models/TornoAccesorios'

/** Como Field, pero sin <label> (un label con botones adentro "aprieta" el primero al tocar el título). */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
    </div>
  )
}

const fmt = (v: number, d = 0) => v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })

/* ================================================================== torno paralelo */

const MONTAJES: { value: Montaje; label: string; desc: string }[] = [
  { value: 'aire', label: 'Al aire', desc: 'La pieza, corta y liviana, se toma de un solo extremo con el plato universal; el otro queda suspendido sobre la bancada.' },
  { value: 'contrapunta', label: 'Plato y contrapunta', desc: 'Pieza larga o delgada: un extremo en el plato y el otro apoyado en el punto giratorio de la contrapunta (con agujero de centro de 60° hecho con mecha de centrar). La pieza llega hasta el punto: corré la contrapunta para cambiar su largo.' },
  { value: 'puntas', label: 'Entre puntas', desc: 'Se saca el plato universal: en el husillo va un punto y el plato liso de arrastre. La brida (perro) apretada en la pieza es empujada por el perno del plato liso; el otro extremo apoya en el punto de la contrapunta.' },
  { value: 'luneta', label: 'Con luneta', desc: 'Pieza larga y delgada: la luneta fija, abulonada a la bancada con su zapata, la sostiene con tres patines para que no se pandee.' },
]

function TornoControls({ params, set }: { params: Params; set: (p: Params) => void }) {
  const p = params as TornoParams
  const L = tornoLayout(p)
  const rpm = RPMS[p.rpmIdx]
  const D = L.barR * 20 // mm
  const vc = (Math.PI * D * rpm) / 1000
  const mont = MONTAJES.find((m) => m.value === p.montaje)!
  return (
    <>
      <Toggle label="Encender el torno (gira el plato)" value={p.on} onChange={(on) => set({ on })} />
      <Slider label="Velocidad del husillo" value={p.rpmIdx} min={0} max={RPMS.length - 1} onChange={(rpmIdx) => set({ rpmIdx })} format={(i) => `${RPMS[i]} rpm (${i < 6 ? 'I' : 'II'}-${(i % 6) + 1})`} />
      <Readout label={`Velocidad de corte en Ø ${fmt(D)} mm`} value={`Vc = π·D·n / 1000 ≈ ${fmt(vc, 1)} m/min`} />
      <Group label="Montaje de la pieza">
        <Segmented<Montaje> value={p.montaje} options={MONTAJES.map((m) => ({ value: m.value, label: m.label }))} onChange={(montaje) => set({ montaje })} />
      </Group>
      <p className="hint">{mont.desc}</p>
      <Slider label="Carro longitudinal (avance)" value={p.carro} min={0} max={100} onChange={(carro) => set({ carro })} format={() => `herramienta a ${fmt((L.toolX - L.jawsFront) * 10)} mm de las mordazas`} />
      <Slider label="Carro transversal (penetración)" value={p.trans} min={10} max={100} onChange={(trans) => set({ trans })} format={(v) => `punta a Ø ${fmt(Math.max(20, v * 2))} mm`} />
      <p className="hint">
        Si la punta queda por debajo del diámetro de la barra (Ø {fmt(D)} mm), a la derecha de la herramienta se ve el tramo ya cilindrado. Profundidad de
        pasada: ap = {fmt(Math.max(0, D / 2 - L.tipR * 10), 1)} mm.
      </p>
      <Slider label="Giro del charriot (respecto del eje)" value={p.charriot} min={-60} max={90} onChange={(charriot) => set({ charriot })} format={(v) => `${v}°`} />
      <Slider label="Posición de la contrapunta" value={p.contrapunta} min={0} max={100} onChange={(contrapunta) => set({ contrapunta })} format={(v) => `${v} %`} />
      <Slider label="Salida del manguito (cañón)" value={p.manguito} min={20} max={100} onChange={(manguito) => set({ manguito })} format={(v) => `${v} mm`} />
      <Group label="Palanca de 3 posiciones del delantal">
        <Segmented<Avance>
          value={p.avance}
          options={[
            { value: 'cilindrar', label: '↑ Cilindrar' },
            { value: 'neutro', label: '— Neutro' },
            { value: 'frentear', label: '↓ Frentear' },
          ]}
          onChange={(avance) => set({ avance })}
        />
      </Group>
      <Toggle label="Tuerca partida cerrada (roscado)" value={p.tuerca} onChange={(tuerca) => set({ tuerca })} />
      <Toggle label="Abrir la tapa de la lira" value={p.tapa} onChange={(tapa) => set({ tapa })} />
    </>
  )
}

const tornoParts = (p: Params): PartInfo[] => {
  const m = p.montaje as Montaje
  return [
    { id: 'bancada', name: 'Bancada', desc: 'Cuerpo fundamental del torno: sirve de soporte y guía a las demás partes. Es de fundición de hierro gris, hueca para que caigan las virutas y el refrigerante, con nervaduras interiores que le dan rigidez. Arriba tiene las guías prismáticas y planas (a veces postizas, de acero templado y rectificado) por donde se desplazan el carro y la contrapunta, y adelante la cremallera. Hay que mantenerla limpia, lubricada y no apoyar ni golpear nada sobre ella.' },
    { id: 'patas', name: 'Patas (pies) y bandeja de virutas', desc: 'Los dos pies de chapa o fundición sobre los que apoya la bancada. En el izquierdo va el motor; en el derecho, el tanque y la bomba del refrigerante. Entre ambos, la bandeja recoge virutas y líquido.' },
    { id: 'cabezal', name: 'Cabezal fijo', desc: 'Caja de fundición en el extremo izquierdo, sobre la bancada. Contiene el husillo y los engranajes que lo hacen girar a distintas velocidades. Tiene las palancas selectoras de velocidad, la placa con las rpm y el selector del sentido de avance. Nunca se cambian velocidades con la máquina en marcha; hay que revisar el nivel de aceite.' },
    { id: 'husillo', name: 'Husillo (eje principal)', desc: 'Eje de acero templado, generalmente hueco para que pasen barras largas. En su nariz se monta el dispositivo de amarre (plato, pinza o punto) y en su parte media lleva los engranajes o poleas que reciben el giro del motor.' },
    ...(m === 'puntas'
      ? [
          { id: 'plato-liso', name: 'Plato liso de arrastre', desc: 'Disco sin mordazas, con un agujero central y un perno de arrastre abulonado en una ranura. Se usa en el montaje entre puntas: el perno empuja la cola de la brida y hace girar la pieza.' },
          { id: 'punto-husillo', name: 'Punto del husillo', desc: 'Punto con cola cono Morse colocado en el agujero cónico del husillo. Gira junto con la pieza, por eso puede ser un punto fijo.' },
          { id: 'brida', name: 'Brida (perro) de arrastre', desc: 'Cuerpo perforado que se aprieta sobre la pieza con su tornillo; su cola de arrastre se engancha en el perno del plato liso. Cuidado con su área de giro: no debe golpear nada.' },
        ]
      : [{ id: 'plato', name: 'Plato universal de 3 mordazas', desc: 'Sujeta la pieza durante el mecanizado. Sus tres mordazas abren y cierran a la vez con la llave de ajuste, centrando solas las piezas cilíndricas (o de caras múltiplo de tres). Nunca dejar la llave puesta en el plato.' }]),
    { id: 'pieza', name: 'Pieza (barra a tornear)', desc: m === 'luneta' ? 'Barra larga y delgada de Ø 25 mm: sin la luneta se pandearía al girar o al empujarla la herramienta.' : 'Barra redonda de acero de Ø 40 mm. El tramo más brillante es el que ya pasó la herramienta (cilindrado).' },
    ...(m === 'luneta' ? [{ id: 'luneta', name: 'Luneta fija', desc: 'Cuerpo de fundición con tres patines de bronce regulables por tornillos. Se fija a la bancada con una zapata inferior y un bulón con tuerca. Los patines deben sostener la pieza sin impedirle girar.' }] : []),
    { id: 'proteccion', name: 'Protección del plato', desc: 'Pantalla transparente abisagrada que cubre el plato mientras gira: retiene virutas y refrigerante y evita el contacto con las mordazas.' },
    { id: 'mando', name: 'Tablero de mando y parada de emergencia', desc: 'Pulsadores de marcha y parada, luz piloto, llave de la bomba de refrigerante y el hongo rojo de parada de emergencia, que corta todo de inmediato. Antes de limpiar, lubricar o desmontar se debe parar el torno y accionar la parada de emergencia.' },
    { id: 'motor', name: 'Motor eléctrico', desc: 'Está en la parte inferior izquierda del torno (en el pie). Transmite su rotación al cabezal mediante poleas y correas.' },
    { id: 'poleas', name: 'Poleas y correas', desc: 'Sistema polea-correa que lleva el giro del motor al eje de entrada del cabezal, paralelo al husillo. La correa puede ser dentada para transmitir los giros sin patinar. Para quitarlas se usa siempre el pasacorreas o una varilla.' },
    { id: 'lira', name: 'Lira (tren de engranajes)', desc: 'Tren de engranajes exterior del cabezal, con tres ruedas: conductora, intermedia y conducida. Lleva las revoluciones del cabezal a la caja Norton. La rueda intermedia va en un brazo (la lira) que se puede girar para cambiar ruedas.' },
    { id: 'tapa', name: 'Tapa de la lira', desc: 'Cubre la lira y las correas. Sólo se abre con el torno parado y con la parada de emergencia accionada.' },
    { id: 'norton', name: 'Caja Norton (caja de avances)', desc: 'Recibe el giro de la última rueda de la lira. Adentro tiene series de engranajes: con una palanca oscilante se hace engranar una rueda con otras de distinto tamaño y así se eligen distintos avances (mm por vuelta) o pasos de rosca, según la tabla de su placa.' },
    { id: 'barra-avances', name: 'Barra de avances (y barra de mando)', desc: 'Barra de sección hexagonal (o cilíndrica con chavetero) que sale de la caja Norton y transmite las velocidades al interior del delantal, donde se convierten en avances automáticos del carro longitudinal o del transversal. Debajo va la barra de mando del encendido.' },
    { id: 'tornillo-patron', name: 'Tornillo patrón', desc: 'Tornillo de filete cuadrado que sale de la caja Norton. Mueve el carro longitudinal sólo para roscar, cuando se cierra la tuerca partida del delantal. En el roscado el avance es igual al paso de la rosca.' },
    { id: 'delantal', name: 'Delantal', desc: 'Caja de fundición que cuelga del carro y contiene los engranajes que mueven los carros. Al frente: el volante del carro longitudinal, la palanca de 3 posiciones (arriba cilindrar, al medio neutro, abajo frentear), la palanca de la tuerca partida y la palanca de encendido y apagado.' },
    { id: 'carro-longitudinal', name: 'Carro longitudinal (principal)', desc: 'Apoya sobre las guías de la bancada y se desplaza a izquierda o derecha, a mano o en automático. Da el movimiento de avance al cilindrar. También se mueve con el tornillo patrón para roscar.' },
    { id: 'carro-transversal', name: 'Carro transversal (con volante y nonio)', desc: 'Va sobre el carro longitudinal y se mueve perpendicular al eje del torno, a mano o en automático: determina la profundidad de pasada (movimiento de penetración). Su volante tiene un tambor graduado (nonio) para medir lo que se avanza.' },
    { id: 'charriot', name: 'Carro superior (charriot)', desc: 'Formado por la base y el carro portaherramientas. Su base apoya en una plataforma giratoria graduada en grados para orientarlo en cualquier ángulo: así se tornean conos (desbaste cónico, sólo a mano) y se penetra “en flanco” al roscar.' },
    { id: 'torre', name: 'Torre portaherramientas', desc: 'Dispositivo montado sobre el charriot que sujeta las herramientas. Esta es de cuatro posiciones (se ajusta con tornillos y se gira con la manija central); también existen torretas regulables en altura. La punta de la herramienta debe quedar a la altura del eje de la pieza.' },
    { id: 'refrigeracion', name: 'Refrigeración (bomba y manguera)', desc: 'Bomba eléctrica en el pie derecho que envía el líquido refrigerante (emulsión de aceite y agua) por una manguera articulada hasta el filo de la herramienta, para enfriar, lubricar y arrastrar la viruta.' },
    { id: 'contrapunta', name: 'Contrapunta (cabezal móvil)', desc: 'De fundición, se desliza y se fija en cualquier lugar de la bancada. Por dentro corre el cañón (manguito o pínula) con agujero cono Morse para puntos y mandriles; lo mueve el volante con un tornillo y tuerca de bronce. Tiene dos palancas-freno: una bloquea la contrapunta sobre la bancada y otra el manguito. El manguito siempre debe sobresalir un par de centímetros.' },
    ...(m === 'contrapunta' || m === 'puntas' ? [{ id: 'punto', name: 'Punto giratorio', desc: 'Va en el manguito de la contrapunta. Su punta gira con la pieza gracias a dos rodamientos internos, por eso no necesita lubricación. Durante el mecanizado hay que observar que siga girando.' }] : []),
  ]
}

export const torno: ComponentDef = {
  id: 'torno',
  name: 'Torno paralelo',
  category: 'Máquina',
  icon: '⚙️',
  short: 'Máquina herramienta que hace girar la pieza mientras una herramienta avanza contra ella y le saca viruta: cilindros, conos, roscas, agujeros.',
  camera: [6, 4, 24],
  target: [0, -2.5, 0],
  shadowY: -9,
  defaultParams: { rpmIdx: 7, on: false, carro: 40, trans: 30, charriot: 30, contrapunta: 70, manguito: 40, montaje: 'aire', avance: 'neutro', tuerca: false, tapa: false } satisfies TornoParams,
  render: (p) => <TornoModel {...(p as TornoParams)} />,
  Controls: TornoControls,
  parts: tornoParts,
  theory: (
    <>
      <p>
        El <strong>torno</strong> es una máquina herramienta que mecaniza piezas de <strong>revolución</strong> (cilindros, conos, hélices): hace girar la pieza
        mientras la herramienta de corte avanza contra su superficie y le arranca el material sobrante en forma de <strong>viruta</strong>. Se llama{' '}
        <strong>torno paralelo</strong> porque el carro con la herramienta se desplaza sobre guías paralelas al eje de giro de la pieza.
      </p>
      <h4>Los tres movimientos de trabajo</h4>
      <ul>
        <li>
          <strong>Movimiento de corte</strong>: la rotación de la pieza. La velocidad con que el material pasa por el filo es la <em>velocidad de corte</em>.
        </li>
        <li>
          <strong>Movimiento de avance</strong>: generalmente paralelo al eje (carro longitudinal); define el perfil al recorrer la pieza.
        </li>
        <li>
          <strong>Movimiento de penetración</strong>: perpendicular al anterior (carro transversal); determina la profundidad de pasada.
        </li>
      </ul>
      <Formula>Vc = π · D · n / 1000 [m/min] ⇄ n = Vc · 1000 / (π · D) [rpm]</Formula>
      <h4>Partes principales</h4>
      <ul>
        <li>
          <strong>Bancada</strong> con sus guías, sobre las <strong>patas</strong>.
        </li>
        <li>
          <strong>Cabezal fijo</strong> con el <strong>husillo</strong> y la caja de velocidades; afuera, la <strong>lira</strong> (conductora, intermedia y
          conducida) lleva el movimiento a la <strong>caja Norton</strong>.
        </li>
        <li>
          De la Norton salen la <strong>barra de avances</strong> (avances automáticos de los carros) y el <strong>tornillo patrón</strong> (sólo para roscar, con la
          tuerca partida).
        </li>
        <li>
          El <strong>carro portaherramientas</strong>: carro longitudinal, carro transversal, charriot (orientable) y torre portaherramientas, todo apoyado en el{' '}
          <strong>delantal</strong>.
        </li>
        <li>
          La <strong>contrapunta</strong>, para apoyar piezas largas o para perforar con mandril y broca.
        </li>
        <li>
          El <strong>motor</strong> abajo a la izquierda, con <strong>poleas y correas</strong> hasta el cabezal.
        </li>
      </ul>
      <p className="tip">
        Antes de arrancar: girar el plato a mano, sacar la llave del plato, ropa ajustada, sin anillos ni pulseras, pelo atado y anteojos de seguridad. Nunca
        tocar la viruta con las manos.
      </p>
    </>
  ),
  activities: [
    { id: 'torno-1', type: 'mc', q: '¿Qué movimiento de trabajo produce la rotación de la pieza?', options: ['Movimiento de avance', 'Movimiento de corte', 'Movimiento de penetración', 'Movimiento de roscado'], answer: 1, explain: 'La rotación de la pieza es el movimiento de corte (o de trabajo).' },
    { id: 'torno-2', type: 'mc', q: '¿Qué carro determina la profundidad de pasada (movimiento de penetración)?', options: ['El longitudinal', 'El transversal', 'La contrapunta', 'El delantal'], answer: 1, explain: 'El carro transversal se mueve perpendicular al eje y determina la profundidad de pasada.' },
    { id: 'torno-3', type: 'mc', q: '¿Para qué se usa el tornillo patrón?', options: ['Para los avances de cilindrado', 'Para roscar, cerrando la tuerca partida', 'Para mover la contrapunta', 'Para cambiar la velocidad del husillo'], answer: 1, explain: 'El tornillo patrón mueve el carro longitudinal sólo en los roscados, al cerrar la tuerca partida.' },
    { id: 'torno-4', type: 'num', q: 'Se cilindra una barra de Ø 50 mm a 500 rpm. ¿Cuál es la velocidad de corte? (Vc = π·D·n/1000)', answer: 78.5, tolerance: 0.02, unit: 'm/min', explain: 'Vc = 3,1416 × 50 × 500 / 1000 ≈ 78,5 m/min.' },
    { id: 'torno-5', type: 'num', q: 'Para un acero se recomienda Vc = 120 m/min. ¿A cuántas rpm hay que tornear una pieza de Ø 80 mm? (n = Vc·1000/(π·D))', answer: 477, tolerance: 0.02, unit: 'rpm', explain: 'n = 120 × 1000 / (3,1416 × 80) ≈ 477 rpm; en el torno se elige la velocidad más cercana por debajo (355 o 500 según la máquina).' },
    { id: 'torno-6', type: 'mc', q: 'La palanca de 3 posiciones del delantal está hacia abajo. ¿Qué movimiento automático se produce?', options: ['Cilindrar (se mueve el carro longitudinal)', 'Neutro', 'Frentear (se mueve el carro transversal)', 'Roscar'], answer: 2, explain: 'Arriba cilindra, al medio está en neutro y abajo mueve el carro transversal para frentear.' },
    { id: 'torno-7', type: 'mc', q: '¿Cuáles son las tres ruedas de la lira?', options: ['Piñón, corona y sinfín', 'Conductora, intermedia y conducida', 'Polea, correa y tensor', 'Plato, perno y brida'], answer: 1, explain: 'La lira transmite el giro del cabezal a la caja Norton con una rueda conductora, una intermedia y una conducida.' },
    { id: 'torno-8', type: 'mc', q: 'Una pieza delgada y larga se toma del plato y se apoya en el otro extremo en el punto de la contrapunta. ¿Qué montaje es?', options: ['Al aire', 'Entre plato y contrapunta', 'Entre puntas', 'Con luneta móvil'], answer: 1, explain: 'Un extremo queda en el plato y el otro apoyado en un punto en la contrapunta: montaje entre plato y contrapunta.' },
  ],
}

/* ================================================================== platos y elementos de sujeción */

const PLATOS: { value: PlatoKind; label: string }[] = [
  { value: '3m', label: '3 mordazas' },
  { value: '4m', label: '4 mordazas' },
  { value: 'liso', label: 'Plato liso y brida' },
  { value: 'pinza', label: 'Pinza' },
]

function PlatosControls({ params, set }: { params: Params; set: (p: Params) => void }) {
  const k = params.tipo as PlatoKind
  const inv = params.invertidas as boolean
  return (
    <>
      <Group label="Elemento de sujeción">
        <Segmented<PlatoKind> value={k} options={PLATOS} onChange={(tipo) => set({ tipo })} />
      </Group>
      {k === '3m' && (
        <>
          <Slider
            label="Llave: diámetro que aprietan las 3 mordazas"
            value={params.apertura}
            min={inv ? 80 : 10}
            max={inv ? 150 : 90}
            onChange={(apertura) => set({ apertura })}
            format={(v) => `Ø ${v} mm`}
          />
          <Toggle label="Mordazas invertidas (piezas de diámetro grande)" value={inv} onChange={(invertidas) => set({ invertidas, apertura: invertidas ? 120 : 40 })} />
          <p className="hint">Al girar la llave, los piñones hacen girar la espiral y las tres mordazas se mueven a la vez: la pieza queda centrada sola. Despiezá para ver la espiral y los piñones.</p>
        </>
      )}
      {k === '4m' && (
        <>
          {(['j1', 'j2', 'j3', 'j4'] as const).map((j, i) => (
            <Slider key={j} label={`Mordaza ${i + 1} (${['arriba', 'adelante', 'abajo', 'atrás'][i]})`} value={params[j]} min={10} max={70} onChange={(v) => set({ [j]: v })} format={(v) => `${v} mm del centro`} />
          ))}
          {(() => {
            const okY = Math.abs(params.j1 + params.j3 - 50) <= 1
            const okZ = Math.abs(params.j2 + params.j4 - 60) <= 1
            const ex = Math.hypot((params.j1 - params.j3) / 2, (params.j2 - params.j4) / 2)
            return <Readout label="Pieza de 50 × 60 mm" value={okY && okZ ? `sujeta · excentricidad ${fmt(ex, 1)} mm` : 'suelta: ajustá las mordazas opuestas'} />
          })()}
          <Toggle label="Mordazas invertidas" value={inv} onChange={(invertidas) => set({ invertidas })} />
        </>
      )}
      {(k === '3m' || k === '4m') && <Toggle label="Mostrar la llave del plato" value={params.llave} onChange={(llave) => set({ llave })} />}
      {k === 'liso' && <p className="hint">El perno de arrastre empuja la cola de la brida y hace girar la pieza, que apoya en el punto del husillo (montaje entre puntas).</p>}
      {k === 'pinza' && <p className="hint">La tuerca empuja la pinza contra el cono del portapinzas: las ranuras se cierran y aprietan la barra. Cada pinza sirve para muy pocos diámetros.</p>}
    </>
  )
}

const platosParts = (p: Params): PartInfo[] => {
  const k = p.tipo as PlatoKind
  if (k === '3m')
    return [
      { id: 'cuerpo', name: 'Cuerpo del plato', desc: 'Cuerpo de acero con tres ranuras radiales a 120° por donde corren las mordazas, y los agujeros cuadrados de los piñones para la llave.' },
      { id: 'mordazas', name: 'Mordazas escalonadas', desc: 'Tres mordazas que se mueven a la vez: sirven para piezas cilíndricas o con un número de caras múltiplo de tres. Hay juegos de mordazas invertidas (diámetros grandes) y blandas (materiales blandos, piezas que no se quieren marcar).' },
      { id: 'espiral', name: 'Espiral (corona)', desc: 'Disco con una rosca plana en espiral en la cara de adelante, donde engranan los dientes de atrás de las mordazas, y con dientes cónicos atrás, donde engranan los piñones. Al girar, acerca o aleja las tres mordazas al mismo tiempo.' },
      { id: 'pinones', name: 'Piñones cónicos', desc: 'Tres piñones con cabeza cuadrada para la llave. Cualquiera de ellos hace girar la espiral.' },
      { id: 'plato-trasero', name: 'Brida (plato) de unión al husillo', desc: 'Pieza intermedia que se atornilla al plato y lo une a la nariz del husillo.' },
      ...(p.llave ? [{ id: 'llave', name: 'Llave de ajuste', desc: 'Llave en T de punta cuadrada. Nunca dejarla colocada en el plato: al arrancar el torno sale despedida.' }] : []),
      { id: 'pieza', name: 'Pieza', desc: p.invertidas ? 'Disco de diámetro grande, tomado por fuera con las mordazas invertidas.' : 'Barra redonda tomada por las tres mordazas.' },
    ]
  if (k === '4m')
    return [
      { id: 'cuerpo', name: 'Cuerpo del plato', desc: 'Plato de 4 ranuras, con circunferencias marcadas en la cara para ayudar a centrar.' },
      { id: 'mordazas', name: 'Mordazas independientes', desc: 'Cada mordaza se ajusta por separado: permite tomar piezas de geometría variada (cuadradas, irregulares) o tornear excéntrico. También se pueden invertir para diámetros grandes.' },
      { id: 'tornillos', name: 'Tornillos de las mordazas', desc: 'Un tornillo radial por mordaza, con cabeza cuadrada en la periferia para la llave.' },
      ...(p.llave ? [{ id: 'llave', name: 'Llave de ajuste', desc: 'La misma llave en T; se usa en cada mordaza por separado. No dejarla puesta.' }] : []),
      { id: 'pieza', name: 'Pieza prismática', desc: 'Bloque de 50 × 60 mm: con el plato de 4 se puede centrar el resalto a tornear aunque no esté en el centro del bloque.' },
    ]
  if (k === 'liso')
    return [
      { id: 'plato-liso', name: 'Plato liso de arrastre', desc: 'No tiene mordazas: un agujero central y una ranura donde se abulona el perno de arrastre.' },
      { id: 'perno', name: 'Perno (tornillo) de arrastre', desc: 'Perno abulonado al plato liso que empuja la cola de la brida.' },
      { id: 'punto', name: 'Punto', desc: 'Punto con cola cono Morse en el agujero del husillo: centra el extremo izquierdo de la pieza.' },
      { id: 'brida', name: 'Brida (perro) de arrastre', desc: 'Cuerpo perforado, cola de arrastre y tornillo que se ajusta sobre el diámetro de la pieza. Se aprieta en el extremo más cercano al plato.' },
      { id: 'pieza', name: 'Pieza con agujeros de centro', desc: 'Perforada en ambas puntas con mecha de centrar (cono de 60°). Se puede dar vuelta sin perder la concentricidad.' },
    ]
  return [
    { id: 'portapinzas', name: 'Portapinzas', desc: 'Se monta en lugar del plato, en el husillo. Tiene el cono interior donde asienta la pinza.' },
    { id: 'pinza', name: 'Pinza (boquilla) de apriete', desc: 'Casquillo ranurado y cónico que se cierra al empujarlo contra el cono. Inconveniente: cada una sirve para muy pocos diámetros, así que hace falta un juego grande de pinzas.' },
    { id: 'tuerca', name: 'Tuerca de apriete', desc: 'Se enrosca en el portapinzas y empuja la pinza hacia el cono.' },
    { id: 'pieza', name: 'Pieza', desc: 'Barra calibrada de diámetro chico, ideal para trabajos en serie.' },
  ]
}

export const platos: ComponentDef = {
  id: 'platos',
  name: 'Platos y elementos de sujeción',
  category: 'Accesorios',
  icon: '🔩',
  short: 'Plato universal de 3 mordazas, plato de 4 mordazas independientes, plato liso con brida de arrastre y pinzas de apriete.',
  camera: [25, 16, 37],
  target: [3, 0, 0],
  shadowY: -11.5,
  defaultParams: { tipo: '3m', apertura: 40, invertidas: false, llave: true, j1: 35, j2: 40, j3: 15, j4: 20 },
  render: (p) => <PlatosModel kind={p.tipo} clampD={p.apertura} inverted={p.invertidas} jaws4={[p.j1, p.j2, p.j3, p.j4]} showKey={p.llave} />,
  Controls: PlatosControls,
  parts: platosParts,
  theory: (
    <>
      <p>Los <strong>platos</strong> sujetan la pieza al husillo durante el mecanizado. Se elige según la forma y el largo de la pieza.</p>
      <ul>
        <li>
          <strong>Plato universal de 3 mordazas</strong>: las tres cierran o abren <em>simultáneamente</em> con la llave (piñón → espiral → mordazas), así que centra
          solo piezas redondas o con caras múltiplo de tres. Tiene juegos de mordazas invertidas y blandas.
        </li>
        <li>
          <strong>Plato de 4 mordazas</strong>: cada mordaza se ajusta por separado; sirve para piezas de geometría variada y para tornear descentrado. Centrar lleva
          más tiempo.
        </li>
        <li>
          <strong>Plato liso de arrastre</strong>: sin mordazas, con agujero central y perno de arrastre; se usa con la <strong>brida (perro)</strong> en el montaje
          entre puntas.
        </li>
        <li>
          <strong>Pinzas o boquillas</strong>: se saca el plato y se montan en el agujero del husillo con un portapinzas. Son muy precisas, pero cada una sirve para
          muy pocos diámetros.
        </li>
      </ul>
      <p className="tip">Verificá que la pieza esté firmemente ajustada, girala a mano para ver si está centrada, y nunca dejes la llave colocada en el plato.</p>
    </>
  ),
  activities: [
    { id: 'platos-1', type: 'mc', q: '¿Qué plato conviene para una pieza de sección hexagonal?', options: ['El de 3 mordazas', 'El de 4 mordazas', 'El plato liso', 'Ninguno'], answer: 0, explain: 'Seis caras es múltiplo de tres: el universal de 3 mordazas la toma y la centra sola.' },
    { id: 'platos-2', type: 'mc', q: '¿Qué pieza interna hace que las 3 mordazas se muevan juntas?', options: ['El perno de arrastre', 'La espiral', 'La tuerca partida', 'El cono Morse'], answer: 1, explain: 'Los piñones hacen girar la espiral, en la que engranan las tres mordazas.' },
    { id: 'platos-3', type: 'mc', q: 'Hay que tornear un resalto descentrado en un bloque rectangular. ¿Qué plato usás?', options: ['Universal de 3 mordazas', 'De 4 mordazas independientes', 'Pinza', 'Plato liso'], answer: 1, explain: 'Con mordazas independientes se puede ubicar la pieza fuera del centro.' },
    { id: 'platos-4', type: 'mc', q: '¿Con qué accesorio se usa el plato liso de arrastre?', options: ['Con la brida (perro) de arrastre', 'Con la luneta móvil', 'Con la llave del plato', 'Con la pinza'], answer: 0, explain: 'El perno del plato liso empuja la cola de la brida apretada en la pieza.' },
    { id: 'platos-5', type: 'mc', q: '¿Cuál es el inconveniente de las pinzas de apriete?', options: ['No centran', 'Cada una sirve para muy pocos diámetros', 'Sólo sirven para piezas cuadradas', 'Hay que lubricarlas siempre'], answer: 1, explain: 'Hace falta un juego grande de pinzas si se cambia seguido de diámetro.' },
    { id: 'platos-6', type: 'mc', q: '¿Para qué sirven las mordazas blandas?', options: ['Para piezas de diámetro grande', 'Para materiales blandos o para no marcar la pieza', 'Para roscar', 'Para piezas calientes'], answer: 1, explain: 'Se usan con materiales blandos o cuando no se quiere lastimar la pieza.' },
  ],
}

/* ================================================================== puntos y lunetas */

const PUNTOS: { value: PuntoKind; label: string }[] = [
  { value: 'fijo', label: 'Punto fijo' },
  { value: 'giratorio', label: 'Punto giratorio' },
  { value: 'mandril', label: 'Mandril portabrocas' },
  { value: 'luneta-fija', label: 'Luneta fija' },
  { value: 'luneta-movil', label: 'Luneta móvil' },
]

function PuntosControls({ params, set }: { params: Params; set: (p: Params) => void }) {
  const k = params.tipo as PuntoKind
  return (
    <>
      <Group label="Accesorio">
        <Segmented<PuntoKind> value={k} options={PUNTOS} onChange={(tipo) => set({ tipo })} />
      </Group>
      {k === 'mandril' && (
        <Group label="Herramienta en el mandril">
          <Segmented<'broca' | 'mecha'>
            value={params.herramienta}
            options={[
              { value: 'broca', label: 'Broca (mecha) Ø 10' },
              { value: 'mecha', label: 'Mecha de centrar' },
            ]}
            onChange={(herramienta) => set({ herramienta })}
          />
        </Group>
      )}
      {(k === 'luneta-fija' || k === 'luneta-movil') && (
        <Slider label="Diámetro de la pieza (ajuste de los patines)" value={params.diametro} min={10} max={100} step={5} onChange={(diametro) => set({ diametro })} format={(v) => `Ø ${v} mm`} />
      )}
      {k !== 'mandril' && <Toggle label="Hacer girar la pieza" value={params.girar} onChange={(girar) => set({ girar })} />}
      {k === 'giratorio' && <p className="hint">Despiezá para ver los dos rodamientos: la cola queda quieta en la contrapunta y la punta gira con la pieza.</p>}
    </>
  )
}

const puntosParts = (p: Params): PartInfo[] => {
  const k = p.tipo as PuntoKind
  if (k === 'fijo')
    return [
      { id: 'cono', name: 'Cola cono Morse', desc: 'Se clava en el agujero cónico del manguito o del husillo (con el manguito afuera unos 5 cm y un golpe suave). Para sacarlo se retrocede el manguito hasta que se suelte.' },
      { id: 'punta', name: 'Punta de 60°', desc: 'Cono templado que entra en el agujero de centro de la pieza. Como la pieza gira contra él, debe mantenerse siempre lubricado.' },
      { id: 'pieza', name: 'Pieza con agujero de centro', desc: 'El agujero cónico de 60° se hace con la mecha de centrar.' },
    ]
  if (k === 'giratorio')
    return [
      { id: 'cuerpo', name: 'Cuerpo con cola cono Morse', desc: 'Queda fijo en el manguito de la contrapunta.' },
      { id: 'rodamiento-trasero', name: 'Rodamiento trasero', desc: 'Primer rulemán del juego de dos que lleva el punto en su cabeza.' },
      { id: 'rodamiento-delantero', name: 'Rodamiento delantero', desc: 'Segundo rulemán: entre los dos permiten que la punta gire a la misma velocidad que la pieza mientras la cola queda fija. Por eso no necesita lubricación.' },
      { id: 'punta', name: 'Eje con punta de 60°', desc: 'Gira junto con la pieza. En el mecanizado hay que observar que esté siempre girando.' },
    ]
  if (k === 'mandril')
    return [
      { id: 'cono', name: 'Cono Morse (vástago)', desc: 'Se clava en el agujero cónico del manguito de la contrapunta.' },
      { id: 'cuerpo', name: 'Cuerpo del mandril', desc: 'Cuerpo con la corona dentada y el casquillo moleteado; al girar la corona, las mordazas avanzan por sus guías inclinadas.' },
      { id: 'mordazas', name: 'Mordazas', desc: 'Tres mordazas que convergen hacia la punta y aprietan la broca centrada.' },
      { id: 'llave', name: 'Llave del portabrocas', desc: 'Llave con piñón cónico que engrana en la corona. No dejarla puesta.' },
      { id: 'herramienta', name: p.herramienta === 'broca' ? 'Broca (mecha) helicoidal' : 'Mecha de centrar', desc: p.herramienta === 'broca' ? 'Broca de dos canales: perfora en el eje de la pieza. Se introduce con el volante de la contrapunta, con la contrapunta bloqueada sobre la bancada.' : 'Hace en la cara de la pieza la perforación cónica de 60° donde apoya el punto (montajes con contrapunta y entre puntas).' },
    ]
  if (k === 'luneta-fija')
    return [
      { id: 'cuerpo', name: 'Cuerpo de fundición', desc: 'Con tapa abisagrada arriba para colocar la pieza. Se apoya sobre las guías de la bancada.' },
      { id: 'patines', name: 'Patines regulables', desc: 'Tres patines de bronce (o con rodamiento) que se acercan a la pieza con tornillos. Deben sostenerla sin impedirle girar libremente.' },
      { id: 'zapata', name: 'Zapata', desc: 'Pieza inferior que, apretada contra la parte de abajo de las guías, fija la luneta a la bancada.' },
      { id: 'bulon', name: 'Bulón', desc: 'Atraviesa la luneta, la ranura de la bancada y la zapata.' },
      { id: 'tuerca', name: 'Tuerca', desc: 'Al apretarla, la zapata sube y la luneta queda firme sobre la bancada.' },
      { id: 'bancada', name: 'Bancada (tramo)', desc: 'Tramo de la bancada con sus guías prismáticas y planas.' },
      { id: 'pieza', name: 'Pieza larga', desc: 'Pieza larga y delgada que sin apoyo se pandearía en la zona media.' },
    ]
  return [
    { id: 'cuerpo', name: 'Cuerpo de la luneta móvil', desc: 'Se atornilla al carro principal y lo acompaña en su desplazamiento.' },
    { id: 'patines', name: 'Patines (2)', desc: 'Dos puntos de apoyo (arriba y atrás): la herramienta es el punto faltante.' },
    { id: 'tornillos', name: 'Tornillos de fijación', desc: 'Fijan la luneta al carro; deben estar firmemente atornillados.' },
    { id: 'carro', name: 'Carro longitudinal', desc: 'Carro sobre el que se monta la luneta móvil.' },
    { id: 'herramienta', name: 'Herramienta', desc: 'Corta junto a los patines, donde la pieza está apoyada.' },
    { id: 'pieza', name: 'Pieza larga', desc: 'Pieza larga y delgada.' },
  ]
}

export const puntosLunetas: ComponentDef = {
  id: 'puntos-lunetas',
  name: 'Puntos, mandril y lunetas',
  category: 'Accesorios',
  icon: '🎯',
  short: 'Punto fijo y giratorio, mandril portabrocas con broca y mecha de centrar, luneta fija y luneta móvil.',
  camera: [16, 10, 25],
  target: [0, 1, 0],
  shadowY: -16.9,
  defaultParams: { tipo: 'giratorio', herramienta: 'broca', diametro: 40, girar: false },
  render: (p) => <PuntosModel kind={p.tipo} tool={p.herramienta} barD={p.diametro} spin={p.girar} />,
  Controls: PuntosControls,
  parts: puntosParts,
  theory: (
    <>
      <h4>Puntos</h4>
      <p>
        Sujetan los extremos libres de las piezas largas. Entran por su <strong>cola cono Morse</strong> en el manguito de la contrapunta (o en el husillo) y su{' '}
        <strong>punta de 60°</strong> apoya en el agujero de centro hecho con la <strong>mecha de centrar</strong>.
      </p>
      <ul>
        <li>
          <strong>Punto fijo</strong>: no gira; su punta debe estar siempre lubricada.
        </li>
        <li>
          <strong>Punto giratorio</strong>: tiene adentro un juego de <strong>dos rulemanes</strong>: la cola queda clavada y la punta gira con la pieza. No necesita
          lubricación.
        </li>
      </ul>
      <h4>Mandril portabrocas</h4>
      <p>
        Se clava en el manguito de la contrapunta y sujeta brocas (mechas) para perforar en el eje de la pieza. Se avanza con el volante de la contrapunta, con la
        contrapunta bloqueada sobre la bancada.
      </p>
      <h4>Lunetas</h4>
      <p>
        Cuando la pieza es muy larga y delgada (o muy pesada) se apoya en una <strong>luneta</strong>: cuerpo de fundición con patines de bronce o de rodamiento,
        regulables con tornillos.
      </p>
      <ul>
        <li>
          <strong>Luneta fija</strong>: tres o cuatro apoyos; se sujeta a la bancada con una zapata inferior, bulón y tuerca. No debe entorpecer el recorrido del
          carro.
        </li>
        <li>
          <strong>Luneta móvil</strong>: se atornilla al carro y lo acompaña; tiene dos o tres apoyos y la herramienta es el punto faltante.
        </li>
      </ul>
    </>
  ),
  activities: [
    { id: 'lunetas-1', type: 'mc', q: '¿Por qué el punto giratorio no necesita lubricación?', options: ['Porque es de bronce', 'Porque tiene dos rodamientos y su punta gira con la pieza', 'Porque no toca la pieza', 'Porque gira más lento'], answer: 1, explain: 'Los dos rulemanes de su cabeza permiten que la punta gire con la pieza mientras la cola queda fija.' },
    { id: 'lunetas-2', type: 'num', q: '¿Cuántos grados tiene el cono de la punta (y del agujero de centro)?', answer: 60, tolerance: 0, unit: '°', explain: 'La mecha de centrar hace una cavidad cónica de 60° en la que apoya el punto.' },
    { id: 'lunetas-3', type: 'mc', q: '¿Cómo se fija la luneta fija a la bancada?', options: ['Con tornillos al carro', 'Con una zapata inferior, un bulón y una tuerca', 'Con imanes', 'Se apoya sola por su peso'], answer: 1, explain: 'La zapata inferior se aprieta contra las guías con un bulón y una tuerca.' },
    { id: 'lunetas-4', type: 'mc', q: 'En la luneta móvil, ¿qué hace de punto de apoyo faltante?', options: ['La contrapunta', 'La herramienta', 'El plato', 'La brida'], answer: 1, explain: 'La luneta móvil tiene dos o tres apoyos; la herramienta completa el apoyo.' },
    { id: 'lunetas-5', type: 'mc', q: '¿Dónde se coloca el mandril portabrocas para perforar en el torno?', options: ['En la torre portaherramientas', 'En el agujero cónico del manguito de la contrapunta', 'En el plato liso', 'En el carro transversal'], answer: 1, explain: 'Se clava en el cono Morse del manguito y se avanza con el volante de la contrapunta.' },
    { id: 'lunetas-6', type: 'mc', q: '¿Cómo deben quedar ajustados los patines de una luneta?', options: ['Lo más apretados posible', 'Sosteniendo la pieza sin impedirle girar libremente', 'Separados 1 mm de la pieza', 'Sólo el de arriba apretado'], answer: 1, explain: 'Deben tener la presión necesaria para sostenerla sin frenar el giro.' },
  ],
}

/* ================================================================== herramientas de corte */

const TOOLS: { value: ToolKind; label: string }[] = [
  { value: 'integral', label: 'Integral (HSS)' },
  { value: 'portainserto', label: 'Portainsertos' },
  { value: 'tronzar', label: 'Ranurar / tronzar' },
  { value: 'roscar', label: 'Roscar 60°' },
  { value: 'interior', label: 'Interiores' },
  { value: 'moleta', label: 'Moleta' },
]

const TOOL_HINT: Record<ToolKind, string> = {
  integral: 'Herramienta de acero súper rápido (4 a 18 % de cobalto). En el corte se ven el ángulo de incidencia α, el de filo β y el de ataque γ: α + β + γ = 90°.',
  portainserto: 'El portainsertos sostiene la plaquita de metal duro sobre su asiento con un tornillo. Despiezá para ver el asiento, la plaquita con sus surcos rompevirutas y el tornillo.',
  tronzar: 'Herramienta de perfil delgado que penetra perpendicular al eje: hace ranuras y, si llega al centro, corta la pieza (tronzado).',
  roscar: 'Plaquita con el perfil del filete: 60° para roscas métricas (55° para Whitworth). Al roscar, el avance es igual al paso.',
  interior: 'Barra larga para tornear por dentro una pieza ya perforada.',
  moleta: 'No saca viruta: comprime la superficie con dos ruedas labradas y deja un grabado para mejorar el agarre.',
}

function HerrControls({ params, set }: { params: Params; set: (p: Params) => void }) {
  const k = params.tipo as ToolKind
  return (
    <>
      <Group label="Herramienta">
        <Segmented<ToolKind> value={k} options={TOOLS} onChange={(tipo) => set({ tipo })} />
      </Group>
      {(k === 'integral' || k === 'roscar') && <Toggle label={k === 'integral' ? 'Mostrar los ángulos α, β y γ' : 'Mostrar el ángulo del filete'} value={params.angulos} onChange={(angulos) => set({ angulos })} />}
      <p className="hint">{TOOL_HINT[k]}</p>
      {k === 'integral' && params.angulos && (
        <Field label="Ángulos de la cuña">
          <Formula>α + β + γ = 8° + 68° + 14° = 90°</Formula>
        </Field>
      )}
    </>
  )
}

const herrParts = (p: Params): PartInfo[] => {
  const k = p.tipo as ToolKind
  const ins = { id: 'inserto', name: 'Inserto (plaquita) de metal duro', desc: 'Plaquita de carburo de tungsteno y cobalto (con carburos de titanio, tántalo, niobio…). Su cara superior tiene surcos rompevirutas para evitar virutas largas. Forma, tamaño y calidad dependen del material y del mecanizado.' }
  const scr = { id: 'tornillo', name: 'Tornillo de fijación', desc: 'Tornillo Torx que pasa por el agujero de la plaquita y la aprieta contra el asiento.' }
  if (k === 'integral')
    return [
      { id: 'vastago', name: 'Vástago (cuerpo)', desc: 'Barra cuadrada de acero súper rápido que se sujeta en la torre. Cuando pierde el filo hay que reafilarla (pierde su perfil y tiempo de hombre y de máquina).' },
      ...(p.angulos
        ? [
            { id: 'cara-ataque', name: 'Cara de ataque (γ)', desc: 'Cara superior por donde sale la viruta. El ángulo de ataque γ se mide entre esta cara y la horizontal.' },
            { id: 'flanco', name: 'Flanco principal (α)', desc: 'Cara debajo del filo. El ángulo de incidencia α (entre el flanco y la vertical) evita que la herramienta roce la pieza.' },
            { id: 'filo', name: 'Filo (cortante) principal (β)', desc: 'Arista entre la cara de ataque y el flanco: es la que corta. β es el ángulo de filo (de la cuña).' },
          ]
        : []),
    ]
  if (k === 'portainserto')
    return [
      { id: 'cuerpo', name: 'Cuerpo del portainsertos', desc: 'Conviene el más grande posible: da una base rígida al filo y evita el voladizo que provoca vibraciones. Tamaño, forma de la plaquita y ángulo de posición (κr) definen el portainsertos.' },
      { id: 'asiento', name: 'Asiento (calce)', desc: 'Placa de metal duro debajo de la plaquita: la apoya bien plana y protege el cuerpo si la plaquita se rompe.' },
      ins,
      scr,
    ]
  if (k === 'tronzar')
    return [
      { id: 'portacuchilla', name: 'Bloque portacuchilla', desc: 'Se sujeta en la torre y aprieta la cuchilla con su regla y tornillos.' },
      { id: 'cuchilla', name: 'Cuchilla', desc: 'Hoja delgada que permite penetrar hasta el centro de la pieza.' },
      { id: 'inserto', name: 'Inserto de ranurar', desc: 'Filo principal frontal: trabajarlo de costado lo somete a esfuerzos adicionales. Produce viruta vinculada.' },
    ]
  if (k === 'roscar')
    return [
      { id: 'cuerpo', name: 'Cuerpo (portainsertos de roscar)', desc: 'Lleva la plaquita triangular acostada.' },
      { id: 'asiento', name: 'Asiento', desc: 'Calce de metal duro bajo la plaquita.' },
      { id: 'inserto', name: 'Inserto de roscar 60°', desc: 'Su punta tiene el perfil del filete métrico (60°). Se centra perfectamente y perpendicular a la pieza.' },
      scr,
    ]
  if (k === 'interior')
    return [
      { id: 'barra', name: 'Barra de interiores', desc: 'Larga y de formato especial, para entrar en el agujero previamente perforado.' },
      { id: 'inserto', name: 'Inserto', desc: 'Plaquita chica (rómbica de 55°) en la punta de la barra.' },
      scr,
    ]
  return [
    { id: 'cuerpo', name: 'Cuerpo de la moleta', desc: 'Mango con la horquilla que sostiene las ruedas.' },
    { id: 'ruedas', name: 'Ruedas moleteadas', desc: 'Dos ruedas con labrado inclinado en sentidos opuestos: juntas dejan un grabado cruzado (diamante). Trabajan comprimiendo, sin sacar viruta.' },
  ]
}

export const herramientas: ComponentDef = {
  id: 'herramientas',
  name: 'Herramientas de corte',
  category: 'Herramientas de corte',
  icon: '🔪',
  short: 'Herramienta integral de acero rápido con sus ángulos, portainsertos con plaquita de metal duro, y herramientas de ranurar, roscar, interiores y moleta.',
  camera: [16, 8, 15],
  target: [0.5, 0, 0],
  shadowY: -2.2,
  defaultParams: { tipo: 'integral', angulos: true },
  render: (p) => <HerramientasModel kind={p.tipo} angles={p.angulos} />,
  Controls: HerrControls,
  parts: herrParts,
  theory: (
    <>
      <p>
        Las herramientas de corte arrancan el material sobrante. Las dos familias más usadas son las <strong>herramientas integrales</strong> y los{' '}
        <strong>portainsertos</strong>.
      </p>
      <h4>Herramienta integral</h4>
      <p>
        De acero aleado al cobalto (<strong>acero súper rápido</strong>, 4 a 18 % de Co): buena dureza y resistencia a la temperatura. Cuando pierde el filo hay que
        reafilarla. Sus ángulos:
      </p>
      <ul>
        <li>
          <strong>α, de incidencia</strong>: entre el flanco y la vertical; evita el roce.
        </li>
        <li>
          <strong>β, de filo</strong>: el de la cuña que corta.
        </li>
        <li>
          <strong>γ, de ataque</strong>: entre la cara de ataque y la horizontal; facilita la salida de la viruta.
        </li>
      </ul>
      <Formula>α + β + γ = 90°</Formula>
      <h4>Insertos y portainsertos</h4>
      <p>
        Las <strong>plaquitas</strong> son de carburo de tungsteno y cobalto, con <strong>rompevirutas</strong> en la cara superior. Se fijan al portainsertos sobre
        un asiento con un tornillo. Hoy reemplazan a las integrales.
      </p>
      <h4>Otras herramientas</h4>
      <ul>
        <li>
          <strong>Ranurar / tronzar</strong>: perfil delgado, penetra perpendicular al eje (viruta vinculada).
        </li>
        <li>
          <strong>Roscar</strong>: perfil del filete, 60° métrica o 55° Whitworth.
        </li>
        <li>
          <strong>Interiores</strong>: barras largas para tornear dentro de una pieza perforada.
        </li>
        <li>
          <strong>Moleta</strong>: única operación que no saca viruta.
        </li>
      </ul>
    </>
  ),
  activities: [
    { id: 'herr-1', type: 'num', q: 'Una herramienta tiene α = 6° y γ = 12°. ¿Cuánto vale el ángulo de filo β?', answer: 72, tolerance: 0, unit: '°', explain: 'α + β + γ = 90° → β = 90 − 6 − 12 = 72°.' },
    { id: 'herr-2', type: 'mc', q: '¿Para qué sirven los surcos de la cara superior de las plaquitas?', options: ['Para enfriarlas', 'Para romper la viruta y evitar virutas largas', 'Para identificarlas', 'Para atornillarlas'], answer: 1, explain: 'Son los rompevirutas: evitan la viruta larga y espiralada.' },
    { id: 'herr-3', type: 'num', q: '¿Qué ángulo tiene el perfil de una rosca métrica?', answer: 60, tolerance: 0, unit: '°', explain: 'Métrica 60°; Whitworth 55°.' },
    { id: 'herr-4', type: 'mc', q: '¿Cuál es la única operación de torneado que no saca viruta?', options: ['Ranurado', 'Moleteado', 'Roscado', 'Frenteado'], answer: 1, explain: 'La moleta comprime la superficie con ruedas labradas.' },
    { id: 'herr-5', type: 'mc', q: '¿De qué están hechas principalmente las plaquitas de metal duro?', options: ['Acero al carbono', 'Carburo de tungsteno y cobalto', 'Bronce', 'Cerámica de vidrio'], answer: 1, explain: 'Carburo de tungsteno con cobalto, más otros carburos según la calidad.' },
    { id: 'herr-6', type: 'mc', q: '¿Por qué conviene un portainsertos lo más grande posible?', options: ['Porque es más barato', 'Porque da una base rígida y evita vibraciones por voladizo', 'Porque corta más rápido', 'Porque usa menos refrigerante'], answer: 1, explain: 'Más tamaño = más rigidez y menos voladizo.' },
    { id: 'herr-7', type: 'num', q: 'Para roscar métrico con el charriot inclinado, β = 90° − α/2. ¿Cuántos grados se inclina el charriot?', answer: 60, tolerance: 0, unit: '°', explain: 'α = 60° → β = 90 − 30 = 60°.' },
  ],
}

export const TORNO_CATALOG: ComponentDef[] = [torno, platos, puntosLunetas, herramientas]

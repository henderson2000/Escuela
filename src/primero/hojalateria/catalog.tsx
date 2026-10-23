import { useCallback } from 'react'
import type { ComponentDef } from '../../catalog/types'
import { Field, Readout, Segmented, Toggle } from '../../components/ui'
import { FoldingSheet, boxSpec, budineraSpec } from '../../three/models/primero/Plegado'
import { ENGRAFADO_PARTS, EngrafadoModel, HERRAMIENTAS_PARTS, HerramientasModel, PLEGADORA_PARTS, PlegadoraModel, type EngrafadoParams } from '../../three/models/primero/Hojalateria'

export interface Op {
  n: number
  text: string
  tools: string
  /** avance del plegado (0..1) que muestra el modelo en esta operación */
  p: number
}

export const CAJA_OPS: Op[] = [
  { n: 10, text: 'Recepción de la materia prima y control dimensional: chapa galvanizada Nº 30 de 130 × 290 mm.', tools: 'Regla metálica', p: 0 },
  { n: 20, text: 'Trazado de paralelas a los bordes con el gramil: a 5 mm y a 35 mm, en las dos caras.', tools: 'Gramil, regla metálica', p: 0 },
  { n: 30, text: 'Diagonal desde la intersección de las líneas de 35 mm hasta el vértice de la chapa.', tools: 'Punta de trazar, regla', p: 0 },
  { n: 40, text: 'Desde la intersección de las líneas de 35 y 5 mm, diagonal a 45° de 5 mm hacia afuera (chaflán de las pestañas).', tools: 'Punta de trazar, regla', p: 0 },
  { n: 50, text: 'Con la pieza vertical, cortar por la línea de 35 mm hasta la intersección y luego por la diagonal (sale el recorte rojo).', tools: 'Tijera de hojalatero', p: 0 },
  { n: 60, text: 'Cortar la línea de 5 mm y las diagonales a 45°.', tools: 'Tijera de hojalatero', p: 0 },
  { n: 70, text: 'Plegar las pestañas de 5 mm de los lados largos.', tools: 'Plegadora, martillo de hojalatero', p: 0.25 },
  { n: 80, text: 'Plegar las pestañas de 5 mm restantes en sentido opuesto a las de la operación 70.', tools: 'Plegadora, martillo de hojalatero', p: 0.25 },
  { n: 90, text: 'Plegar los laterales por las líneas de 35 mm.', tools: 'Plegadora, martillo de hojalatero', p: 0.75 },
  { n: 100, text: 'Plegar los triángulos (orejas) y cerrar la caja.', tools: 'Plegadora, martillo de hojalatero', p: 1 },
]

export const TAPA_OPS: Op[] = [
  { n: 10, text: 'Recepción de la materia prima y control dimensional: chapa galvanizada Nº 30 de 102 × 262 mm.', tools: 'Regla metálica', p: 0 },
  { n: 20, text: 'Trazado de paralelas a los bordes con el gramil: a 5 mm y a 20 mm, en las dos caras.', tools: 'Gramil, regla metálica', p: 0 },
  { n: 30, text: 'Diagonal desde la intersección de las líneas de 20 mm hasta el vértice de la chapa.', tools: 'Punta de trazar, regla', p: 0 },
  { n: 40, text: 'Desde la intersección de las líneas de 20 y 5 mm, diagonal a 45° de 5 mm hacia afuera.', tools: 'Punta de trazar, regla', p: 0 },
  { n: 50, text: 'Cortar por la línea de 20 mm hasta la intersección y luego por la diagonal.', tools: 'Tijera de hojalatero', p: 0 },
  { n: 60, text: 'Cortar la línea de 5 mm y las diagonales a 45°.', tools: 'Tijera de hojalatero', p: 0 },
  { n: 70, text: 'Plegar las pestañas de 5 mm de los lados largos.', tools: 'Plegadora, martillo de hojalatero', p: 0.25 },
  { n: 80, text: 'Plegar las pestañas de 5 mm restantes en el MISMO sentido que las de la operación 70.', tools: 'Plegadora, martillo de hojalatero', p: 0.25 },
  { n: 90, text: 'Plegar los laterales por las líneas de 20 mm.', tools: 'Plegadora, martillo de hojalatero', p: 0.75 },
  { n: 100, text: 'Plegar los triángulos y cerrar la tapa.', tools: 'Plegadora, martillo de hojalatero', p: 1 },
]

export const BUDINERA_OPS: Op[] = [
  { n: 10, text: 'Recepción de la materia prima y control dimensional: chapa galvanizada Nº 30 de 200 × 333 mm.', tools: 'Regla metálica', p: 0 },
  { n: 20, text: 'Trazado de paralelas a los bordes con el gramil: a 8 mm y a 63 mm, en las dos caras.', tools: 'Gramil, regla metálica', p: 0 },
  { n: 30, text: 'Pieza vertical: marcar un punto sobre la recta de 8 mm a 18 mm de la línea de 63 mm y unirlo con la intersección de las líneas de 63 mm.', tools: 'Punta de trazar, regla', p: 0 },
  { n: 40, text: 'Pieza horizontal: punto sobre la recta de 8 mm a 15 mm de la línea de 63 mm, y diagonal hasta la intersección.', tools: 'Punta de trazar, regla', p: 0 },
  { n: 50, text: 'Trazar la diagonal que une las intersecciones de las operaciones 40 y 30, hasta el borde.', tools: 'Punta de trazar, regla', p: 0 },
  { n: 60, text: 'Trazar una recta paralela a 15 mm de la diagonal de la operación 40.', tools: 'Gramil, regla', p: 0 },
  { n: 70, text: 'Cortar sobre la recta de la operación 60.', tools: 'Tijera de hojalatero', p: 0 },
  { n: 80, text: 'Cortar sobre las rectas de las operaciones 30 y 60.', tools: 'Tijera de hojalatero', p: 0 },
  { n: 90, text: 'Plegar en las rectas de 63 mm con ángulo agudo, hacia el interior.', tools: 'Plegadora, martillo de hojalatero', p: 0.7 },
  { n: 100, text: 'Plegar las rectas trazadas en la operación 60 (las esquinas).', tools: 'Plegadora, martillo de hojalatero', p: 0.7 },
  { n: 110, text: 'Plegar las rectas de 8 mm hacia el exterior y cerrar el pliegue con el martillo (dobladillo).', tools: 'Plegadora, martillo de hojalatero', p: 1 },
  { n: 120, text: 'Soldar por punto los pliegues de las esquinas.', tools: 'Soldadora por punto', p: 1 },
]

interface ProjParams {
  op: number
  recortes: boolean
}

function ProjectControls({ ops, params, set }: { ops: Op[]; params: ProjParams; set: (p: Partial<ProjParams>) => void }) {
  const i = Math.max(0, Math.min(ops.length - 1, params.op))
  const op = ops[i]
  return (
    <>
      <Field label={`Operación ${op.n} (${i + 1} de ${ops.length})`}>
        <input type="range" min={0} max={ops.length - 1} value={i} onChange={(e) => set({ op: Number(e.target.value) })} />
      </Field>
      <div className="row wrap">
        <button type="button" className="btn small" disabled={i === 0} onClick={() => set({ op: i - 1 })}>
          ← Anterior
        </button>
        <button type="button" className="btn small primary" disabled={i === ops.length - 1} onClick={() => set({ op: i + 1 })}>
          Siguiente operación →
        </button>
      </div>
      <p className="hint">
        <b>Op. {op.n}:</b> {op.text}
      </p>
      <Readout label="Herramientas" value={op.tools} />
      <Toggle label="Mostrar los recortes (en rojo) sobre la chapa plana" value={params.recortes} onChange={(recortes) => set({ recortes })} />
    </>
  )
}

/** el modelo anima el plegado hacia el avance de la operación elegida */
function projectProgress(ops: Op[], op: number) {
  return ops[Math.max(0, Math.min(ops.length - 1, op))].p
}

function CajaSheet({ op, recortes }: ProjParams) {
  const make = useCallback((p: number) => boxSpec({ a: 60, b: 220, h: 30, f: 5, p, mismoSentido: false, showScrap: recortes }), [recortes])
  return <FoldingSheet lift={0.6} target={projectProgress(CAJA_OPS, op)} make={make} />
}

function TapaSheet({ op, recortes }: ProjParams) {
  const make = useCallback((p: number) => boxSpec({ a: 62, b: 222, h: 15, f: 5, p, mismoSentido: true, showScrap: recortes }), [recortes])
  return <FoldingSheet lift={0.6} target={projectProgress(TAPA_OPS, op)} make={make} />
}

const PROJECT_PARTS = (extra: { id: string; name: string; desc: string }[]) => [
  { id: 'fondo', name: 'Fondo', desc: 'La base de la pieza: el rectángulo central que queda entre las líneas de plegado.' },
  { id: 'laterales', name: 'Laterales (lados largos)', desc: 'Se pliegan a 90° por las líneas trazadas con el gramil.' },
  { id: 'cabeceras', name: 'Cabeceras (lados cortos)', desc: 'Se pliegan después de los laterales.' },
  ...extra,
]

function caja(): ComponentDef {
  return {
    id: 'caja',
    name: 'Caja (cartuchera)',
    category: 'Proyectos del taller',
    icon: '📦',
    short: 'Ej. 01-01: desarrollo de 130 × 290 mm, líneas a 5 y 35 mm. Seguí el ciclo de fabricación y mirala plegarse.',
    parts: (p) =>
      PROJECT_PARTS([
        { id: 'pestanas', name: 'Pestañas de 5 mm', desc: 'Pliegues del borde: refuerzan y no dejan filos que corten. Las largas y las cortas van en sentidos opuestos.' },
        { id: 'orejas', name: 'Orejas (triángulos)', desc: 'Triángulos que quedan en los laterales al cortar las esquinas; se pliegan sobre las cabeceras y cierran la caja.' },
        ...((p as ProjParams).recortes && projectProgress(CAJA_OPS, (p as ProjParams).op) === 0 ? [{ id: 'recortes', name: 'Recortes', desc: 'Lo que se saca con la tijera en las esquinas (operaciones 50 y 60).' }] : []),
      ]),
    camera: [12, 16, 24],
    target: [0, 1, 0],
    shadowY: 0,
    defaultParams: { op: 9, recortes: true },
    render: (p) => <CajaSheet {...(p as ProjParams)} />,
    Controls: ({ params, set }) => <ProjectControls ops={CAJA_OPS} params={params as ProjParams} set={set} />,
    theory: (
      <>
        <p>
          Plano Ej. Nº 01-01, chapa galvanizada Nº 30, escala 1:1, tolerancia ±1 mm. Desarrollo de <b>130 × 290 mm</b>. Con el gramil se
          trazan líneas a <b>5 mm</b> (pestañas) y a <b>35 mm</b> (alto de los laterales) de cada borde.
        </p>
        <p>
          Queda un fondo de <b>60 × 220 mm</b> y paredes de <b>30 mm</b> de alto (35 − 5). En el plano las líneas llenas son de{' '}
          <b>corte</b> y las de trazos, de <b>plegado</b>.
        </p>
      </>
    ),
    activities: [
      { id: 'h1-cj-1', type: 'num', q: '¿Cuánto mide de ancho el fondo de la caja? (130 − 2 × 35)', answer: 60, tolerance: 0, unit: 'mm', explain: '130 − 70 = 60 mm.' },
      { id: 'h1-cj-2', type: 'num', q: '¿Cuánto mide de largo el fondo? (290 − 2 × 35)', answer: 220, tolerance: 0, unit: 'mm', explain: '290 − 70 = 220 mm.' },
      { id: 'h1-cj-3', type: 'num', q: '¿Qué alto tienen las paredes de la caja, sin la pestaña?', answer: 30, tolerance: 0, unit: 'mm', explain: '35 − 5 = 30 mm.' },
      { id: 'h1-cj-4', type: 'mc', q: 'En el plano, una línea de trazos indica…', options: ['Una línea de plegado', 'Una línea de corte', 'Una cota', 'Un error'], answer: 0, explain: 'Las llenas son de corte; las de trazos, de plegado.' },
      { id: 'h1-cj-5', type: 'mc', q: '¿Qué se pliega último?', options: ['Los triángulos (orejas), cerrando la caja', 'Las pestañas de 5 mm', 'Los laterales', 'Nada'], answer: 0, explain: 'Op. 100.' },
    ],
  }
}

function tapa(): ComponentDef {
  return {
    id: 'tapa',
    name: 'Tapa de la caja',
    category: 'Proyectos del taller',
    icon: '🗃️',
    short: 'Ej. 02-01: desarrollo de 102 × 262 mm, líneas a 5 y 20 mm. Entra justo sobre la caja.',
    parts: (p) =>
      PROJECT_PARTS([
        { id: 'pestanas', name: 'Pestañas de 5 mm', desc: 'En la tapa, todas se pliegan en el mismo sentido.' },
        { id: 'orejas', name: 'Orejas (triángulos)', desc: 'Cierran las esquinas de la tapa.' },
        ...((p as ProjParams).recortes && projectProgress(TAPA_OPS, (p as ProjParams).op) === 0 ? [{ id: 'recortes', name: 'Recortes', desc: 'Lo que se saca con la tijera en las esquinas.' }] : []),
      ]),
    camera: [11, 14, 21],
    target: [0, 1, 0],
    shadowY: 0,
    defaultParams: { op: 9, recortes: true },
    render: (p) => <TapaSheet {...(p as ProjParams)} />,
    Controls: ({ params, set }) => <ProjectControls ops={TAPA_OPS} params={params as ProjParams} set={set} />,
    theory: (
      <>
        <p>
          Plano Ej. Nº 02-01. Desarrollo de <b>102 × 262 mm</b> con líneas a <b>5</b> y <b>20 mm</b>. El fondo queda de <b>62 × 222 mm</b>:
          2 mm más que la caja en cada sentido, así la tapa entra justo por encima.
        </p>
      </>
    ),
    activities: [
      { id: 'h1-tp-1', type: 'num', q: '¿Cuánto mide el fondo de la tapa a lo ancho? (102 − 2 × 20)', answer: 62, tolerance: 0, unit: 'mm', explain: '102 − 40 = 62 mm.' },
      { id: 'h1-tp-2', type: 'num', q: '¿Qué alto tienen los laterales de la tapa, sin la pestaña?', answer: 15, tolerance: 0, unit: 'mm', explain: '20 − 5 = 15 mm.' },
      { id: 'h1-tp-3', type: 'num', q: 'El fondo de la caja mide 60 mm y el de la tapa 62 mm. ¿Cuánto juego total queda a lo ancho?', answer: 2, tolerance: 0, unit: 'mm', explain: 'Así la tapa calza sin forzar.' },
      { id: 'h1-tp-4', type: 'mc', q: '¿En qué se diferencia el plegado de las pestañas de la tapa respecto de la caja?', options: ['En la tapa todas van en el mismo sentido', 'En la tapa no hay pestañas', 'En la tapa se sueldan', 'No hay diferencia'], answer: 0, explain: 'En la caja, las restantes van en sentido opuesto.' },
    ],
  }
}

function budinera(): ComponentDef {
  return {
    id: 'budinera',
    name: 'Budinera',
    category: 'Proyectos del taller',
    icon: '🍞',
    short: 'Ej. 03: desarrollo de 200 × 333 mm, líneas a 8 y 63 mm, paredes inclinadas, dobladillo y soldadura por punto.',
    parts: PROJECT_PARTS([{ id: 'dobladillo', name: 'Dobladillo de 8 mm', desc: 'El borde se pliega hacia afuera y se cierra con el martillo: refuerza el borde y no corta.' }]),
    camera: [21, 19, 28],
    target: [0, 1.5, 0],
    shadowY: 0,
    defaultParams: { op: 11, recortes: false },
    render: (p) => <FoldingSheet lift={0.9} target={projectProgress(BUDINERA_OPS, (p as ProjParams).op)} make={budineraSpec} />,
    Controls: ({ params, set }) => <ProjectControls ops={BUDINERA_OPS} params={params as ProjParams} set={set} />,
    theory: (
      <>
        <p>
          Plano Ej. Nº 03 (dibujado a escala 1,5:1). Desarrollo de <b>200 × 333 mm</b> con líneas a <b>8 mm</b> (dobladillo) y a{' '}
          <b>63 mm</b>. El fondo queda de <b>74 × 207 mm</b> y las paredes, de <b>55 mm</b>.
        </p>
        <p>
          Las cabeceras se abren 18 mm de cada lado: por eso las paredes quedan inclinadas, como un molde de budín. Las esquinas se pliegan
          y se <b>sueldan por punto</b>.
        </p>
      </>
    ),
    activities: [
      { id: 'h1-bd-1', type: 'num', q: '¿Cuánto mide el fondo de la budinera a lo ancho? (200 − 2 × 63)', answer: 74, tolerance: 0, unit: 'mm', explain: '200 − 126 = 74 mm.' },
      { id: 'h1-bd-2', type: 'num', q: '¿Y a lo largo? (333 − 2 × 63)', answer: 207, tolerance: 0, unit: 'mm', explain: '333 − 126 = 207 mm.' },
      { id: 'h1-bd-3', type: 'mc', q: 'El plano de la budinera está en escala 1,5:1. Eso quiere decir que el dibujo es…', options: ['Una vez y media más grande que la pieza', 'Más chico que la pieza', 'Igual a la pieza', 'El doble de la pieza'], answer: 0, explain: '1,5:1 = ampliación.' },
      { id: 'h1-bd-4', type: 'mc', q: '¿Cómo se unen las esquinas de la budinera?', options: ['Con soldadura por punto', 'Con pegamento', 'Con tornillos', 'Sólo plegadas'], answer: 0, explain: 'Op. 120.' },
    ],
  }
}

const herramientas: ComponentDef = {
  id: 'herramientas',
  name: 'Herramientas de hojalatería',
  category: 'Herramientas',
  icon: '✂️',
  short: 'Tijera, martillo de hojalatero, bigornia, compás, punta de trazar, granete y escuadra.',
  parts: HERRAMIENTAS_PARTS,
  camera: [6, 30, 40],
  target: [-1, 0, 0],
  shadowY: -1.5,
  defaultParams: {},
  render: () => <HerramientasModel />,
  Controls: () => <p className="hint">Tocá cada herramienta para ver para qué sirve.</p>,
  theory: (
    <>
      <p>
        Para trabajar la chapa se usan herramientas para <b>medir y trazar</b> (regla, escuadra, gramil, compás, punta de trazar y
        granete), para <b>cortar</b> (tijera, cizalla, guillotina), para <b>golpear</b> (martillo de hojalatero) y para <b>soportar los
        golpes</b> (bigornia, yunque, calzo o sufridera).
      </p>
    </>
  ),
  activities: [
    { id: 'h1-he-1', type: 'num', q: '¿Hasta qué espesor de chapa corta la tijera de hojalatero? (en mm)', answer: 1, tolerance: 0, unit: 'mm', explain: 'Para más espesor se usa la cizalla.' },
    { id: 'h1-he-2', type: 'num', q: '¿Con qué ángulo está afilada la punta del granete?', answer: 120, tolerance: 0, unit: '°', explain: 'Punta cónica a 120°.' },
    { id: 'h1-he-3', type: 'mc', q: '¿Para qué sirve la bigornia?', options: ['Para apoyar la chapa al enderezarla o darle forma', 'Para cortar', 'Para medir', 'Para soldar'], answer: 0, explain: 'Bloque de acero fundido con dos extremos cónicos.' },
    { id: 'h1-he-4', type: 'mc', q: '¿Con qué se trazan círculos y arcos sobre la chapa?', options: ['Compás de punta seca', 'Escuadra', 'Granete', 'Tijera'], answer: 0, explain: 'También sirve para trasladar medidas.' },
  ],
}

const plegadora: ComponentDef = {
  id: 'plegadora',
  name: 'Plegadora manual',
  category: 'Máquinas',
  icon: '🗜️',
  short: 'Levantá la aleta y mirá cómo se pliega la chapa contra el pisador.',
  parts: PLEGADORA_PARTS,
  camera: [-30, 26, 34],
  target: [0, 6, 0],
  shadowY: 0,
  defaultParams: { angulo: 90 },
  render: (p) => <PlegadoraModel angulo={p.angulo as number} />,
  Controls: ({ params, set }) => (
    <>
      <Field label={`Ángulo de plegado: ${params.angulo}°`}>
        <input type="range" min={0} max={135} step={5} value={params.angulo} onChange={(e) => set({ angulo: Number(e.target.value) })} />
      </Field>
      <div className="row wrap">
        {[0, 45, 90, 135].map((a) => (
          <button key={a} type="button" className={`btn small ${params.angulo === a ? 'primary' : ''}`} onClick={() => set({ angulo: a })}>
            {a}°
          </button>
        ))}
      </div>
      <p className="hint">Las plegadoras manuales trabajan chapa de hasta 1 mm. Para más espesor o piezas más grandes se usan las oleohidráulicas.</p>
    </>
  ),
  theory: (
    <>
      <p>
        La <b>plegadora</b> hace los pliegues de la chapa. Sus herramientas son el <b>punzón</b> y la <b>matriz</b>, cuya forma cambia según
        el pliegue. Las manuales, a palanca, son para piezas chicas y chapa de hasta <b>1 mm</b>; las <b>oleohidráulicas</b> tienen más
        fuerza y aceptan chapa más gruesa y piezas más grandes.
      </p>
    </>
  ),
  activities: [
    { id: 'h1-pl-1', type: 'mc', q: '¿Cómo se llaman las herramientas de la plegadora?', options: ['Punzón y matriz', 'Tijera y yunque', 'Granete y gramil', 'Rodillo y cuchilla'], answer: 0, explain: 'Su forma depende del pliegue.' },
    { id: 'h1-pl-2', type: 'num', q: '¿Hasta qué espesor trabajan las plegadoras manuales chicas? (mm)', answer: 1, tolerance: 0, unit: 'mm', explain: 'Para más espesor, las oleohidráulicas.' },
  ],
}

const engrafado: ComponentDef = {
  id: 'engrafado',
  name: 'Unión por engrafado',
  category: 'Máquinas',
  icon: '🔗',
  short: 'Dos chapas con ganchos opuestos que se enlazan y se aplastan: una unión firme sin soldadura.',
  parts: ENGRAFADO_PARTS,
  camera: [3, 6, 13],
  target: [0, 2, 0],
  shadowY: 1.2,
  defaultParams: { paso: 0 },
  render: (p) => <EngrafadoModel paso={(p as EngrafadoParams).paso} />,
  Controls: ({ params, set }) => (
    <Field label="Paso">
      <Segmented<number>
        value={params.paso}
        onChange={(paso) => set({ paso })}
        options={[
          { value: 0, label: '1. Ganchos' },
          { value: 1, label: '2. Enlazados' },
          { value: 2, label: '3. Aplastados' },
        ]}
      />
    </Field>
  ),
  theory: (
    <>
      <p>
        En el <b>engrafado</b> (o engargolado) se pliegan ganchos en los extremos de las dos chapas, en posiciones opuestas para que se
        puedan cruzar. Después se enlazan y se aplastan (remachan): la unión queda firme y duradera. Se hace con la <b>engrafadora</b>.
      </p>
    </>
  ),
  activities: [
    { id: 'h1-en-1', type: 'mc', q: '¿Cómo tienen que estar los ganchos de las dos chapas?', options: ['En posiciones opuestas, para que se crucen', 'Iguales y del mismo lado', 'Sin ganchos', 'Soldados'], answer: 0, explain: 'Así se pueden enlazar.' },
    { id: 'h1-en-2', type: 'mc', q: '¿Qué se hace después de enlazar los ganchos?', options: ['Se aplastan (remachan) entre sí', 'Se cortan', 'Se pintan', 'Se separan'], answer: 0, explain: 'Queda una unión firme y duradera.' },
  ],
}

export const HOJALATERIA1_CATALOG: ComponentDef[] = [caja(), tapa(), budinera(), herramientas, plegadora, engrafado]

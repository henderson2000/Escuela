import type { ComponentDef } from '../../catalog/types'
import { Field, Readout, Segmented, Slider, Toggle } from '../../components/ui'
import { FORMA_INFO, GRADO_INFO, LimaModel, limaParts, type Forma, type Grado, type LimaParams, type Picado } from '../../three/models/primero/Lima'
import { ETAPAS, MartilloModel, martilloParts, type MartilloParams } from '../../three/models/primero/Martillo'
import { INSTRUMENTOS_PARTS, InstrumentosModel, MORSA_PARTS, MorsaModel, type MorsaParams } from '../../three/models/primero/Taller'

const PICADO_INFO: Record<Picado, string> = {
  simple: 'Una sola fila de surcos paralelos. Para metales blandos (aluminio, plomo, estaño) y para afilar.',
  doble: 'Dos filas de surcos que se cruzan: dientes en forma de diamante que rompen la viruta. El estándar para hierro y acero.',
  escofina: 'Dientes individuales, triangulares y muy salientes. Sólo para materiales muy blandos: madera, caucho, cuero.',
}

function LimaControls({ params, set }: { params: LimaParams; set: (p: Partial<LimaParams>) => void }) {
  return (
    <>
      <Field label="Forma (sección)">
        <select className="input" value={params.forma} onChange={(e) => set({ forma: e.target.value as Forma })}>
          {(Object.keys(FORMA_INFO) as Forma[]).map((f) => (
            <option key={f} value={f}>
              {FORMA_INFO[f].name}
            </option>
          ))}
        </select>
      </Field>
      <Slider label="Tamaño" value={params.pulgadas} min={4} max={14} step={2} onChange={(pulgadas) => set({ pulgadas })} format={(x) => `${x}" (${(x * 2.54).toFixed(1).replace('.', ',')} cm)`} />
      <Field label="Picado">
        <Segmented<Picado>
          value={params.picado}
          onChange={(picado) => set({ picado })}
          options={[
            { value: 'simple', label: 'Simple' },
            { value: 'doble', label: 'Doble' },
            { value: 'escofina', label: 'Escofina' },
          ]}
        />
      </Field>
      <Field label="Grado de corte">
        <select className="input" value={params.grado} onChange={(e) => set({ grado: e.target.value as Grado })}>
          {(Object.keys(GRADO_INFO) as Grado[]).map((g) => (
            <option key={g} value={g}>
              {GRADO_INFO[g].name}
            </option>
          ))}
        </select>
      </Field>
      <Toggle label="Mostrar la sección (corte)" value={params.seccion} onChange={(seccion) => set({ seccion })} />
      <Readout label="Uso de la forma" value={FORMA_INFO[params.forma].uso} />
      <Readout label="Picado" value={PICADO_INFO[params.picado]} />
      <Readout label="Grado" value={`${GRADO_INFO[params.grado].dientes}. ${GRADO_INFO[params.grado].uso}`} />
    </>
  )
}

const lima: ComponentDef = {
  id: 'lima',
  name: 'La lima',
  category: 'Herramientas',
  icon: '🪚',
  short: 'Mango, espiga, cuerpo y punta. Cambiá la forma, el tamaño, el picado y el grado de corte.',
  parts: (p) => limaParts(p as LimaParams),
  camera: [6, 15, 34],
  target: [0, 2.5, 0],
  shadowY: 0.6,
  defaultParams: { forma: 'plana', pulgadas: 8, picado: 'doble', grado: 'bastarda', seccion: true },
  render: (p) => <LimaModel {...(p as LimaParams)} />,
  Controls: LimaControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        La <b>lima</b> es una varilla de <b>acero templado</b> de sección variada, cuyas caras tienen un estriado (dientes) para rebajar y
        pulir superficies. Partes: <b>mango</b>, <b>espiga</b>, <b>cuerpo</b> y <b>punta</b>.
      </p>
      <p>
        Se clasifica por <b>tamaño</b> (largo del cuerpo, en pulgadas), <b>forma</b> (sección transversal), <b>picado</b> (cómo están
        tallados los dientes) y <b>grado de corte</b> (cantidad de dientes por cm², de 18 a 1200).
      </p>
    </>
  ),
  activities: [
    { id: 'a1-li-1', type: 'mc', q: '¿Cómo se llama la parte de la lima que entra en el mango?', options: ['Espiga', 'Punta', 'Cuerpo', 'Virola'], answer: 0, explain: 'La espiga es el extremo puntiagudo sin dientes.' },
    { id: 'a1-li-2', type: 'mc', q: 'El tamaño de una lima se mide…', options: ['Por el largo del cuerpo, en pulgadas', 'Por el largo total con el mango', 'Por el ancho, en mm', 'Por el peso'], answer: 0, explain: 'Por ejemplo, una lima de 8" tiene un cuerpo de unos 20 cm.' },
    { id: 'a1-li-3', type: 'num', q: '¿Cuántos centímetros mide el cuerpo de una lima de 10"? (1" = 2,54 cm)', answer: 25.4, tolerance: 0.01, unit: 'cm', explain: '10 × 2,54 = 25,4 cm.' },
    { id: 'a1-li-4', type: 'mc', q: 'Para limar acero se usa picado…', options: ['Doble', 'Simple', 'Escofina', 'Cualquiera'], answer: 0, explain: 'El picado doble rompe la viruta en trozos chicos: el estándar para metales duros.' },
    { id: 'a1-li-5', type: 'mc', q: '¿Qué lima sirve para agrandar un agujero redondo?', options: ['Redonda', 'Plana', 'Cuadrada', 'Triangular'], answer: 0, explain: 'Su sección es un círculo: va bien en superficies cóncavas y agujeros.' },
  ],
}

function MartilloControls({ params, set }: { params: MartilloParams; set: (p: Partial<MartilloParams>) => void }) {
  const e = ETAPAS[params.etapa]
  return (
    <>
      <Field label={`Etapa ${params.etapa + 1} de ${ETAPAS.length}: ${e.name}`}>
        <input type="range" min={0} max={ETAPAS.length - 1} step={1} value={params.etapa} onChange={(ev) => set({ etapa: Number(ev.target.value) })} />
      </Field>
      <div className="row wrap">
        <button type="button" className="btn small" disabled={params.etapa === 0} onClick={() => set({ etapa: params.etapa - 1 })}>
          ← Etapa anterior
        </button>
        <button type="button" className="btn small primary" disabled={params.etapa === ETAPAS.length - 1} onClick={() => set({ etapa: params.etapa + 1 })}>
          Etapa siguiente →
        </button>
      </div>
      <p className="hint">
        <b>{e.ops}.</b> {e.text}
      </p>
      <Toggle label="Ver las cotas del plano" value={params.cotas} onChange={(cotas) => set({ cotas })} />
      <Toggle label="Numerar las caras (como un dado)" value={params.caras} onChange={(caras) => set({ caras })} />
      <Readout label="Material" value="Acero IRAM 1010" />
      <Readout label="Plano" value="M01-2020 · escala 1:1 · tol. ±0,5" />
    </>
  )
}

const martillo: ComponentDef = {
  id: 'martillo',
  name: 'Martillo de peña',
  category: 'Proyectos del taller',
  icon: '🔨',
  short: 'El proyecto del taller con las medidas del plano: de la barra en bruto al martillo terminado, etapa por etapa.',
  parts: (p) => martilloParts(p as MartilloParams),
  camera: [7, 9, 13],
  target: [0, 1.2, 0],
  shadowY: 0,
  defaultParams: { etapa: 4, cotas: true, caras: false },
  render: (p) => <MartilloModel {...(p as MartilloParams)} />,
  Controls: MartilloControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        El martillo de peña se hace con una barra de <b>acero IRAM 1010</b> de sección cuadrada de <b>22 mm</b> y <b>95 mm</b> de largo
        (plano M01-2020, escala 1:1, tolerancia ±0,5 mm).
      </p>
      <ul>
        <li>
          La <b>peña</b> ocupa los primeros <b>35 mm</b> y baja hasta <b>5 mm</b> de alto en la punta.
        </li>
        <li>
          El <b>ojo</b> es un oblongo de <b>10 mm</b> de ancho con centros a <b>45</b> y <b>55 mm</b> de la punta.
        </li>
      </ul>
      <p>Mové las etapas para seguir el ciclo de fabricación de la guía.</p>
    </>
  ),
  activities: [
    { id: 'a1-ma-1', type: 'num', q: '¿Cuántos milímetros de largo tiene el martillo terminado?', answer: 95, tolerance: 0, unit: 'mm', explain: 'Lo dice la cota de 95 del plano.' },
    { id: 'a1-ma-2', type: 'num', q: '¿Qué altura tiene la punta de la peña?', answer: 5, tolerance: 0, unit: 'mm', explain: 'La cota vertical de 5 mm.' },
    { id: 'a1-ma-3', type: 'num', q: '¿Cuánto mide de largo el ojo oblongo de punta a punta? (centros a 45 y 55, ancho 10)', answer: 20, tolerance: 0, unit: 'mm', explain: 'De 45 − 5 = 40 a 55 + 5 = 60: 20 mm.' },
    { id: 'a1-ma-4', type: 'mc', q: '¿De qué material es el martillo?', options: ['Acero IRAM 1010', 'Aluminio', 'Bronce', 'Fundición gris'], answer: 0, explain: 'Un acero de bajo carbono, fácil de limar.' },
    { id: 'a1-ma-5', type: 'mc', q: 'Al numerar las caras como un dado, ¿cuánto suman dos caras opuestas?', options: ['7', '6', '10', '12'], answer: 0, explain: 'Como en un dado: 1-6, 2-5, 3-4.' },
  ],
}

const instrumentos: ComponentDef = {
  id: 'instrumentos',
  name: 'Instrumentos de trazado',
  category: 'Instrumentos de medición y trazado',
  icon: '📐',
  short: 'Mármol, regla metálica, escuadra, gramil, punta de trazar, granete y martillo: lo necesario para marcar la pieza.',
  parts: INSTRUMENTOS_PARTS,
  camera: [18, 34, 44],
  target: [0, 2, 0],
  shadowY: -4,
  defaultParams: {},
  render: () => <InstrumentosModel />,
  Controls: () => <p className="hint">Tocá cada instrumento para ver para qué sirve, o despiezá para separarlos.</p>,
  theory: (
    <>
      <p>
        Antes de cortar o perforar, la pieza se <b>traza</b>: se pinta con sulfato de cobre y se marcan las líneas con la punta de trazar,
        apoyando el <b>gramil</b> sobre el <b>mármol</b>. Los centros de los agujeros se marcan con el <b>granete</b>.
      </p>
      <p>
        Durante el limado se controla con la <b>regla metálica</b> (que la cara sea plana y paralela) y con la <b>escuadra de 90°</b> (que
        dos caras estén a escuadra).
      </p>
    </>
  ),
  activities: [
    { id: 'a1-in-1', type: 'mc', q: '¿Con qué instrumento se controla que dos caras formen 90°?', options: ['Escuadra', 'Gramil', 'Granete', 'Regla'], answer: 0, explain: 'Se dice que las caras están "a escuadra".' },
    { id: 'a1-in-2', type: 'mc', q: '¿Para qué sirve el granete?', options: ['Para marcar el centro de un agujero antes de perforar', 'Para limar', 'Para medir ángulos', 'Para cortar chapa'], answer: 0, explain: 'Así la mecha no se desvía.' },
    { id: 'a1-in-3', type: 'mc', q: '¿Qué se usa para trazar líneas paralelas a la base a una altura exacta?', options: ['El gramil', 'La escuadra', 'El granete', 'La lima'], answer: 0, explain: 'Se apoya en el mármol y traza a la altura fijada.' },
    { id: 'a1-in-4', type: 'mc', q: '¿Por qué se pinta la pieza con sulfato de cobre antes de trazar?', options: ['Para que las líneas trazadas se vean bien', 'Para que no se oxide nunca', 'Para ablandarla', 'Para que pese menos'], answer: 0, explain: 'La punta de trazar raya la capa y la línea se ve brillante.' },
  ],
}

const morsa: ComponentDef = {
  id: 'morsa',
  name: 'Morsa de banco',
  category: 'Herramientas',
  icon: '🗜️',
  short: 'Sujeta la pieza mientras se lima. Abrí y cerrá las mordazas con la palanca.',
  parts: (p) => MORSA_PARTS.filter((x) => x.id !== 'pieza' || ((p as MorsaParams).pieza && (p as MorsaParams).apertura < 12)),
  camera: [20, 22, 26],
  target: [0, 7, 0],
  shadowY: 0,
  defaultParams: { apertura: 0, pieza: true },
  render: (p) => <MorsaModel {...(p as MorsaParams)} />,
  Controls: ({ params, set }) => (
    <>
      <Slider label="Apertura" value={params.apertura} min={0} max={100} step={1} onChange={(apertura) => set({ apertura })} format={(x) => `${Math.round(24 + x * 0.8 - 2.5)} mm`} />
      <Toggle label="Pieza sujeta" value={!!params.pieza} onChange={(pieza) => set({ pieza })} />
      <p className="hint">La pieza tiene que quedar firme y sobresalir poco de las mordazas, así no vibra al limar.</p>
    </>
  ),
  theory: (
    <>
      <p>
        La <b>morsa</b> (tornillo de banco) sujeta la pieza mientras se trabaja. Tiene una mordaza fija y una móvil que se acerca girando
        el tornillo con la palanca.
      </p>
      <p>
        Para limar bien, la morsa tiene que quedar a una altura cómoda: con el codo formando 90°, como dice la técnica del limado.
      </p>
    </>
  ),
  activities: [
    { id: 'a1-mo-1', type: 'mc', q: '¿Qué parte de la morsa se mueve al girar la palanca?', options: ['La mordaza móvil', 'La base', 'La mordaza fija', 'El banco'], answer: 0, explain: 'El tornillo la acerca o la aleja de la fija.' },
    { id: 'a1-mo-2', type: 'mc', q: '¿Cómo tiene que quedar la pieza en la morsa para limar?', options: ['Firme y sobresaliendo poco', 'Floja, para poder girarla', 'Sobresaliendo mucho', 'Apoyada sin apretar'], answer: 0, explain: 'Si sobresale mucho, vibra y la lima salta.' },
    { id: 'a1-mo-3', type: 'mc', q: '¿Se le puede poner un caño a la palanca para apretar más?', options: ['No: se puede romper la morsa', 'Sí, siempre', 'Sólo con piezas chicas', 'Sólo si la pieza es grande'], answer: 0, explain: 'Se aprieta con la mano; la morsa no está hecha para tanta fuerza.' },
  ],
}

export const AJUSTE1_CATALOG: ComponentDef[] = [lima, martillo, instrumentos, morsa]

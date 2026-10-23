import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Topic } from '../../data/theory'
import { Readout, Segmented } from '../../components/ui'
import { useSub } from '../../lib/nav'
import './c1.css'

/* ------------------------------------------------------------------ simuladores chicos */

const CYCLE_EXAMPLES = [
  { id: 'texto', label: 'Escribir un texto', e: 'Tecleás las palabras (teclado)', p: 'El procesador arma el documento', s: 'Aparece en el monitor', a: 'Se guarda en el disco como archivo' },
  { id: 'foto', label: 'Sacar una foto con el celular', e: 'La cámara capta la imagen', p: 'El procesador la comprime y mejora', s: 'Se ve en la pantalla', a: 'Queda en la memoria del celular' },
  { id: 'musica', label: 'Escuchar una canción', e: 'Tocás «play» en la pantalla táctil', p: 'El procesador decodifica el audio', s: 'Suena por los auriculares', a: 'La canción estaba guardada (o se descarga)' },
  { id: 'calc', label: 'Hacer una cuenta en la calculadora', e: 'Ingresás 25 × 4', p: 'El procesador multiplica', s: 'Muestra 100', a: 'Queda en el historial' },
]

function CycleDemo() {
  const [ex, setEx] = useState(CYCLE_EXAMPLES[0].id)
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % 4), 1400)
    return () => window.clearInterval(id)
  }, [])
  const e = CYCLE_EXAMPLES.find((x) => x.id === ex)!
  const stages = [
    { k: 'Entrada', icon: '⌨️', t: e.e },
    { k: 'Procesamiento', icon: '🧠', t: e.p },
    { k: 'Salida', icon: '🖥️', t: e.s },
    { k: 'Almacenamiento', icon: '💾', t: e.a },
  ]
  return (
    <div className="calc">
      <select className="input" value={ex} onChange={(x) => setEx(x.target.value)} aria-label="Ejemplo">
        {CYCLE_EXAMPLES.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}
          </option>
        ))}
      </select>
      <div className="c1-cycle">
        {stages.map((s, i) => (
          <div key={s.k} className={`c1-stage ${i === step ? 'on' : ''}`}>
            <span className="c1-stage-icon">{s.icon}</span>
            <strong>{s.k}</strong>
            <span>{s.t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const HW_ITEMS: { name: string; kind: 'hw' | 'so' | 'app' }[] = [
  { name: 'Teclado', kind: 'hw' },
  { name: 'Windows', kind: 'so' },
  { name: 'Navegador Chrome', kind: 'app' },
  { name: 'Memoria RAM', kind: 'hw' },
  { name: 'Android', kind: 'so' },
  { name: 'Procesador de texto', kind: 'app' },
  { name: 'Placa de video', kind: 'hw' },
  { name: 'Linux', kind: 'so' },
  { name: 'Un juego', kind: 'app' },
  { name: 'Monitor', kind: 'hw' },
]

function HwSwSorter() {
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const ok = HW_ITEMS.filter((m) => picked[m.name] === m.kind).length
  return (
    <div className="calc">
      <p className="hint">¿Es hardware, sistema operativo o una aplicación?</p>
      <div className="c1-sorter">
        {HW_ITEMS.map((m) => (
          <div key={m.name} className={`c1-sort-row ${checked ? (picked[m.name] === m.kind ? 'ok' : 'bad') : ''}`}>
            <strong>{m.name}</strong>
            <Segmented<string>
              value={picked[m.name] ?? ''}
              onChange={(v) => {
                setPicked({ ...picked, [m.name]: v })
                setChecked(false)
              }}
              options={[
                { value: 'hw', label: 'Hardware' },
                { value: 'so', label: 'Sist. operativo' },
                { value: 'app', label: 'Aplicación' },
              ]}
            />
          </div>
        ))}
      </div>
      <div className="row">
        <button type="button" className="btn primary small" disabled={Object.keys(picked).length < HW_ITEMS.length} onClick={() => setChecked(true)}>
          Comprobar
        </button>
        {checked && <span className={`feedback ${ok === HW_ITEMS.length ? 'ok' : 'bad'}`}>{ok === HW_ITEMS.length ? '✔ ¡Todos bien!' : `${ok} de ${HW_ITEMS.length} bien.`}</span>}
      </div>
    </div>
  )
}

function BinaryDemo() {
  const [bits, setBits] = useState([0, 1, 0, 0, 0, 0, 0, 1])
  const value = bits.reduce((a, b) => a * 2 + b, 0)
  const ch = value >= 32 && value < 127 ? String.fromCharCode(value) : '—'
  return (
    <div className="calc">
      <p className="hint">Tocá cada bit para prenderlo (1) o apagarlo (0). Ocho bits forman un byte.</p>
      <div className="c1-bits">
        {bits.map((b, i) => (
          <button
            key={i}
            type="button"
            className={`c1-bit ${b ? 'on' : ''}`}
            aria-pressed={!!b}
            aria-label={`Bit que vale ${2 ** (7 - i)}`}
            onClick={() => setBits(bits.map((x, k) => (k === i ? 1 - x : x)))}
          >
            <span className="c1-bit-v">{b}</span>
            <small>{2 ** (7 - i)}</small>
          </button>
        ))}
      </div>
      <Readout label="Valor en decimal" value={value} />
      <Readout label="Cuenta" value={bits.map((b, i) => (b ? 2 ** (7 - i) : 0)).filter(Boolean).join(' + ') || '0'} />
      <Readout label="Como letra (código ASCII)" value={ch} />
      <div className="row">
        <button type="button" className="btn small" onClick={() => setBits([0, 0, 0, 0, 0, 0, 0, 0])}>
          Todo en 0
        </button>
        <button type="button" className="btn small" onClick={() => setBits([1, 1, 1, 1, 1, 1, 1, 1])}>
          Todo en 1 (255)
        </button>
        <button type="button" className="btn small" onClick={() => setBits([0, 1, 0, 1, 0, 1, 1, 0])}>
          La letra V
        </button>
      </div>
    </div>
  )
}

const WEB_STEPS = [
  { at: 0, t: 'Escribís la dirección (URL) en el navegador: www.villada.edu.ar' },
  { at: 1, t: 'El navegador arma una solicitud y la manda por tu red (Wi-Fi o cable) hasta el router.' },
  { at: 2, t: 'La solicitud viaja por internet: routers, fibra óptica y hasta cables submarinos.' },
  { at: 3, t: 'Llega al servidor del sitio web, que busca la página pedida.' },
  { at: 2, t: 'El servidor responde enviando los datos de la página de vuelta por internet.' },
  { at: 0, t: 'Tu navegador recibe los datos y los muestra como una página web.' },
]

function WebTrip() {
  const [i, setI] = useState(0)
  const nodes = [
    { icon: '💻', label: 'Tu compu' },
    { icon: '📶', label: 'Router' },
    { icon: '🌐', label: 'Internet' },
    { icon: '🗄️', label: 'Servidor' },
  ]
  const s = WEB_STEPS[i]
  const back = i >= 4
  return (
    <div className="calc">
      <div className="c1-trip">
        {nodes.map((n, k) => (
          <div key={k} className={`c1-node ${s.at === k ? 'on' : ''}`}>
            <span>{n.icon}</span>
            <small>{n.label}</small>
          </div>
        ))}
        <span className={`c1-packet ${back ? 'back' : ''}`} style={{ left: `${(s.at / 3) * 82 + 6}%` }} aria-hidden>
          {back ? '📄' : '✉️'}
        </span>
      </div>
      <p>
        <b>Paso {i + 1} de {WEB_STEPS.length}.</b> {s.t}
      </p>
      <div className="row">
        <button type="button" className="btn small" disabled={i === 0} onClick={() => setI(i - 1)}>
          ← Anterior
        </button>
        <button type="button" className="btn small primary" onClick={() => setI((i + 1) % WEB_STEPS.length)}>
          {i === WEB_STEPS.length - 1 ? 'Volver a empezar' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}

const STEPS = ['Abrir la canilla', 'Mojarse las manos', 'Ponerse jabón', 'Frotar las manos 20 segundos', 'Enjuagarse', 'Cerrar la canilla', 'Secarse con la toalla']

function AlgorithmOrder() {
  const [order, setOrder] = useState<number[]>(() => [3, 0, 6, 1, 5, 2, 4])
  const [checked, setChecked] = useState(false)
  const ok = order.every((v, i) => v === i)
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= order.length) return
    const o = [...order]
    ;[o[i], o[j]] = [o[j], o[i]]
    setOrder(o)
    setChecked(false)
  }
  return (
    <div className="calc">
      <p className="hint">Un algoritmo para lavarse las manos. Ordená los pasos con las flechas.</p>
      <ol className="c1-algo">
        {order.map((v, i) => (
          <li key={v} className={checked ? (v === i ? 'ok' : 'bad') : ''}>
            <span>{STEPS[v]}</span>
            <span className="row">
              <button type="button" className="btn small ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">
                ▲
              </button>
              <button type="button" className="btn small ghost" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="Bajar">
                ▼
              </button>
            </span>
          </li>
        ))}
      </ol>
      <div className="row">
        <button type="button" className="btn primary small" onClick={() => setChecked(true)}>
          Comprobar
        </button>
        {checked && <span className={`feedback ${ok ? 'ok' : 'bad'}`}>{ok ? '✔ ¡Algoritmo correcto!' : 'Hay pasos fuera de lugar (en rojo).'}</span>}
      </div>
    </div>
  )
}

function ToBlocks() {
  const sub = useSub()
  return (
    <p>
      <Link to={sub('/bloques')} className="btn primary">
        🧩 Practicar con bloques
      </Link>
    </p>
  )
}

/* ------------------------------------------------------------------ temas */

export const COMPU1_TOPICS: Topic[] = [
  {
    id: 'c1-computadora',
    title: 'La computadora',
    icon: '💻',
    summary: 'Una máquina que procesa datos: entrada, procesamiento, salida y almacenamiento.',
    content: (
      <>
        <p>
          Una <b>computadora</b> es una máquina capaz de procesar datos de manera automática mediante una serie de instrucciones. Funciona
          con un ciclo básico: <b>entrada, procesamiento, salida y almacenamiento</b>. Nos ayuda a hacer tareas más rápido y mejor.
        </p>
        <p>Todo lo que vemos para la computadora vale también para celulares, smart TV, tablets y otros dispositivos.</p>
        <CycleDemo />
      </>
    ),
    activities: [
      { id: 'c1-t1-1', type: 'mc', q: '¿Cuál es el ciclo básico de una computadora?', options: ['Entrada, procesamiento, salida y almacenamiento', 'Encender, usar y apagar', 'Teclado, mouse y monitor', 'Bajar, instalar y abrir'], answer: 0, explain: 'Así trabaja cualquier computadora.' },
      { id: 'c1-t1-2', type: 'mc', q: 'Cuando la computadora muestra un resultado en la pantalla, es la etapa de…', options: ['Salida', 'Entrada', 'Almacenamiento', 'Procesamiento'], answer: 0, explain: 'La salida comunica el resultado al usuario.' },
      { id: 'c1-t1-3', type: 'mc', q: '¿Un celular es una computadora?', options: ['Sí: también tiene entrada, procesamiento, salida y almacenamiento', 'No, porque no tiene teclado', 'No, porque es chico', 'Sólo si tiene internet'], answer: 0, explain: 'Los conceptos valen para celulares, tablets y smart TV.' },
      { id: 'c1-t1-4', type: 'mc', q: 'Guardar un trabajo en el disco corresponde a…', options: ['Almacenamiento', 'Salida', 'Entrada', 'Procesamiento'], answer: 0, explain: 'Queda guardado para usarlo después.' },
    ],
  },
  {
    id: 'c1-partes',
    title: 'Partes del ordenador',
    icon: '🧩',
    summary: 'CPU, RAM y disco: los tres fundamentales. Además, placa base, GPU y periféricos.',
    content: (
      <>
        <p>Hay tres componentes sumamente importantes:</p>
        <ul>
          <li>
            <b>Unidad central de procesamiento (CPU)</b>: el cerebro. Recibe instrucciones y datos de la RAM, los procesa y envía los
            resultados a la memoria o a los dispositivos de salida.
          </li>
          <li>
            <b>Memoria RAM</b> (memoria de acceso aleatorio): guarda temporalmente los datos e instrucciones que la CPU necesita. Es rápida
            pero <b>volátil</b>: se borra al apagar. La CPU lee y escribe en ella todo el tiempo.
          </li>
          <li>
            <b>Disco</b>: el almacenamiento principal, permanente. El <b>HDD</b> usa discos magnéticos que giran; el <b>SSD</b> usa memorias
            flash y es menos sensible a los golpes.
          </li>
        </ul>
        <p>Además:</p>
        <ul>
          <li>
            <b>Periféricos</b>: de entrada (teclado, mouse) y de salida (pantalla, impresora).
          </li>
          <li>
            <b>Placa base (motherboard)</b>: conecta a todos los componentes; tiene ranuras para la CPU, la RAM, el disco y la placa de video.
          </li>
          <li>
            <b>Placa de video (GPU)</b>: procesa y genera las imágenes del monitor, con su propio procesador y memoria.
          </li>
        </ul>
        <p>Estos componentes intercambian datos y señales eléctricas a través de la placa base. Miralos en el modelo 3D del gabinete.</p>
      </>
    ),
    activities: [
      { id: 'c1-t2-1', type: 'mc', q: '¿Cuáles son los tres componentes fundamentales?', options: ['CPU, RAM y disco', 'Teclado, mouse y monitor', 'Gabinete, fuente y ventilador', 'GPU, parlantes e impresora'], answer: 0, explain: 'Procesar, memoria de trabajo y almacenamiento.' },
      { id: 'c1-t2-2', type: 'mc', q: '¿Qué significa que la RAM es volátil?', options: ['Que se borra al apagar la computadora', 'Que es muy liviana', 'Que se rompe fácil', 'Que guarda todo para siempre'], answer: 0, explain: 'Sus datos son temporales.' },
      { id: 'c1-t2-3', type: 'mc', q: '¿Qué diferencia a un SSD de un HDD?', options: ['El SSD usa memorias flash y no tiene partes que giran', 'El SSD es más lento', 'El HDD no guarda datos', 'Son exactamente iguales'], answer: 0, explain: 'Por eso el SSD es menos sensible a los golpes.' },
      { id: 'c1-t2-4', type: 'mc', q: '¿De dónde toma la CPU las instrucciones y los datos que procesa?', options: ['De la memoria RAM', 'Del monitor', 'De la fuente', 'Del mouse'], answer: 0, explain: 'La CPU lee y escribe en la RAM constantemente.' },
    ],
  },
  {
    id: 'c1-hw-sw',
    title: 'Hardware y software',
    icon: '🧠',
    summary: 'Lo que se toca y lo que le dice a la computadora qué hacer: sistema operativo y aplicaciones.',
    content: (
      <>
        <p>
          <b>Hardware</b>: todas las partes físicas y tangibles de la computadora (las que se pueden tocar).
        </p>
        <p>
          <b>Software</b>: los programas y datos que le indican a la computadora qué hacer. Dos tipos principales:
        </p>
        <ul>
          <li>
            <b>Sistema operativo (SO)</b>: el software fundamental. Controla el hardware, administra la memoria, gestiona archivos y
            dispositivos y da la interfaz para usar la compu. Ejemplos: Windows, Linux, Android.
          </li>
          <li>
            <b>Aplicaciones y programas</b>: hacen tareas específicas: procesadores de texto, navegadores, editores de imágenes, juegos.
          </li>
        </ul>
        <p>
          Son complementarios: sin hardware el software no puede funcionar, y sin software el hardware no puede hacer tareas útiles.
        </p>
        <HwSwSorter />
      </>
    ),
    activities: [
      { id: 'c1-t3-1', type: 'mc', q: 'El mouse es…', options: ['Hardware', 'Software', 'Un sistema operativo', 'Una aplicación'], answer: 0, explain: 'Es una parte física.' },
      { id: 'c1-t3-2', type: 'mc', q: '¿Cuál es un sistema operativo?', options: ['Linux', 'Chrome', 'Un juego', 'La RAM'], answer: 0, explain: 'Linux, Windows y Android son sistemas operativos.' },
      { id: 'c1-t3-3', type: 'mc', q: '¿Qué hace el sistema operativo?', options: ['Controla el hardware y administra memoria, archivos y dispositivos', 'Sólo muestra fotos', 'Enfría el procesador', 'Es una parte física'], answer: 0, explain: 'Es el software fundamental.' },
      { id: 'c1-t3-4', type: 'mc', q: 'Un navegador web es…', options: ['Una aplicación', 'Hardware', 'Un sistema operativo', 'Un periférico'], answer: 0, explain: 'Es un programa para una tarea específica: navegar.' },
    ],
  },
  {
    id: 'c1-binario',
    title: 'Bits, bytes y el sistema binario',
    icon: '🔢',
    summary: 'Todo se guarda como señales eléctricas de dos estados: 1 y 0.',
    content: (
      <>
        <p>
          En una computadora la información se representa con <b>señales eléctricas</b> de dos estados: encendido (tensión alta) o apagado
          (tensión baja). Se corresponden con los dígitos binarios <b>1</b> y <b>0</b>. El sistema binario es un sistema de numeración en
          base 2: usa sólo esos dos dígitos.
        </p>
        <ul>
          <li>
            <b>Bit</b>: la unidad más pequeña de información (un 1 o un 0).
          </li>
          <li>
            <b>Byte</b>: 8 bits. Es la cantidad básica con la que trabajan las computadoras: una letra de un texto ocupa un byte.
          </li>
        </ul>
        <p>Cada bit vale el doble que el de su derecha: 1, 2, 4, 8, 16, 32, 64, 128. Sumando los que están en 1 se obtiene el número.</p>
        <BinaryDemo />
      </>
    ),
    activities: [
      { id: 'c1-t4-1', type: 'num', q: '¿Cuántos bits tiene un byte?', answer: 8, tolerance: 0, unit: 'bits', explain: '1 byte = 8 bits.' },
      { id: 'c1-t4-2', type: 'num', q: '¿Qué número decimal es el binario 00000101?', answer: 5, tolerance: 0, unit: '', explain: '4 + 1 = 5.' },
      { id: 'c1-t4-3', type: 'num', q: '¿Qué número decimal es el binario 00001010?', answer: 10, tolerance: 0, unit: '', explain: '8 + 2 = 10.' },
      { id: 'c1-t4-4', type: 'num', q: '¿Cuál es el número más grande que entra en un byte?', answer: 255, tolerance: 0, unit: '', explain: '11111111 = 128+64+32+16+8+4+2+1 = 255.' },
      { id: 'c1-t4-5', type: 'mc', q: '¿Qué es un bit?', options: ['La unidad más pequeña de información: un 1 o un 0', 'Una letra', '8 bytes', 'Un programa'], answer: 0, explain: 'Bit = binary digit (dígito binario).' },
      { id: 'c1-t4-6', type: 'num', q: '¿Qué número decimal es 10000000?', answer: 128, tolerance: 0, unit: '', explain: 'Sólo está prendido el bit que vale 128.' },
    ],
  },
  {
    id: 'c1-dato',
    title: 'Dato e información',
    icon: '📊',
    summary: 'El dato es la materia prima; la información es el dato procesado con significado.',
    content: (
      <>
        <ul>
          <li>
            <b>Dato</b>: una representación simbólica de una característica de un objeto, evento o fenómeno. Por ejemplo: un número, una
            letra, una imagen.
          </li>
          <li>
            <b>Información</b>: el resultado de procesar datos; tiene significado y es útil para quien la recibe. Por ejemplo: un texto
            escrito, una imagen editada, un video montado.
          </li>
        </ul>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Datos</th>
                <th>Información</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>7, 8, 6, 9</td>
                <td>«Tu promedio en el trimestre es 7,5: aprobaste»</td>
              </tr>
              <tr>
                <td>22 °C, 65 %, 1013 hPa</td>
                <td>«Mañana en Córdoba: templado y sin lluvias»</td>
              </tr>
              <tr>
                <td>Millones de píxeles</td>
                <td>La foto del curso, recortada y con brillo ajustado</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
    activities: [
      { id: 'c1-t5-1', type: 'mc', q: 'La lista de notas 7, 8, 6 y 9 sin explicación es…', options: ['Datos', 'Información', 'Software', 'Hardware'], answer: 0, explain: 'Son símbolos sueltos: todavía no se procesaron.' },
      { id: 'c1-t5-2', type: 'mc', q: '«Tu promedio es 7,5: aprobaste» es…', options: ['Información', 'Un dato suelto', 'Un periférico', 'Un bit'], answer: 0, explain: 'Es el resultado de procesar los datos y tiene significado.' },
      { id: 'c1-t5-3', type: 'mc', q: '¿Qué convierte los datos en información?', options: ['El procesamiento', 'El monitor', 'La fuente', 'El gabinete'], answer: 0, explain: 'Procesar es lo que hace la computadora.' },
    ],
  },
  {
    id: 'c1-redes',
    title: 'Redes e internet',
    icon: '🌐',
    summary: 'Redes locales y extensas, protocolos, y la red de redes.',
    content: (
      <>
        <p>
          Una <b>red</b> de computadoras es un conjunto de dispositivos conectados que se comunican para compartir recursos y datos. Puede
          ser <b>local</b> (una casa, una oficina, el taller) o de <b>área extensa</b> (ciudades o países). La conexión puede ser{' '}
          <b>cableada</b>, <b>inalámbrica</b> (Wi-Fi) o una mezcla.
        </p>
        <p>
          Para entenderse usan <b>protocolos</b>: «acuerdos» establecidos a nivel mundial a lo largo de la historia para mantener una norma
          común.
        </p>
        <p>
          <b>Internet</b> es una red global de redes interconectadas: millones de dispositivos de todo el mundo. Funciona sobre una
          infraestructura física de fibra óptica, cables submarinos, routers y servidores, por donde viajan los datos hasta su destino.
        </p>
        <h4>¿Qué pasa cuando abrís una página web?</h4>
        <WebTrip />
      </>
    ),
    activities: [
      { id: 'c1-t6-1', type: 'mc', q: 'La red de las computadoras del taller es una red…', options: ['Local', 'De área extensa', 'Submarina', 'Mundial'], answer: 0, explain: 'Cubre un área geográfica limitada.' },
      { id: 'c1-t6-2', type: 'mc', q: '¿Qué son los protocolos?', options: ['Acuerdos comunes para que los dispositivos se comuniquen', 'Cables de fibra óptica', 'Virus informáticos', 'Tipos de monitores'], answer: 0, explain: 'Normas compartidas a nivel mundial.' },
      { id: 'c1-t6-3', type: 'mc', q: 'Internet es…', options: ['Una red de redes', 'Un programa', 'Una computadora muy grande', 'Un navegador'], answer: 0, explain: 'Muchas redes interconectadas en todo el mundo.' },
      { id: 'c1-t6-4', type: 'mc', q: '¿Por dónde viajan los datos de internet entre continentes?', options: ['Por cables submarinos de fibra óptica', 'Por el aire siempre', 'Por las cañerías', 'No viajan'], answer: 0, explain: 'Gran parte del tráfico mundial va por cables bajo el mar.' },
      { id: 'c1-t6-5', type: 'mc', q: '¿Qué hace el servidor cuando le pedís una página?', options: ['Responde enviando los datos de la página', 'Apaga tu computadora', 'Guarda tu contraseña en la RAM', 'Nada'], answer: 0, explain: 'Después el navegador los muestra como página web.' },
    ],
  },
  {
    id: 'c1-pensamiento',
    title: 'Pensamiento computacional',
    icon: '🧩',
    summary: 'Algoritmo, instrucciones, condicionales, repeticiones, variables y procedimientos.',
    content: (
      <>
        <ul>
          <li>
            <b>Algoritmo</b>: un conjunto de instrucciones paso a paso para resolver un problema o hacer una tarea. Como una receta: dice
            exactamente qué hacer en cada paso.
          </li>
          <li>
            <b>Instrucciones</b>: acciones específicas que se hacen en un orden determinado. Son la base de la ejecución de un algoritmo.
          </li>
          <li>
            <b>Condicional</b>: permite tomar decisiones según una <b>condición</b> (la «pregunta» que es verdadera o falsa).
            <ul>
              <li>
                <b>Simple</b> (si…): si se cumple la condición se ejecuta el bloque; si no, se sigue de largo.
              </li>
              <li>
                <b>Complejo</b> (si… si no…): un bloque si se cumple y otro si no se cumple.
              </li>
            </ul>
          </li>
          <li>
            <b>Repetición</b> (bucle): ejecuta un bloque varias veces sin escribirlo de nuevo.
            <ul>
              <li>
                <b>Simple</b>: se indica con un número cuántas veces.
              </li>
              <li>
                <b>Condicional</b>: se repite mientras (o hasta que) se cumpla una condición. Cuidado: si la condición de corte nunca se
                cumple, el bucle queda atrapado en un <b>loop infinito</b>.
              </li>
            </ul>
          </li>
          <li>
            <b>Variable</b>: un contenedor que guarda un valor que puede cambiar a lo largo del programa.
          </li>
          <li>
            <b>Procedimiento</b> (o subrutina): una parte del programa con nombre que hace una tarea específica y se puede usar desde
            cualquier lugar. Divide el programa en partes más chicas, facilita escribirlo, leerlo y mantenerlo, y permite reutilizar código.
          </li>
        </ul>
        <AlgorithmOrder />
        <ToBlocks />
      </>
    ),
    activities: [
      { id: 'c1-t7-1', type: 'mc', q: 'Una receta de cocina paso a paso es un ejemplo de…', options: ['Algoritmo', 'Variable', 'Hardware', 'Bucle infinito'], answer: 0, explain: 'Pasos definidos que llevan a un resultado.' },
      { id: 'c1-t7-2', type: 'mc', q: '«Si llueve, llevo paraguas; si no, llevo gorra» es un condicional…', options: ['Complejo (si / si no)', 'Simple', 'Una repetición', 'Una variable'], answer: 0, explain: 'Tiene un camino para cada caso.' },
      { id: 'c1-t7-3', type: 'mc', q: '¿Qué pasa si la condición de corte de un «repetir hasta» nunca se cumple?', options: ['Se produce un loop infinito', 'El programa termina antes', 'Se repite una sola vez', 'Se borra el programa'], answer: 0, explain: 'Por eso hay que fijar bien la condición de corte.' },
      { id: 'c1-t7-4', type: 'mc', q: 'Un contenedor con nombre que guarda un valor que puede cambiar es…', options: ['Una variable', 'Un procedimiento', 'Un condicional', 'Un algoritmo'], answer: 0, explain: 'Por ejemplo, la cantidad de tornillos juntados.' },
      { id: 'c1-t7-5', type: 'mc', q: '¿Para qué sirve un procedimiento?', options: ['Para definir una tarea una vez y reutilizarla', 'Para apagar la computadora', 'Para guardar un número', 'Para repetir infinitamente'], answer: 0, explain: 'Divide el programa en partes manejables y evita repetir código.' },
      { id: 'c1-t7-6', type: 'mc', q: '«Repetir 5 veces» es una repetición…', options: ['Simple', 'Condicional', 'Infinita', 'Compleja'], answer: 0, explain: 'Se indica con un número cuántas veces.' },
    ],
  },
]

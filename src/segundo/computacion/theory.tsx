import { useMemo, useState } from 'react'
import type { Topic } from '../../data/theory'
import { Field, Formula, Readout, Segmented, Slider } from '../../components/ui'
import { shuffle } from '../../games/QuizGame'
import { SubLink } from '../../lib/nav'
import './c2.css'

/* ------------------------------------------------------------------ simuladores */

const GENERACIONES = [
  { n: '1ª', fecha: 'Década de 1940', icon: '💡', tec: 'Válvulas y cables (ENIAC)', prog: 'Se programaba con interruptores y cables físicos: hacía falta mucho conocimiento técnico.' },
  { n: '2ª', fecha: 'Década de 1950', icon: '🔌', tec: 'Transistor', prog: 'Computadoras más chicas, eficientes y baratas. Aparecen lenguajes más cercanos al lenguaje humano.' },
  { n: '3ª', fecha: 'Década de 1960', icon: '🧩', tec: 'Microprocesador (circuitos integrados)', prog: 'Se consolidan los lenguajes de alto nivel; llegan las computadoras personales.' },
  { n: '4ª', fecha: '1970 – 1980', icon: '🧱', tec: 'Computadoras personales', prog: 'Programación orientada a objetos: software modular y reutilizable.' },
  { n: '5ª', fecha: '1990 en adelante', icon: '🌐', tec: 'Internet y la web', prog: 'Inteligencia artificial, programación web y aplicaciones en línea.' },
  { n: 'Hoy', fecha: 'Siglo XXI', icon: '☁️', tec: 'La nube, aprendizaje automático, realidad virtual', prog: 'Muchos lenguajes especializados para cada propósito.' },
]

function Historia() {
  const [k, setK] = useState(0)
  const g = GENERACIONES[k]
  return (
    <div className="calc">
      <div className="c2-timeline" role="tablist">
        {GENERACIONES.map((x, i) => (
          <button key={x.n} type="button" role="tab" aria-selected={i === k} className={`c2-gen ${i === k ? 'on' : ''}`} onClick={() => setK(i)}>
            <span className="c2-gen-icon">{x.icon}</span>
            <span>{x.n}</span>
          </button>
        ))}
      </div>
      <div className="c2-gen-card">
        <strong>
          {g.n} generación · {g.fecha}
        </strong>
        <Readout label="Tecnología" value={g.tec} />
        <p>{g.prog}</p>
      </div>
    </div>
  )
}

function TipoRed() {
  const [km, setKm] = useState(0.1)
  const tipo = km <= 1 ? 'LAN' : km <= 50 ? 'MAN' : 'WAN'
  const ej = km <= 1 ? 'el laboratorio de computación, la escuela, una oficina' : km <= 50 ? 'las sedes de una empresa en una misma ciudad, la red de una municipalidad' : 'redes entre países… ¡Internet es la WAN más grande!'
  return (
    <div className="calc">
      <Slider label="Distancia que cubre la red" value={km} min={0.01} max={5000} step={0.01} onChange={setKm} format={(x) => (x < 1 ? `${Math.round(x * 1000)} m` : `${Math.round(x)} km`)} />
      <div className="c2-net-scale">
        {(['LAN', 'MAN', 'WAN'] as const).map((t) => (
          <span key={t} className={t === tipo ? 'on' : ''}>
            {t}
          </span>
        ))}
      </div>
      <Readout label="Tipo de red" value={tipo === 'LAN' ? 'LAN · área local' : tipo === 'MAN' ? 'MAN · área metropolitana' : 'WAN · área amplia'} />
      <p className="hint">Por ejemplo: {ej}.</p>
      <p className="hint">Los límites en km son orientativos: lo importante es la escala (un edificio, una ciudad, el mundo).</p>
    </div>
  )
}

const CAFE = [
  'Poner una taza de agua en el recipiente sobre la hornalla.',
  'Calentar el agua hasta justo antes de hervir.',
  'Vaciar el agua caliente en una taza.',
  'Agregar las cucharadas de café que desee.',
  'Agregar las cucharadas de azúcar que desee.',
  'Revolver hasta que los ingredientes se mezclen.',
]

function Cafe() {
  const mezcla = useMemo(() => shuffle(CAFE.map((t, k) => ({ t, k }))), [])
  const [orden, setOrden] = useState<number[]>([])
  const [mal, setMal] = useState<number | null>(null)
  return (
    <div className="calc">
      <p className="hint">Ordená el algoritmo para preparar café instantáneo: tocá los pasos en orden.</p>
      <div className="c2-steps">
        {mezcla.map(({ t, k }) => {
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
              {pos >= 0 ? `${pos + 1}) ` : ''}
              {t}
            </button>
          )
        })}
      </div>
      {mal !== null && <p className="hint">✘ Ese paso no va todavía.</p>}
      {orden.length === CAFE.length && <p className="hint">✔ ¡Algoritmo correcto! Pasos simples, en un orden preciso y en un número finito de pasos.</p>}
      {orden.length > 0 && (
        <button type="button" className="btn small" onClick={() => setOrden([])}>
          Empezar de nuevo
        </button>
      )}
    </div>
  )
}

const PALETA = ['#0b1018', '#ffffff', '#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#a855f7']

function PixelArt() {
  const [n, setN] = useState(8)
  const [bits, setBits] = useState(24)
  const [color, setColor] = useState(4)
  const [cells, setCells] = useState<number[]>(() => Array(16 * 16).fill(0))
  const [drag, setDrag] = useState(false)
  const paint = (i: number) => setCells((c) => (c[i] === color ? c : c.map((x, k) => (k === i ? color : x))))
  const bytes = (n * n * bits) / 8
  return (
    <div className="calc">
      <Field label="Resolución">
        <Segmented<number>
          value={n}
          onChange={setN}
          options={[
            { value: 8, label: '8 × 8' },
            { value: 16, label: '16 × 16' },
          ]}
        />
      </Field>
      <div className="c2-palette" role="radiogroup" aria-label="Color">
        {PALETA.map((c, k) => (
          <button key={c} type="button" role="radio" aria-checked={k === color} aria-label={`Color ${k + 1}`} className={k === color ? 'on' : ''} style={{ background: c }} onClick={() => setColor(k)} />
        ))}
      </div>
      <div
        className="c2-pixels"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
        onPointerDown={() => setDrag(true)}
        onPointerUp={() => setDrag(false)}
        onPointerLeave={() => setDrag(false)}
      >
        {Array.from({ length: n * n }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Píxel ${(i % n) + 1}, ${Math.floor(i / n) + 1}`}
            style={{ background: PALETA[cells[i]] }}
            onPointerDown={() => paint(i)}
            onPointerEnter={() => drag && paint(i)}
          />
        ))}
      </div>
      <button type="button" className="btn small" onClick={() => setCells(Array(16 * 16).fill(0))}>
        Borrar
      </button>
      <Field label="Profundidad de color">
        <Segmented<number>
          value={bits}
          onChange={setBits}
          options={[
            { value: 1, label: '1 bit (2 colores)' },
            { value: 8, label: '8 bits (256)' },
            { value: 24, label: '24 bits (16,7 M)' },
          ]}
        />
      </Field>
      <Formula>
        {n} × {n} píxeles × {bits} bits ÷ 8 = {bytes.toLocaleString('es-AR')} bytes
      </Formula>
      <Readout label="Una foto de 1920 × 1080 con 24 bits, sin comprimir" value={`${((1920 * 1080 * 3) / 1024 / 1024).toLocaleString('es-AR', { maximumFractionDigits: 1 })} MB`} />
    </div>
  )
}

const FORMATOS = {
  jpeg: { name: 'JPEG (.jpg)', comp: 0.1, txt: 'Comprime mucho (pierde un poco de calidad): ideal para fotos y para guardar muchas imágenes.' },
  png: { name: 'PNG (.png)', comp: 0.5, txt: 'Comprime sin perder calidad y admite fondos transparentes: ideal para logos, dibujos y capturas.' },
  bmp: { name: 'BMP (sin comprimir)', comp: 1, txt: 'Guarda cada píxel tal cual: el archivo es enorme.' },
} as const

function Tamano() {
  const [w, setW] = useState(1920)
  const [h, setH] = useState(1080)
  const [f, setF] = useState<keyof typeof FORMATOS>('jpeg')
  const raw = w * h * 3
  const size = raw * FORMATOS[f].comp
  const fmt = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toLocaleString('es-AR', { maximumFractionDigits: 1 })} MB` : `${Math.round(b / 1024).toLocaleString('es-AR')} KB`)
  return (
    <div className="calc">
      <Slider label="Ancho" value={w} min={100} max={4000} step={10} onChange={setW} format={(x) => `${x} px`} />
      <Slider label="Alto" value={h} min={100} max={3000} step={10} onChange={setH} format={(x) => `${x} px`} />
      <Field label="Formato">
        <Segmented<keyof typeof FORMATOS>
          value={f}
          onChange={setF}
          options={[
            { value: 'jpeg', label: 'JPEG' },
            { value: 'png', label: 'PNG' },
            { value: 'bmp', label: 'BMP' },
          ]}
        />
      </Field>
      <Readout label="Resolución" value={`${(w * h / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 })} megapíxeles`} />
      <Readout label="Sin comprimir (24 bits)" value={fmt(raw)} />
      <Readout label={`Aproximado en ${FORMATOS[f].name}`} value={fmt(size)} />
      <p className="hint">{FORMATOS[f].txt} Los tamaños comprimidos son aproximados: dependen de la imagen.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ temas */

export const COMPU2_TOPICS: Topic[] = [
  {
    id: 'c2-computacion',
    title: 'Computación y programación',
    icon: '💻',
    summary: 'Qué estudia la computación y en qué se diferencia de la programación.',
    content: (
      <>
        <p>
          La <b>computación</b> es la disciplina que estudia y desarrolla sistemas informáticos: <b>hardware y software</b> trabajando juntos para procesar
          información. Es la fuerza detrás de innumerables avances que cambiaron cómo vivimos y trabajamos.
        </p>
        <div className="c2-compare">
          <div>
            <h4>Computación</h4>
            <p>Abarca todo: arquitectura de computadoras, redes, sistemas operativos, algoritmos. Se ocupa de la teoría y el funcionamiento de los sistemas.</p>
          </div>
          <div>
            <h4>Programación</h4>
            <p>Se centra en desarrollar software: escribir código, conjuntos de instrucciones para que la computadora haga tareas específicas.</p>
          </div>
        </div>
        <p>En resumen: la computación es más amplia; la programación es la parte que materializa las soluciones con código.</p>
      </>
    ),
    activities: [
      { id: 'c2-t1-1', type: 'mc', q: '¿Qué abarca la computación?', options: ['Hardware, software, redes, sistemas operativos y algoritmos', 'Sólo escribir código', 'Sólo armar computadoras', 'Sólo internet'], answer: 0, explain: 'Es la disciplina más amplia.' },
      { id: 'c2-t1-2', type: 'mc', q: 'Escribir las instrucciones de una app en un lenguaje es…', options: ['Programación', 'Arquitectura de computadoras', 'Redes', 'Hardware'], answer: 0, explain: 'Es la parte práctica: el código.' },
    ],
  },
  {
    id: 'c2-historia',
    title: 'Evolución histórica',
    icon: '🕰️',
    summary: 'De las válvulas de la ENIAC a la nube: las generaciones de computadoras y cómo cambió la programación.',
    content: (
      <>
        <p>Cada avance de la tecnología cambió la forma de programar. Tocá cada generación:</p>
        <Historia />
        <p>
          La programación pasó de ser un esfuerzo altamente técnico (cables e interruptores) a una habilidad accesible para mucha más gente.
        </p>
      </>
    ),
    activities: [
      { id: 'c2-t2-1', type: 'mc', q: '¿Con qué funcionaban las primeras computadoras (como la ENIAC)?', options: ['Con válvulas y cables', 'Con transistores', 'Con microprocesadores', 'En la nube'], answer: 0, explain: 'Primera generación, década de 1940.' },
      { id: 'c2-t2-2', type: 'mc', q: '¿Qué invento marcó la segunda generación?', options: ['El transistor', 'Internet', 'La válvula', 'El mouse'], answer: 0, explain: 'Más chicas, eficientes y baratas.' },
      { id: 'c2-t2-3', type: 'mc', q: '¿En qué generación aparece la programación orientada a objetos?', options: ['Cuarta (1970-1980)', 'Primera', 'Segunda', 'Actualidad'], answer: 0, explain: 'Software modular y reutilizable.' },
      { id: 'c2-t2-4', type: 'mc', q: '¿Cómo se programaba en la primera generación?', options: ['Con interruptores y cables físicos', 'Con bloques', 'En pseudocódigo', 'Con el mouse'], answer: 0, explain: 'Requería mucho conocimiento técnico.' },
    ],
  },
  {
    id: 'c2-von-neumann',
    title: 'El modelo de Von Neumann',
    icon: '🧠',
    summary: 'Las cinco partes de una computadora y la idea de guardar programas y datos en la misma memoria.',
    content: (
      <>
        <p>
          El matemático húngaro <b>John Von Neumann</b> definió la arquitectura de un sistema de cómputo moderno: los <b>datos y los programas se almacenan en
          la misma memoria</b>, a diferencia de los modelos anteriores.
        </p>
        <ul>
          <li>
            <b>Unidad de control</b>: controla todas las operaciones del sistema.
          </li>
          <li>
            <b>Unidad de memoria</b>: guarda los programas y los datos.
          </li>
          <li>
            <b>Unidad aritmético-lógica</b>: hace las operaciones lógicas y aritméticas.
          </li>
          <li>
            <b>Dispositivos de entrada</b>: introducen datos y programas en la memoria.
          </li>
          <li>
            <b>Dispositivos de salida</b>: muestran los resultados.
          </li>
        </ul>
        <p>
          <SubLink to="/componentes/von-neumann">Mirá un programa ejecutándose paso a paso en 3D</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 'c2-t3-1', type: 'mc', q: '¿Dónde se guardan los programas en el modelo de Von Neumann?', options: ['En la misma memoria que los datos', 'En cables', 'En la ALU', 'En el monitor'], answer: 0, explain: 'Esa es su idea central.' },
      { id: 'c2-t3-2', type: 'mc', q: 'El teclado es un…', options: ['Dispositivo de entrada', 'Dispositivo de salida', 'Unidad de control', 'Unidad de memoria'], answer: 0, explain: 'Introduce datos.' },
      { id: 'c2-t3-3', type: 'num', q: '¿Cuántas partes básicas tiene el modelo?', answer: 5, tolerance: 0, unit: '', explain: 'Control, memoria, ALU, entrada y salida.' },
    ],
  },
  {
    id: 'c2-redes',
    title: 'Redes de computadoras',
    icon: '🌐',
    summary: 'Equipos autónomos interconectados que intercambian información. LAN, MAN y WAN.',
    content: (
      <>
        <p>
          En el siglo XX convergieron la radio, la televisión, la telefonía, las computadoras y los satélites. El viejo modelo de <b>una sola computadora</b>{' '}
          que hace todo fue reemplazado por <b>muchas computadoras autónomas conectadas</b>: las <b>redes de ordenadores</b>.
        </p>
        <p>
          <b>Interconectadas</b> significa que pueden intercambiar información, por cable de cobre, fibra óptica, microondas o satélite. <b>Autónomas</b>{' '}
          significa que ninguna controla, enciende o apaga a otra (no hay relación maestro/esclavo). Un <b>sistema distribuido</b> es una red donde el usuario
          ni nota que hay varios equipos.
        </p>
        <h4>Tipos de redes según su tamaño</h4>
        <ul>
          <li>
            <b>LAN</b> (red de área local): un edificio, un campus o una empresa. Suele usar Ethernet.
          </li>
          <li>
            <b>MAN</b> (red de área metropolitana): una ciudad.
          </li>
          <li>
            <b>WAN</b> (red de área amplia): grandes distancias. <b>Internet</b> es una WAN global.
          </li>
        </ul>
        <TipoRed />
      </>
    ),
    activities: [
      { id: 'c2-t4-1', type: 'mc', q: 'La red del laboratorio de computación de la escuela es una…', options: ['LAN', 'MAN', 'WAN', 'No es una red'], answer: 0, explain: 'Área local.' },
      { id: 'c2-t4-2', type: 'mc', q: 'Internet es un ejemplo de…', options: ['WAN', 'LAN', 'MAN', 'Sistema sin enlaces'], answer: 0, explain: 'La WAN más grande.' },
      { id: 'c2-t4-3', type: 'mc', q: '¿Qué significa que las computadoras de una red sean autónomas?', options: ['Ninguna puede encender, apagar o controlar a otra', 'Que no tienen cables', 'Que tienen batería', 'Que son iguales'], answer: 0, explain: 'No hay relación maestro/esclavo.' },
      { id: 'c2-t4-4', type: 'mc', q: '¿Qué es un sistema distribuido?', options: ['Una red donde el usuario no nota que hay varios equipos', 'Una sola computadora', 'Una impresora compartida', 'Un cable largo'], answer: 0, explain: 'La división en equipos es invisible.' },
    ],
  },
  {
    id: 'c2-componentes-red',
    title: 'Componentes y ventajas de una red',
    icon: '🔗',
    summary: 'Nodos, enlaces y protocolos. Compartir recursos, comunicarse, acceso remoto, administración y escalabilidad.',
    content: (
      <>
        <ul>
          <li>
            <b>Nodos</b>: computadoras, servidores, impresoras, escáneres… Cada uno tiene una <b>dirección IP</b> única. Pueden ser <b>clientes</b> (piden
            servicios) o <b>servidores</b> (los dan).
          </li>
          <li>
            <b>Enlaces</b>: conexiones físicas o inalámbricas (cobre, fibra óptica, Wi-Fi). Las <b>topologías</b> describen cómo se conectan: estrella, bus,
            anillo…
          </li>
          <li>
            <b>Protocolos</b>: reglas para comunicarse (transmisión, detección de errores, direcciones). Por ejemplo, <b>IP</b> para transmitir datos en
            Internet y <b>TCP</b> para que lleguen completos.
          </li>
        </ul>
        <h4>Ventajas</h4>
        <ul>
          <li>
            <b>Compartir recursos</b>: impresoras, archivos, aplicaciones (menos costos).
          </li>
          <li>
            <b>Comunicación eficiente</b>: correo, mensajes, videoconferencias.
          </li>
          <li>
            <b>Acceso remoto</b> a archivos y aplicaciones desde otros lugares.
          </li>
          <li>
            <b>Administración centralizada</b>.
          </li>
          <li>
            <b>Escalabilidad</b>: se pueden agregar nodos y enlaces.
          </li>
        </ul>
        <p>
          <SubLink to="/componentes/red">Armá una red en 3D y mandá paquetes</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 'c2-t5-1', type: 'mc', q: '¿Qué es un servidor?', options: ['Un nodo que proporciona servicios', 'Un nodo que pide servicios', 'Un cable', 'Un protocolo'], answer: 0, explain: 'El que pide es el cliente.' },
      { id: 'c2-t5-2', type: 'mc', q: '¿Qué protocolo se ocupa de que los datos lleguen completos?', options: ['TCP', 'Wi-Fi', 'LAN', 'PNG'], answer: 0, explain: 'IP los transmite; TCP garantiza la entrega.' },
      { id: 'c2-t5-3', type: 'mc', q: 'Que se puedan agregar más computadoras a la red cuando hace falta se llama…', options: ['Escalabilidad', 'Topología', 'Protocolo', 'Resolución'], answer: 0, explain: 'Una de las ventajas de las redes.' },
      { id: 'c2-t5-4', type: 'mc', q: '¿Cuál de estos es un enlace?', options: ['Un cable de fibra óptica', 'Una impresora', 'Un servidor', 'Una dirección IP'], answer: 0, explain: 'También el cobre o el Wi-Fi.' },
    ],
  },
  {
    id: 'c2-algoritmos',
    title: 'Algoritmos',
    icon: '🧭',
    summary: 'Los pasos para resolver un problema: simples, en orden preciso y finitos.',
    content: (
      <>
        <p>
          Un <b>algoritmo</b> es la descripción detallada de los pasos necesarios para resolver un problema. Debe cumplir tres características:
        </p>
        <ol>
          <li>Los pasos deben ser <b>simples y claros</b>.</li>
          <li>El <b>orden</b> en que se ejecutan debe ser <b>preciso</b>.</li>
          <li>Debe resolver el problema en un <b>número finito</b> de pasos.</li>
        </ol>
        <p>
          Lo ejecuta una <b>entidad</b> capaz de seguir instrucciones: una persona, una computadora, un robot. El nivel de detalle depende de a quién va
          dirigido: a una computadora hay que explicarle todo, y sólo con instrucciones que pueda ejecutar.
        </p>
        <Cafe />
      </>
    ),
    activities: [
      { id: 'c2-t6-1', type: 'mc', q: '¿Cuál NO es una característica de un algoritmo?', options: ['Tener infinitos pasos', 'Pasos simples y claros', 'Orden preciso', 'Número finito de pasos'], answer: 0, explain: 'Tiene que terminar.' },
      { id: 'c2-t6-2', type: 'mc', q: '¿Quién puede ejecutar un algoritmo?', options: ['Cualquier entidad capaz de seguir instrucciones', 'Sólo una computadora', 'Sólo un robot', 'Nadie'], answer: 0, explain: 'Una persona, una computadora, un robot…' },
    ],
  },
  {
    id: 'c2-pseudocodigo',
    title: 'Algoritmos y pseudocódigo',
    icon: '📝',
    summary: 'El pseudocódigo: un lenguaje intermedio entre el lenguaje natural y el de programación.',
    content: (
      <>
        <p>
          Los lenguajes de las computadoras usan palabras en inglés y son difíciles para las personas: por eso se usa el <b>pseudocódigo</b>, un lenguaje{' '}
          <b>intermedio</b> entre el lenguaje natural y uno de programación. No tiene una sintaxis rigurosa y no está pensado para que lo ejecute una
          computadora, sino para que lo entiendan las personas.
        </p>
        <div className="c2-compare">
          <div>
            <h4>Algoritmo</h4>
            <p>Más formal y detallado (incluye condiciones y estructuras de control). Orientado a programadores.</p>
            <pre>{`1) Inicializar contador a cero.
2) Mientras el contador sea menor que 5:
   a) Leer un número.
   b) Sumar el número.
3) Mostrar el resultado.`}</pre>
          </div>
          <div>
            <h4>Pseudocódigo</h4>
            <p>Menos formal, más cercano al lenguaje humano. Se centra en la lógica y el flujo.</p>
            <pre>{`Iniciar contador en cero
Mientras contador < 5
   Leer número
   Sumar número
Mostrar resultado`}</pre>
          </div>
        </div>
        <h4>Para qué sirve</h4>
        <ul>
          <li>
            <b>Planificar y diseñar</b> antes de comprometerse con un lenguaje.
          </li>
          <li>
            <b>Entendimiento común</b> dentro de un equipo.
          </li>
          <li>
            <b>Resolver problemas</b> evaluando la lógica sin preocuparse por la sintaxis.
          </li>
          <li>
            <b>Enseñar y aprender</b> a programar.
          </li>
          <li>
            <b>Documentar</b> la lógica del programa.
          </li>
        </ul>
        <p>
          <SubLink to="/pseudocodigo" className="btn primary">
            ⌨️ Escribir pseudocódigo (se ejecuta y se corrige solo)
          </SubLink>
        </p>
      </>
    ),
    activities: [
      { id: 'c2-t7-1', type: 'mc', q: '¿Qué es el pseudocódigo?', options: ['Un lenguaje intermedio entre el natural y uno de programación', 'Un lenguaje de máquina', 'Un virus', 'Un tipo de red'], answer: 0, explain: 'Pensado para las personas.' },
      { id: 'c2-t7-2', type: 'mc', q: '¿Cuál es más formal y detallado?', options: ['El algoritmo', 'El pseudocódigo', 'Son iguales', 'Ninguno'], answer: 0, explain: 'El pseudocódigo omite detalles de implementación.' },
      { id: 'c2-t7-3', type: 'mc', q: '¿Para qué NO sirve el pseudocódigo?', options: ['Para que la computadora lo ejecute directamente sin traducirlo', 'Para planificar', 'Para enseñar', 'Para documentar'], answer: 0, explain: 'No sigue una sintaxis rigurosa (en el taller usamos un intérprete que acepta un pseudocódigo estilo PSeInt).' },
    ],
  },
  {
    id: 'c2-pixel',
    title: 'Píxel y resolución',
    icon: '🟨',
    summary: 'El ladrillo de las imágenes digitales y cuántos de ellos forman una imagen.',
    content: (
      <>
        <p>
          Un <b>píxel</b> es como el ladrillo más pequeño de una imagen: la pantalla está hecha de cuadraditos y cada uno muestra un color. Juntos forman la
          imagen.
        </p>
        <p>
          La <b>resolución</b> es la cantidad de píxeles a lo ancho y a lo alto, como las piezas de un rompecabezas: con muchas piezas se ven los detalles;
          con pocas, la imagen se ve <b>borrosa o pixelada</b>.
        </p>
        <PixelArt />
        <p>
          <SubLink to="/componentes/pantalla">Mirá los píxeles de cerca en 3D</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 'c2-t8-1', type: 'num', q: '¿Cuántos píxeles tiene una imagen de 1920 × 1080?', answer: 2073600, tolerance: 0, unit: 'píxeles', explain: '1920 × 1080 = 2.073.600 (unos 2 megapíxeles).' },
      { id: 'c2-t8-2', type: 'mc', q: 'Una imagen con baja resolución se ve…', options: ['Borrosa o pixelada', 'Más nítida', 'Con más colores', 'Transparente'], answer: 0, explain: 'Hay menos píxeles para los detalles.' },
      { id: 'c2-t8-3', type: 'num', q: 'Una imagen de 10 × 10 píxeles a 24 bits (3 bytes por píxel), ¿cuántos bytes ocupa sin comprimir?', answer: 300, tolerance: 0, unit: 'bytes', explain: '100 píxeles × 3 bytes.' },
    ],
  },
  {
    id: 'c2-formatos',
    title: 'Formatos y tamaño de archivo',
    icon: '🗂️',
    summary: 'JPEG, PNG y cuánto espacio ocupa una imagen.',
    content: (
      <>
        <p>
          Los <b>formatos de imagen</b> son como cajas con reglas distintas para guardar las fotos. <b>JPEG</b> comprime la información para que ocupe menos
          espacio (ideal para muchas fotos). <b>PNG</b> es mejor para imágenes con fondos transparentes.
        </p>
        <p>
          El <b>tamaño de archivo</b> (en bytes) es el espacio que ocupa la imagen. Crece con la <b>resolución</b> (más píxeles) y la <b>profundidad de color</b>{' '}
          (más colores). Comprimir achica el archivo, pero a veces pierde algo de calidad: hay que encontrar el equilibrio.
        </p>
        <Formula>bytes sin comprimir = ancho × alto × bits por píxel ÷ 8</Formula>
        <Tamano />
      </>
    ),
    activities: [
      { id: 'c2-t9-1', type: 'mc', q: 'Querés guardar un logo con fondo transparente. ¿Qué formato?', options: ['PNG', 'JPEG', 'BMP', 'Cualquiera'], answer: 0, explain: 'PNG admite transparencia.' },
      { id: 'c2-t9-2', type: 'mc', q: 'Tenés que guardar 500 fotos ocupando poco espacio. ¿Qué formato?', options: ['JPEG', 'PNG', 'BMP', 'TXT'], answer: 0, explain: 'Comprime mucho.' },
      { id: 'c2-t9-3', type: 'mc', q: '¿Qué hace crecer el tamaño de una imagen?', options: ['Más resolución y más profundidad de color', 'Menos píxeles', 'Comprimirla', 'Cambiarle el nombre'], answer: 0, explain: 'Más información para guardar.' },
      { id: 'c2-t9-4', type: 'num', q: 'Una imagen de 100 × 100 píxeles con 8 bits por píxel, ¿cuántos bytes ocupa sin comprimir?', answer: 10000, tolerance: 0, unit: 'bytes', explain: '10.000 píxeles × 1 byte.' },
    ],
  },
]

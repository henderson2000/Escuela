import type { ReactNode } from 'react'
import type { GameDef } from '../../games/registry'
import { QuizGame, pickOne, shuffle, type QuizRound } from '../../games/QuizGame'
import { PartsGame } from '../../games/PartsGame'
import './c1.css'

const bin = (n: number) => n.toString(2).padStart(8, '0')
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

/* ------------------------------------------------------------------ binario */

function makeBinaryRounds(): QuizRound[] {
  const r: QuizRound[] = []
  for (let k = 0; k < 4; k++) {
    const n = rnd(1, k < 2 ? 31 : 255)
    const wrong = new Set<number>()
    while (wrong.size < 3) {
      const w = Math.max(0, Math.min(255, n + pickOne([-8, -4, -2, -1, 1, 2, 4, 8, 16, -16, 32])))
      if (w !== n) wrong.add(w)
    }
    r.push({
      prompt: '¿Qué número decimal es este byte?',
      visual: <code className="c1-big-code">{bin(n)}</code>,
      options: shuffle([n, ...wrong]).map((x) => ({ id: String(x), label: String(x) })),
      answer: String(n),
      explain: `${bin(n)
        .split('')
        .map((b, i) => (b === '1' ? 2 ** (7 - i) : 0))
        .filter(Boolean)
        .join(' + ')} = ${n}`,
    })
  }
  for (let k = 0; k < 3; k++) {
    const n = rnd(1, 63)
    const wrong = new Set<number>()
    while (wrong.size < 3) {
      const w = n ^ (1 << rnd(0, 6))
      if (w !== n && w <= 255) wrong.add(w)
    }
    r.push({
      prompt: `¿Cómo se escribe ${n} en binario?`,
      visual: <code className="c1-big-code">{n}</code>,
      options: shuffle([n, ...wrong]).map((x) => ({ id: String(x), label: <code>{bin(x)}</code> })),
      answer: String(n),
      explain: `${n} = ${bin(n)}`,
    })
  }
  const facts = shuffle([
    { p: '¿Cuántos bits tiene un byte?', ok: '8', o: ['2', '10', '16'] },
    { p: '¿Cuál es la unidad más pequeña de información?', ok: 'El bit', o: ['El byte', 'La letra', 'El archivo'] },
    { p: 'En la computadora, un 1 es…', ok: 'Una señal eléctrica alta (encendido)', o: ['Una señal apagada', 'Una letra', 'Un byte entero'] },
    { p: '¿Cuánto vale el binario 11111111?', ok: '255', o: ['256', '8', '128'] },
    { p: 'Una letra de un texto ocupa aproximadamente…', ok: '1 byte', o: ['1 bit', '8 bytes', '1 kilobyte'] },
  ]).slice(0, 3)
  for (const f of facts) r.push({ prompt: f.p, visual: <span className="quiz-emoji">🔢</span>, options: shuffle([f.ok, ...f.o]).map((x) => ({ id: x, label: x })), answer: f.ok })
  return shuffle(r)
}

/* ------------------------------------------------------------------ hardware y software */

const ITEMS: { e: string; n: string; a: string; group: 'kind' | 'io' }[] = [
  { e: '⌨️', n: 'Teclado', a: 'Hardware de entrada', group: 'io' },
  { e: '🖱️', n: 'Mouse', a: 'Hardware de entrada', group: 'io' },
  { e: '🖥️', n: 'Monitor', a: 'Hardware de salida', group: 'io' },
  { e: '🖨️', n: 'Impresora', a: 'Hardware de salida', group: 'io' },
  { e: '🔊', n: 'Parlantes', a: 'Hardware de salida', group: 'io' },
  { e: '📷', n: 'Cámara web', a: 'Hardware de entrada', group: 'io' },
  { e: '🎤', n: 'Micrófono', a: 'Hardware de entrada', group: 'io' },
  { e: '🪟', n: 'Windows', a: 'Sistema operativo', group: 'kind' },
  { e: '🐧', n: 'Linux', a: 'Sistema operativo', group: 'kind' },
  { e: '🤖', n: 'Android', a: 'Sistema operativo', group: 'kind' },
  { e: '🌐', n: 'Navegador web', a: 'Aplicación', group: 'kind' },
  { e: '📝', n: 'Procesador de texto', a: 'Aplicación', group: 'kind' },
  { e: '🎮', n: 'Un videojuego', a: 'Aplicación', group: 'kind' },
  { e: '🧠', n: 'Procesador (CPU)', a: 'Hardware interno', group: 'kind' },
  { e: '🧮', n: 'Memoria RAM', a: 'Hardware interno', group: 'kind' },
  { e: '💽', n: 'Disco rígido', a: 'Hardware interno', group: 'kind' },
]

const PARTS_Q = [
  { p: '¿Qué componente es volátil (se borra al apagar)?', ok: 'La memoria RAM', o: ['El disco rígido', 'El SSD', 'El monitor'] },
  { p: '¿Qué componente conecta a todos los demás?', ok: 'La placa base', o: ['La fuente', 'El mouse', 'La placa de video'] },
  { p: '¿Qué procesa las imágenes del monitor?', ok: 'La placa de video (GPU)', o: ['La RAM', 'El teclado', 'El disco'] },
  { p: '¿Dónde quedan guardados los archivos con la compu apagada?', ok: 'En el disco', o: ['En la RAM', 'En el monitor', 'En la fuente'] },
  { p: '¿Qué tipo de disco no tiene partes que giran?', ok: 'SSD', o: ['HDD', 'Disquete', 'CD'] },
]

function makeHwRounds(): QuizRound[] {
  const answers = ['Hardware de entrada', 'Hardware de salida', 'Hardware interno', 'Sistema operativo', 'Aplicación']
  const r: QuizRound[] = shuffle(ITEMS)
    .slice(0, 7)
    .map((it) => {
      const opts = shuffle([it.a, ...shuffle(answers.filter((a) => a !== it.a)).slice(0, 3)])
      return {
        prompt: `${it.n}: ¿qué es?`,
        visual: <span className="quiz-emoji">{it.e}</span>,
        options: opts.map((x) => ({ id: x, label: x })),
        answer: it.a,
      }
    })
  for (const q of shuffle(PARTS_Q).slice(0, 3)) r.push({ prompt: q.p, visual: <span className="quiz-emoji">🖥️</span>, options: shuffle([q.ok, ...q.o]).map((x) => ({ id: x, label: x })), answer: q.ok })
  return shuffle(r)
}

/* ------------------------------------------------------------------ pensamiento computacional */

/** Programa de bloques chiquito, dibujado como lista con sangría. */
function MiniBlocks({ lines }: { lines: [number, string][] }) {
  return (
    <div className="c1-mini">
      {lines.map(([d, t], i) => (
        <div key={i} className={`c1-mini-b ${/^(repetir|si|mientras)/.test(t) ? 'ctl' : t.startsWith('definir') || t.startsWith('hacer') ? 'proc' : ''}`} style={{ marginLeft: d * 18 }}>
          {t}
        </div>
      ))}
    </div>
  )
}

function makeThinkRounds(): QuizRound[] {
  const r: QuizRound[] = []
  // ¿cuántas veces avanza?
  {
    const a = rnd(2, 6)
    const b = rnd(2, 3)
    const n = a * b
    const ans = String(n)
    const opts = shuffle([...new Set([n, a + b, n + a, n - b, a])].slice(0, 4)).map(String)
    if (!opts.includes(ans)) opts[0] = ans
    r.push({
      prompt: '¿Cuántas veces avanza el robot?',
      visual: (
        <MiniBlocks
          lines={[
            [0, `repetir ${b} veces`],
            [1, `repetir ${a} veces`],
            [2, 'avanzar'],
            [1, 'girar a la derecha'],
          ]}
        />
      ),
      options: shuffle(opts).map((x) => ({ id: x, label: x })),
      answer: ans,
      explain: `${b} × ${a} = ${n}`,
    })
  }
  // variable
  {
    const start = rnd(0, 3)
    const times = rnd(3, 6)
    const add = rnd(1, 3)
    const v = start + times * add
    const opts = shuffle([...new Set([v, v + add, times * add, start + times])]).slice(0, 4)
    if (!opts.includes(v)) opts[0] = v
    r.push({
      prompt: '¿Qué número dice el robot al final?',
      visual: (
        <MiniBlocks
          lines={[
            [0, `poner tornillos a ${start}`],
            [0, `repetir ${times} veces`],
            [1, `sumar ${add} a tornillos`],
            [0, 'decir tornillos'],
          ]}
        />
      ),
      options: shuffle(opts).map((x) => ({ id: String(x), label: String(x) })),
      answer: String(v),
      explain: `${start} + ${times} × ${add} = ${v}`,
    })
  }
  const concepts: { p: string; vis: ReactNode; ok: string; o: string[]; explain?: string }[] = [
    { p: '¿Qué estructura es esta?', vis: <MiniBlocks lines={[[0, 'si hay tornillo acá'], [1, 'juntar tornillo']]} />, ok: 'Condicional simple', o: ['Condicional complejo', 'Repetición simple', 'Variable'] },
    { p: '¿Qué estructura es esta?', vis: <MiniBlocks lines={[[0, 'si hay pared adelante'], [1, 'girar a la derecha'], [0, 'si no'], [1, 'avanzar']]} />, ok: 'Condicional complejo (si / si no)', o: ['Condicional simple', 'Repetición condicional', 'Procedimiento'] },
    { p: '¿Qué estructura es esta?', vis: <MiniBlocks lines={[[0, 'repetir 5 veces'], [1, 'avanzar']]} />, ok: 'Repetición simple', o: ['Repetición condicional', 'Condicional', 'Variable'] },
    { p: '¿Qué estructura es esta?', vis: <MiniBlocks lines={[[0, 'repetir hasta que llegue a la meta'], [1, 'avanzar']]} />, ok: 'Repetición condicional', o: ['Repetición simple', 'Condicional simple', 'Procedimiento'] },
    { p: '¿Qué estructura es esta?', vis: <MiniBlocks lines={[[0, 'definir juntar fila'], [1, 'repetir 4 veces'], [2, 'avanzar'], [2, 'juntar tornillo']]} />, ok: 'Procedimiento', o: ['Variable', 'Condicional', 'Algoritmo infinito'] },
    { p: 'Este programa, en un pasillo sin meta, ¿qué hace?', vis: <MiniBlocks lines={[[0, 'repetir hasta que llegue a la meta'], [1, 'girar a la derecha']]} />, ok: 'Un loop infinito: nunca llega a la meta', o: ['Llega a la meta', 'Avanza 4 casillas', 'No hace nada'], explain: 'Sólo gira: la condición de corte nunca se cumple.' },
    { p: '¿Qué es un algoritmo?', vis: <span className="quiz-emoji">📋</span>, ok: 'Instrucciones paso a paso para resolver un problema', o: ['Un componente de la computadora', 'Un tipo de cable', 'Un virus'] },
    { p: '¿Qué es una variable?', vis: <span className="quiz-emoji">📦</span>, ok: 'Un contenedor con un valor que puede cambiar', o: ['Una instrucción para girar', 'Un bucle infinito', 'Un periférico'] },
  ]
  for (const c of shuffle(concepts).slice(0, 8)) r.push({ prompt: c.p, visual: c.vis, options: shuffle([c.ok, ...c.o]).map((x) => ({ id: x, label: x })), answer: c.ok, explain: c.explain })
  return shuffle(r).slice(0, 10)
}

export const COMPU1_GAMES: GameDef[] = [
  {
    id: 'c1-partes',
    title: '¿Qué parte es?',
    icon: '🔍',
    desc: 'El gabinete, los discos y los periféricos aparecen despiezados en 3D: identificá la pieza marcada.',
    max: '200',
    component: () => <PartsGame game="c1-partes" />,
  },
  {
    id: 'c1-binario',
    title: 'Unos y ceros',
    icon: '🔢',
    desc: 'Pasá de binario a decimal y de decimal a binario, con números nuevos en cada partida.',
    max: '200',
    component: () => (
      <QuizGame game="c1-binario" title="Unos y ceros" icon="🔢" info="10 preguntas de sistema binario. Rápido = más puntos." intro={<p>Cada bit vale el doble que el de su derecha: 128, 64, 32, 16, 8, 4, 2, 1.</p>} makeRounds={makeBinaryRounds} />
    ),
  },
  {
    id: 'c1-hardware',
    title: '¿Hardware o software?',
    icon: '🖥️',
    desc: 'Entrada, salida, hardware interno, sistema operativo o aplicación: clasificá cada cosa.',
    max: '200',
    component: () => (
      <QuizGame game="c1-hardware" title="¿Hardware o software?" icon="🖥️" info="10 preguntas sobre partes, periféricos y software." intro={<p>Mirá cada objeto o programa y elegí qué es.</p>} makeRounds={makeHwRounds} />
    ),
  },
  {
    id: 'c1-pensar',
    title: '¿Qué hace este programa?',
    icon: '🧩',
    desc: 'Leé programas de bloques: cuántas veces avanza, qué número dice y qué estructura usa.',
    max: '200',
    component: () => (
      <QuizGame
        game="c1-pensar"
        title="¿Qué hace este programa?"
        icon="🧩"
        info="10 preguntas de pensamiento computacional."
        intro={<p>Seguí los bloques en tu cabeza (o en un papel) y respondé.</p>}
        makeRounds={makeThinkRounds}
      />
    ),
  },
]

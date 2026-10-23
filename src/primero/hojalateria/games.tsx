import type { GameDef } from '../../games/registry'
import { QuizGame, shuffle, type QuizRound } from '../../games/QuizGame'
import { PartsGame } from '../../games/PartsGame'

const mk = (prompt: string, emoji: string, ok: string, wrong: string[], explain?: string): QuizRound => ({
  prompt,
  visual: <span className="quiz-emoji">{emoji}</span>,
  options: shuffle([ok, ...wrong]).map((x) => ({ id: x, label: x })),
  answer: ok,
  explain,
})

/* ------------------------------------------------------------------ ¿qué herramienta uso? */

const HERRAMIENTAS: [string, string, string, string[], string][] = [
  ['Cortar chapa galvanizada Nº 30 para la caja.', '✂️', 'Tijera de hojalatero', ['Guillotina hidráulica', 'Sierra sensitiva', 'Plasma'], 'Corta hasta 1 mm.'],
  ['Cortar una chapa de 2 mm de espesor.', '🔪', 'Cizalla', ['Tijera de hojalatero', 'Granete', 'Gramil'], 'Hasta 3 mm.'],
  ['Cortar una plancha grande de 10 mm.', '🏭', 'Guillotina', ['Tijera', 'Cizalla de mano', 'Compás'], 'Hasta 12,7 mm.'],
  ['Trazar paralelas a 5 mm del borde.', '📏', 'Gramil', ['Granete', 'Tijera', 'Bigornia'], 'Ahorra tiempo y reduce errores.'],
  ['Marcar un punto antes de perforar.', '🎯', 'Granete', ['Compás', 'Gramil', 'Cinta métrica'], 'Punta cónica a 120°.'],
  ['Trazar un círculo sobre la chapa.', '⭕', 'Compás de punta seca', ['Escuadra', 'Gramil', 'Tijera'], 'También traslada medidas.'],
  ['Comprobar que la chapa esté cortada a escuadra.', '📐', 'Escuadra de 90°', ['Martillo', 'Compás', 'Cinta'], 'También traza líneas a 45°.'],
  ['Medir 4 metros de canaleta.', '📏', 'Cinta métrica', ['Regla de 300 mm', 'Compás', 'Gramil'], 'Se fabrican de 1 a 10 m.'],
  ['Plegar las pestañas de 5 mm.', '🗜️', 'Plegadora', ['Guillotina', 'Gramil', 'Punzonadora'], 'Con punzón y matriz.'],
  ['Unir dos chapas con ganchos que se enlazan.', '🔗', 'Engrafadora', ['Soldadora por punto', 'Compás', 'Tijera'], 'Engrafado o engargolado.'],
  ['Hacer refuerzos en un panel de techo.', '🥁', 'Bombo hojalatero', ['Tijera', 'Granete', 'Cinta'], 'Dos rodillos movidos con manija.'],
  ['Unir las esquinas de la budinera.', '⚡', 'Soldadora por punto', ['Estaño', 'Engrafadora', 'Gramil'], 'Soldadura por resistencia.'],
  ['Apoyar la chapa para darle forma a martillazos.', '🧱', 'Calzo o sufridera en la morsa', ['Gramil', 'Cinta métrica', 'Plegadora'], 'Así no se mueve.'],
  ['Enderezar una chapa de mediano espesor.', '⚒️', 'Bigornia', ['Granete', 'Tijera', 'Compás'], 'Dos extremos cónicos distintos.'],
  ['Cortar un perfil grueso de acero.', '🌀', 'Sierra sensitiva o amoladora', ['Tijera de hojalatero', 'Gramil', 'Plegadora'], 'Corte por fricción.'],
  ['Perforar y conformar chapa como una prensa.', '🔩', 'Punzonadora', ['Gramil', 'Compás', 'Escuadra'], 'Punzón y matriz.'],
]

/* ------------------------------------------------------------------ orden de las operaciones */

type CicloQ = [string, string, string, string[], string?]

const CICLO: CicloQ[] = [
  ['¿Qué se hace siempre primero?', '📦', 'Recepción de la materia prima y control dimensional', ['Plegar', 'Cortar', 'Soldar']],
  ['Después de controlar la chapa, ¿qué sigue?', '📏', 'Trazar paralelas con el gramil en las dos caras', ['Plegar los laterales', 'Soldar por punto', 'Cortar sin trazar']],
  ['Caja: ¿a qué distancias se trazan las paralelas?', '📐', 'A 5 mm y a 35 mm', ['A 8 mm y a 63 mm', 'A 5 mm y a 20 mm', 'A 10 mm y a 50 mm']],
  ['Tapa: ¿a qué distancias se trazan las paralelas?', '📐', 'A 5 mm y a 20 mm', ['A 5 mm y a 35 mm', 'A 8 mm y a 63 mm', 'A 15 mm y a 18 mm']],
  ['Budinera: ¿a qué distancias se trazan las paralelas?', '📐', 'A 8 mm y a 63 mm', ['A 5 mm y a 35 mm', 'A 5 mm y a 20 mm', 'A 18 mm y a 15 mm']],
  ['Después de trazar las diagonales, ¿qué se hace?', '✂️', 'Cortar con la tijera de hojalatero', ['Soldar', 'Plegar los triángulos', 'Pintar']],
  ['¿Qué se pliega primero en la caja?', '📎', 'Las pestañas de 5 mm', ['Los laterales', 'Los triángulos', 'El fondo']],
  ['¿Qué se pliega último en la caja?', '🔺', 'Los triángulos (orejas) para cerrarla', ['Las pestañas', 'Los laterales', 'Nada']],
  ['¿Qué operación tiene la budinera que no tienen la caja y la tapa?', '⚡', 'Soldadura por punto de las esquinas', ['Trazado con gramil', 'Control dimensional', 'Corte con tijera']],
  ['Budinera: ¿qué se pliega al final antes de soldar?', '〰️', 'El dobladillo de 8 mm hacia el exterior', ['Los laterales hacia afuera', 'Las orejas', 'El fondo']],
  ['Caja: ¿en qué sentido van las pestañas de la operación 80?', '↕️', 'Opuesto a las de la operación 70', ['El mismo que las de la 70', 'No hay pestañas', 'Da igual']],
  ['Tapa: ¿en qué sentido van las pestañas de la operación 80?', '↔️', 'El mismo que las de la operación 70', ['Opuesto a las de la 70', 'No hay pestañas', 'Da igual']],
]

/* ------------------------------------------------------------------ planos y cuentas */

function planRound(): QuizRound {
  const kind = Math.floor(Math.random() * 4)
  if (kind === 0) {
    const W = 100 + 10 * Math.floor(Math.random() * 11)
    const s = [20, 25, 30, 35][Math.floor(Math.random() * 4)]
    const ok = W - 2 * s
    return mk(`Desarrollo de ${W} mm de ancho, laterales plegados a ${s} mm de cada borde. ¿Cuánto mide el fondo de ancho?`, '📐', `${ok} mm`, [`${W - s} mm`, `${W + 2 * s} mm`, `${ok + 10} mm`], `${W} − 2 × ${s} = ${ok} mm.`)
  }
  if (kind === 1) {
    const s = [20, 30, 35, 40][Math.floor(Math.random() * 4)]
    const f = [5, 8][Math.floor(Math.random() * 2)]
    return mk(`Líneas de plegado a ${f} mm (pestaña) y a ${s} mm (lateral). ¿Qué alto tiene la pared?`, '📏', `${s - f} mm`, [`${s} mm`, `${s + f} mm`, `${f} mm`], `${s} − ${f} = ${s - f} mm.`)
  }
  if (kind === 2) {
    const a = 50 + 10 * Math.floor(Math.random() * 8)
    const h = [20, 25, 30, 40][Math.floor(Math.random() * 4)]
    return mk(`Querés una caja con fondo de ${a} mm de ancho y paredes de ${h} mm, sin pestaña. ¿Qué ancho de chapa necesitás?`, '🧮', `${a + 2 * h} mm`, [`${a + h} mm`, `${a} mm`, `${a + 4 * h} mm`], `${a} + 2 × ${h} = ${a + 2 * h} mm.`)
  }
  const n = [30, 26, 22, 18][Math.floor(Math.random() * 4)]
  const m = n - 4
  return mk(`¿Cuál chapa es más gruesa: calibre Nº ${n} o Nº ${m}?`, '🔢', `Nº ${m}`, [`Nº ${n}`, 'Son iguales', 'Depende del metal'], 'A menor número de calibre, mayor espesor.')
}

export const HOJALATERIA1_GAMES: GameDef[] = [
  {
    id: 'h1-partes',
    title: '¿Qué parte es?',
    icon: '🔍',
    desc: 'La caja, la tapa, la budinera, las herramientas, la plegadora y el engrafado en 3D: identificá la parte marcada.',
    max: '200',
    component: () => <PartsGame game="h1-partes" />,
  },
  {
    id: 'h1-herramientas',
    title: '¿Qué herramienta uso?',
    icon: '✂️',
    desc: 'Te cuentan un trabajo de hojalatería: elegí la herramienta o la máquina justa.',
    max: '200',
    component: () => (
      <QuizGame
        game="h1-herramientas"
        title="¿Qué herramienta uso?"
        icon="✂️"
        info="10 trabajos del taller. Rápido = más puntos."
        intro={<p>Medir, trazar, cortar, golpear, plegar y unir: cada trabajo tiene su herramienta.</p>}
        makeRounds={() => shuffle(HERRAMIENTAS).slice(0, 10).map(([p, e, ok, w, ex]) => mk(p, e, ok, w, ex))}
      />
    ),
  },
  {
    id: 'h1-ciclo',
    title: 'El orden de las operaciones',
    icon: '🔢',
    desc: 'Caja, tapa y budinera: ¿qué operación sigue y con qué medidas?',
    max: '200',
    component: () => (
      <QuizGame
        game="h1-ciclo"
        title="El orden de las operaciones"
        icon="🔢"
        info="10 preguntas de los ciclos de fabricación."
        intro={<p>Controlar, trazar, cortar, plegar y (en la budinera) soldar.</p>}
        makeRounds={() => shuffle(CICLO).slice(0, 10).map(([p, e, ok, w, ex]) => mk(p, e, ok, w, ex))}
      />
    ),
  },
  {
    id: 'h1-planos',
    title: 'Cuentas de planos',
    icon: '🧮',
    desc: 'Fondos, alturas de pared, desarrollos y calibres: cuentas rápidas como en el taller.',
    max: '200',
    component: () => (
      <QuizGame
        game="h1-planos"
        title="Cuentas de planos"
        icon="🧮"
        info="10 cuentas con números distintos cada vez."
        intro={<p>Desarrollo = fondo + 2 × pared (+ pestañas). A mayor calibre, menor espesor.</p>}
        makeRounds={() => Array.from({ length: 10 }, planRound)}
      />
    ),
  },
]

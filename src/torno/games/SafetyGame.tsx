import { QuizGame, shuffle, type QuizRound } from '../../games/QuizGame'

export const SAFETY_GAME = 'torno-seguridad'

type Item =
  | { kind: 'bm'; emoji: string; s: string; ok: boolean; explain: string }
  | { kind: 'q'; emoji: string; s: string; options: [string, string, string, string]; explain: string }

/** En las preguntas «¿qué hacés?», la primera opción es la correcta. */
export const SAFETY_ITEMS: Item[] = [
  { kind: 'bm', emoji: '🔑⚙️', s: 'Arranca el torno con la llave del plato todavía puesta.', ok: false, explain: 'Nunca: con el plato girando, la llave sale despedida.' },
  { kind: 'bm', emoji: '🥽', s: 'Se pone anteojos de seguridad con cierres laterales para tornear fundición de hierro.', ok: true, explain: 'La viruta de la fundición salta en partículas: protección con cierres laterales.' },
  { kind: 'bm', emoji: '✋🌀', s: 'Saca con la mano la viruta enredada en la pieza.', ok: false, explain: 'La viruta está caliente y corta: se saca con un gancho y con la máquina detenida.' },
  { kind: 'bm', emoji: '⌚📿', s: 'Trabaja en el torno con reloj, pulsera y una cadenita colgando.', ok: false, explain: 'Nada que cuelgue ni se pueda enganchar: ni pulseras, relojes, anillos ni collares.' },
  { kind: 'bm', emoji: '💇', s: 'Tiene el pelo largo y se lo ata con una colita antes de tornear.', ok: true, explain: 'El pelo largo no debe pender sobre la cara: siempre atado.' },
  { kind: 'bm', emoji: '💪', s: 'Apoya los codos sobre el torno para mirar mejor mientras mecaniza.', ok: false, explain: 'Posición correcta, sin apoyar el torso ni los codos: pueden originarse graves daños.' },
  { kind: 'bm', emoji: '⚙️🔄', s: 'Cambia la velocidad del cabezal con la máquina en marcha para no perder tiempo.', ok: false, explain: 'Con la máquina en marcha se rompen engranajes. Siempre detenida.' },
  { kind: 'bm', emoji: '🔨', s: 'Golpea el plato con un martillo de acero para aflojarlo.', ok: false, explain: 'Se usa martillo de cobre o mazo de madera; nunca acero ni llaves.' },
  { kind: 'bm', emoji: '🤲', s: 'Antes de arrancar, gira el plato a mano para ver que no haya estorbos.', ok: true, explain: 'Es la primera advertencia del apunte.' },
  { kind: 'bm', emoji: '📏🧰', s: 'Deja el calibre y las llaves apoyados sobre la bancada.', ok: false, explain: 'Desgasta las guías y se pierde precisión. Van en la tablita.' },
  { kind: 'bm', emoji: '🧽', s: 'Al terminar, saca las virutas con un cepillo y limpia las guías con querosén y un trapo limpio.', ok: true, explain: 'Así se limpia la máquina después de cada trabajo.' },
  { kind: 'bm', emoji: '🛢️⚙️', s: 'Lubrica la máquina con el torno en marcha, metiendo la mano entre los engranajes.', ok: false, explain: 'Primero se para el torno, se lo asegura y se coloca la parada de emergencia.' },
  { kind: 'bm', emoji: '🧣', s: 'Trabaja con una campera suelta y una bufanda porque hace frío.', ok: false, explain: 'Ropa ajustada al cuerpo, nunca suelta.' },
  { kind: 'bm', emoji: '🧤', s: 'Con la máquina detenida, usa guantes para sacar del torno una pieza llena de virutas.', ok: true, explain: 'Para manipular material cerca de virutas, guantes. Pero nunca con la pieza girando.' },
  { kind: 'bm', emoji: '🧤🌀', s: 'Lima la pieza mientras gira, con guantes puestos.', ok: false, explain: 'Un guante cerca de una pieza girando puede engancharse y arrastrar la mano.' },
  { kind: 'bm', emoji: '⚙️🔀', s: 'Usa los engranajes de roscar del torno de al lado porque son de la misma medida.', ok: false, explain: 'Los engranajes de roscar se mantienen limpios y no se mezclan con los de otras máquinas.' },
  { kind: 'bm', emoji: '🛢️👟', s: 'Deja el piso junto al torno lleno de virutas y manchas de aceite.', ok: false, explain: 'El piso tiene que estar limpio y sin estorbos: un resbalón sobre el torno en marcha es gravísimo.' },
  { kind: 'bm', emoji: '🎯', s: 'Mete el manguito de la contrapunta hasta esconderlo del todo.', ok: false, explain: 'El manguito siempre tiene que sobresalir un par de centímetros.' },
  { kind: 'bm', emoji: '🪨✨', s: 'Afila una herramienta en la amoladora sin anteojos.', ok: false, explain: 'Al afilar también es imprescindible proteger los ojos.' },
  { kind: 'bm', emoji: '🛢️🔍', s: 'Revisa periódicamente el nivel de aceite del cabezal.', ok: true, explain: 'Es parte del cuidado del cabezal fijo.' },
  { kind: 'bm', emoji: '🔧📦', s: 'Deja una llave apoyada sobre el cabezal mientras trabaja.', ok: false, explain: 'Con la vibración puede deslizarse y caer sobre partes en movimiento.' },
  { kind: 'bm', emoji: '🎯🛢️', s: 'Usa un punto fijo en la contrapunta y le mantiene la punta lubricada.', ok: true, explain: 'El punto fijo roza con la pieza: tiene que estar constantemente lubricado.' },
  { kind: 'bm', emoji: '🪢', s: 'Saca la correa de la polea con la mano.', ok: false, explain: 'Se usa el pasacorreas o una varilla, tubo o regla de madera.' },
  { kind: 'bm', emoji: '🔒🔒', s: 'Antes de mecanizar entre puntas, bloquea la contrapunta en la bancada y también el manguito.', ok: true, explain: 'La contrapunta se bloquea con sus dos frenos.' },
  { kind: 'q', emoji: '⚙️❓', s: 'Un cambio de velocidad no entra. ¿Qué hacés?', options: ['Con la máquina detenida, muevo el plato a mano hasta que entre', 'Lo fuerzo con la máquina en marcha', 'Golpeo la palanca con un martillo', 'Dejo la palanca a medio camino'], explain: 'Mover el plato con la mano hace coincidir los dientes.' },
  { kind: 'q', emoji: '🌀🌀', s: 'Se te formó una viruta larga que se enrosca en la pieza. ¿Qué hacés?', options: ['Paro la máquina y la saco con un gancho', 'La tiro con la mano rápido', 'La corto con una pinza con la máquina girando', 'La dejo, ya se va a cortar'], explain: 'Las virutas largas se enganchan en la ropa y la máquina. Gancho y máquina parada.' },
  { kind: 'q', emoji: '🔪🩹', s: 'En aluminio, se pegó material sobre el filo (filo falso). ¿Qué hacés?', options: ['Lo desprendo con un material más duro y mejoro la refrigeración', 'Lo saco con la uña', 'Sigo trabajando igual', 'Aumento la velocidad al máximo'], explain: 'Se desprende con algo más duro y se evita refrigerando bien.' },
  { kind: 'q', emoji: '🧰', s: 'Terminaste de usar una herramienta. ¿Dónde va?', options: ['Siempre al mismo lugar, en su casillero', 'Sobre la bancada', 'Sobre el cabezal', 'Donde haya lugar'], explain: 'Orden: cada cosa en su lugar, para encontrarla cuando haga falta.' },
  { kind: 'q', emoji: '🔨❓', s: 'Tenés que golpear un órgano de la máquina para acomodarlo. ¿Con qué?', options: ['Martillo de cobre o mazo de madera', 'Martillo de acero', 'La llave del plato', 'Una barra de acero'], explain: 'Las herramientas duras arruinan la máquina.' },
  { kind: 'q', emoji: '🛑', s: 'Vas a desmontar una pieza interna de la máquina. ¿Qué hacés primero?', options: ['Paro el torno, lo aseguro para que no arranque y coloco la parada de emergencia', 'Bajo la velocidad', 'Le aviso a un compañero y sigo', 'Lo hago rápido con la máquina en marcha'], explain: 'Precaución 5 del apunte.' },
  { kind: 'q', emoji: '🗜️🌀', s: 'Montaje entre puntas, a punto de arrancar. ¿A qué le prestás especial atención?', options: ['Al área de giro de la brida: que no enganche ni golpee nada', 'A que la luneta esté floja', 'A que el carro empuje la contrapunta', 'A que la llave quede en el plato'], explain: 'La cola de la brida gira con la pieza.' },
  { kind: 'q', emoji: '🔄🔩', s: 'Montaste una pieza al aire. Antes de arrancar…', options: ['Verifico el ajuste, la giro a mano para ver si está centrada y saco la llave', 'Arranco a máxima velocidad para probar', 'Dejo la llave para reajustar después', 'Apoyo la mano en el plato'], explain: 'Observaciones del montaje al aire.' },
  { kind: 'q', emoji: '🛢️📅', s: '¿Cada cuánto se lubrican los órganos en movimiento (si el fabricante no dice otra cosa)?', options: ['Al menos una vez al día, después de la limpieza', 'Una vez por año', 'Sólo cuando hacen ruido', 'Nunca'], explain: 'Con justo criterio: ni de menos (desgaste) ni de más (desperdicio).' },
  { kind: 'q', emoji: '🧽📅', s: '¿Cada cuánto se hace la limpieza especial de todos los órganos, también los internos?', options: ['Una vez por semana', 'Una vez por año', 'Nunca', 'Cada hora'], explain: 'Además de la limpieza al terminar cada trabajo.' },
  { kind: 'q', emoji: '🎯🔄', s: 'Trabajando con contrapunta, notás que el punto giratorio dejó de girar. ¿Qué hacés?', options: ['Detengo la máquina y reviso el apoyo: el punto tiene que girar siempre', 'Sigo, no importa', 'Aprieto más la luneta', 'Aumento el avance'], explain: 'El punto giratorio tiene que estar girando constantemente durante el mecanizado.' },
  { kind: 'q', emoji: '🛢️❓', s: 'Llenaste los puntos de aceite, pero no llega lubricación a un engranaje. ¿Qué revisás?', options: ['Que los tubitos que llevan el aceite no estén obstruidos', 'Nada, ya está lubricada', 'Que el motor gire más rápido', 'La correa'], explain: 'No basta con llenar: hay que asegurarse de que el aceite llegue.' },
]

const BM = [
  { id: 'bien', label: '✔ Está bien' },
  { id: 'mal', label: '✘ Está mal' },
]

export function makeSafetyRounds(n = 10): QuizRound[] {
  return shuffle(SAFETY_ITEMS)
    .slice(0, n)
    .map((it) => {
      const visual = (
        <div className="tn-scene">
          <span className="tn-emoji" aria-hidden>
            {it.emoji}
          </span>
          <p style={{ margin: 0, maxWidth: 520 }}>{it.s}</p>
        </div>
      )
      if (it.kind === 'bm') {
        return { prompt: '¿Está bien o mal?', visual, options: BM, answer: it.ok ? 'bien' : 'mal', explain: it.explain }
      }
      return {
        prompt: 'Elegí la respuesta correcta',
        visual,
        options: shuffle(it.options.map((label, i) => ({ id: String(i), label }))),
        answer: '0',
        explain: it.explain,
      }
    })
}

export function SafetyGame() {
  return (
    <QuizGame
      game={SAFETY_GAME}
      title="Seguridad en el taller"
      icon="🦺"
      info="Situaciones reales frente al torno: decidí si está bien o mal, o qué tenés que hacer. Basado en las normas de seguridad del apunte."
      intro={<p>10 situaciones. Respuesta correcta: 15 puntos + hasta 5 de bonus por rapidez (máximo 200).</p>}
      makeRounds={() => makeSafetyRounds(10)}
    />
  )
}

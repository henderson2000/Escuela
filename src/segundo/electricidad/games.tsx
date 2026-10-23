import type { GameDef } from '../../games/registry'
import { QuizGame, pickOne, shuffle, type QuizRound } from '../../games/QuizGame'
import { PartsGame } from '../../games/PartsGame'
import { SIMBOLOS, Simbolo } from './Esquemas'

const mk = (prompt: string, emoji: string, ok: string, wrong: string[], explain?: string): QuizRound => ({
  prompt,
  visual: <span className="quiz-emoji">{emoji}</span>,
  options: shuffle([ok, ...wrong]).map((x) => ({ id: x, label: x })),
  answer: ok,
  explain,
})

const f = (n: number) => Number(n.toFixed(2)).toString().replace('.', ',')

/* ------------------------------------------------------------------ símbolos */

function simboloRound(): QuizRound {
  const s = pickOne(SIMBOLOS)
  const wrong = shuffle(SIMBOLOS.filter((x) => x.id !== s.id)).slice(0, 3)
  return {
    prompt: '¿Qué símbolo es?',
    visual: <Simbolo id={s.id} size={120} />,
    options: shuffle([s, ...wrong]).map((x) => ({ id: x.id, label: x.name })),
    answer: s.id,
    explain: s.desc,
  }
}

/* ------------------------------------------------------------------ cálculos */

const R = [10, 20, 30, 40, 50, 60, 100, 110, 220]

function calcRound(): QuizRound {
  const k = Math.floor(Math.random() * 5)
  if (k === 0) {
    const a = pickOne(R)
    const b = pickOne(R)
    const c = pickOne(R)
    const ok = a + b + c
    return mk(`${a} Ω, ${b} Ω y ${c} Ω en serie. ¿RT?`, '🔗', `${ok} Ω`, [`${f(1 / (1 / a + 1 / b + 1 / c))} Ω`, `${ok + 10} Ω`, `${Math.max(a, b, c)} Ω`], 'En serie se suman.')
  }
  if (k === 1) {
    const a = pickOne([20, 40, 60, 100, 200])
    const ok = a / 2
    return mk(`Dos resistencias de ${a} Ω en paralelo. ¿RT?`, '🔀', `${ok} Ω`, [`${a * 2} Ω`, `${a} Ω`, `${a / 4} Ω`], 'Dos iguales en paralelo: la mitad.')
  }
  if (k === 2) {
    const r = pickOne([10, 20, 22, 44, 55, 110])
    const u = 220
    const ok = u / r
    return mk(`Una resistencia de ${r} Ω a 220 V. ¿Corriente?`, '⚡', `${f(ok)} A`, [`${f(ok * 2)} A`, `${f(ok / 2)} A`, `${f(r / u)} A`], `I = U / R = 220 / ${r}.`)
  }
  if (k === 3) {
    const i = pickOne([0.5, 1, 2, 4, 5])
    const r = pickOne([10, 20, 44, 55])
    const ok = i * r
    return mk(`Por ${r} Ω circulan ${f(i)} A. ¿Tensión?`, '🔋', `${f(ok)} V`, [`${f(r / i)} V`, `${f(ok * 2)} V`, `${f(ok + r)} V`], `U = I × R.`)
  }
  const a = pickOne([1, 2, 3, 4])
  const b = pickOne([1, 2, 3])
  const c = pickOne([1, 2])
  const ok = a + b - c
  return mk(`A un nodo entran ${a} A y ${b} A, y salen ${c} A por un cable. ¿Cuánto sale por el otro?`, '🔀', `${ok} A`, [`${a + b + c} A`, `${Math.abs(a - b)} A`, `${ok + 1} A`], 'Lo que entra es igual a lo que sale (Kirchhoff).')
}

/* ------------------------------------------------------------------ protecciones y seguridad */

const PROT: [string, string, string, string[], string][] = [
  ['Se tocan los cables de fase y neutro en una caja.', '💥', 'La parte magnética del termomagnético', ['El diferencial', 'La parte térmica', 'Ninguna'], 'Cortocircuito: actúa al instante.'],
  ['Hay estufa, pava eléctrica y plancha en el mismo circuito.', '🔥', 'La parte térmica del termomagnético', ['El diferencial', 'La parte magnética', 'El botón T'], 'Sobrecarga: corta después de un rato.'],
  ['Una persona toca un cable pelado con tensión.', '🧍', 'El diferencial', ['La parte térmica', 'El fusible solamente', 'Ninguna'], 'Se escapa corriente a tierra por su cuerpo.'],
  ['La carcasa del lavarropas quedó con tensión por una falla.', '🧺', 'El diferencial', ['La parte magnética', 'La térmica', 'El interruptor de la luz'], 'Contacto indirecto.'],
  ['¿Qué se hace primero para trabajar sin tensión?', '1️⃣', 'Desconectar todas las fuentes', ['Verificar ausencia de tensión', 'Señalizar la zona', 'Poner a tierra'], 'Regla de oro 1.'],
  ['¿Qué se hace después de desconectar?', '🔒', 'Bloquear con candado y señalizar', ['Trabajar directamente', 'Medir la resistencia', 'Puentear el diferencial'], 'Regla de oro 2.'],
  ['Ya cortaste y bloqueaste. ¿Qué sigue?', '📟', 'Verificar la ausencia de tensión', ['Empezar a trabajar', 'Rearmar el diferencial', 'Sacar el candado'], 'Regla de oro 3.'],
  ['¿Cuál es la cuarta regla de oro?', '⏚', 'Puesta a tierra y en cortocircuito', ['Desconexión', 'Señalización', 'Verificar tensión'], 'Regla de oro 4.'],
  ['Tocar un cable pelado con tensión es un contacto…', '✋', 'Directo', ['Indirecto', 'Seguro', 'Magnético'], 'Se toca una parte activa.'],
  ['Tocar la carcasa de una heladera con una falla de aislamiento es un contacto…', '🧊', 'Indirecto', ['Directo', 'Seguro', 'Térmico'], 'La carcasa no debería tener tensión.'],
  ['Se fundió un fusible. ¿Qué hacés?', '🔌', 'Busco la falla y lo reemplazo por uno igual', ['Lo puenteo con un alambre', 'Pongo uno más grande', 'Lo dejo así'], 'Nunca se puentea.'],
  ['El circuito consume 8 A y el cable soporta 15 A. ¿Qué termomagnético?', '🧮', '10 A', ['6 A', '20 A', '32 A'], 'IB ≤ In ≤ IZ: 8 ≤ 10 ≤ 15.'],
  ['¿Cada cuánto conviene probar el diferencial con el botón T?', '🟡', 'Una vez por mes', ['Nunca', 'Cada 10 años', 'Sólo cuando dispara'], 'Así se comprueba que funciona.'],
  ['¿Qué conductor corta el interruptor de la luz?', '💡', 'La fase', ['El neutro', 'La tierra', 'Los dos'], 'Con la llave abierta la lámpara queda sin tensión.'],
  ['¿Qué color tiene el conductor de protección (tierra)?', '🟢', 'Verde y amarillo', ['Celeste', 'Marrón', 'Rojo'], 'Nunca se usa para otra cosa.'],
  ['¿De qué color es el neutro?', '🔵', 'Celeste', ['Verde y amarillo', 'Marrón', 'Negro'], 'Colores normalizados.'],
]

export const ELECTRICIDAD2_GAMES: GameDef[] = [
  {
    id: 'e2-partes',
    title: '¿Qué parte es?',
    icon: '🔍',
    desc: 'La instalación, el termomagnético, el diferencial y el multímetro en 3D: identificá la parte marcada.',
    max: '200',
    component: () => <PartsGame game="e2-partes" />,
  },
  {
    id: 'e2-simbolos',
    title: 'Símbolos eléctricos',
    icon: '🔣',
    desc: 'Aparece un símbolo de los planos: ¿qué es?',
    max: '200',
    component: () => (
      <QuizGame
        game="e2-simbolos"
        title="Símbolos eléctricos"
        icon="🔣"
        info="10 símbolos. Rápido = más puntos."
        intro={<p>Lámparas, cajas, interruptores, protecciones, tomas y tierra.</p>}
        makeRounds={() => Array.from({ length: 10 }, simboloRound)}
      />
    ),
  },
  {
    id: 'e2-circuitos',
    title: 'Calculá rápido',
    icon: '🧮',
    desc: 'Ley de Ohm, serie, paralelo y Kirchhoff con números distintos cada vez.',
    max: '200',
    component: () => (
      <QuizGame
        game="e2-circuitos"
        title="Calculá rápido"
        icon="🧮"
        info="10 cuentas cortas."
        intro={<p>U = I × R · serie: se suman · dos iguales en paralelo: la mitad · lo que entra a un nodo, sale.</p>}
        makeRounds={() => Array.from({ length: 10 }, calcRound)}
      />
    ),
  },
  {
    id: 'e2-protecciones',
    title: 'Protecciones y seguridad',
    icon: '🛡️',
    desc: '¿Qué protección actúa? ¿Qué regla de oro sigue? ¿Qué tipo de contacto es?',
    max: '200',
    component: () => (
      <QuizGame
        game="e2-protecciones"
        title="Protecciones y seguridad"
        icon="🛡️"
        info="10 situaciones de una instalación."
        intro={<p>Diferencial, termomagnético, fusible, reglas de oro y colores de los conductores.</p>}
        makeRounds={() => shuffle(PROT).slice(0, 10).map(([p, e, ok, w, ex]) => mk(p, e, ok, w, ex))}
      />
    ),
  },
]

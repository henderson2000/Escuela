import type { GameDef } from '../../games/registry'
import { QuizGame, pickOne, shuffle, type QuizRound } from '../../games/QuizGame'
import { PartsGame } from '../../games/PartsGame'

const mk = (prompt: string, emoji: string, ok: string, wrong: string[], explain?: string): QuizRound => ({
  prompt,
  visual: <span className="quiz-emoji">{emoji}</span>,
  options: shuffle([ok, ...wrong]).map((x) => ({ id: x, label: x })),
  answer: ok,
  explain,
})

const f = (n: number, d = 2) => Number(n.toFixed(d)).toString().replace('.', ',')

/* ------------------------------------------------------------------ ¿buena o mala soldadura? */

const SOLDADURAS: [string, string, string, string[], string][] = [
  ['Cono cóncavo, liso y brillante que moja todo el pad.', '🌋', 'Buena soldadura', ['Soldadura fría', 'Exceso de estaño', 'Puente'], '¡Así tiene que quedar!'],
  ['Bolita opaca y granulada, apoyada sobre el pad.', '🪨', 'Soldadura fría', ['Buena soldadura', 'Pad levantado', 'Poco estaño'], 'Faltó calor o la punta estaba sucia.'],
  ['Bola grande y brillante que tapa toda la pata.', '🔮', 'Exceso de estaño', ['Buena soldadura', 'Soldadura fría', 'Poco estaño'], 'No se ve si mojó bien: sacar el sobrante.'],
  ['Se ve el cobre del pad alrededor de la pata.', '🟠', 'Poco estaño', ['Exceso de estaño', 'Puente', 'Buena soldadura'], 'Agregar un poco más.'],
  ['Estaño que une dos pads vecinos.', '🌉', 'Puente (cortocircuito)', ['Buena soldadura', 'Poco estaño', 'Soldadura fría'], 'Se saca con malla desoldante.'],
  ['El pad está despegado y la placa alrededor quedó marrón oscuro.', '🔥', 'Sobrecalentada (pad levantado)', ['Soldadura fría', 'Poco estaño', 'Buena soldadura'], 'Demasiado tiempo o temperatura.'],
  ['La soldadura quedó opaca porque se movió el componente mientras se enfriaba.', '🫨', 'Soldadura fría', ['Buena soldadura', 'Puente', 'Exceso de estaño'], 'No mover nada hasta que solidifique.'],
  ['El estaño quedó pegado a la pata pero no al pad: hay un anillo oscuro entre los dos.', '⭕', 'Soldadura fría', ['Buena soldadura', 'Exceso', 'Puente'], 'El pad no llegó a calentarse.'],
]

/* ------------------------------------------------------------------ componentes */

function componenteRound(): QuizRound {
  const k = Math.floor(Math.random() * 6)
  if (k === 0) {
    const [code, nf] = pickOne<[string, string]>([
      ['104', '100 nF'],
      ['103', '10 nF'],
      ['102', '1 nF'],
      ['473', '47 nF'],
      ['222', '2,2 nF'],
      ['224', '220 nF'],
    ])
    return mk(`Un capacitor cerámico dice "${code}". ¿Cuánto vale?`, '🟤', nf, shuffle(['100 nF', '10 nF', '1 nF', '47 nF', '2,2 nF', '220 nF', '1 µF'].filter((x) => x !== nf)).slice(0, 3), `${code.slice(0, 2)} × 10^${code[2]} pF.`)
  }
  if (k === 1) {
    const [reg, v] = pickOne<[string, number]>([
      ['7805', 5],
      ['7809', 9],
      ['7812', 12],
      ['7815', 15],
    ])
    return mk(`¿Qué tensión entrega un regulador ${reg}?`, '🔌', `${v} V`, ['5 V', '9 V', '12 V', '15 V', '3,3 V'].filter((x) => x !== `${v} V`).slice(0, 3), `Las últimas cifras son la tensión; necesita al menos ${v + 2} V en la entrada.`)
  }
  if (k === 2) return mk('¿Qué marca la franja pintada de un diodo?', '🔺', 'El cátodo', ['El ánodo', 'La potencia', 'Que está quemado'], 'La corriente va de ánodo a cátodo.')
  if (k === 3) return mk('¿Cuál es el negativo de un capacitor electrolítico?', '🔋', 'La pata corta, del lado de la franja', ['La pata larga', 'Cualquiera', 'La del medio'], 'Al revés puede explotar.')
  if (k === 4) return mk('¿Qué hace un puente rectificador?', '🌊', 'Convierte la alterna en continua pulsante', ['Baja la tensión', 'Elimina el ripple', 'Mide la corriente'], 'Cuatro diodos, onda completa.')
  return mk('En un BC547, ¿cómo se llaman las tres patas?', '🦵', 'Colector, base y emisor', ['Ánodo, cátodo y puerta', 'Entrada, masa y salida', 'Fase, neutro y tierra'], 'La base controla la corriente de colector a emisor.')
}

/* ------------------------------------------------------------------ cálculos */

function calculoRound(): QuizRound {
  const k = Math.floor(Math.random() * 4)
  if (k === 0) {
    const v = pickOne([5, 9, 12])
    const ma = pickOne([10, 15, 20])
    const vf = pickOne([2, 3])
    const r = Math.round((v - vf) / (ma / 1000))
    return mk(`LED de ${vf} V, fuente de ${v} V, ${ma} mA. ¿Qué resistencia se calcula?`, '💡', `${r} Ω`, [`${Math.round(r / 2)} Ω`, `${r * 2} Ω`, `${Math.round(v / (ma / 1000))} Ω`], `(${v} − ${vf}) ÷ ${f(ma / 1000, 3)}.`)
  }
  if (k === 1) {
    const vef = pickOne([6, 9, 12, 15, 18])
    const vp = vef * Math.SQRT2
    return mk(`Secundario de ${vef} V eficaces: ¿cuál es la tensión pico?`, '〰️', `${f(vp, 1)} V`, [`${f(vef / Math.SQRT2, 1)} V`, `${vef} V`, `${f(vef * 2, 1)} V`], 'Vpico = Vef × √2.')
  }
  if (k === 2) {
    const i = pickOne([0.5, 1, 1.5])
    const c = pickOne([1000, 2200, 4700])
    const vr = i / (100 * c * 1e-6)
    return mk(`${f(i, 1)} A y un capacitor de ${c} µF: ¿cuánto ripple hay?`, '📉', `${f(vr)} V`, [`${f(vr * 10)} V`, `${f(vr / 10)} V`, `${f(vr * 2)} V`], 'Vr ≈ I ÷ (100 × C).')
  }
  const n1 = pickOne([1100, 2200])
  const v2 = pickOne([6, 12, 24])
  const n2 = (n1 * v2) / 220
  return mk(`Transformador de 220 V a ${v2} V con ${n1} vueltas en el primario. ¿Cuántas tiene el secundario?`, '🧲', `${f(n2, 0)}`, [`${f(n2 * 2, 0)}`, `${f(n2 / 2, 0)}`, `${f((220 * v2) / n1, 0)}`], 'N2 = N1 × V2 ÷ V1.')
}

/* ------------------------------------------------------------------ seguridad */

const SEGURIDAD: [string, string, boolean, string][] = [
  ['Deja el soldador caliente apoyado en la mesa un momento.', '🔥', false, 'Siempre en el soporte.'],
  ['Se le cae el soldador y lo deja caer, sin intentar agarrarlo.', '🫳', true, 'Mejor romper el soldador que quemarse la mano.'],
  ['Corta las patas sobrantes sosteniéndolas y con anteojos.', '🥽', true, 'Los pedacitos de alambre saltan lejos.'],
  ['Come galletitas mientras suelda con estaño con plomo.', '🍪', false, 'El plomo es tóxico: no se come en la mesa.'],
  ['Trabaja con el extractor de humo encendido.', '💨', true, 'El humo del flux irrita.'],
  ['Mide continuidad con la placa enchufada.', '📟', false, 'La continuidad se mide sin alimentar.'],
  ['Usa guantes y anteojos para el percloruro férrico.', '🧤', true, 'Es corrosivo y mancha.'],
  ['Tira el percloruro usado a la pileta.', '🚰', false, 'Es un residuo peligroso: se guarda y se entrega para su tratamiento.'],
  ['Toca el lado de 220 V de la fuente enchufada para ver si anda.', '⚡', false, 'Nunca: se mide con el multímetro y con cuidado.'],
  ['Revisa la polaridad del electrolítico antes de alimentar la placa.', '🔋', true, 'Al revés puede explotar.'],
  ['Desenchufa el soldador al terminar y lo deja enfriar en el soporte.', '🔌', true, 'Recién frío se guarda.'],
  ['Limpia la punta en una esponja empapada que chorrea agua.', '💧', false, 'Húmeda, no empapada: enfría la punta.'],
]

export const ELECTRONICA2_GAMES: GameDef[] = [
  {
    id: 'e2-partes',
    title: '¿Qué parte es?',
    icon: '🔍',
    desc: 'La estación de soldado, el punto de soldadura, la placa y la fuente en 3D: identificá la parte marcada.',
    max: '200',
    component: () => <PartsGame game="e2-partes" />,
  },
  {
    id: 'e2-soldaduras',
    title: '¿Buena o mala soldadura?',
    icon: '🌋',
    desc: 'Te describen cómo quedó el punto: decí qué es.',
    max: '200',
    component: () => (
      <QuizGame
        game="e2-soldaduras"
        title="¿Buena o mala soldadura?"
        icon="🌋"
        info="8 soldaduras para revisar."
        intro={<p>Buena, fría, exceso, poco estaño, puente o pad levantado.</p>}
        makeRounds={() => shuffle(SOLDADURAS).map(([p, e, ok, w, ex]) => mk(p, e, ok, w, ex))}
      />
    ),
  },
  {
    id: 'e2-componentes',
    title: 'Componentes y cálculos',
    icon: '🧮',
    desc: 'Códigos de capacitores, reguladores, polaridades y cálculos de LED, transformador y ripple. Números distintos cada vez.',
    max: '200',
    component: () => (
      <QuizGame
        game="e2-componentes"
        title="Componentes y cálculos"
        icon="🧮"
        info="10 preguntas rápidas."
        intro={<p>R = (V − VLED) ÷ I · Vp = Vef × √2 · Vr ≈ I ÷ (100 × C).</p>}
        makeRounds={() => Array.from({ length: 10 }, (_, i) => (i % 2 ? calculoRound() : componenteRound()))}
      />
    ),
  },
  {
    id: 'e2-seguridad',
    title: '¿Seguro o peligroso?',
    icon: '⚠️',
    desc: 'Situaciones del taller de electrónica: ¿está bien o mal?',
    max: '200',
    component: () => (
      <QuizGame
        game="e2-seguridad"
        title="¿Seguro o peligroso?"
        icon="⚠️"
        info="10 situaciones: decidí si está bien o mal."
        intro={<p>El soldador, el humo, el plomo, el percloruro y la tensión de red.</p>}
        makeRounds={() =>
          shuffle(SEGURIDAD)
            .slice(0, 10)
            .map(([s, e, ok, ex]) => ({
              prompt: s,
              visual: <span className="quiz-emoji">{e}</span>,
              options: [
                { id: 'bien', label: '✔ Está bien' },
                { id: 'mal', label: '✘ Está mal' },
              ],
              answer: ok ? 'bien' : 'mal',
              explain: ex,
            }))
        }
      />
    ),
  },
]

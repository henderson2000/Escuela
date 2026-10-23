import type { GameDef } from '../../games/registry'
import { QuizGame, pickOne, shuffle, type QuizRound } from '../../games/QuizGame'
import { PartsGame } from '../../games/PartsGame'
import { ELEMENTS, SHELL_NAMES } from './atoms'
import './e1.css'

const fmt = (n: number, d = 2) => Number(n.toFixed(d)).toString().replace('.', ',')

/* ------------------------------------------------------------------ cables */

const WIRES = [
  { c: '#7a4a24', color: 'Marrón', f: 'Fase L1 (alterna)' },
  { c: '#4fb3e8', color: 'Celeste', f: 'Neutro (alterna)' },
  { c: 'vy', color: 'Verde y amarillo', f: 'Puesta a tierra' },
  { c: '#f2f2ee', color: 'Blanco', f: 'Retorno de iluminación' },
  { c: '#c1121f', color: 'Rojo', f: 'Fase L3 en alterna / positivo en continua' },
  { c: '#1b1b1d', color: 'Negro', f: 'Fase L2 en alterna / negativo en continua' },
]

const CABLE_FACTS: { q: string; ok: string; bad: string[]; explain: string }[] = [
  { q: '¿Qué cable usás para un alargue de una herramienta eléctrica?', ok: 'TPR multifilar', bad: ['Alambre desnudo', 'Alambre esmaltado', 'Cable sumergible'], explain: 'TPR: taller pesado reforzado, flexible y resistente.' },
  { q: '¿Con qué alambre se bobina un motor?', ok: 'Esmaltado', bad: ['TPR', 'Subterráneo', 'Libre de halógenos'], explain: 'El esmalte es una aislación finísima.' },
  { q: 'Hasta 1000 V en alterna es…', ok: 'Baja tensión', bad: ['Media tensión', 'Alta tensión', 'Muy alta tensión'], explain: 'BT: hasta 1000 V CA / 1500 V CC.' },
  { q: '20 kV es…', ok: 'Media tensión', bad: ['Baja tensión', 'Alta tensión', 'Muy alta tensión'], explain: 'MT: de 1 kV a 33 kV.' },
  { q: '500 kV es…', ok: 'Muy alta tensión', bad: ['Media tensión', 'Alta tensión', 'Baja tensión'], explain: 'MAT: más de 132 kV.' },
  { q: '¿Qué aislación es la más usada en las casas?', ok: 'PVC', bad: ['Silicona', 'Fibra de vidrio', 'Esmalte'], explain: 'Buena resistencia eléctrica y mecánica a bajo costo.' },
  { q: 'En un incendio hace poco humo y no larga gases tóxicos:', ok: 'Libre de halógenos (LSZH)', bad: ['PVC común', 'Desnudo', 'Esmaltado'], explain: 'Se usa en edificios públicos.' },
  { q: 'Un cable con un solo alambre es…', ok: 'Unifilar', bad: ['Multifilar', 'Unipolar sí o sí', 'Pentapolar'], explain: 'Unifilar = un hilo; multifilar = varias hebras.' },
  { q: 'Un cable con 4 conductores es…', ok: 'Tetrapolar', bad: ['Tripolar', 'Pentapolar', 'Bipolar'], explain: 'Tetra = 4.' },
  { q: '¿Qué aislación aguanta altas temperaturas (hornos)?', ok: 'Silicona', bad: ['PVC', 'Papel', 'Goma común'], explain: 'Silicona y fibra de vidrio son para altas temperaturas.' },
]

function wireVisual(c: string) {
  return <span className={`e1-wire big ${c === 'vy' ? 'vy' : ''}`} style={c === 'vy' ? undefined : { background: c }} />
}

function makeCableRounds(): QuizRound[] {
  const rounds: QuizRound[] = []
  for (const w of shuffle(WIRES).slice(0, 4)) {
    rounds.push({
      prompt: '¿Para qué se usa un cable de este color?',
      visual: wireVisual(w.c),
      options: shuffle([w, ...shuffle(WIRES.filter((x) => x !== w)).slice(0, 3)]).map((x) => ({ id: x.f, label: x.f })),
      answer: w.f,
      explain: `${w.color}: ${w.f}.`,
    })
  }
  for (const w of shuffle(WIRES.slice(0, 4)).slice(0, 2)) {
    rounds.push({
      prompt: `¿De qué color es el cable de: ${w.f.toLowerCase()}?`,
      visual: <span className="quiz-emoji">🎨</span>,
      options: shuffle([w, ...shuffle(WIRES.filter((x) => x !== w)).slice(0, 3)]).map((x) => ({ id: x.color, label: <span className="row">{wireVisual(x.c)} {x.color}</span> })),
      answer: w.color,
    })
  }
  for (const f of shuffle(CABLE_FACTS).slice(0, 4)) {
    rounds.push({
      prompt: f.q,
      visual: <span className="quiz-emoji">🧵</span>,
      options: shuffle([f.ok, ...f.bad]).map((x) => ({ id: x, label: x })),
      answer: f.ok,
      explain: f.explain,
    })
  }
  return shuffle(rounds)
}

/* ------------------------------------------------------------------ materiales y átomo */

const MATS: { e: string; name: string; kind: string }[] = [
  { e: '🥈', name: 'Plata', kind: 'Conductor' },
  { e: '🟠', name: 'Cobre', kind: 'Conductor' },
  { e: '🥇', name: 'Oro', kind: 'Conductor' },
  { e: '🥫', name: 'Aluminio', kind: 'Conductor' },
  { e: '💻', name: 'Silicio', kind: 'Semiconductor' },
  { e: '🔬', name: 'Germanio', kind: 'Semiconductor' },
  { e: '🪟', name: 'Vidrio', kind: 'Aislante' },
  { e: '🏺', name: 'Cerámica', kind: 'Aislante' },
  { e: '📄', name: 'Papel', kind: 'Aislante' },
  { e: '🛞', name: 'Goma', kind: 'Aislante' },
  { e: '🧪', name: 'PVC', kind: 'Aislante' },
  { e: '🪵', name: 'Madera seca', kind: 'Aislante' },
]

function makeMaterialRounds(): QuizRound[] {
  const kinds = ['Conductor', 'Semiconductor', 'Aislante']
  const rounds: QuizRound[] = shuffle(MATS)
    .slice(0, 6)
    .map((m) => ({
      prompt: `${m.name}: ¿qué tipo de material es?`,
      visual: <span className="quiz-emoji">{m.e}</span>,
      options: kinds.map((k) => ({ id: k, label: k })),
      answer: m.kind,
    }))
  // átomo: electrones de valencia y carga
  for (const el of shuffle(ELEMENTS.filter((e) => e.shells.length > 1)).slice(0, 2)) {
    const v = el.shells[el.shells.length - 1]
    const opts = [...new Set([v, v + 1, v - 1, v + 2, v + 3, 8, 2].filter((x) => x > 0))].slice(0, 4)
    rounds.push({
      prompt: `El ${el.name.toLowerCase()} tiene ${el.z} electrones (${el.shells.map((n, i) => `${SHELL_NAMES[i]}: ${i === el.shells.length - 1 ? '?' : n}`).join(', ')}). ¿Cuántos electrones de valencia tiene?`,
      visual: <span className="quiz-emoji">⚛️</span>,
      options: shuffle(opts).map((x) => ({ id: String(x), label: String(x) })),
      answer: String(v),
      explain: `${el.z} − ${el.shells.slice(0, -1).join(' − ')} = ${v}.`,
    })
  }
  const q = pickOne([
    { p: 'Un átomo neutro pierde un electrón. Queda…', ok: 'Ion positivo', o: ['Ion negativo', 'Neutro', 'Sin protones'] },
    { p: 'Un átomo neutro gana un electrón. Queda…', ok: 'Ion negativo', o: ['Ion positivo', 'Neutro', 'Sin neutrones'] },
  ])
  rounds.push({ prompt: q.p, visual: <span className="quiz-emoji">⚛️</span>, options: shuffle([q.ok, ...q.o]).map((x) => ({ id: x, label: x })), answer: q.ok })
  const q2 = pickOne([
    { p: '¿Qué partícula tiene carga positiva?', ok: 'Protón', o: ['Electrón', 'Neutrón', 'Ninguna'] },
    { p: '¿Qué partícula no tiene carga?', ok: 'Neutrón', o: ['Protón', 'Electrón', 'Ion'] },
    { p: '¿Cuántos electrones entran en la capa K?', ok: '2', o: ['8', '18', '32'] },
  ])
  rounds.push({ prompt: q2.p, visual: <span className="quiz-emoji">⚛️</span>, options: shuffle([q2.ok, ...q2.o]).map((x) => ({ id: x, label: x })), answer: q2.ok })
  return shuffle(rounds)
}

/* ------------------------------------------------------------------ cálculos */

const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

function numOptions(right: number, unit: string, d = 2): { id: string; label: string }[] {
  const wrong = new Set<string>()
  const r = fmt(right, d)
  const cands = [right * 2, right / 2, right * 10, right / 10, right + right * 0.5, right * 1.5, right * 4]
  for (const c of shuffle(cands)) {
    const s = fmt(c, d)
    if (s !== r && s !== '0') wrong.add(s)
    if (wrong.size === 3) break
  }
  return shuffle([r, ...wrong]).map((x) => ({ id: x, label: `${x} ${unit}` }))
}

function makeCalcRounds(): QuizRound[] {
  const rounds: QuizRound[] = []
  for (let k = 0; k < 10; k++) {
    const t = k % 5
    if (t === 0) {
      const r = rnd([10, 20, 22, 44, 50, 100, 110])
      const u = rnd([12, 24, 220])
      const i = u / r
      rounds.push({ prompt: `U = ${u} V y R = ${r} Ω. ¿Cuánto vale I?`, visual: <span className="quiz-emoji">Ω</span>, options: numOptions(i, 'A'), answer: fmt(i, 2), explain: `I = U / R = ${u} / ${r} = ${fmt(i, 2)} A` })
    } else if (t === 1) {
      const i = rnd([0.1, 0.2, 0.5, 2, 3])
      const r = rnd([10, 20, 40, 60, 100])
      const u = i * r
      rounds.push({ prompt: `I = ${fmt(i)} A y R = ${r} Ω. ¿Cuánto vale U?`, visual: <span className="quiz-emoji">🔋</span>, options: numOptions(u, 'V'), answer: fmt(u, 2), explain: `U = I · R = ${fmt(i)} · ${r} = ${fmt(u)} V` })
    } else if (t === 2) {
      const u = rnd([6, 12, 24, 220])
      const i = rnd([0.5, 1, 2, 4])
      const r = u / i
      rounds.push({ prompt: `U = ${u} V e I = ${fmt(i)} A. ¿Cuánto vale R?`, visual: <span className="quiz-emoji">🧮</span>, options: numOptions(r, 'Ω'), answer: fmt(r, 2), explain: `R = U / I = ${u} / ${fmt(i)} = ${fmt(r)} Ω` })
    } else if (t === 3) {
      const a = rnd([10, 22, 47, 100, 150, 220])
      const b = rnd([10, 33, 68, 100, 330])
      rounds.push({ prompt: `R1 = ${a} Ω y R2 = ${b} Ω en serie. ¿RT?`, visual: <span className="quiz-emoji">➖➖</span>, options: numOptions(a + b, 'Ω'), answer: fmt(a + b, 2), explain: `RT = ${a} + ${b} = ${a + b} Ω` })
    } else {
      const pair = rnd([
        [10, 10],
        [20, 20],
        [30, 60],
        [40, 10],
        [12, 6],
        [100, 100],
        [60, 30],
        [120, 60],
      ])
      const rt = (pair[0] * pair[1]) / (pair[0] + pair[1])
      rounds.push({ prompt: `R1 = ${pair[0]} Ω y R2 = ${pair[1]} Ω en paralelo. ¿RT?`, visual: <span className="quiz-emoji">🔀</span>, options: numOptions(rt, 'Ω'), answer: fmt(rt, 2), explain: `RT = ${pair[0]}·${pair[1]} / ${pair[0] + pair[1]} = ${fmt(rt)} Ω` })
    }
  }
  return shuffle(rounds)
}

/* ------------------------------------------------------------------ registro */

export const ELECTRICIDAD1_GAMES: GameDef[] = [
  {
    id: 'e1-partes',
    title: '¿Qué parte es?',
    icon: '🔍',
    desc: 'El átomo, el cable y el circuito aparecen despiezados en 3D: identificá la parte marcada.',
    max: '200',
    component: () => <PartsGame game="e1-partes" />,
  },
  {
    id: 'e1-cables',
    title: 'Cables al toque',
    icon: '🧵',
    desc: 'Colores de los cables, cantidad de conductores, tensiones y aislaciones. ¿Qué cable es y para qué sirve?',
    max: '200',
    component: () => (
      <QuizGame
        game="e1-cables"
        title="Cables al toque"
        icon="🧵"
        info="10 preguntas sobre los cables del apunte. Rápido = más puntos."
        intro={<p>Te muestran un cable o una situación: elegí la respuesta correcta lo más rápido que puedas.</p>}
        makeRounds={makeCableRounds}
      />
    ),
  },
  {
    id: 'e1-materiales',
    title: '¿Conduce o aísla?',
    icon: '⚛️',
    desc: 'Clasificá materiales en conductores, semiconductores y aislantes, y contá electrones de valencia.',
    max: '200',
    component: () => (
      <QuizGame
        game="e1-materiales"
        title="¿Conduce o aísla?"
        icon="⚛️"
        info="10 preguntas sobre el átomo y los materiales. Rápido = más puntos."
        intro={<p>¿Conductor, semiconductor o aislante? ¿Cuántos electrones de valencia? Respondé rápido.</p>}
        makeRounds={makeMaterialRounds}
      />
    ),
  },
  {
    id: 'e1-calculos',
    title: 'Calculá rápido',
    icon: '🧮',
    desc: 'Ley de Ohm y resistencia equivalente con números nuevos en cada partida.',
    max: '200',
    component: () => (
      <QuizGame
        game="e1-calculos"
        title="Calculá rápido"
        icon="🧮"
        info="10 cálculos con la ley de Ohm y resistencias en serie y en paralelo."
        intro={<p>Tené a mano papel o la calculadora: U = I · R, serie y paralelo.</p>}
        makeRounds={makeCalcRounds}
      />
    ),
  },
]

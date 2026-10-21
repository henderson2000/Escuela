import { TimingChart } from '../TimingChart'
import { Simulation, type BlockType, type Program } from '../engine'
import { QuizGame, pickOne, shuffle, type QuizRound } from './QuizGame'

const STEP = 100 // ms por muestra
const TOTAL = 14000

type Fn = 'TON' | 'TOF' | 'RI' | 'GEN' | 'RS'
const FN_NAMES: Record<Fn, string> = {
  TON: 'Retardo a la conexión (TON)',
  TOF: 'Retardo a la desconexión (TOF)',
  RI: 'Relé de impulsos',
  GEN: 'Generador de impulsos',
  RS: 'Relé autoenclavador (RS)',
}

const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

/** Simula un bloque con entradas definidas por intervalos [desde, hasta) en ms. */
function simulate(type: BlockType, params: Program['blocks'][number]['params'], inputs: [number, number][][]) {
  const blocks: Program['blocks'] = [
    { id: 'blk', type, x: 0, y: 0, params },
    { id: 'q', type: 'Q', n: 1, x: 0, y: 0 },
  ]
  const wires: Program['wires'] = [{ id: 'wq', from: 'blk', to: 'q', pin: 0 }]
  inputs.forEach((_, k) => {
    blocks.push({ id: `i${k}`, type: 'I', n: k + 1, x: 0, y: 0 })
    wires.push({ id: `w${k}`, from: `i${k}`, to: 'blk', pin: k })
  })
  const prog: Program = { blocks, wires, io: { I: {}, Q: {} } }
  const sim = new Simulation(prog)
  const ins: number[][] = inputs.map(() => [])
  const out: number[] = []
  for (let t = 0; t < TOTAL; t += STEP) {
    inputs.forEach((iv, k) => {
      const on = iv.some(([a, b]) => t >= a && t < b)
      sim.actuated[k + 1] = on
      ins[k].push(on ? 1 : 0)
    })
    sim.run(STEP)
    out.push(sim.output(1))
  }
  return { ins, out }
}

function scenario(fn: Fn) {
  const T = r(1, 3) * 1000
  switch (fn) {
    case 'TON': {
      const a = r(5, 10) * 100
      const b = a + T + r(10, 25) * 100
      const c = b + r(10, 15) * 100
      const short = c + Math.max(300, T - r(3, 6) * 100)
      const d = short + r(10, 15) * 100
      const e = Math.min(TOTAL - 500, d + T + r(10, 20) * 100)
      return { T, names: ['Trg'], ...simulate('TON', { T }, [[[a, b], [c, short], [d, e]]]) }
    }
    case 'TOF': {
      const a = r(5, 10) * 100
      const b = a + r(5, 10) * 100
      const c = b + T + r(10, 20) * 100
      const d = c + r(15, 25) * 100
      return { T, names: ['Trg'], ...simulate('TOF', { T }, [[[a, b], [c, d]]]) }
    }
    case 'RI': {
      const pulses: [number, number][] = []
      let t = r(5, 10) * 100
      for (let k = 0; k < 4; k++) {
        pulses.push([t, t + 400])
        t += r(20, 30) * 100
      }
      return { T: 0, names: ['Trg'], ...simulate('RI', {}, [pulses]) }
    }
    case 'GEN': {
      const th = r(4, 8) * 100
      const tl = r(4, 8) * 100
      const a = r(5, 15) * 100
      return { T: 0, names: ['En'], ...simulate('GEN', { TH: th, TL: tl }, [[[a, a + r(70, 100) * 100]]]) }
    }
    case 'RS': {
      const s1 = r(5, 10) * 100
      const r1 = s1 + r(25, 40) * 100
      const s2 = r1 + r(15, 25) * 100
      const r2 = Math.min(TOTAL - 800, s2 + r(20, 30) * 100)
      return { T: 0, names: ['S', 'R'], ...simulate('RS', {}, [[[s1, s1 + 400], [s2, s2 + 400]], [[r1, r1 + 400], [r2, r2 + 400]]]) }
    }
  }
}

function chart(sc: ReturnType<typeof scenario>, hideQ = false) {
  return (
    <TimingChart
      stepMs={STEP}
      traces={[...sc.names.map((n, k) => ({ label: n, values: sc.ins[k] })), ...(hideQ ? [] : [{ label: 'Q', values: sc.out }])]}
    />
  )
}

function makeRound(): QuizRound {
  const kind = pickOne(['funcion', 'funcion', 'tiempo'] as const)
  if (kind === 'tiempo') {
    const fn = pickOne<Fn>(['TON', 'TOF'])
    const sc = scenario(fn)
    const opts = shuffle([1000, 2000, 3000, 4000])
    return {
      prompt: <>Este es un {FN_NAMES[fn]}. Mirando el diagrama, ¿cuánto vale el tiempo T?</>,
      visual: chart(sc),
      options: opts.map((t) => ({ id: String(t), label: `T = ${t / 1000} s` })),
      answer: String(sc.T),
      explain:
        fn === 'TON' ? (
          <>La salida se activa {sc.T / 1000} s después de que Trg pasa a 1 (si Trg dura menos, la salida ni se entera).</>
        ) : (
          <>La salida se queda activa {sc.T / 1000} s después de que Trg vuelve a 0.</>
        ),
    }
  }
  const fn = pickOne<Fn>(['TON', 'TOF', 'RI', 'GEN', 'RS'])
  const sc = scenario(fn)
  const pool: Fn[] = fn === 'RS' ? ['RS', 'RI', 'TON', 'TOF'] : (shuffle((['TON', 'TOF', 'RI', 'GEN', 'RS'] as Fn[]).filter((x) => x !== fn)).slice(0, 3) as Fn[]).concat(fn)
  const explain: Record<Fn, string> = {
    TON: 'La salida se activa un tiempo después de que la entrada pasa a 1, y se apaga junto con la entrada.',
    TOF: 'La salida se activa junto con la entrada y se apaga un tiempo después de que la entrada vuelve a 0.',
    RI: 'Cada pulso en Trg cambia el estado de la salida: prende, apaga, prende…',
    GEN: 'Mientras la entrada está en 1, la salida se prende y se apaga sola (intermitente).',
    RS: 'S prende la salida y queda prendida aunque S vuelva a 0; R la apaga.',
  }
  return {
    prompt: '¿Qué función del LOGO! produce esta salida Q?',
    visual: chart(sc),
    options: shuffle(pool).map((f) => ({ id: f, label: FN_NAMES[f] })),
    answer: fn,
    explain: explain[fn],
  }
}

export function TimersGame() {
  return (
    <QuizGame
      game="logo-tiempos"
      title="Diagramas de tiempo"
      icon="⏱"
      info="Mirá cómo cambian la entrada y la salida en el tiempo y descubrí qué función especial las produce o cuánto vale su tiempo."
      intro={<p>10 diagramas. Respuesta correcta: 15 puntos + hasta 5 de bonus por rapidez (máximo 200).</p>}
      makeRounds={() => Array.from({ length: 10 }, makeRound)}
    />
  )
}

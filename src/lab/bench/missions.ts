// Misiones guiadas de la mesa de trabajo: Armar → Cablear → Programar → Probar.
// Cada paso se comprueba solo: los componentes colocados, el circuito (con la red de conexiones),
// el programa (que compile y tenga lo pedido) y lo que pasa al ejecutarlo (observando la simulación).

import { seg, seriesChain, type CompKind, type Netlist, type Placed } from '../../lib/circuit'
import type { SimResult } from '../sim/solve'

export interface Sample {
  t: number
  /** brillo de cada LED (por id) */
  leds: Record<string, number>
  pressed: boolean
  pots: Record<string, number>
  serial: string
}

export interface MissionCtx {
  placed: Placed[]
  nl: Netlist
  sim: SimResult
}

export interface Mission {
  id: string
  title: string
  icon: string
  level: 'Inicial' | 'Intermedio' | 'Desafío'
  goal: string
  /** qué hay que colocar */
  parts: { kind: CompKind; n: number; label: string; color?: string }[]
  wireHint: string
  checkWire: (c: MissionCtx) => string | null
  startCode: string
  /** requisitos del programa: [texto, prueba] */
  codeReqs: [string, (code: string) => boolean][]
  /** cómo probarlo (se muestra mientras corre) */
  testHint: string
  /** recibe lo observado hasta ahora; null = todavía no / string = ok con mensaje */
  test: (samples: Sample[], c: MissionCtx) => { ok: boolean; msg: string }
  /** tiempo máximo de observación (s) antes de decir qué faltó */
  maxSeconds: number
}

const P = (n: string) => `ard:${n}`
const GND = 'ard:GND'
const of = (placed: Placed[], k: CompKind) => placed.filter((p) => p.kind === k)
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const has = (re: RegExp) => (code: string) => re.test(noComments(code))

/** ¿Hay un LED con resistencia (150 Ω a 1 kΩ) entre `from` y GND? Devuelve el LED o un mensaje. */
function ledPath(c: MissionCtx, from: string, fromName: string, color?: string, extra: Placed[] = []): Placed | string {
  const leds = of(c.placed, 'led').filter((l) => !color || l.color === color)
  const rs = of(c.placed, 'resistencia')
  const start = c.nl.net(from)
  const end = c.nl.net(GND)
  for (const led of leds)
    for (const r of rs)
      if (seriesChain(c.nl, start, end, [seg(r), seg(led), ...extra.map(seg)])) {
        if ((r.value ?? 0) > 1000) return `El LED de ${fromName} está bien conectado, pero con ${r.value! / 1000} kΩ casi no se va a ver. Usá 220 Ω o 330 Ω.`
        return led
      }
  for (const led of leds)
    for (const r of rs)
      if (seriesChain(c.nl, start, end, [seg(r), seg({ ...led, kind: 'resistencia' }), ...extra.map(seg)]))
        return `El LED de ${fromName} está al revés: el ánodo (pata larga, +) va hacia ${fromName} y el cátodo hacia GND.`
  for (const led of leds) if (seriesChain(c.nl, start, end, [seg(led), ...extra.map(seg)])) return `El LED de ${fromName} está directo, sin resistencia: se quemaría.`
  return `Todavía no hay un camino ${fromName} → resistencia → LED → GND. Pasá el mouse por los orificios: se marcan las tiras conectadas.`
}

/** ¿Cuántas veces cambió de prendido a apagado (o al revés) un LED? */
function toggles(samples: Sample[], id: string) {
  let n = 0
  let prev: boolean | null = null
  for (const s of samples) {
    const on = (s.leds[id] ?? 0) > 0.3
    if (prev !== null && on !== prev) n++
    prev = on
  }
  return n
}

const RED = '#ff2a2a'
const YELLOW = '#ffd21a'
const GREEN = '#2aff5a'

const TEMPLATE = (extra = '') => `${extra}void setup() {
  // configurá los pines

}

void loop() {
  // lo que se repite

}
`

export const MISSIONS: Mission[] = [
  {
    id: 'm-blink',
    title: 'Blink con un LED externo',
    icon: '💡',
    level: 'Inicial',
    goal: 'Hacé parpadear un LED conectado al pin 12: medio segundo prendido y medio segundo apagado.',
    parts: [
      { kind: 'led', n: 1, label: 'un LED (cualquier color)' },
      { kind: 'resistencia', n: 1, label: 'una resistencia de 220 Ω' },
    ],
    wireHint: 'Un cable del pin 12 a una columna; ahí una pata de la resistencia; la otra pata, al ánodo (+) del LED; el cátodo, con un cable a GND (podés usar el riel −).',
    checkWire: (c) => {
      const r = ledPath(c, P('12'), 'el pin 12')
      return typeof r === 'string' ? r : null
    },
    startCode: TEMPLATE('// Blink en el pin 12\n'),
    codeReqs: [
      ['Configurar el pin 12 como salida: pinMode(12, OUTPUT);', has(/pinMode\s*\(\s*(12|\w+)\s*,\s*OUTPUT\s*\)/)],
      ['Prenderlo con digitalWrite(…, HIGH)', has(/digitalWrite\s*\([^)]*HIGH\s*\)/)],
      ['Apagarlo con digitalWrite(…, LOW)', has(/digitalWrite\s*\([^)]*LOW\s*\)/)],
      ['Esperar con delay(500)', has(/delay\s*\(\s*500\s*\)/)],
    ],
    testHint: 'Ejecutá el programa y mirá el LED: tiene que prender y apagar varias veces.',
    maxSeconds: 6,
    test: (s, c) => {
      const led = ledPath(c, P('12'), 'el pin 12')
      if (typeof led === 'string') return { ok: false, msg: led }
      const n = toggles(s, led.id)
      return n >= 4 ? { ok: true, msg: `¡Parpadea! Cambió ${n} veces.` } : { ok: false, msg: n ? 'Cambió pocas veces: ¿pusiste un delay entre el HIGH y el LOW, y otro después del LOW?' : 'El LED no cambia. ¿Usaste el pin 12 en pinMode y digitalWrite?' }
    },
  },
  {
    id: 'm-semaforo',
    title: 'Semáforo',
    icon: '🚦',
    level: 'Inicial',
    goal: 'Armá un semáforo con tres LEDs: verde en el pin 8, amarillo en el 9 y rojo en el 10. Tienen que prenderse de a uno, en orden: verde → amarillo → rojo.',
    parts: [
      { kind: 'led', n: 1, label: 'un LED verde', color: GREEN },
      { kind: 'led', n: 1, label: 'un LED amarillo', color: YELLOW },
      { kind: 'led', n: 1, label: 'un LED rojo', color: RED },
      { kind: 'resistencia', n: 3, label: 'tres resistencias de 220 Ω' },
    ],
    wireHint: 'Tres circuitos iguales al del Blink, uno por LED. Los tres cátodos pueden ir al mismo riel − (GND).',
    checkWire: (c) => {
      for (const [pin, color, name] of [
        ['8', GREEN, 'verde'],
        ['9', YELLOW, 'amarillo'],
        ['10', RED, 'rojo'],
      ]) {
        const r = ledPath(c, P(pin), `el pin ${pin}`, color)
        if (typeof r === 'string') return `LED ${name}: ${r}`
      }
      return null
    },
    startCode: TEMPLATE('// Semáforo: verde 8, amarillo 9, rojo 10\n'),
    codeReqs: [
      ['Los tres pines como salida (pinMode … OUTPUT)', (c) => (noComments(c).match(/pinMode\s*\([^)]*OUTPUT/g)?.length ?? 0) >= 3],
      ['Usar delay para los tiempos (que sean cortos para probarlo: 1000 ms o menos)', has(/delay\s*\(/)],
    ],
    testHint: 'Ejecutalo: tiene que prenderse el verde, después el amarillo y después el rojo, de a uno.',
    maxSeconds: 12,
    test: (s, c) => {
      const ids = (['8', '9', '10'] as const).map((p, i) => ledPath(c, P(p), p, [GREEN, YELLOW, RED][i]))
      if (ids.some((x) => typeof x === 'string')) return { ok: false, msg: 'Revisá el cableado de los tres LEDs.' }
      const [g, y, r] = (ids as Placed[]).map((l) => l.id)
      const seq: string[] = []
      for (const smp of s) {
        const on = [g, y, r].filter((id) => (smp.leds[id] ?? 0) > 0.3)
        if (on.length > 1) return { ok: false, msg: 'Hay dos luces prendidas a la vez: apagá una antes de prender la siguiente.' }
        if (on.length === 1 && seq[seq.length - 1] !== on[0]) seq.push(on[0])
      }
      const txt = seq.map((id) => (id === g ? 'V' : id === y ? 'A' : 'R')).join('')
      if (/VAR/.test(txt) || /ARV/.test(txt) || /RVA/.test(txt)) return { ok: true, msg: 'Verde → amarillo → rojo. ¡Funciona como un semáforo!' }
      if (txt.length >= 3) return { ok: false, msg: `El orden fue ${txt.slice(0, 4).split('').join(' → ')}… (V = verde, A = amarillo, R = rojo). Tiene que ser V → A → R.` }
      return { ok: false, msg: 'Todavía no se vieron las tres luces. Si los delay son largos, esperá un poco más.' }
    },
  },
  {
    id: 'm-pulsador',
    title: 'Pulsador que prende un LED',
    icon: '🔘',
    level: 'Intermedio',
    goal: 'Mientras apretás el pulsador (en el pin 2) se prende el LED del pin 12. Usá la resistencia pull-up interna: pinMode(2, INPUT_PULLUP).',
    parts: [
      { kind: 'pulsador', n: 1, label: 'un pulsador' },
      { kind: 'led', n: 1, label: 'un LED' },
      { kind: 'resistencia', n: 1, label: 'una resistencia de 220 Ω' },
    ],
    wireHint: 'Pulsador: una pata al pin 2 y la otra a GND (con INPUT_PULLUP no hace falta resistencia). El LED, como en el Blink, en el pin 12.',
    checkWire: (c) => {
      const btn = of(c.placed, 'pulsador')[0]
      if (!btn) return 'Falta el pulsador.'
      const nets = btn.legs.map(c.nl.net)
      const p2 = c.nl.net(P('2'))
      const g = c.nl.net(GND)
      if (!(nets.includes(p2) && nets.includes(g))) return 'El pulsador tiene que unir el pin 2 con GND: una pata en la tira del pin 2 y la otra en la de GND.'
      const r = ledPath(c, P('12'), 'el pin 12')
      return typeof r === 'string' ? r : null
    },
    startCode: TEMPLATE('// Pulsador en 2, LED en 12\n'),
    codeReqs: [
      ['Pin 2 como entrada con pull-up: pinMode(2, INPUT_PULLUP);', has(/pinMode\s*\(\s*\w+\s*,\s*INPUT_PULLUP\s*\)/)],
      ['Pin 12 como salida', has(/pinMode\s*\(\s*\w+\s*,\s*OUTPUT\s*\)/)],
      ['Leer el pulsador con digitalRead', has(/digitalRead\s*\(/)],
      ['Decidir con un if (apretado = LOW)', has(/\bif\s*\(/)],
    ],
    testHint: 'Ejecutalo. Con la herramienta 👆 Usar, mantené apretado el pulsador (clic sostenido) y soltalo un par de veces.',
    maxSeconds: 25,
    test: (s, c) => {
      const led = ledPath(c, P('12'), 'el pin 12')
      if (typeof led === 'string') return { ok: false, msg: led }
      const pressedOn = s.filter((x) => x.pressed).map((x) => (x.leds[led.id] ?? 0) > 0.3)
      const releasedOff = s.filter((x) => !x.pressed).map((x) => (x.leds[led.id] ?? 0) <= 0.3)
      if (pressedOn.length < 3) return { ok: false, msg: 'Apretá el pulsador (clic sostenido sobre él) para probarlo.' }
      const okP = pressedOn.filter(Boolean).length / pressedOn.length
      const okR = releasedOff.filter(Boolean).length / Math.max(1, releasedOff.length)
      if (okP > 0.7 && okR > 0.7) return { ok: true, msg: 'Apretado → prende, suelto → apaga. ¡Perfecto!' }
      if (okP < 0.3 && okR < 0.3) return { ok: false, msg: 'Hace lo contrario: con INPUT_PULLUP el pin lee LOW cuando está apretado.' }
      return { ok: false, msg: 'El LED no sigue al pulsador todavía. Revisá el if con digitalRead(2) == LOW.' }
    },
  },
  {
    id: 'm-dimmer',
    title: 'Dimmer con potenciómetro',
    icon: '🎛',
    level: 'Intermedio',
    goal: 'El potenciómetro (en A0) regula el brillo del LED del pin 9 con PWM. Además, mandá el valor leído al monitor serie.',
    parts: [
      { kind: 'potenciometro', n: 1, label: 'un potenciómetro' },
      { kind: 'led', n: 1, label: 'un LED' },
      { kind: 'resistencia', n: 1, label: 'una resistencia de 220 Ω' },
    ],
    wireHint: 'Potenciómetro: un extremo a 5V, el del medio (cursor) a A0 y el otro extremo a GND. El LED, como en el Blink, pero en el pin 9 (tiene ~, o sea PWM).',
    checkWire: (c) => {
      const pot = of(c.placed, 'potenciometro')[0]
      if (!pot) return 'Falta el potenciómetro.'
      const [a, w, b] = pot.legs.map(c.nl.net)
      if (w !== c.nl.net(P('A0'))) return 'El cursor (la pata del medio) del potenciómetro tiene que ir a A0.'
      const v5 = c.nl.net(P('5V'))
      const g = c.nl.net(GND)
      if (!((a === v5 && b === g) || (a === g && b === v5))) return 'Los extremos del potenciómetro van uno a 5V y el otro a GND.'
      const r = ledPath(c, P('9'), 'el pin 9')
      return typeof r === 'string' ? r : null
    },
    startCode: TEMPLATE('// Dimmer: potenciómetro en A0, LED en 9\n'),
    codeReqs: [
      ['Leer el potenciómetro: analogRead(A0)', has(/analogRead\s*\(\s*A0\s*\)/)],
      ['Pasar de 0–1023 a 0–255 (map o dividir por 4)', has(/map\s*\(|\/\s*4\b/)],
      ['Regular el brillo: analogWrite(9, …)', has(/analogWrite\s*\(\s*(9|\w+)\s*,/)],
      ['Mostrar el valor: Serial.begin y Serial.println', (c) => has(/Serial\.begin\s*\(/)(c) && has(/Serial\.print(ln)?\s*\(/)(c)],
    ],
    testHint: 'Ejecutalo y mové la perilla (panel de la derecha, "Perillas") de punta a punta: el LED tiene que pasar de apagado a brillante.',
    maxSeconds: 30,
    test: (s, c) => {
      const led = ledPath(c, P('9'), 'el pin 9')
      if (typeof led === 'string') return { ok: false, msg: led }
      const b = s.map((x) => x.leds[led.id] ?? 0)
      const lo = Math.min(...b)
      const hi = Math.max(...b)
      const serialOk = /\d/.test(s[s.length - 1]?.serial ?? '')
      if (hi - lo > 0.5 && serialOk) return { ok: true, msg: 'El brillo sigue a la perilla y el valor aparece en el monitor serie. ¡Muy bien!' }
      if (hi - lo > 0.5) return { ok: false, msg: 'El brillo cambia, pero no aparece ningún número en el monitor serie.' }
      return { ok: false, msg: 'Mové la perilla de 0 % a 100 %: el brillo todavía no cambió lo suficiente.' }
    },
  },
  {
    id: 'm-contador',
    title: 'Contador de pulsaciones',
    icon: '🔢',
    level: 'Desafío',
    goal: 'Cada vez que apretás el pulsador (pin 2, con INPUT_PULLUP) se suma 1 y se muestra en el monitor serie: 1, 2, 3… Ojo: tiene que contar una vez por apretada, no muchas mientras lo tenés apretado.',
    parts: [{ kind: 'pulsador', n: 1, label: 'un pulsador' }],
    wireHint: 'Pulsador entre el pin 2 y GND.',
    checkWire: (c) => {
      const btn = of(c.placed, 'pulsador')[0]
      if (!btn) return 'Falta el pulsador.'
      const nets = btn.legs.map(c.nl.net)
      return nets.includes(c.nl.net(P('2'))) && nets.includes(c.nl.net(GND)) ? null : 'El pulsador tiene que unir el pin 2 con GND.'
    },
    startCode: TEMPLATE('// Contador: pulsador en 2\nint cuenta = 0;\nint anterior = HIGH;\n\n'),
    codeReqs: [
      ['Pin 2 con INPUT_PULLUP', has(/INPUT_PULLUP/)],
      ['Una variable que cuente (cuenta++ o cuenta = cuenta + 1)', has(/\+\+|\+=\s*1|=\s*\w+\s*\+\s*1/)],
      ['Mostrarla con Serial.println', has(/Serial\.println\s*\(/)],
      ['Detectar el cambio (comparar con el estado anterior)', has(/anterior|previo|ultimo|último|last/i)],
    ],
    testHint: 'Ejecutalo y apretá el pulsador 3 veces, despacio. En el monitor serie tiene que aparecer 1, 2, 3.',
    maxSeconds: 40,
    test: (s) => {
      const presses = s.reduce((n, x, i) => n + (x.pressed && !(s[i - 1]?.pressed ?? false) ? 1 : 0), 0)
      const nums = (s[s.length - 1]?.serial ?? '').match(/-?\d+/g)?.map(Number) ?? []
      if (presses < 3) return { ok: false, msg: `Apretaste ${presses} ${presses === 1 ? 'vez' : 'veces'}: apretalo 3 veces.` }
      if (nums.length > presses + 1) return { ok: false, msg: `Contó ${nums.length} veces con ${presses} apretadas: cuenta mientras está apretado. Sumá sólo cuando pasa de HIGH a LOW.` }
      const last = nums[nums.length - 1] ?? 0
      if (last >= 3 && nums.every((v, i) => i === 0 || v === nums[i - 1] + 1)) return { ok: true, msg: `Contó ${nums.join(', ')}. ¡Una por apretada!` }
      return { ok: false, msg: `En el monitor serie aparece: ${nums.slice(-6).join(', ') || 'nada'}. Tiene que ir 1, 2, 3…` }
    },
  },
]

export const missionActivityId = (id: string) => `mesa-${id}`

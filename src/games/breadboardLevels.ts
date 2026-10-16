import { seriesChain, seg, type CompKind, type Netlist, type Placed } from '../lib/circuit'

export interface Tool {
  kind: CompKind
  label: string
  value?: number
  color?: string
}

export interface BBLevel {
  id: string
  title: string
  goal: string
  tools: Tool[]
  hint: string
  /** devuelve null si está bien, o un mensaje con el problema */
  check: (nl: Netlist, placed: Placed[]) => string | null
}

const P5 = 'ard:5V'
const GND = 'ard:GND'
const pin = (n: string) => `ard:${n}`

const WIRES: Tool[] = [
  { kind: 'cable', label: 'Cable rojo', color: '#e02424' },
  { kind: 'cable', label: 'Cable negro', color: '#202020' },
  { kind: 'cable', label: 'Cable amarillo', color: '#f2c40f' },
  { kind: 'cable', label: 'Cable azul', color: '#2563eb' },
]
const R220: Tool = { kind: 'resistencia', label: 'Resistencia 220 Ω', value: 220 }
const R10K: Tool = { kind: 'resistencia', label: 'Resistencia 10 kΩ', value: 10000 }
const LEDR: Tool = { kind: 'led', label: 'LED rojo', color: '#ff2a2a' }
const LEDG: Tool = { kind: 'led', label: 'LED verde', color: '#2aff5a' }
const LEDY: Tool = { kind: 'led', label: 'LED amarillo', color: '#ffd21a' }
const BTN: Tool = { kind: 'pulsador', label: 'Pulsador' }
const POT: Tool = { kind: 'potenciometro', label: 'Potenciómetro 10 kΩ', value: 10000 }

const of = (placed: Placed[], k: CompKind) => placed.filter((p) => p.kind === k)

/** Revisa un LED con su resistencia entre `from` y GND, con mensajes útiles. */
function ledCircuit(nl: Netlist, placed: Placed[], from: string, fromName: string, extra: Placed[] = []): string | null {
  const leds = of(placed, 'led')
  const rs = of(placed, 'resistencia')
  if (leds.length === 0) return 'Falta colocar el LED.'
  if (rs.length === 0) return '¡Falta la resistencia! Sin ella el LED se quemaría.'
  const start = nl.net(from)
  const end = nl.net(GND)
  for (const led of leds)
    for (const r of rs) {
      if (seriesChain(nl, start, end, [seg(r), seg(led), ...extra.map(seg)])) {
        if (r.value !== 220) return 'El circuito está bien armado, pero con 10 kΩ el LED casi no se ve. Usá la de 220 Ω.'
        return null
      }
    }
  for (const led of leds)
    for (const r of rs) {
      const flipped = { ...led, kind: 'resistencia' as CompKind }
      if (seriesChain(nl, start, end, [seg(r), seg(flipped), ...extra.map(seg)]))
        return '¡Casi! El LED está al revés: el ánodo (pata larga) tiene que ir hacia ' + fromName + ' y el cátodo hacia GND.'
    }
  for (const led of leds) if (seriesChain(nl, start, end, [seg(led)])) return '¡Peligro! El LED está conectado directo, sin resistencia.'
  return `Todavía no hay un camino ${fromName} → resistencia → LED → GND. Revisá que cada pata esté en la tira correcta.`
}

export const BB_LEVELS: BBLevel[] = [
  {
    id: 'led5v',
    title: '1. Prender un LED',
    goal: 'Conectá un LED con su resistencia de 220 Ω entre 5V y GND del Arduino.',
    tools: [...WIRES, R220, R10K, LEDR],
    hint: 'Llevá 5V y GND a los rieles con dos cables. Después: riel + → resistencia → ánodo del LED; cátodo → riel −.',
    check: (nl, placed) => ledCircuit(nl, placed, P5, '5V'),
  },
  {
    id: 'blink',
    title: '2. Blink en el pin 13',
    goal: 'Ahora el LED tiene que estar controlado por el programa: conectalo al pin digital 13 (con su resistencia) y a GND.',
    tools: [...WIRES, R220, R10K, LEDG],
    hint: 'Un cable desde el pin 13 hasta una columna; ahí la resistencia, después el LED y su cátodo a GND.',
    check: (nl, placed) => ledCircuit(nl, placed, pin('13'), 'el pin 13'),
  },
  {
    id: 'pulsador-led',
    title: '3. Timbre de luz',
    goal: 'Sin programa: el LED tiene que prenderse sólo mientras se aprieta el pulsador. Todo en serie entre 5V y GND.',
    tools: [...WIRES, R220, R10K, LEDY, BTN],
    hint: '5V → pulsador → resistencia → LED → GND. El pulsador puede ir en cualquier lugar de la cadena.',
    check: (nl, placed) => {
      const btns = of(placed, 'pulsador')
      if (btns.length === 0) return 'Falta el pulsador.'
      return ledCircuit(nl, placed, P5, '5V', [btns[0]])
    },
  },
  {
    id: 'pulldown',
    title: '4. Pulsador con pull-down',
    goal: 'Conectá un pulsador para que el pin 2 lea HIGH al apretarlo: pulsador entre 5V y el pin 2, y una resistencia de 10 kΩ del pin 2 a GND.',
    tools: [...WIRES, R220, R10K, BTN],
    hint: 'El pin 2 tiene que llegar a una columna donde se unan una pata del pulsador y una pata de la resistencia.',
    check: (nl, placed) => {
      const btns = of(placed, 'pulsador')
      const rs = of(placed, 'resistencia')
      if (!btns.length) return 'Falta el pulsador.'
      if (!rs.length) return 'Falta la resistencia pull-down.'
      const d2 = nl.net(pin('2'))
      const okBtn = btns.some((b) => seriesChain(nl, nl.net(P5), d2, [seg(b)]))
      if (!okBtn) return 'El pulsador tiene que unir 5V con el pin 2.'
      const r = rs.find((x) => seriesChain(nl, d2, nl.net(GND), [seg(x)]))
      if (!r) return 'Falta la resistencia entre el pin 2 y GND (pull-down).'
      if (r.value !== 10000) return 'Funciona, pero con 220 Ω, al apretar circulan 23 mA desperdiciados. Para pull-down se usa 10 kΩ.'
      return null
    },
  },
  {
    id: 'pote',
    title: '5. Potenciómetro en A0',
    goal: 'Conectá el potenciómetro como divisor de tensión: los extremos a 5V y GND, y el cursor (pata del medio) a la entrada analógica A0.',
    tools: [...WIRES, POT, R220],
    hint: 'Colocá el potenciómetro en tres columnas seguidas. Extremo 1 → 5V, cursor → A0, extremo 3 → GND.',
    check: (nl, placed) => {
      const pots = of(placed, 'potenciometro')
      if (!pots.length) return 'Falta el potenciómetro.'
      for (const p of pots) {
        const [a, w, b] = p.legs.map(nl.net)
        const ends = new Set([a, b])
        const okEnds = ends.has(nl.net(P5)) && ends.has(nl.net(GND))
        const okW = w === nl.net(pin('A0'))
        if (okEnds && okW) return null
        if (!okW && ends.has(nl.net(pin('A0')))) return 'A0 tiene que ir al cursor (la pata del MEDIO), no a un extremo.'
        if (!okEnds) return 'Los extremos del potenciómetro van uno a 5V y otro a GND.'
        return 'El cursor (pata del medio) tiene que ir a A0.'
      }
      return 'Revisá las conexiones.'
    },
  },
  {
    id: 'semaforo',
    title: '6. Semáforo',
    goal: 'Tres LEDs (rojo, amarillo y verde) en los pines 13, 12 y 11, cada uno con su propia resistencia de 220 Ω a GND.',
    tools: [...WIRES, R220, LEDR, LEDY, LEDG],
    hint: 'Usá el riel − como GND común para los tres. Cada pin → su resistencia → su LED → riel −.',
    check: (nl, placed) => {
      const leds = of(placed, 'led')
      const rs = of(placed, 'resistencia')
      if (leds.length < 3) return `Faltan LEDs: hay ${leds.length} de 3.`
      if (rs.length < 3) return `Faltan resistencias: hay ${rs.length} de 3. Cada LED necesita la suya.`
      const pins = ['13', '12', '11']
      const usedL = new Set<string>()
      const usedR = new Set<string>()
      const solve = (k: number): boolean => {
        if (k === pins.length) return true
        for (const l of leds) {
          if (usedL.has(l.id)) continue
          for (const r of rs) {
            if (usedR.has(r.id)) continue
            if (seriesChain(nl, nl.net(pin(pins[k])), nl.net(GND), [seg(r), seg(l)])) {
              usedL.add(l.id)
              usedR.add(r.id)
              if (solve(k + 1)) return true
              usedL.delete(l.id)
              usedR.delete(r.id)
            }
          }
        }
        return false
      }
      if (solve(0)) return null
      for (const n of pins) {
        const ok = leds.some((l) => rs.some((r) => seriesChain(nl, nl.net(pin(n)), nl.net(GND), [seg(r), seg(l)])))
        if (!ok) return `El pin ${n} todavía no tiene su LED con resistencia hasta GND (o hay un LED al revés).`
      }
      return 'Cada LED tiene que tener su propia resistencia.'
    },
  },
]

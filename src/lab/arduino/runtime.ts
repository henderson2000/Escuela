// Ejecuta un programa de Arduino ya traducido (ver compile.ts) con un reloj simulado.
// La placa "real" (qué tensión hay en cada pin) la resuelve el simulador eléctrico a través de `io`.

import type { Compiled } from './compile'

export interface BoardIO {
  pinMode(pin: number, mode: 'OUTPUT' | 'INPUT' | 'INPUT_PULLUP'): void
  /** valor 0 a 1 (1 = HIGH; entre medio = PWM) */
  write(pin: number, value: number): void
  readDigital(pin: number): number
  readAnalog(pin: number): number
  tone(pin: number, freq: number | null): void
  serial(text: string): void
  /** ángulo de un servo conectado a ese pin (null = se desconectó) */
  servo(pin: number, angle: number | null): void
  /** duración del pulso que llega al pin (µs); 0 si no llega nada */
  pulseIn(pin: number, value: number): number
}

class Stop extends Error {}

const PWM_PINS = new Set([3, 5, 6, 9, 10, 11])

export class ArduinoRunner {
  private stopped = false
  private now = 0 // ms simulados
  private ops = 0
  private timers = new Set<number>()
  private wake: (() => void) | null = null
  constructor(private io: BoardIO) {}

  millis() {
    return Math.floor(this.now)
  }

  stop() {
    this.stopped = true
    this.timers.forEach((t) => clearTimeout(t))
    this.timers.clear()
    this.wake?.()
  }

  private sleep(ms: number) {
    return new Promise<void>((res) => {
      const t = window.setTimeout(() => {
        this.timers.delete(t)
        this.wake = null
        res()
      }, ms)
      this.timers.add(t)
      this.wake = () => {
        clearTimeout(t)
        this.timers.delete(t)
        res()
      }
    })
  }

  /** Se llama en cada vuelta de un bucle: avanza el reloj y cada tanto deja respirar a la página. */
  private tick = async () => {
    if (this.stopped) throw new Stop()
    this.now += 0.002
    if (++this.ops % 400 === 0) {
      await this.sleep(0)
      if (this.stopped) throw new Stop()
    }
  }

  private delay = async (ms: number) => {
    if (this.stopped) throw new Stop()
    const d = Math.max(0, Number(ms) || 0)
    this.now += d
    await this.sleep(d)
    if (this.stopped) throw new Stop()
  }

  async run(c: Compiled, onError: (msg: string) => void) {
    const io = this.io
    const fmt = (v: unknown, base?: number): string => {
      if (typeof v === 'number') {
        if (base === 2) return Math.trunc(v).toString(2)
        if (base === 16) return Math.trunc(v).toString(16).toUpperCase()
        if (Number.isInteger(v)) return String(v)
        return v.toFixed(typeof base === 'number' && base < 10 ? base : 2)
      }
      if (typeof v === 'boolean') return v ? '1' : '0'
      return String(v ?? '')
    }
    const Serial = {
      begin: () => undefined,
      print: (v: unknown = '', base?: number) => io.serial(fmt(v, base)),
      println: (v: unknown = '', base?: number) => io.serial(fmt(v, base) + '\n'),
      available: () => 0,
      read: () => -1,
      write: (v: unknown) => io.serial(typeof v === 'number' ? String.fromCharCode(v) : String(v)),
      end: () => undefined,
    }
    const api: Record<string, unknown> = {
      HIGH: 1,
      LOW: 0,
      INPUT: 'INPUT',
      OUTPUT: 'OUTPUT',
      INPUT_PULLUP: 'INPUT_PULLUP',
      LED_BUILTIN: 13,
      A0: 14,
      A1: 15,
      A2: 16,
      A3: 17,
      A4: 18,
      A5: 19,
      DEC: 10,
      HEX: 16,
      BIN: 2,
      PI: Math.PI,
      Serial,
      F: (s: string) => s,
      pinMode: (p: number, m: 'OUTPUT' | 'INPUT' | 'INPUT_PULLUP') => io.pinMode(p, m),
      digitalWrite: (p: number, v: number) => io.write(p, v ? 1 : 0),
      digitalRead: (p: number) => io.readDigital(p),
      analogRead: (p: number) => io.readAnalog(p < 14 ? p + 14 : p),
      analogWrite: (p: number, v: number) => {
        const x = Math.max(0, Math.min(255, Math.trunc(v)))
        io.write(p, PWM_PINS.has(p) ? x / 255 : x >= 128 ? 1 : 0)
      },
      tone: (p: number, f: number, dur?: number) => {
        io.tone(p, f)
        if (dur) window.setTimeout(() => !this.stopped && io.tone(p, null), dur)
      },
      noTone: (p: number) => io.tone(p, null),
      delay: this.delay,
      delayMicroseconds: (us: number) => this.delay(us / 1000),
      pulseIn: async (p: number, v: number, timeout = 1000000) => {
        const us = io.pulseIn(p, v)
        // esperar el pulso también lleva tiempo (o el tiempo máximo si no llega)
        await this.delay((us > 0 ? us * 2 : Math.min(timeout, 1000000)) / 1000)
        return us
      },
      Servo: makeServo(io),
      millis: () => Math.floor(this.now),
      micros: () => Math.floor(this.now * 1000),
      map: (x: number, a: number, b: number, c: number, d: number) => Math.trunc(((x - a) * (d - c)) / (b - a) + c),
      constrain: (x: number, a: number, b: number) => Math.min(b, Math.max(a, x)),
      min: Math.min,
      max: Math.max,
      abs: Math.abs,
      pow: Math.pow,
      sqrt: Math.sqrt,
      sq: (x: number) => x * x,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
      random: (a: number, b?: number) => (b === undefined ? Math.floor(Math.random() * a) : a + Math.floor(Math.random() * (b - a))),
      randomSeed: () => undefined,
      bitRead: (v: number, b: number) => (v >> b) & 1,
      bitSet: (v: number, b: number) => v | (1 << b),
      bitClear: (v: number, b: number) => v & ~(1 << b),
      __int: (v: unknown) => (typeof v === 'number' ? Math.trunc(v) : typeof v === 'boolean' ? +v : v),
      __array: (n: number) => new Array(Math.max(0, Math.trunc(n))).fill(0),
      __tick: this.tick,
    }
    const names = Object.keys(api)
    let prog: { setup: () => Promise<void>; loop: () => Promise<void> }
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const make = new Function(...names, `"use strict"; return (async () => {\n${c.js}\nreturn { setup, loop };\n})()`)
      prog = await make(...names.map((n) => api[n]))
      await prog.setup()
      while (!this.stopped) {
        await prog.loop()
        await this.tick()
        this.now += 0.01
        // un loop() sin delay corre muchísimas veces: cada tanto se le da paso a la pantalla
        if (this.ops % 50 === 0) await this.sleep(0)
      }
    } catch (e) {
      if (e instanceof Stop || this.stopped) return
      onError(explainRuntime(e as Error))
    }
  }
}

/** La librería Servo.h: attach, write, read, writeMicroseconds, attached, detach. */
function makeServo(io: BoardIO) {
  return class Servo {
    private pin = -1
    private angle = 90
    attach(pin: number) {
      this.pin = pin
      io.servo(pin, this.angle)
      return 1
    }
    write(a: number) {
      // como la librería real: más de 544 se toma como microsegundos
      const deg = a > 544 ? ((a - 544) / (2400 - 544)) * 180 : a
      this.angle = Math.max(0, Math.min(180, Math.round(deg)))
      if (this.pin >= 0) io.servo(this.pin, this.angle)
    }
    writeMicroseconds(us: number) {
      this.write(Math.max(544, Math.min(2400, us)))
    }
    read() {
      return this.angle
    }
    attached() {
      return this.pin >= 0
    }
    detach() {
      if (this.pin >= 0) io.servo(this.pin, null)
      this.pin = -1
    }
  }
}

function explainRuntime(e: Error): string {
  const m = e.message || String(e)
  let r = m.match(/^(\w+) is not defined/)
  if (r) return `No existe "${r[1]}": revisá que esté bien escrito (mayúsculas y minúsculas importan) o que la variable esté declarada.`
  r = m.match(/(\w+) is not a function/)
  if (r) return `"${r[1]}" no es una función que conozca la placa.`
  r = m.match(/Cannot read properties of undefined \(reading '(\w+)'\)/)
  if (r) return `Se quiso usar ".${r[1]}" sobre algo que no existe (¿un arreglo fuera de rango?).`
  if (/Assignment to constant/.test(m)) return 'Se quiso cambiar una constante (const o #define).'
  return m
}

// Interfaz para compilar y ejecutar Java desde la página (usa un Web Worker).
import { useSyncExternalStore } from 'react'
import type { FromWorker, ToWorker } from './worker'

export interface RunResult {
  out: string
  err: string
  code: number
  crashed: string | null
  timedOut: boolean
  ms: number
}
export interface Outcome {
  compiled: boolean
  /** errores de compilación (texto de javac) */
  errors: string
  compileMs: number
  runs: RunResult[]
  /** se detuvo a mano */
  stopped?: boolean
}

export interface JavaStatus {
  busy: boolean
  text: string
  progress: number | null
  ready: boolean
  error: string | null
}

let status: JavaStatus = { busy: false, text: '', progress: null, ready: false, error: null }
const listeners = new Set<() => void>()
const setStatus = (p: Partial<JavaStatus>) => {
  status = { ...status, ...p }
  listeners.forEach((l) => l())
}
export function useJavaStatus(): JavaStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => status,
  )
}

/** ¿El navegador puede correr el compilador? (necesita WebAssembly GC, navegadores de 2024 en adelante) */
export function javaSupported(): boolean {
  try {
    // módulo mínimo con un tipo struct (WasmGC)
    const bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 95, 1, 127, 0])
    return typeof WebAssembly === 'object' && WebAssembly.validate(bytes) && typeof DecompressionStream === 'function'
  } catch {
    return false
  }
}

const base = () => new URL('java/', document.baseURI).href

let worker: Worker | null = null
let seq = 0
let current: { id: number; resolve: (o: Outcome) => void; outcome: Outcome; onStream?: StreamFn; timer?: number; timeoutMs: number } | null = null
type StreamFn = (run: number, stream: 'out' | 'err', text: string) => void

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (ev: MessageEvent<FromWorker>) => handle(ev.data)
  worker.onerror = (e) => {
    setStatus({ busy: false, error: e.message || 'Falló el entorno de Java.' })
    finish()
  }
  return worker
}

function handle(m: FromWorker) {
  if (m.type === 'status') {
    setStatus({ text: m.text, progress: m.progress ?? status.progress })
    if (m.text === 'Java listo') setStatus({ ready: true, busy: false, progress: null })
    return
  }
  if (m.type === 'fatal') {
    setStatus({ error: m.message, busy: false, progress: null })
    if (current) {
      current.outcome.errors = current.outcome.errors || `No se pudo ejecutar: ${m.message}`
      finish()
    }
    return
  }
  if (!current || m.id !== current.id) return
  const c = current
  if (m.type === 'compiled') {
    setStatus({ ready: true, progress: null })
    c.outcome.compiled = m.ok
    c.outcome.errors = m.ok ? '' : m.errors
    c.outcome.compileMs = m.ms
    armTimer()
  } else if (m.type === 'stream') {
    const r = (c.outcome.runs[m.run] ??= { out: '', err: '', code: 0, crashed: null, timedOut: false, ms: 0 })
    if (m.stream === 'out') r.out += m.text
    else r.err += m.text
    // corta la salida si un programa imprime sin parar
    if (r.out.length > 200_000) {
      r.out = r.out.slice(0, 200_000) + '\n… (se cortó la salida: demasiado texto)'
      stop(true)
      return
    }
    c.onStream?.(m.run, m.stream, m.text)
  } else if (m.type === 'exit') {
    const r = (c.outcome.runs[m.run] ??= { out: '', err: '', code: 0, crashed: null, timedOut: false, ms: 0 })
    r.code = m.code
    r.crashed = m.crashed
    r.ms = m.ms
    armTimer()
  } else if (m.type === 'done') {
    finish()
  }
}

function armTimer() {
  if (!current) return
  clearTimeout(current.timer)
  const c = current
  c.timer = window.setTimeout(() => {
    const k = c.outcome.runs.length
    const r = (c.outcome.runs[Math.max(0, k - 1)] ??= { out: '', err: '', code: 0, crashed: null, timedOut: false, ms: 0 })
    r.timedOut = true
    stop(true)
  }, c.timeoutMs)
}

function finish() {
  const c = current
  if (!c) return
  clearTimeout(c.timer)
  current = null
  setStatus({ busy: false, text: '' })
  c.resolve(c.outcome)
}

/** Detiene el programa (por ejemplo, un bucle infinito). Se reinicia el entorno de Java. */
export function stop(auto = false) {
  if (worker) {
    worker.terminate()
    worker = null
  }
  if (current) {
    if (!auto) current.outcome.stopped = true
    finish()
  }
  setStatus({ busy: false, text: '', progress: null })
}

/** Descarga y prepara el compilador sin ejecutar nada (para que después sea más rápido). */
export function warmup() {
  if (status.ready || status.busy || !javaSupported()) return
  setStatus({ busy: true, error: null })
  const msg: ToWorker = { type: 'warmup', base: base() }
  getWorker().postMessage(msg)
}

/**
 * Compila los archivos y ejecuta el programa una vez por cada entrada.
 * timeoutMs: tiempo máximo de cada ejecución (no cuenta la compilación).
 */
export function runJava(
  files: { path: string; content: string }[],
  inputs: string[] = [''],
  opts: { onStream?: StreamFn; timeoutMs?: number; entry?: string } = {},
): Promise<Outcome> {
  if (current) stop(true)
  setStatus({ busy: true, error: null })
  return new Promise((resolve) => {
    const id = ++seq
    current = { id, resolve, onStream: opts.onStream, timeoutMs: opts.timeoutMs ?? 6000, outcome: { compiled: false, errors: '', compileMs: 0, runs: [] } }
    const entry = opts.entry ?? files.find((f) => /public\s+static\s+void\s+main\s*\(/.test(f.content))?.path ?? files[0].path
    const msg: ToWorker = { type: 'run', id, base: base(), files, entry, inputs }
    getWorker().postMessage(msg)
  })
}

/* ------------------------------------------------------------------ mensajes para el alumno */

const ERRORS: [RegExp, string][] = [
  [/';' expected/, 'Falta un punto y coma ( ; ) al final de la instrucción.'],
  [/cannot find symbol/, 'Usaste un nombre que Java no conoce: revisá que la variable, método o clase esté declarado y bien escrito (mayúsculas y minúsculas importan).'],
  [/incompatible types: possible lossy conversion from (\w+) to (\w+)/, 'Estás guardando un $1 en una variable $2 y se puede perder información. Usá un cast, por ejemplo (int).'],
  [/incompatible types: (.+) cannot be converted to (.+)/, 'Tipos incompatibles: no se puede guardar un $1 donde va un $2.'],
  [/class (\w+) is public, should be declared in a file named/, 'La clase pública tiene que llamarse igual que el archivo.'],
  [/reached end of file while parsing/, 'Falta cerrar una llave }.'],
  [/'\)' expected/, 'Falta cerrar un paréntesis ).'],
  [/unclosed string literal/, 'Falta cerrar las comillas de un texto (").'],
  [/variable (\w+) might not have been initialized/, 'La variable $1 se usa antes de darle un valor.'],
  [/variable (\w+) is already defined/, 'La variable $1 ya estaba declarada: no la declares dos veces.'],
  [/missing return statement/, 'El método tiene que devolver un valor con return en todos los caminos.'],
  [/not a statement/, 'Esa línea no es una instrucción válida.'],
  [/'else' without 'if'/, 'Hay un else sin su if (revisá las llaves).'],
  [/non-static (method|variable) (\w+).*cannot be referenced from a static context/, 'Desde main (que es static) no podés usar $2 directamente: hacelo static o creá un objeto.'],
  [/illegal start of expression/, 'Expresión mal escrita: revisá llaves, paréntesis y puntos y coma cerca de esa línea.'],
  [/(\w+) is abstract; cannot be instantiated/, '$1 es abstracta: no se puede crear con new; creá un objeto de una subclase.'],
  [/does not override abstract method (\w+)/, 'Falta implementar el método $1 que pide la clase abstracta o la interfaz.'],
  [/bad operand types for binary operator/, 'Estás operando con tipos que no se pueden combinar con ese operador.'],
  [/unreachable statement/, 'Hay código que nunca se va a ejecutar (está después de un return, break o un bucle infinito).'],
]

export interface CompileError {
  line: number
  message: string
  hint: string | null
}

/** Separa los errores de javac por línea y agrega una explicación en castellano. */
export function parseCompileErrors(text: string): CompileError[] {
  const out: CompileError[] = []
  for (const l of text.split('\n')) {
    const m = /^(?:[\w/.]+\.java):(\d+): (?:error|warning): (.*)$/.exec(l.trim())
    if (!m) continue
    const message = m[2]
    let hint: string | null = null
    for (const [re, es] of ERRORS) {
      const mm = re.exec(message)
      if (mm) {
        hint = es.replace(/\$(\d)/g, (_, k) => mm[Number(k)] ?? '')
        break
      }
    }
    out.push({ line: Number(m[1]), message, hint })
  }
  if (!out.length && text.trim()) out.push({ line: 0, message: text.trim(), hint: null })
  return out
}

/** Describe un error en tiempo de ejecución a partir del rastro de la pila. */
export function describeCrash(r: RunResult): string | null {
  if (r.timedOut) return 'El programa tardó demasiado y se detuvo. ¿Hay un bucle que nunca termina?'
  if (!r.crashed && !/\tat /.test(r.err)) return null
  const lines = r.err.split('\n').filter((l) => l.trim().startsWith('at '))
  const user = lines.find((l) => !/\bat (java\.|javax\.|org\.teavm|jdk\.|sun\.)/.test(l.trim()))
  const lib = lines[0]?.trim() ?? ''
  const where = user ? /\((\w+\.java):(\d+)\)/.exec(user) : null
  let kind = 'una excepción'
  if (/parseInt|parseDouble|parseLong|NumberFormat/.test(lib)) kind = 'un NumberFormatException (texto que no es un número)'
  else if (/Scanner/.test(lib)) kind = 'un error al leer la entrada (InputMismatchException / NoSuchElementException): ¿escribiste los datos en «Entrada»?'
  else if (/Formatter/.test(lib)) kind = 'un error en el formato de printf'
  else if (/ArrayList|List|get\(/.test(lib)) kind = 'un IndexOutOfBoundsException (posición que no existe)'
  return `El programa se detuvo por ${kind}${where ? ` en la línea ${where[2]} de ${where[1]}` : ''}.`
}

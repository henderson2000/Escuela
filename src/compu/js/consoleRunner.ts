// Ejecuta programas de consola (console.log, prompt) en un Worker aparte, con tiempo máximo.
import { FORMAT_SRC, GUARD_SRC, explainRuntime, protect, type CodeError } from './protect'

export interface ConsoleResult {
  out: string
  /** respuestas de prompt (para mostrar en gris en la consola) */
  prompts: { msg: string; value: string | null; at: number }[]
  /** error de sintaxis (no se ejecutó) */
  syntax: CodeError | null
  /** error durante la ejecución */
  runtime: { message: string; line: number; hint: string | null } | null
  timedOut: boolean
}

const WORKER_SRC = `
${FORMAT_SRC}
var __off = 0;
try { new Function('throw new Error("x")')(); } catch (e) { var m = /(?:<anonymous>|Function):(\\d+)/.exec(e.stack || ''); if (m) __off = Number(m[1]) - 1; }
self.onmessage = function (ev) {
  var d = ev.data, lines = d.input.replace(/\\r/g, '').split('\\n'), k = 0, size = 0;
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  function send(t) {
    size += t.length;
    if (size > 20000) throw new Error('__DEMASIADO__');
    postMessage({ type: 'out', text: t });
  }
  function log() { var a = []; for (var i = 0; i < arguments.length; i++) a.push(__fmt(arguments[i])); send(a.join(' ') + '\\n'); }
  self.console = { log: log, info: log, warn: log, error: log, debug: log, table: log };
  self.prompt = function (msg) {
    var v = k < lines.length ? lines[k++] : null;
    postMessage({ type: 'prompt', msg: msg == null ? '' : String(msg), value: v, at: size });
    return v;
  };
  self.alert = function (m) { send(String(m) + '\\n'); };
  try {
    new Function(${JSON.stringify(GUARD_SRC)} + '\\n' + d.code)();
    postMessage({ type: 'done' });
  } catch (e) {
    var line = 0, mm = /(?:<anonymous>|Function):(\\d+)/.exec((e && e.stack) || '');
    if (mm) line = Number(mm[1]) - __off - ${GUARD_SRC.split('\n').length};
    postMessage({ type: 'error', message: String((e && e.message) || e), name: e && e.name, line: line });
  }
};`

let url: string | null = null
const workerUrl = () => (url ??= URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' })))

let current: Worker | null = null

/** Detiene el programa que esté corriendo. */
export function stopConsole() {
  current?.terminate()
  current = null
}

/** Ejecuta el código con la entrada dada. onOut recibe la salida a medida que se produce. */
export function runConsole(code: string, input = '', onOut?: (text: string) => void, timeoutMs = 4000): Promise<ConsoleResult> {
  const res: ConsoleResult = { out: '', prompts: [], syntax: null, runtime: null, timedOut: false }
  const p = protect(code)
  if ('error' in p) {
    res.syntax = p.error
    return Promise.resolve(res)
  }
  stopConsole()
  return new Promise((resolve) => {
    const w = new Worker(workerUrl())
    current = w
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      w.terminate()
      if (current === w) current = null
      resolve(res)
    }
    const timer = setTimeout(() => {
      res.timedOut = true
      finish()
    }, timeoutMs)
    w.onmessage = (ev) => {
      const m = ev.data
      if (m.type === 'out') {
        res.out += m.text
        onOut?.(m.text)
      } else if (m.type === 'prompt') res.prompts.push({ msg: m.msg, value: m.value, at: m.at })
      else if (m.type === 'done') finish()
      else if (m.type === 'error') {
        if (m.message === '__BUCLE__') res.timedOut = true
        else if (m.message === '__DEMASIADO__') res.out += '\n… (se cortó: el programa escribió demasiado)'
        else res.runtime = { message: `${m.name ?? 'Error'}: ${m.message}`, line: m.line > 0 ? m.line : 0, hint: explainRuntime(m.message) }
        finish()
      }
    }
    w.onerror = (e) => {
      res.runtime = { message: e.message, line: 0, hint: null }
      finish()
    }
    w.postMessage({ code: p.code, input })
  })
}

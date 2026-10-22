// Páginas con HTML + JavaScript del alumno: se arman en un iframe, se capturan console.log y los errores.
import { FORMAT_SRC, GUARD_SRC, explainRuntime, protect, type CodeError } from './protect'
import type { DomCode, DomCtx, WebCtx } from '../types'

const HEAD_SCRIPT = `<script>
${FORMAT_SRC}
${GUARD_SRC}
window.__logs = []; window.__errors = [];
(function () {
  function log() { var a = []; for (var i = 0; i < arguments.length; i++) a.push(__fmt(arguments[i])); window.__logs.push(a.join(' ')); if (window.__onlog) window.__onlog(); }
  window.console = { log: log, info: log, warn: log, error: log, debug: log, table: log };
  window.alert = function (m) { window.__logs.push('🔔 ' + String(m)); if (window.__onlog) window.__onlog(); };
  window.prompt = function () { return null; };
  // un formulario no tiene que cambiar de página dentro de la vista previa
  document.addEventListener('submit', function (e) { e.preventDefault(); });
  window.confirm = function () { return true; };
  window.addEventListener('error', function (e) {
    window.__errors.push({ message: e.message, line: e.lineno || 0 });
    if (window.__onlog) window.__onlog();
  });
})();
</script>`

export interface DomBuild {
  doc: string
  syntax: CodeError | null
  /** línea del documento donde empieza el código del alumno */
  jsLine: number
}

/** Arma el documento: el HTML del alumno con su JavaScript al final del body. */
export function buildDomDoc({ html, js }: DomCode): DomBuild {
  const p = protect(js)
  const syntax = 'error' in p ? p.error : null
  let h = html
  const base = '<base target="_blank">'
  if (/<head[^>]*>/i.test(h)) h = h.replace(/<head[^>]*>/i, (m) => `${m}${base}${HEAD_SCRIPT}`)
  else if (/<html[^>]*>/i.test(h)) h = h.replace(/<html[^>]*>/i, (m) => `${m}<head>${base}${HEAD_SCRIPT}</head>`)
  else h = `<!doctype html><html><head><meta charset="utf-8">${base}${HEAD_SCRIPT}</head><body>\n${h}\n</body></html>`
  if (syntax) return { doc: h, syntax, jsLine: 0 }
  const code = 'code' in p ? p.code : ''
  // el script va justo antes de </body> (o al final)
  const tag = `<script>\n${code}\n</script>`
  let idx = h.search(/<\/body>/i)
  if (idx < 0) idx = h.length
  const doc = h.slice(0, idx) + tag + h.slice(idx)
  const jsLine = doc.slice(0, idx).split('\n').length + 1
  return { doc, syntax: null, jsLine }
}

export interface DomError {
  message: string
  line: number
  hint: string | null
}

type DomWin = Window & { __logs: string[]; __errors: { message: string; line: number }[]; __onlog?: () => void }

/** Lee los mensajes y errores de la página. */
export function readDom(frame: HTMLIFrameElement, jsLine: number): { logs: string[]; errors: DomError[] } {
  const w = frame.contentWindow as DomWin | null
  if (!w || !w.__logs) return { logs: [], errors: [] }
  return {
    logs: [...w.__logs],
    errors: w.__errors.map((e) => {
      const loop = /__BUCLE__/.test(e.message)
      return {
        message: loop ? 'El programa tardó demasiado y se cortó.' : e.message.replace(/^Uncaught /, ''),
        line: e.line && e.line >= jsLine ? e.line - jsLine + 1 : 0,
        hint: explainRuntime(e.message),
      }
    }),
  }
}

/** Avisa cada vez que la página escribe algo en la consola o tiene un error. */
export function watchDom(frame: HTMLIFrameElement, cb: () => void) {
  const w = frame.contentWindow as DomWin | null
  if (w) w.__onlog = cb
}

/** Carga el documento en el iframe y espera a que termine (máx. 2,5 s si una imagen no carga). */
export function loadDoc(frame: HTMLIFrameElement, doc: string): Promise<void> {
  return new Promise((resolve) => {
    let finished = false
    const done = () => {
      if (finished) return
      finished = true
      frame.removeEventListener('load', done)
      clearTimeout(timer)
      setTimeout(resolve, 40)
    }
    const timer = setTimeout(done, 2500)
    frame.addEventListener('load', done)
    frame.srcdoc = doc
  })
}

/** Contexto para las pruebas de una lección de JavaScript con HTML. */
export function makeDomCtx(base: WebCtx, js: string, frame: HTMLIFrameElement, jsLine: number): DomCtx {
  const doc = base.doc
  const win = base.win
  const fire = (el: Element, type: string, init: EventInit = { bubbles: true }) => el.dispatchEvent(new (win as unknown as typeof globalThis).Event(type, init))
  const ctx: DomCtx = {
    ...base,
    js,
    get logs() {
      return readDom(frame, jsLine).logs
    },
    get errors() {
      return readDom(frame, jsLine).errors.map((e) => e.message)
    },
    click: (sel) => {
      const el = base.$(sel) as HTMLElement | null
      if (!el) return false
      el.click()
      return true
    },
    type: (sel, value) => {
      const el = base.$(sel) as HTMLInputElement | null
      if (!el) return false
      el.value = value
      fire(el, 'input')
      fire(el, 'change')
      return true
    },
    press: (sel, key) => {
      const el = (base.$(sel) as HTMLElement | null) ?? doc.body
      if (!el) return false
      const K = (win as unknown as typeof globalThis).KeyboardEvent
      el.dispatchEvent(new K('keydown', { key, bubbles: true }))
      el.dispatchEvent(new K('keyup', { key, bubbles: true }))
      return true
    },
  }
  return ctx
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CodeEditor } from './CodeEditor'
import { runConsole, stopConsole, type ConsoleResult } from './js/consoleRunner'
import { buildDomDoc, loadDoc, makeDomCtx, readDom, watchDom, type DomError } from './js/domRunner'
import type { DomCode, DomLesson, JsLesson, Lesson, WebCode, WebCtx, WebLesson } from './types'
import { BulbPurchase } from '../components/Bulbs'
import { BULBS } from '../lib/scores'
import './compu.css'

/* ------------------------------------------------------------------ vista previa web (sólo HTML) */

/** Arma la página que se muestra a partir del HTML del alumno. */
export function buildDoc({ html, css }: WebCode): string {
  const style = css.trim() ? `<style>\n${css}\n</style>` : ''
  let h = html
  if (/<\/head>/i.test(h)) h = h.replace(/<\/head>/i, `${style}</head>`)
  else if (/<html[^>]*>/i.test(h)) h = h.replace(/<html[^>]*>/i, (m) => `${m}<head>${style}</head>`)
  else h = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body>${h}</body></html>`
  // los links abren en otra pestaña para no cambiar la vista previa
  return h.replace(/<head>/i, '<head><base target="_blank">')
}

export function makeCtx(doc: Document, code: WebCode): WebCtx {
  const win = doc.defaultView as Window
  const $ = (sel: string) => {
    try {
      return doc.querySelector(sel)
    } catch {
      return null
    }
  }
  const $$ = (sel: string) => {
    try {
      return Array.from(doc.querySelectorAll(sel))
    } catch {
      return []
    }
  }
  return {
    doc,
    win,
    html: code.html,
    css: code.css,
    $,
    $$,
    style: (sel, prop) => {
      const el = $(sel)
      return el ? win.getComputedStyle(el).getPropertyValue(prop).trim() : ''
    },
    text: (sel) => ($(sel)?.textContent ?? '').replace(/\s+/g, ' ').trim(),
  }
}

function Browser({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="web-preview">
      <div className="preview-bar">
        <span className="dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  )
}

/** iframe con la página del alumno (sin JavaScript). */
export function WebPreview({ code, frameRef, title = 'Vista previa' }: { code: WebCode; frameRef?: React.RefObject<HTMLIFrameElement | null>; title?: string }) {
  const own = useRef<HTMLIFrameElement>(null)
  const ref = frameRef ?? own
  const [doc, setDoc] = useState(() => buildDoc(code))
  useEffect(() => {
    const t = setTimeout(() => setDoc(buildDoc(code)), 250)
    return () => {
      clearTimeout(t)
    }
  }, [code])
  return (
    <Browser title={title}>
      <iframe ref={ref} title={title} sandbox="allow-same-origin" srcDoc={doc} />
    </Browser>
  )
}

/** Carga el código en un iframe y espera a que termine de cargar. */
function loadInto(frame: HTMLIFrameElement, code: WebCode): Promise<Document> {
  return loadDoc(frame, buildDoc(code)).then(() => frame.contentDocument as Document)
}

/* ------------------------------------------------------------------ consola */

export function ErrorList({ errors }: { errors: { line: number; message: string; hint: string | null }[] }) {
  if (!errors.length) return null
  return (
    <ul className="js-errors">
      {errors.map((e, i) => (
        <li key={i}>
          {e.line > 0 && <span className="err-at">Línea {e.line}</span>} <code>{e.message}</code>
          {e.hint && <div className="err-hint">💡 {e.hint}</div>}
        </li>
      ))}
    </ul>
  )
}

/** Muestra el resultado de un programa de consola. */
export function ConsoleView({ result, live, running }: { result: ConsoleResult | null; live: string; running: boolean }) {
  if (running && !live) return <pre className="console empty">⏳ Ejecutando…</pre>
  if (!result && !live) return <pre className="console empty">Lo que escribas con console.log aparece acá.</pre>
  if (result?.syntax)
    return (
      <div className="console errors">
        <strong>✘ El código tiene un error de escritura y no se pudo ejecutar:</strong>
        <ErrorList errors={[result.syntax]} />
      </div>
    )
  const out = result ? result.out : live
  // intercala las respuestas de prompt en gris
  const parts: ReactNode[] = []
  let pos = 0
  for (const [i, p] of (result?.prompts ?? []).entries()) {
    if (p.at > pos) parts.push(out.slice(pos, p.at))
    pos = Math.max(pos, p.at)
    parts.push(
      <span key={`p${i}`} className="prompt-line">
        {`❓ ${p.msg} → ${p.value ?? '(sin respuesta: falta un dato en «Entrada»)'}\n`}
      </span>,
    )
  }
  parts.push(out.slice(pos))
  return (
    <div className="console">
      <pre>{parts}</pre>
      {result?.runtime && (
        <div className="errors">
          <strong>⚠ El programa se detuvo por un error:</strong>
          <ErrorList errors={[result.runtime]} />
        </div>
      )}
      {result?.timedOut && <p className="crash">⚠ El programa tardó demasiado y se cortó. ¿Hay un bucle que nunca termina?</p>}
      {result && !result.runtime && !result.timedOut && <p className="exit-ok">— Fin del programa —</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ vista previa con JavaScript */

/** Página del alumno con su JavaScript funcionando, y debajo la consola. */
export function DomPreview({ code, title = 'Vista previa' }: { code: DomCode; title?: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [state, setState] = useState<{ logs: string[]; errors: DomError[]; syntax: ReturnType<typeof buildDomDoc>['syntax'] }>({ logs: [], errors: [], syntax: null })
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const t = setTimeout(async () => {
      const f = frame.current
      if (!f) return
      const b = buildDomDoc(code)
      const update = () => {
        const r = readDom(f, b.jsLine)
        setState({ logs: r.logs, errors: r.errors, syntax: b.syntax })
      }
      setState({ logs: [], errors: [], syntax: b.syntax })
      await loadDoc(f, b.doc)
      watchDom(f, update)
      update()
    }, 400)
    return () => {
      clearTimeout(t)
    }
  }, [code, reload])

  return (
    <div className="dom-preview">
      <Browser title={title}>
        <iframe ref={frame} title={title} sandbox="allow-scripts allow-same-origin allow-forms" />
      </Browser>
      <div className="dom-console">
        <div className="row space">
          <span className="console-title">Consola</span>
          <button type="button" className="btn small ghost" onClick={() => setReload((r) => r + 1)} title="Vuelve a cargar la página desde cero">
            ↻ Recargar
          </button>
        </div>
        {state.syntax ? (
          <div className="console errors">
            <strong>✘ El JavaScript tiene un error de escritura y no se ejecutó:</strong>
            <ErrorList errors={[state.syntax]} />
          </div>
        ) : (
          <div className="console small">
            {state.logs.length === 0 && state.errors.length === 0 ? (
              <span className="muted">Los console.log y los errores aparecen acá.</span>
            ) : (
              <>
                <pre>{state.logs.join('\n')}</pre>
                {state.errors.length > 0 && (
                  <div className="errors">
                    <ErrorList errors={state.errors} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ espacio de trabajo de una lección */

export type TestState = boolean[] | null

const keyOf = (id: string) => `compu-code-${id}`

function loadCode<T>(id: string, starter: T): T {
  try {
    const raw = localStorage.getItem(keyOf(id))
    if (raw) {
      const v = JSON.parse(raw)
      // si la lección cambió de tipo, se vuelve a empezar
      if (typeof v === typeof starter) return v as T
    }
  } catch {
    /* sin almacenamiento */
  }
  return starter
}
function saveCode(id: string, code: unknown) {
  try {
    localStorage.setItem(keyOf(id), JSON.stringify(code))
  } catch {
    /* sin almacenamiento */
  }
}

interface WsProps<L> {
  lesson: L
  storageId: string
  /** clave para comprar pista y solución (si no hay, no se pueden comprar: por ejemplo en los desafíos) */
  shop?: string
  onChecked?: (results: boolean[], ok: boolean) => void
  side?: ReactNode
  actions?: ReactNode
  checkLabel: string
}

export function LessonWorkspace({
  lesson,
  storageId,
  onChecked,
  side,
  actions,
  checkLabel = 'Comprobar',
  shop,
}: {
  lesson: Lesson
  /** clave para comprar pista y solución con lamparitas */
  shop?: string
  /** clave para guardar el código (por defecto el id de la lección) */
  storageId?: string
  onChecked?: (results: boolean[], ok: boolean) => void
  /** contenido extra arriba de la consigna */
  side?: ReactNode
  actions?: ReactNode
  checkLabel?: string
}) {
  const props = { storageId: storageId ?? lesson.id, onChecked, side, actions, checkLabel, shop }
  if (lesson.kind === 'web') return <WebWorkspace lesson={lesson} {...props} />
  if (lesson.kind === 'js') return <JsWorkspace lesson={lesson} {...props} />
  return <DomWorkspace lesson={lesson} {...props} />
}

function TestList({ lesson, results, checking }: { lesson: Lesson; results: TestState; checking: boolean }) {
  return (
    <ul className="test-list">
      {lesson.tests.map((t, i) => (
        <li key={i} className={results ? (results[i] ? 'ok' : 'bad') : ''}>
          <span className="tick">{checking ? '…' : results ? (results[i] ? '✔' : '✘') : '○'}</span>
          <span>{t.text}</span>
        </li>
      ))}
    </ul>
  )
}

function SidePanel({
  lesson,
  results,
  checking,
  side,
  onCheck,
  onReset,
  actions,
  checkLabel,
  shop,
  onSolution,
}: {
  lesson: Lesson
  results: TestState
  checking: boolean
  side?: ReactNode
  onCheck: () => void
  onReset: () => void
  actions?: ReactNode
  checkLabel: string
  shop?: string
  onSolution: () => void
}) {
  const ok = !!results && results.every(Boolean)
  return (
    <aside className="lesson-side">
      {side}
      <div className="lesson-intro prose">{lesson.intro}</div>
      <div className="lesson-task">
        <h3>Consigna</h3>
        <div className="prose">{lesson.task}</div>
      </div>
      <h4 className="req-title">Requisitos</h4>
      <TestList lesson={lesson} results={results} checking={checking} />
      {results && (
        <p className={`feedback ${ok ? 'ok' : 'bad'}`}>
          {ok ? '✔ ¡Muy bien! Cumpliste todos los requisitos.' : `✘ Te faltan ${results.filter((r) => !r).length} requisito(s). Revisá los que están en rojo.`}
        </p>
      )}
      <div className="row wrap">
        <button type="button" className="btn primary" onClick={onCheck} disabled={checking}>
          {checking ? 'Comprobando…' : `✔ ${checkLabel}`} <kbd>Ctrl+Enter</kbd>
        </button>
        <button type="button" className="btn ghost small" onClick={onReset}>
          ↺ Reiniciar código
        </button>
      </div>
      {shop && (
        <div className="row wrap shop-row">
          {lesson.hint && (
            <BulbPurchase itemKey={`hint:${shop}`} cost={BULBS.pista} label="Ver una pista" what={`Pista: ${lesson.title}`}>
              {lesson.hint}
            </BulbPurchase>
          )}
          <BulbPurchase
            itemKey={`sol:${shop}`}
            cost={BULBS.solucion}
            label="Ver la solución"
            what={`Solución: ${lesson.title}`}
            confirmText={`¿Gastar ${BULBS.solucion} 💡 para cargar la solución en el editor? Esta lección ya no te va a dar lamparitas.`}
            onBuy={onSolution}
          />
        </div>
      )}
      {actions}
    </aside>
  )
}

const runSafe = <C,>(fn: (c: C) => boolean, c: C) => {
  try {
    return !!fn(c)
  } catch {
    return false
  }
}

/* ---------------- HTML */

function WebWorkspace({ lesson, storageId, onChecked, side, actions, checkLabel, shop }: WsProps<WebLesson>) {
  const [code, setCode] = useState<WebCode>(() => loadCode(storageId, lesson.starter))
  const [results, setResults] = useState<TestState>(null)
  const [checking, setChecking] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    saveCode(storageId, code)
  }, [storageId, code])

  const check = useCallback(async () => {
    if (!frame.current) return
    setChecking(true)
    const doc = await loadInto(frame.current, code)
    const ctx = makeCtx(doc, code)
    const r = lesson.tests.map((t) => runSafe(t.test, ctx))
    setChecking(false)
    setResults(r)
    onChecked?.(r, r.every(Boolean))
  }, [code, lesson, onChecked])

  return (
    <div className="lesson-layout">
      <SidePanel
        lesson={lesson}
        results={results}
        checking={checking}
        side={side}
        onCheck={check}
        onReset={() => {
          setCode(lesson.starter)
          setResults(null)
        }}
        actions={actions}
        checkLabel={checkLabel}
        shop={shop}
        onSolution={() => {
          setCode(lesson.solution as never)
          setResults(null)
        }}
      />
      <section className="lesson-work">
        <div className="file-tabs">
          <button type="button" className="active">
            index.html
          </button>
        </div>
        <div className="editor-box">
          <CodeEditor
            lang="html"
            value={code.html}
            onChange={(v) => {
              setCode((c) => ({ ...c, html: v }))
              setResults(null)
            }}
            onRun={check}
          />
        </div>
        <WebPreview code={code} frameRef={frame} />
      </section>
    </div>
  )
}

/* ---------------- JavaScript en consola */

function JsWorkspace({ lesson, storageId, onChecked, side, actions, checkLabel, shop }: WsProps<JsLesson>) {
  const [code, setCode] = useState<string>(() => loadCode(storageId, lesson.starter))
  const [input, setInput] = useState(lesson.sampleInput ?? '')
  const [results, setResults] = useState<TestState>(null)
  const [checking, setChecking] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ConsoleResult | null>(null)
  const [live, setLive] = useState('')

  useEffect(() => {
    saveCode(storageId, code)
  }, [storageId, code])

  const run = async () => {
    setRunning(true)
    setLive('')
    setResult(null)
    const r = await runConsole(code, input, (t) => setLive((x) => x + t))
    setResult(r)
    setRunning(false)
  }

  const check = async () => {
    setChecking(true)
    const inputs = [...new Set(lesson.tests.map((t) => t.input ?? ''))]
    const outs = new Map<string, ConsoleResult>()
    for (const inp of inputs) outs.set(inp, await runConsole(code, inp, undefined, 3000))
    const r = lesson.tests.map((t) => {
      const o = outs.get(t.input ?? '')!
      if (o.syntax || o.timedOut) return false
      return runSafe((c: ConsoleResult) => t.check(c.out, code), o)
    })
    // en la consola se ve la primera prueba
    setResult(outs.get(inputs[0]) ?? null)
    setLive('')
    setChecking(false)
    setResults(r)
    onChecked?.(r, r.every(Boolean))
  }

  const errLine = result?.syntax?.line ?? result?.runtime?.line ?? 0

  return (
    <div className="lesson-layout">
      <SidePanel
        lesson={lesson}
        results={results}
        checking={checking}
        side={side}
        onCheck={check}
        onReset={() => {
          setCode(lesson.starter)
          setResults(null)
          setResult(null)
        }}
        actions={actions}
        checkLabel={checkLabel}
        shop={shop}
        onSolution={() => {
          setCode(lesson.solution as never)
          setResults(null)
        }}
      />
      <section className="lesson-work">
        <div className="file-tabs">
          <button type="button" className="active">
            programa.js
          </button>
          <span className="grow" />
          <button type="button" className="run-btn" onClick={run} disabled={running}>
            ▶ Ejecutar
          </button>
          {running && (
            <button type="button" className="stop-btn" onClick={() => stopConsole()}>
              ⏹ Detener
            </button>
          )}
        </div>
        <div className="editor-box">
          <CodeEditor
            lang="js"
            value={code}
            onChange={(v) => {
              setCode(v)
              setResults(null)
            }}
            onRun={check}
            errorLines={errLine ? [errLine] : []}
          />
        </div>
        <div className="java-io">
          <label className="java-input">
            <span>Entrada: las respuestas para cada prompt(), una por línea</span>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3} spellCheck={false} placeholder="Ej.: Ana&#10;15" />
          </label>
          <div className="java-out">
            <span className="console-title">Consola</span>
            <ConsoleView result={result} live={live} running={running} />
          </div>
        </div>
      </section>
    </div>
  )
}

/* ---------------- JavaScript con HTML */

function DomWorkspace({ lesson, storageId, onChecked, side, actions, checkLabel, shop }: WsProps<DomLesson>) {
  const [code, setCode] = useState<DomCode>(() => loadCode(storageId, lesson.starter))
  const [tab, setTab] = useState<'html' | 'js'>(lesson.edit.includes('js') ? 'js' : 'html')
  const [results, setResults] = useState<TestState>(null)
  const [checking, setChecking] = useState(false)
  const checkFrame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    saveCode(storageId, code)
  }, [storageId, code])

  const check = useCallback(async () => {
    const f = checkFrame.current
    if (!f) return
    setChecking(true)
    const b = buildDomDoc(code)
    const r: boolean[] = []
    for (const t of lesson.tests) {
      if (b.syntax) {
        r.push(false)
        continue
      }
      // cada prueba arranca con la página recién cargada
      await loadDoc(f, b.doc)
      const doc = f.contentDocument as Document
      const ctx = makeDomCtx(makeCtx(doc, { html: code.html, css: '' }), code.js, f, b.jsLine)
      r.push(runSafe(t.test, ctx))
    }
    setChecking(false)
    setResults(r)
    onChecked?.(r, r.every(Boolean))
  }, [code, lesson, onChecked])

  return (
    <div className="lesson-layout">
      <SidePanel
        lesson={lesson}
        results={results}
        checking={checking}
        side={side}
        onCheck={check}
        onReset={() => {
          setCode(lesson.starter)
          setResults(null)
        }}
        actions={actions}
        checkLabel={checkLabel}
        shop={shop}
        onSolution={() => {
          setCode(lesson.solution as never)
          setResults(null)
        }}
      />
      <section className="lesson-work">
        <div className="file-tabs">
          {(['html', 'js'] as const).map((t) => (
            <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t === 'html' ? 'index.html' : 'script.js'}
              {!lesson.edit.includes(t) && <small> (sólo lectura)</small>}
            </button>
          ))}
        </div>
        <div className="editor-box">
          <CodeEditor
            key={tab}
            lang={tab}
            value={code[tab]}
            readOnly={!lesson.edit.includes(tab)}
            onChange={(v) => {
              setCode((c) => ({ ...c, [tab]: v }))
              setResults(null)
            }}
            onRun={check}
          />
        </div>
        <DomPreview code={code} />
        <iframe ref={checkFrame} title="Pruebas" className="check-frame" sandbox="allow-scripts allow-same-origin allow-forms" aria-hidden tabIndex={-1} />
      </section>
    </div>
  )
}

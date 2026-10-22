import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CodeEditor } from './CodeEditor'
import { describeCrash, javaSupported, parseCompileErrors, runJava, stop as stopJava, useJavaStatus, warmup, type Outcome } from './java/runner'
import type { JavaLesson, Lesson, WebCode, WebCtx, WebLesson } from './types'
import './compu.css'

/* ------------------------------------------------------------------ vista previa web */

/** Arma la página que se muestra: el HTML del alumno con su CSS incorporado. */
export function buildDoc({ html, css }: WebCode): string {
  const style = `<style>\n${css}\n</style>`
  let h = html.replace(/<link[^>]*href=["']?styles?\.css["']?[^>]*>/gi, '')
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
    <div className="web-preview">
      <div className="preview-bar">
        <span className="dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
      </div>
      <iframe ref={ref} title={title} sandbox="allow-same-origin" srcDoc={doc} />
    </div>
  )
}

/** Carga el código en un iframe y espera a que termine de cargar. */
function loadInto(frame: HTMLIFrameElement, code: WebCode): Promise<Document> {
  return new Promise((resolve) => {
    const done = () => {
      frame.removeEventListener('load', done)
      // un instante para que se apliquen los estilos
      setTimeout(() => resolve(frame.contentDocument as Document), 30)
    }
    frame.addEventListener('load', done)
    frame.srcdoc = buildDoc(code)
  })
}

/* ------------------------------------------------------------------ consola Java */

export function JavaStatusBar() {
  const st = useJavaStatus()
  if (!javaSupported())
    return (
      <p className="java-warn">
        ⚠ Este navegador no puede ejecutar Java. Actualizá Chrome, Edge o Firefox (versiones de 2024 en adelante).
      </p>
    )
  if (st.error) return <p className="java-warn">⚠ {st.error}</p>
  if (st.progress !== null && st.progress < 1)
    return (
      <div className="java-loading">
        <span>{st.text}</span>
        <div className="progress">
          <div style={{ width: `${Math.round(st.progress * 100)}%` }} />
        </div>
      </div>
    )
  if (st.busy) return <p className="java-busy">⏳ {st.text || 'Trabajando…'}</p>
  return null
}

export function JavaConsole({ outcome, live }: { outcome: Outcome | null; live: string }) {
  if (!outcome && !live) return <pre className="console empty">La salida del programa aparece acá.</pre>
  if (outcome && !outcome.compiled && outcome.errors) {
    const errs = parseCompileErrors(outcome.errors)
    return (
      <div className="console errors">
        <strong>✘ El programa tiene errores y no se pudo compilar:</strong>
        <ul>
          {errs.map((e, i) => (
            <li key={i}>
              {e.line > 0 && <span className="err-at">Línea {e.line}</span>} <code>{e.message}</code>
              {e.hint && <div className="err-hint">💡 {e.hint}</div>}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  const run = outcome?.runs[0]
  const crash = run ? describeCrash(run) : null
  const errText = run?.err.split('\n').filter((l) => l.trim() && !l.trim().startsWith('at ')).join('\n')
  return (
    <div className="console">
      <pre>{run ? run.out : live}</pre>
      {errText && <pre className="stderr">{errText}</pre>}
      {crash && <p className="crash">⚠ {crash}</p>}
      {outcome?.stopped && <p className="crash">⏹ Programa detenido.</p>}
      {run && !crash && !outcome?.stopped && <p className="exit-ok">— Fin del programa —</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ espacio de trabajo de una lección */

export type TestState = boolean[] | null

const keyOf = (id: string) => `compu-code-${id}`

function loadCode<T>(id: string, starter: T): T {
  try {
    const raw = localStorage.getItem(keyOf(id))
    if (raw) return JSON.parse(raw) as T
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

export function LessonWorkspace({
  lesson,
  storageId,
  onChecked,
  side,
  actions,
  checkLabel = 'Comprobar',
}: {
  lesson: Lesson
  /** clave para guardar el código (por defecto el id de la lección) */
  storageId?: string
  onChecked?: (results: boolean[], ok: boolean) => void
  /** contenido extra arriba de la consigna */
  side?: ReactNode
  actions?: ReactNode
  checkLabel?: string
}) {
  return lesson.kind === 'web' ? (
    <WebWorkspace lesson={lesson} storageId={storageId ?? lesson.id} onChecked={onChecked} side={side} actions={actions} checkLabel={checkLabel} />
  ) : (
    <JavaWorkspace lesson={lesson} storageId={storageId ?? lesson.id} onChecked={onChecked} side={side} actions={actions} checkLabel={checkLabel} />
  )
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
}: {
  lesson: Lesson
  results: TestState
  checking: boolean
  side?: ReactNode
  onCheck: () => void
  onReset: () => void
  actions?: ReactNode
  checkLabel: string
}) {
  const [hint, setHint] = useState(false)
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
        {lesson.hint && (
          <button type="button" className="btn ghost small" onClick={() => setHint(!hint)}>
            💡 {hint ? 'Ocultar pista' : 'Pista'}
          </button>
        )}
      </div>
      {hint && lesson.hint && <div className="hint-box">{lesson.hint}</div>}
      {actions}
    </aside>
  )
}

function WebWorkspace({
  lesson,
  storageId,
  onChecked,
  side,
  actions,
  checkLabel,
}: {
  lesson: WebLesson
  storageId: string
  onChecked?: (r: boolean[], ok: boolean) => void
  side?: ReactNode
  actions?: ReactNode
  checkLabel: string
}) {
  const [code, setCode] = useState<WebCode>(() => loadCode(storageId, lesson.starter))
  const [tab, setTab] = useState<'html' | 'css'>(lesson.edit[0])
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
    const r = lesson.tests.map((t) => {
      try {
        return !!t.test(ctx)
      } catch {
        return false
      }
    })
    setChecking(false)
    setResults(r)
    onChecked?.(r, r.every(Boolean))
  }, [code, lesson, onChecked])

  const tabs = (['html', 'css'] as const).filter((t) => lesson.edit.includes(t) || code[t].trim())

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
      />
      <section className="lesson-work">
        <div className="file-tabs">
          {tabs.map((t) => (
            <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t === 'html' ? 'index.html' : 'styles.css'}
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
        <WebPreview code={code} frameRef={frame} />
      </section>
    </div>
  )
}

function JavaWorkspace({
  lesson,
  storageId,
  onChecked,
  side,
  actions,
  checkLabel,
}: {
  lesson: JavaLesson
  storageId: string
  onChecked?: (r: boolean[], ok: boolean) => void
  side?: ReactNode
  actions?: ReactNode
  checkLabel: string
}) {
  const [code, setCode] = useState<string>(() => loadCode(storageId, lesson.starter))
  const [input, setInput] = useState(lesson.sampleInput ?? '')
  const [results, setResults] = useState<TestState>(null)
  const [checking, setChecking] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [live, setLive] = useState('')
  const st = useJavaStatus()

  useEffect(() => {
    saveCode(storageId, code)
  }, [storageId, code])
  useEffect(() => {
    warmup()
  }, [])

  const errorLines = useMemo(() => (outcome && !outcome.compiled ? parseCompileErrors(outcome.errors).map((e) => e.line) : []), [outcome])

  const run = async () => {
    setLive('')
    setOutcome(null)
    const o = await runJava([{ path: 'Main.java', content: code }], [input], { onStream: (_r, s, t) => s === 'out' && setLive((x) => x + t) })
    setOutcome(o)
  }

  const check = async () => {
    setChecking(true)
    setLive('')
    const inputs = [...new Set(lesson.tests.map((t) => t.input ?? ''))]
    const o = await runJava([{ path: 'Main.java', content: code }], inputs, { timeoutMs: 5000 })
    let r: boolean[]
    if (!o.compiled || o.stopped) r = lesson.tests.map(() => false)
    else
      r = lesson.tests.map((t) => {
        const run = o.runs[inputs.indexOf(t.input ?? '')]
        if (!run || run.timedOut) return false
        try {
          return !!t.check(run.out, code)
        } catch {
          return false
        }
      })
    // en la consola se muestra la primera ejecución de prueba
    setOutcome(o)
    setChecking(false)
    setResults(r)
    onChecked?.(r, r.every(Boolean))
  }

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
          setOutcome(null)
        }}
        actions={actions}
        checkLabel={checkLabel}
      />
      <section className="lesson-work">
        <div className="file-tabs">
          <button type="button" className="active">
            Main.java
          </button>
          <span className="grow" />
          <button type="button" className="run-btn" onClick={run} disabled={st.busy && !checking}>
            ▶ Ejecutar
          </button>
          {st.busy && (
            <button type="button" className="stop-btn" onClick={() => stopJava()}>
              ⏹ Detener
            </button>
          )}
        </div>
        <div className="editor-box">
          <CodeEditor lang="java" value={code} onChange={(v) => {
            setCode(v)
            setResults(null)
          }} onRun={check} errorLines={errorLines} />
        </div>
        <div className="java-io">
          <label className="java-input">
            <span>Entrada (lo que escribiría el usuario por teclado, una línea por dato)</span>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3} spellCheck={false} placeholder="Ej.: Ana&#10;15" />
          </label>
          <div className="java-out">
            <span className="console-title">Consola</span>
            <JavaStatusBar />
            <JavaConsole outcome={outcome} live={live} />
          </div>
        </div>
      </section>
    </div>
  )
}

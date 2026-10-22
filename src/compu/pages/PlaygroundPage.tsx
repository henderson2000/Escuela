import { useEffect, useState } from 'react'
import { Segmented } from '../../components/ui'
import { download } from '../../lib/scores'
import { CodeEditor } from '../CodeEditor'
import { JavaConsole, JavaStatusBar, WebPreview, buildDoc } from '../Workspace'
import { runJava, stop, useJavaStatus, warmup, type Outcome } from '../java/runner'
import type { WebCode } from '../types'

const WEB_KEY = 'compu-libre-web'
const JAVA_KEY = 'compu-libre-java'

const WEB_START: WebCode = {
  html: '<h1>Mi página</h1>\n<p>Editá este código y mirá el resultado a la derecha.</p>\n<ul>\n  <li>HTML para la estructura</li>\n  <li>CSS para el diseño</li>\n</ul>\n',
  css: 'body {\n  font-family: sans-serif;\n  background: #f5f7fb;\n  color: #1f2937;\n  padding: 20px;\n}\n\nh1 {\n  color: #2563eb;\n}\n',
}
const JAVA_START =
  'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println("¿Cómo te llamás?");\n        String nombre = sc.nextLine();\n        System.out.println("¡Hola, " + nombre + "!");\n    }\n}\n'

function load<T>(k: string, d: T): T {
  try {
    const r = localStorage.getItem(k)
    return r ? (JSON.parse(r) as T) : d
  } catch {
    return d
  }
}
function save(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* sin almacenamiento */
  }
}

export function PlaygroundPage() {
  const [mode, setMode] = useState<'web' | 'java'>(() => load('compu-libre-modo', 'web'))
  useEffect(() => {
    save('compu-libre-modo', mode)
  }, [mode])
  return (
    <div className="page wide">
      <h1>🛠 Taller libre</h1>
      <p className="lead">Probá lo que quieras. Tu trabajo queda guardado en esta computadora y lo podés descargar.</p>
      <div className="playground-tabs">
        <Segmented<'web' | 'java'>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'web', label: '🌐 Página web (HTML + CSS)' },
            { value: 'java', label: '☕ Programa Java' },
          ]}
        />
      </div>
      {mode === 'web' ? <WebPlayground /> : <JavaPlayground />}
    </div>
  )
}

function WebPlayground() {
  const [code, setCode] = useState<WebCode>(() => load(WEB_KEY, WEB_START))
  useEffect(() => {
    save(WEB_KEY, code)
  }, [code])
  return (
    <div className="play-web">
      <div className="lesson-work">
        <div className="file-tabs">
          <button type="button" className="active">
            index.html
          </button>
        </div>
        <div className="editor-box">
          <CodeEditor lang="html" value={code.html} onChange={(v) => setCode((c) => ({ ...c, html: v }))} />
        </div>
        <div className="file-tabs">
          <button type="button" className="active">
            styles.css
          </button>
        </div>
        <div className="editor-box">
          <CodeEditor lang="css" value={code.css} onChange={(v) => setCode((c) => ({ ...c, css: v }))} />
        </div>
        <div className="row wrap">
          <button type="button" className="btn small" onClick={() => download('index.html', buildDoc(code), 'text/html')}>
            ⬇ Descargar la página
          </button>
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              if (confirm('¿Borrar todo y volver al ejemplo inicial?')) setCode(WEB_START)
            }}
          >
            ↺ Empezar de nuevo
          </button>
        </div>
      </div>
      <WebPreview code={code} />
    </div>
  )
}

function JavaPlayground() {
  const [code, setCode] = useState<string>(() => load(JAVA_KEY, JAVA_START))
  const [input, setInput] = useState('Ana')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [live, setLive] = useState('')
  const st = useJavaStatus()
  useEffect(() => {
    save(JAVA_KEY, code)
  }, [code])
  useEffect(() => {
    warmup()
  }, [])
  const run = async () => {
    setOutcome(null)
    setLive('')
    setOutcome(await runJava([{ path: 'Main.java', content: code }], [input], { onStream: (_r, s, t) => s === 'out' && setLive((x) => x + t), timeoutMs: 15000 }))
  }
  return (
    <section className="lesson-work">
      <div className="file-tabs">
        <button type="button" className="active">
          Main.java
        </button>
        <span className="grow" />
        <button type="button" className="run-btn" onClick={run} disabled={st.busy}>
          ▶ Ejecutar <small>(Ctrl+Enter)</small>
        </button>
        {st.busy && (
          <button type="button" className="stop-btn" onClick={() => stop()}>
            ⏹ Detener
          </button>
        )}
      </div>
      <div className="editor-box">
        <CodeEditor lang="java" value={code} onChange={setCode} onRun={run} />
      </div>
      <div className="java-io">
        <label className="java-input">
          <span>Entrada (lo que se escribe por teclado, una línea por dato)</span>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} spellCheck={false} />
        </label>
        <div className="java-out">
          <span className="console-title">Consola</span>
          <JavaStatusBar />
          <JavaConsole outcome={outcome} live={live} />
        </div>
      </div>
      <div className="row wrap">
        <button type="button" className="btn small" onClick={() => download('Main.java', code, 'text/x-java')}>
          ⬇ Descargar Main.java
        </button>
        <button
          type="button"
          className="btn small ghost"
          onClick={() => {
            if (confirm('¿Borrar todo y volver al ejemplo inicial?')) setCode(JAVA_START)
          }}
        >
          ↺ Empezar de nuevo
        </button>
      </div>
    </section>
  )
}

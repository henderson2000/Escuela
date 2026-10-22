import { useEffect, useState } from 'react'
import { Segmented } from '../../components/ui'
import { download } from '../../lib/scores'
import { CodeEditor } from '../CodeEditor'
import { ConsoleView, DomPreview } from '../Workspace'
import { buildDomDoc } from '../js/domRunner'
import { runConsole, stopConsole, type ConsoleResult } from '../js/consoleRunner'
import type { DomCode } from '../types'

const WEB_KEY = 'compu-libre-pagina'
const JS_KEY = 'compu-libre-consola'

const WEB_START: DomCode = {
  html: '<h1>Mi página</h1>\n<p id="texto">Tocá el botón.</p>\n<button id="boton">Contar</button>\n',
  js: 'let clics = 0;\nconst boton = document.getElementById("boton");\nconst texto = document.getElementById("texto");\n\nboton.addEventListener("click", function () {\n  clics = clics + 1;\n  texto.textContent = "Tocaste " + clics + " veces";\n});\n',
}
const JS_START = 'const nombre = prompt("¿Cómo te llamás?");\nconsole.log("¡Hola, " + nombre + "!");\n\nfor (let i = 1; i <= 3; i++) {\n  console.log("Vuelta " + i);\n}\n'

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
  const [mode, setMode] = useState<'web' | 'js'>(() => {
    const m = load<string>('compu-libre-modo2', 'web')
    return m === 'js' ? 'js' : 'web'
  })
  useEffect(() => {
    save('compu-libre-modo2', mode)
  }, [mode])
  return (
    <div className="page wide">
      <h1>🛠 Taller libre</h1>
      <p className="lead">Probá lo que quieras. Tu trabajo queda guardado en esta computadora y lo podés descargar.</p>
      <div className="playground-tabs">
        <Segmented<'web' | 'js'>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'web', label: '🌐 Página (HTML + JavaScript)' },
            { value: 'js', label: '⚡ Consola de JavaScript' },
          ]}
        />
      </div>
      {mode === 'web' ? <WebPlayground /> : <JsPlayground />}
    </div>
  )
}

function WebPlayground() {
  const [code, setCode] = useState<DomCode>(() => load(WEB_KEY, WEB_START))
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
            script.js
          </button>
        </div>
        <div className="editor-box">
          <CodeEditor lang="js" value={code.js} onChange={(v) => setCode((c) => ({ ...c, js: v }))} />
        </div>
        <div className="row wrap">
          <button
            type="button"
            className="btn small"
            onClick={() => {
              const h = /<\/body>/i.test(code.html) ? code.html.replace(/<\/body>/i, `<script>\n${code.js}\n</script>\n</body>`) : `${code.html}\n<script>\n${code.js}\n</script>\n`
              download('index.html', h, 'text/html')
            }}
          >
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
          {buildDomDoc(code).syntax && <span className="feedback bad">El JavaScript tiene un error de escritura (mirá la consola).</span>}
        </div>
      </div>
      <DomPreview code={code} />
    </div>
  )
}

function JsPlayground() {
  const [code, setCode] = useState<string>(() => load(JS_KEY, JS_START))
  const [input, setInput] = useState('Ana')
  const [result, setResult] = useState<ConsoleResult | null>(null)
  const [live, setLive] = useState('')
  const [running, setRunning] = useState(false)
  useEffect(() => {
    save(JS_KEY, code)
  }, [code])
  const run = async () => {
    setRunning(true)
    setResult(null)
    setLive('')
    setResult(await runConsole(code, input, (t) => setLive((x) => x + t), 8000))
    setRunning(false)
  }
  const errLine = result?.syntax?.line ?? result?.runtime?.line ?? 0
  return (
    <section className="lesson-work">
      <div className="file-tabs">
        <button type="button" className="active">
          programa.js
        </button>
        <span className="grow" />
        <button type="button" className="run-btn" onClick={run} disabled={running}>
          ▶ Ejecutar <small>(Ctrl+Enter)</small>
        </button>
        {running && (
          <button type="button" className="stop-btn" onClick={() => stopConsole()}>
            ⏹ Detener
          </button>
        )}
      </div>
      <div className="editor-box">
        <CodeEditor lang="js" value={code} onChange={setCode} onRun={run} errorLines={errLine ? [errLine] : []} />
      </div>
      <div className="java-io">
        <label className="java-input">
          <span>Entrada: las respuestas para cada prompt(), una por línea</span>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} spellCheck={false} />
        </label>
        <div className="java-out">
          <span className="console-title">Consola</span>
          <ConsoleView result={result} live={live} running={running} />
        </div>
      </div>
      <div className="row wrap">
        <button type="button" className="btn small" onClick={() => download('programa.js', code, 'text/javascript')}>
          ⬇ Descargar programa.js
        </button>
        <button
          type="button"
          className="btn small ghost"
          onClick={() => {
            if (confirm('¿Borrar todo y volver al ejemplo inicial?')) setCode(JS_START)
          }}
        >
          ↺ Empezar de nuevo
        </button>
      </div>
    </section>
  )
}

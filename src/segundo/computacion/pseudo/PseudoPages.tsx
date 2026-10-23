import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CodeEditor } from '../../../compu/CodeEditor'
import { BulbPurchase } from '../../../components/Bulbs'
import { NotFound } from '../../../components/ui'
import { useSub } from '../../../lib/nav'
import { BULBS, isDone, markActivity, useStore } from '../../../lib/scores'
import { check, type CheckResult } from './check'
import { run, type RunResult } from './interpreter'
import { LESSONS, getLesson, pseudoActivityId, type PseudoLesson } from './lessons'
import './pseudo.css'

const LIBRE = `Algoritmo libre
    Definir nombre Como Caracter
    Escribir "¿Cómo te llamás?"
    Leer nombre
    Escribir "Hola, ", nombre, ". ¡Bienvenido al taller!"
FinAlgoritmo
`

const load = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
const save = (key: string, v: string) => {
  try {
    localStorage.setItem(key, v)
  } catch {
    /* sin almacenamiento */
  }
}

/* ================================================================== lista */

export function PseudoHome() {
  const s = useStore()
  const sub = useSub()
  const solved = LESSONS.filter((l) => isDone(s, pseudoActivityId(l.id))).length
  const next = LESSONS.find((l) => !isDone(s, pseudoActivityId(l.id))) ?? LESSONS[0]
  return (
    <div className="page narrow">
      <h1>⌨️ Pseudocódigo</h1>
      <p className="lead">
        Escribí algoritmos en pseudocódigo, como en PSeInt: el programa se ejecuta acá mismo y se corrige solo. Cada lección resuelta da{' '}
        {BULBS.leccion} 💡.
      </p>
      <div className="card progress-card">
        <strong>Tu progreso (guardado en esta computadora)</strong>
        <div className="progress big">
          <div style={{ width: `${(solved / LESSONS.length) * 100}%` }} />
        </div>
        <span>
          {solved} de {LESSONS.length} lecciones ·{' '}
          <Link to={sub(`/pseudocodigo/${next.id}`)}>{solved === LESSONS.length ? 'repasar' : `seguir con "${next.title}"`} →</Link>
        </span>
      </div>
      <ol className="ps-list">
        {LESSONS.map((l, k) => {
          const done = isDone(s, pseudoActivityId(l.id))
          return (
            <li key={l.id}>
              <Link to={sub(`/pseudocodigo/${l.id}`)} className={`card ps-item ${done ? 'done' : ''}`}>
                <span className="ex-n">{k + 1}</span>
                <span>{l.title}</span>
                {done && <span className="tag ok">✔</span>}
              </Link>
            </li>
          )
        })}
      </ol>
      <p>
        <Link to={sub('/pseudocodigo/libre')} className="btn">
          🧪 Taller libre: probar cualquier algoritmo
        </Link>
      </p>
      <details className="card ps-ref">
        <summary>Referencia rápida</summary>
        <pre>{`Algoritmo nombre ... FinAlgoritmo
Definir x Como Entero | Real | Caracter | Logico
Escribir "texto", variable, 2 + 3
Leer variable
x <- expresión
Si condición Entonces ... SiNo ... FinSi
Segun x Hacer  1: ...  2: ...  De Otro Modo: ...  FinSegun
Mientras condición Hacer ... FinMientras
Para i <- 1 Hasta 10 Con Paso 1 Hacer ... FinPara
Repetir ... Hasta Que condición
Operadores: + - * / ^ MOD  = <> < > <= >=  Y O NO
Funciones: raiz(x) abs(x) trunc(x) redon(x) azar(n) longitud(t)`}</pre>
      </details>
    </div>
  )
}

/* ================================================================== lección */

export function PseudoLessonPage() {
  const { id } = useParams()
  const sub = useSub()
  if (id === 'libre') return <Libre />
  const lesson = getLesson(id)
  if (!lesson) return <NotFound what="esa lección" back={sub('/pseudocodigo')} backLabel="Ver las lecciones" />
  return <LessonView key={lesson.id} lesson={lesson} />
}

function Console({ result, inputs }: { result: RunResult | null; inputs?: string[] }) {
  if (!result) return <div className="ps-console empty">Tocá «Ejecutar» para ver la salida.</div>
  return (
    <div className="ps-console" aria-live="polite">
      {inputs && inputs.length > 0 && <div className="ps-in">Entrada: {inputs.join(' · ')}</div>}
      {result.output.map((l, k) => (
        <div key={k}>{l || ' '}</div>
      ))}
      {result.error && (
        <div className="ps-err">
          ✘ {result.error.line ? `Línea ${result.error.line}: ` : ''}
          {result.error.message}
        </div>
      )}
      {!result.error && result.output.length === 0 && <div className="hint">(el programa no mostró nada)</div>}
    </div>
  )
}

function Editor({ code, setCode, onRun, errorLine }: { code: string; setCode: (v: string) => void; onRun: () => void; errorLine?: number }) {
  return (
    <div className="ps-editor">
      <CodeEditor value={code} onChange={setCode} lang="pseudo" onRun={onRun} errorLines={errorLine ? [errorLine] : []} />
    </div>
  )
}

function LessonView({ lesson }: { lesson: PseudoLesson }) {
  const sub = useSub()
  const s = useStore()
  const actId = pseudoActivityId(lesson.id)
  const key = `pseudo-${lesson.id}`
  const [code, setCodeState] = useState(() => load(key, lesson.start))
  const [inputs, setInputs] = useState(() => lesson.tests[0]?.inputs.join('\n') ?? '')
  const [result, setResult] = useState<RunResult | null>(null)
  const [checked, setChecked] = useState<CheckResult | null>(null)
  const solved = isDone(s, actId)
  const k = LESSONS.indexOf(lesson)
  const prev = LESSONS[k - 1]
  const next = LESSONS[k + 1]
  const setCode = (v: string) => {
    setCodeState(v)
    save(key, v)
    setChecked(null)
  }
  const inputList = useMemo(() => inputs.split('\n').filter((x, i, a) => x !== '' || i < a.length - 1), [inputs])
  const ejecutar = () => {
    setResult(run(code, inputList))
    setChecked(null)
  }
  const comprobar = () => {
    const c = check(lesson, code)
    setChecked(c)
    const firstBad = c.tests.find((t) => !t.ok)
    setResult(firstBad ? firstBad.result : (c.tests[c.tests.length - 1]?.result ?? null))
    if (firstBad) setInputs(firstBad.inputs.join('\n'))
    if (c.ok) markActivity(actId, true, BULBS.leccion, `Pseudocódigo: ${lesson.title}`)
  }
  const errLine = result?.error?.line
  return (
    <div className="page ps-page">
      <Link to={sub('/pseudocodigo')} className="back">
        ← Lecciones
      </Link>
      <h1>
        <span className="ex-n big">{k + 1}</span> {lesson.title} {solved && <span className="tag ok">✔ resuelta</span>}
      </h1>
      <div className="ps-grid">
        <section className="card ps-left">
          {lesson.teoria}
          <div className="ps-task">
            <strong>Consigna</strong>
            <p>{lesson.consigna}</p>
          </div>
          {lesson.tests.some((t) => t.inputs.length) && (
            <p className="hint">
              Se prueba con: {lesson.tests.map((t) => (t.inputs.length ? t.inputs.join(', ') : '—')).join(' · ')}
            </p>
          )}
          <BulbPurchase itemKey={`hint:${actId}`} cost={BULBS.pista} label="Ver una pista" what={`Pista: pseudocódigo ${lesson.title}`}>
            <code>{lesson.hint}</code>
          </BulbPurchase>
          <BulbPurchase
            itemKey={`sol:${actId}`}
            cost={BULBS.solucion}
            label="Ver la solución"
            what={`Solución: pseudocódigo ${lesson.title}`}
            confirmText="Si ves la solución, esta lección ya no te da lamparitas. ¿Seguro?"
          >
            <pre className="ps-sol">{lesson.solucion}</pre>
            <button type="button" className="btn small" onClick={() => setCode(lesson.solucion)}>
              Copiar al editor
            </button>
          </BulbPurchase>
        </section>
        <section className="ps-right">
          <Editor code={code} setCode={setCode} onRun={ejecutar} errorLine={errLine} />
          <label className="field">
            <span className="field-label">Entrada (un dato por renglón, para cada Leer)</span>
            <textarea className="input ps-input" rows={3} value={inputs} onChange={(e) => setInputs(e.target.value)} spellCheck={false} />
          </label>
          <div className="ps-actions">
            <button type="button" className="btn" onClick={ejecutar}>
              ▶ Ejecutar
            </button>
            <button type="button" className="btn primary" onClick={comprobar}>
              ✔ Comprobar
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                if (confirm('¿Volver al código inicial? Se pierde lo que escribiste.')) setCode(lesson.start)
              }}
            >
              Reiniciar
            </button>
          </div>
          <Console result={result} inputs={result ? inputList : undefined} />
          {checked && (
            <div className={`card ps-check ${checked.ok ? 'ok' : 'bad'}`}>
              {checked.ok ? (
                <>
                  <strong>✔ ¡Correcto! Pasó todas las pruebas.</strong>
                  {next && (
                    <p>
                      <Link to={sub(`/pseudocodigo/${next.id}`)} className="btn primary small">
                        Siguiente: {next.title} →
                      </Link>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <strong>Todavía no.</strong>
                  <ul>
                    {checked.missing.map((m) => (
                      <li key={m}>Tenés que usar: {m}.</li>
                    ))}
                    {checked.tests.map((t, i) => (
                      <li key={i}>
                        {t.ok ? '✔' : '✘'} Con {t.inputs.length ? `entrada ${t.inputs.join(', ')}` : 'sin entrada'}: se esperaba «{t.expect.join(' / ')}»
                        {!t.ok && (t.result.error ? ` y dio error en la línea ${t.result.error.line}.` : `, salió «${t.result.output.join(' / ') || '(nada)'}».`)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>
      </div>
      <div className="ex-nav">
        {prev ? (
          <Link to={sub(`/pseudocodigo/${prev.id}`)} className="btn">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={sub(`/pseudocodigo/${next.id}`)} className="btn">
            {next.title} →
          </Link>
        )}
      </div>
    </div>
  )
}

function Libre() {
  const sub = useSub()
  const [code, setCodeState] = useState(() => load('pseudo-libre', LIBRE))
  const [inputs, setInputs] = useState('Sofía')
  const [result, setResult] = useState<RunResult | null>(null)
  const inputList = inputs.split('\n').filter((x, i, a) => x !== '' || i < a.length - 1)
  const ejecutar = () => setResult(run(code, inputList))
  return (
    <div className="page ps-page">
      <Link to={sub('/pseudocodigo')} className="back">
        ← Lecciones
      </Link>
      <h1>🧪 Taller libre</h1>
      <p className="lead">Escribí cualquier algoritmo y ejecutalo. Lo que escribas queda guardado en esta computadora.</p>
      <Editor
        code={code}
        setCode={(v) => {
          setCodeState(v)
          save('pseudo-libre', v)
        }}
        onRun={ejecutar}
        errorLine={result?.error?.line}
      />
      <label className="field">
        <span className="field-label">Entrada (un dato por renglón)</span>
        <textarea className="input ps-input" rows={3} value={inputs} onChange={(e) => setInputs(e.target.value)} spellCheck={false} />
      </label>
      <div className="ps-actions">
        <button type="button" className="btn primary" onClick={ejecutar}>
          ▶ Ejecutar
        </button>
      </div>
      <Console result={result} inputs={result ? inputList : undefined} />
    </div>
  )
}

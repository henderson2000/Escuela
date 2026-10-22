// Herramienta de desarrollo: verifica que cada lección y desafío del curso esté bien armado.
// Abrir /verify-course.html con el servidor de desarrollo (npm run dev).
import { TRACKS, lessonsOf } from './course'
import { CHALLENGES } from './challenges'
import { buildDoc, makeCtx } from './Workspace'
import { runConsole } from './js/consoleRunner'
import { buildDomDoc, loadDoc, makeDomCtx } from './js/domRunner'
import type { DomCode, DomLesson, JsLesson, Lesson, WebCode, WebLesson } from './types'

const log = document.getElementById('log')!
const out = (s: string) => {
  log.textContent += s + '\n'
}

const frame = document.createElement('iframe')
frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms')
frame.style.cssText = 'width:900px;height:600px;position:absolute;left:-3000px'
document.body.appendChild(frame)

const safe = <C,>(f: (c: C) => boolean, c: C) => {
  try {
    return !!f(c)
  } catch {
    return false
  }
}

async function webResults(l: WebLesson, code: WebCode): Promise<boolean[]> {
  await loadDoc(frame, buildDoc(code))
  const ctx = makeCtx(frame.contentDocument!, code)
  return l.tests.map((t) => safe(t.test, ctx))
}

async function domResults(l: DomLesson, code: DomCode): Promise<{ r: boolean[]; note: string }> {
  const b = buildDomDoc(code)
  if (b.syntax) return { r: l.tests.map(() => false), note: `ERROR DE SINTAXIS línea ${b.syntax.line}: ${b.syntax.message}` }
  const r: boolean[] = []
  let note = ''
  for (const t of l.tests) {
    await loadDoc(frame, b.doc)
    const ctx = makeDomCtx(makeCtx(frame.contentDocument!, { html: code.html, css: '' }), code.js, frame, b.jsLine)
    r.push(safe(t.test, ctx))
    if (ctx.errors.length) note = 'errores: ' + ctx.errors.join(' | ')
  }
  return { r, note }
}

async function jsResults(l: JsLesson, code: string): Promise<{ r: boolean[]; note: string }> {
  const inputs = [...new Set(l.tests.map((t) => t.input ?? ''))]
  const res = new Map<string, Awaited<ReturnType<typeof runConsole>>>()
  for (const i of inputs) res.set(i, await runConsole(code, i, undefined, 3000))
  const first = res.get(inputs[0])!
  const note = first.syntax ? `ERROR DE SINTAXIS: ${first.syntax.message}` : first.runtime ? `ERROR: ${first.runtime.message}` : first.timedOut ? 'SE CORTÓ (bucle)' : JSON.stringify(first.out.slice(0, 100))
  return {
    r: l.tests.map((t) => {
      const o = res.get(t.input ?? '')!
      return !o.syntax && !o.timedOut && safe((c: string) => t.check(c, code), o.out)
    }),
    note,
  }
}

async function results(l: Lesson, which: 'solution' | 'starter') {
  if (l.kind === 'web') return { r: await webResults(l, l[which]), note: '' }
  if (l.kind === 'dom') return domResults(l, l[which])
  return jsResults(l, l[which])
}

async function check(l: Lesson): Promise<boolean> {
  const t0 = performance.now()
  const sol = await results(l, 'solution')
  const start = await results(l, 'starter')
  const solOk = sol.r.every(Boolean)
  const startOk = !start.r.every(Boolean)
  const ok = solOk && startOk
  out(
    `${ok ? 'OK ' : 'MAL'} ${l.id.padEnd(18)} ${Math.round(performance.now() - t0)}ms` +
      (solOk ? '' : `\n     la SOLUCIÓN falla: ${l.tests.filter((_, i) => !sol.r[i]).map((t) => t.text).join(' / ')}  ${sol.note}`) +
      (startOk ? '' : '\n     el CÓDIGO INICIAL ya pasa todas las pruebas'),
  )
  return ok
}

const solo = new URLSearchParams(location.search).get('solo')?.split(',')
const all: Lesson[] = [...TRACKS.flatMap(lessonsOf), ...CHALLENGES].filter((l) => !solo || solo.includes(l.id))
const ids = new Set<string>()
let bad = 0
for (const l of all) {
  if (ids.has(l.id)) {
    out(`MAL id repetido: ${l.id}`)
    bad++
  }
  ids.add(l.id)
}
for (const l of all) if (!(await check(l))) bad++
out(`\nFIN: ${all.length} lecciones, ${bad} con problemas`)

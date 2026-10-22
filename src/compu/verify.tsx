// Herramienta de desarrollo: verifica que cada lección y desafío del curso esté bien armado.
// Abrir /verify-course.html con el servidor de desarrollo (npm run dev).
import { TRACKS, lessonsOf } from './course'
import { CHALLENGES } from './challenges'
import { buildDoc, makeCtx } from './Workspace'
import { runJava } from './java/runner'
import type { JavaLesson, Lesson, WebCode, WebLesson } from './types'

const log = document.getElementById('log')!
const out = (s: string) => {
  log.textContent += s + '\n'
}

const frame = document.createElement('iframe')
frame.setAttribute('sandbox', 'allow-same-origin')
frame.style.cssText = 'width:900px;height:600px;position:absolute;left:-2000px'
document.body.appendChild(frame)

function webResults(l: WebLesson, code: WebCode): Promise<boolean[]> {
  return new Promise((resolve) => {
    let finished = false
    const go = () => {
      if (finished) return
      finished = true
      setTimeout(() => {
        const ctx = makeCtx(frame.contentDocument!, code)
        resolve(
          l.tests.map((t) => {
            try {
              return !!t.test(ctx)
            } catch {
              return false
            }
          }),
        )
      }, 30)
    }
    frame.onload = go
    setTimeout(go, 2500)
    frame.srcdoc = buildDoc(code)
  })
}

async function javaResults(l: JavaLesson, code: string): Promise<{ r: boolean[]; note: string }> {
  const inputs = [...new Set(l.tests.map((t) => t.input ?? ''))]
  const o = await runJava([{ path: 'Main.java', content: code }], inputs, { timeoutMs: 8000 })
  if (!o.compiled) return { r: l.tests.map(() => false), note: 'NO COMPILA: ' + o.errors.split('\n')[0] }
  return {
    r: l.tests.map((t) => {
      const run = o.runs[inputs.indexOf(t.input ?? '')]
      try {
        return !!run && !run.timedOut && !!t.check(run.out, code)
      } catch {
        return false
      }
    }),
    note: o.runs.map((x) => JSON.stringify(x.out.slice(0, 80))).join(' | '),
  }
}

async function check(l: Lesson): Promise<boolean> {
  const t0 = performance.now()
  let sol: boolean[]
  let start: boolean[]
  let note = ''
  if (l.kind === 'web') {
    sol = await webResults(l, l.solution)
    start = await webResults(l, l.starter)
  } else {
    const a = await javaResults(l, l.solution)
    sol = a.r
    note = a.note
    start = (await javaResults(l, l.starter)).r
  }
  const solOk = sol.every(Boolean)
  const startOk = !start.every(Boolean)
  const ok = solOk && startOk
  out(`${ok ? 'OK ' : 'MAL'} ${l.id.padEnd(16)} ${Math.round(performance.now() - t0)}ms` + (solOk ? '' : `\n     la SOLUCIÓN falla: ${l.tests.filter((_, i) => !sol[i]).map((t) => t.text).join(' / ')}  ${note}`) + (startOk ? '' : '\n     el CÓDIGO INICIAL ya pasa todas las pruebas'))
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

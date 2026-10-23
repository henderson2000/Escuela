import { norm, run, usesKeyword, type RunResult } from './interpreter'
import type { PseudoLesson } from './lessons'

const clean = (s: string) => norm(s).replace(/\s+/g, ' ').trim()

export interface TestResult {
  inputs: string[]
  expect: string[]
  result: RunResult
  ok: boolean
}

export interface CheckResult {
  ok: boolean
  tests: TestResult[]
  /** palabras que faltan usar */
  missing: string[]
}

/** Las líneas esperadas tienen que aparecer en orden en la salida (se permiten mensajes extra, como "Ingresá un número"). */
export function matches(output: string[], expect: string[]) {
  let k = 0
  for (const line of output) if (k < expect.length && clean(line) === clean(expect[k])) k++
  return k === expect.length
}

export function check(lesson: PseudoLesson, src: string): CheckResult {
  const tests = lesson.tests.map((t) => {
    const result = run(src, t.inputs)
    return { ...t, result, ok: !result.error && matches(result.output, t.expect) }
  })
  const missing = (lesson.usa ?? []).filter((group) => !group.some((w) => usesKeyword(src, w))).map((g) => g.join(' o '))
  return { ok: tests.every((t) => t.ok) && missing.length === 0, tests, missing }
}

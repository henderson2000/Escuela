import type { ReactNode } from 'react'
import { QuizGame, pickOne, shuffle, type QuizRound } from '../../games/QuizGame'
import { VC_TABLE, dms, fmt } from '../theory'

export const CALC_GAME = 'torno-calculos'

const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const rad = (d: number) => (d * Math.PI) / 180
const deg = (x: number) => (x * 180) / Math.PI

/** Arma 4 opciones (la correcta + 3 distractores distintos al mostrarse). */
function options(correct: number, distractors: number[], show: (n: number) => string, fallback: number[] = []) {
  const labels = [show(correct)]
  for (const d of [...shuffle(distractors), ...fallback, correct * 1.5, correct * 0.75, correct * 2.5, correct * 0.4]) {
    if (labels.length >= 4) break
    if (!Number.isFinite(d) || d <= 0) continue
    const l = show(d)
    if (!labels.includes(l)) labels.push(l)
  }
  return {
    options: shuffle(labels.map((label, i) => ({ id: String(i), label }))),
    answer: '0',
  }
}

function Data({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="tn-data">
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <span>{k}</span>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  )
}

type Kind = 'rpm' | 'contrapunta' | 'h' | 'x' | 'beta' | 'charriot' | 'ap'

function rpmRound(): QuizRound {
  const mats = Object.keys(VC_TABLE) as (keyof typeof VC_TABLE)[]
  const m = pickOne(mats)
  const tool = pickOne(['hss', 'md'] as const)
  const [lo, hi] = VC_TABLE[m][tool]
  const vc = Math.round(r(lo, hi) / 5) * 5
  const D = pickOne([12, 16, 20, 25, 30, 40, 50, 60, 80, 100])
  const n = (1000 * vc) / (Math.PI * D)
  const show = (x: number) => `${Math.round(x)} rpm`
  return {
    prompt: '¿A cuántas rpm tiene que girar la pieza?',
    visual: (
      <Data
        rows={[
          ['Material', VC_TABLE[m].name],
          ['Herramienta', tool === 'hss' ? 'acero rápido' : 'metal duro'],
          ['Vc', `${vc} m/min`],
          ['Diámetro', `${D} mm`],
        ]}
      />
    ),
    ...options(n, [2 * n, n / 2, n * Math.PI, n / Math.PI], show),
    explain: (
      <>
        n = 1000 × Vc / (π × D) = 1000 × {vc} / (π × {D}) ≈ <strong>{Math.round(n)} rpm</strong>.
      </>
    ),
  }
}

function contrapuntaRound(): QuizRound {
  const D = r(6, 24) * 5
  const delta = pickOne([4, 6, 8, 10, 12, 16, 20].filter((x) => x < D - 5))
  const d = D - delta
  const Lc = pickOne([100, 120, 150, 200, 250])
  const LT = Lc + pickOne([0, 50, 100, 150, 200, 250])
  const S = (delta * LT) / (2 * Lc)
  const show = (x: number) => `${fmt(x, 2)} mm`
  return {
    prompt: '¿Cuánto hay que desplazar la contrapunta?',
    visual: (
      <Data
        rows={[
          ['ø mayor', `${D} mm`],
          ['ø menor', `${d} mm`],
          ['Largo del cono', `${Lc} mm`],
          ['Largo total (entre puntas)', `${LT} mm`],
        ]}
      />
    ),
    ...options(S, [(delta * LT) / Lc, (delta * Lc) / (2 * LT), delta / 2, (delta * Lc) / LT], show),
    explain: (
      <>
        S = (ø Mayor − ø Menor) × Largo Total / (Largo Cono × 2) = {delta} × {LT} / ({Lc} × 2) = <strong>{fmt(S, 2)} mm</strong>.
      </>
    ),
  }
}

const THREADS: { name: string; D: number; d: number; p: number; a: number }[] = [
  { name: 'M6 × 1', D: 6, d: 4.773, p: 1, a: 60 },
  { name: 'M8 × 1,25', D: 8, d: 6.466, p: 1.25, a: 60 },
  { name: 'M10 × 1,5', D: 10, d: 8.16, p: 1.5, a: 60 },
  { name: 'M12 × 1,75', D: 12, d: 9.853, p: 1.75, a: 60 },
  { name: 'M16 × 2', D: 16, d: 13.546, p: 2, a: 60 },
  { name: 'M20 × 2,5', D: 20, d: 16.933, p: 2.5, a: 60 },
  { name: 'W 3/8" (apunte)', D: 9.525, d: 8, p: 25.4 / 16, a: 55 },
]

function hRound(): QuizRound {
  const t = pickOne(THREADS)
  const h = (t.D - t.d) / 2
  const show = (x: number) => `${fmt(x, 4)} mm`
  return {
    prompt: '¿Cuál es la profundidad de la rosca h?',
    visual: (
      <Data
        rows={[
          ['Rosca', t.name],
          ['ø exterior', `${fmt(t.D, 3)} mm`],
          ['ø interior (tabla)', `${fmt(t.d, 3)} mm`],
        ]}
      />
    ),
    ...options(h, [t.D - t.d, h / Math.cos(rad(t.a / 2)), t.p, h / 2], show),
    explain: (
      <>
        h = (ø ext − ø int) / 2 = ({fmt(t.D, 3)} − {fmt(t.d, 3)}) / 2 = <strong>{fmt(h, 4)} mm</strong>.
      </>
    ),
  }
}

function xRound(): QuizRound {
  const t = pickOne(THREADS)
  const h = (t.D - t.d) / 2
  const c = Math.cos(rad(t.a / 2))
  const x = h / c
  const show = (v: number) => `${fmt(v, 3)} mm`
  return {
    prompt: '¿Cuánto avanza el charriot en flanco (x) para llegar a la profundidad?',
    visual: (
      <Data
        rows={[
          ['Rosca', `${t.name} (${t.a}°)`],
          ['ø exterior', `${fmt(t.D, 3)} mm`],
          ['ø interior', `${fmt(t.d, 3)} mm`],
          ['α/2', dms(t.a / 2)],
        ]}
      />
    ),
    ...options(x, [h, h * c, 2 * h, (t.D - t.d) / c], show),
    explain: (
      <>
        h = ({fmt(t.D, 3)} − {fmt(t.d, 3)}) / 2 = {fmt(h, 4)} mm → x = h / cos(α/2) = {fmt(h, 4)} / cos {dms(t.a / 2)} = <strong>{fmt(x, 3)} mm</strong>.
      </>
    ),
  }
}

function betaRound(): QuizRound {
  const t = pickOne([
    { name: 'Métrica', a: 60 },
    { name: 'Whitworth', a: 55 },
    { name: 'Trapecial', a: 30 },
    { name: 'ACME', a: 29 },
  ])
  const b = 90 - t.a / 2
  return {
    prompt: '¿Cuántos grados se inclina el charriot respecto al eje del torno (β)?',
    visual: (
      <Data
        rows={[
          ['Rosca', t.name],
          ['Ángulo del filete α', `${t.a}°`],
        ]}
      />
    ),
    ...options(b, [t.a / 2, 90 - t.a, t.a, 90 + t.a / 2, 45, 90], dms),
    explain: (
      <>
        β = 90° − α/2 = 90° − {dms(t.a / 2)} = <strong>{dms(b)}</strong>.
      </>
    ),
  }
}

function charriotRound(): QuizRound {
  const L = pickOne([20, 25, 30, 40, 50, 60, 80, 100])
  const D = r(4, 16) * 5
  const delta = pickOne([2, 4, 5, 6, 8, 10, 12, 20].filter((x) => x < D - 4))
  const d = D - delta
  const t = delta / (2 * L)
  const a = deg(Math.atan(t))
  const show = (v: number) => `${fmt(v, 2)}°`
  return {
    prompt: '¿Cuántos grados se gira el charriot para hacer este cono?',
    visual: (
      <Data
        rows={[
          ['ø mayor D', `${D} mm`],
          ['ø menor d', `${d} mm`],
          ['Largo del cono L', `${L} mm`],
        ]}
      />
    ),
    ...options(a, [deg(Math.atan(delta / L)), 2 * a, t, deg(Math.atan(delta / (4 * L)))], show),
    explain: (
      <>
        tan α = (D − d) / (2 × L) = {delta} / {2 * L} = {fmt(t, 4)} → α = arctan {fmt(t, 4)} ≈ <strong>{fmt(a, 2)}°</strong>.
      </>
    ),
  }
}

function apRound(): QuizRound {
  const D = r(4, 24) * 5
  const delta = pickOne([1, 2, 3, 4, 5, 6])
  const d = D - delta
  const ap = delta / 2
  const show = (v: number) => `${fmt(v, 2)} mm`
  return {
    prompt: '¿Cuál fue la profundidad de pasada ap?',
    visual: (
      <Data
        rows={[
          ['ø antes', `${D} mm`],
          ['ø después', `${d} mm`],
        ]}
      />
    ),
    ...options(ap, [delta, delta / 4, delta * 2, delta / 3], show),
    explain: (
      <>
        ap = (ø sin mecanizar − ø mecanizado) / 2 = ({D} − {d}) / 2 = <strong>{fmt(ap, 2)} mm</strong>.
      </>
    ),
  }
}

const GEN: Record<Kind, () => QuizRound> = {
  rpm: rpmRound,
  contrapunta: contrapuntaRound,
  h: hRound,
  x: xRound,
  beta: betaRound,
  charriot: charriotRound,
  ap: apRound,
}

export function makeCalcRounds(n = 10): QuizRound[] {
  const base: Kind[] = ['rpm', 'rpm', 'contrapunta', 'contrapunta', 'h', 'x', 'beta', 'charriot', 'ap']
  const kinds = [...base, pickOne<Kind>(['rpm', 'contrapunta', 'h', 'beta'])]
  return shuffle(kinds)
    .slice(0, n)
    .map((k) => GEN[k]())
}

export function CalcGame() {
  return (
    <QuizGame
      game={CALC_GAME}
      title="Calculá rápido"
      icon="🧮"
      info="Problemas de taller con números nuevos en cada partida: rpm, desplazamiento de la contrapunta, conos con el charriot, profundidad de rosca y ángulo β. Tené a mano la calculadora."
      intro={<p>10 cálculos. Respuesta correcta: 15 puntos + hasta 5 de bonus por rapidez (máximo 200). Ojo con los errores típicos: las opciones incorrectas los traen.</p>}
      makeRounds={() => makeCalcRounds(10)}
    />
  )
}

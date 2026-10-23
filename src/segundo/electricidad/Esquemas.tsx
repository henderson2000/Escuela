import { useState, type ReactElement } from 'react'
import { Segmented } from '../../components/ui'

/* ================================================================== resolución de circuitos */

export interface CircuitoGuia {
  n: number
  /** 'serie' | 'paralelo' | 'mixto' (Ra en serie con el paralelo de Rb y Rc) */
  tipo: 'serie' | 'paralelo' | 'mixto'
  r: number[]
  u: number
  /** en los mixtos: qué resistencia está sola (índice) y cuáles en paralelo */
  sola?: number
}

/** Los seis circuitos de la «Guía de circuitos eléctricos» de 2do año. */
export const GUIA_CIRCUITOS: CircuitoGuia[] = [
  { n: 1, tipo: 'serie', r: [20, 40, 60], u: 220 },
  { n: 2, tipo: 'paralelo', r: [40, 150, 60], u: 220 },
  { n: 3, tipo: 'serie', r: [50, 20, 90], u: 380 },
  { n: 4, tipo: 'paralelo', r: [60, 150], u: 220 },
  { n: 5, tipo: 'mixto', r: [15, 60, 300], u: 220, sola: 0 },
  { n: 6, tipo: 'mixto', r: [70, 100, 90], u: 380, sola: 1 },
]

export interface Solucion {
  rt: number
  it: number
  i: number[]
  v: number[]
}

export function resolver(c: CircuitoGuia): Solucion {
  if (c.tipo === 'serie') {
    const rt = c.r.reduce((a, b) => a + b, 0)
    const it = c.u / rt
    return { rt, it, i: c.r.map(() => it), v: c.r.map((r) => r * it) }
  }
  if (c.tipo === 'paralelo') {
    const rt = 1 / c.r.reduce((a, r) => a + 1 / r, 0)
    const i = c.r.map((r) => c.u / r)
    return { rt, it: c.u / rt, i, v: c.r.map(() => c.u) }
  }
  const s = c.sola ?? 0
  const par = c.r.map((_, k) => k).filter((k) => k !== s)
  const rp = 1 / par.reduce((a, k) => a + 1 / c.r[k], 0)
  const rt = c.r[s] + rp
  const it = c.u / rt
  const up = it * rp
  const i: number[] = []
  const v: number[] = []
  c.r.forEach((r, k) => {
    if (k === s) {
      i[k] = it
      v[k] = it * r
    } else {
      v[k] = up
      i[k] = up / r
    }
  })
  return { rt, it, i, v }
}

/* ================================================================== dibujos */

/** Resistencia en zigzag entre (x1,y) y (x2,y) o vertical. */
function Res({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  const z = 30
  const a = (len - z) / 2
  const pts = [`0,0`, `${a},0`]
  for (let k = 0; k < 6; k++) pts.push(`${a + (k + 0.5) * (z / 6)},${k % 2 ? 6 : -6}`)
  pts.push(`${a + z},0`, `${len},0`)
  const vertical = Math.abs(ang) > 45
  return (
    <g transform={`translate(${x1} ${y1}) rotate(${ang})`}>
      <polyline points={pts.join(' ')} className="wire" />
      <text x={len / 2} y={vertical ? 0 : -11} className="lbl" transform={vertical ? `rotate(${-ang} ${len / 2} 0) translate(16 4)` : undefined}>
        {label}
      </text>
    </g>
  )
}

function Fuente({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x - 4} y1={y - 12} x2={x - 4} y2={y + 12} className="wire" />
      <line x1={x + 4} y1={y - 6} x2={x + 4} y2={y + 6} className="wire thick" />
      <text x={x} y={y + 26} className="lbl">
        {label}
      </text>
    </g>
  )
}

/** Dibujo de uno de los circuitos de la guía. */
export function CircuitoSvg({ c }: { c: CircuitoGuia }) {
  const W = 300
  const H = 150
  const els: ReactElement[] = []
  const L = (x1: number, y1: number, x2: number, y2: number, k: string) => els.push(<line key={k} x1={x1} y1={y1} x2={x2} y2={y2} className="wire" />)
  const dot = (x: number, y: number, k: string) => els.push(<circle key={k} cx={x} cy={y} r={3} className="node" />)
  const names = c.r.map((r, k) => `R${k + 1} = ${r} Ω`)
  // fuente abajo al centro, lazo rectangular
  L(20, 30, 20, 120, 'l')
  L(280, 30, 280, 120, 'r')
  L(20, 120, 142, 120, 'b1')
  L(158, 120, 280, 120, 'b2')
  els.push(<Fuente key="u" x={150} y={120} label={`U = ${c.u} V`} />)
  if (c.tipo === 'serie') {
    const xs = [20, 106, 193, 280]
    c.r.forEach((_, k) => els.push(<Res key={`r${k}`} x1={xs[k]} y1={30} x2={xs[k + 1]} y2={30} label={names[k]} />))
  } else if (c.tipo === 'paralelo') {
    L(20, 30, 80, 30, 't1')
    L(220, 30, 280, 30, 't2')
    const n = c.r.length
    const ys = n === 2 ? [18, 62] : [12, 44, 76]
    L(80, ys[0], 80, ys[n - 1], 'v1')
    L(220, ys[0], 220, ys[n - 1], 'v2')
    dot(80, 30, 'd1')
    dot(220, 30, 'd2')
    c.r.forEach((_, k) => els.push(<Res key={`r${k}`} x1={80} y1={ys[k]} x2={220} y2={ys[k]} label={names[k]} />))
  } else {
    const s = c.sola ?? 0
    const par = c.r.map((_, k) => k).filter((k) => k !== s)
    els.push(<Res key="rs" x1={20} y1={30} x2={130} y2={30} label={names[s]} />)
    L(130, 30, 150, 30, 'ta')
    L(250, 30, 280, 30, 'tb')
    L(150, 14, 150, 50, 'va')
    L(250, 14, 250, 50, 'vb')
    dot(150, 30, 'da')
    dot(250, 30, 'db')
    els.push(<Res key="p0" x1={150} y1={14} x2={250} y2={14} label={names[par[0]]} />)
    els.push(<Res key="p1" x1={150} y1={50} x2={250} y2={50} label="" />)
    els.push(
      <text key="p1l" x={200} y={70} className="lbl">
        {names[par[1]]}
      </text>,
    )
  }
  return (
    <svg viewBox={`0 -12 ${W} ${H + 12}`} className="e2-svg" role="img" aria-label={`Circuito ${c.n}: ${c.tipo}`}>
      {els}
    </svg>
  )
}

/* ================================================================== símbolos */

export type SimboloId =
  | 'lampara'
  | 'caja'
  | 'int-simple-u'
  | 'int-simple-f'
  | 'desviador-u'
  | 'desviador-f'
  | 'inversor-u'
  | 'termomagnetico'
  | 'diferencial'
  | 'fusible'
  | 'toma'
  | 'tierra'

export const SIMBOLOS: { id: SimboloId; name: string; desc: string }[] = [
  { id: 'lampara', name: 'Lámpara', desc: 'Círculo con una cruz.' },
  { id: 'caja', name: 'Caja de derivación', desc: 'Círculo vacío: donde se empalman y derivan los conductores.' },
  { id: 'int-simple-u', name: 'Interruptor simple (unifilar)', desc: 'Círculo con una línea inclinada y un trazo: un polo.' },
  { id: 'int-simple-f', name: 'Interruptor simple (funcional)', desc: 'Un contacto que se abre: la palanca inclinada.' },
  { id: 'desviador-u', name: 'Interruptor desviador o de combinación (unifilar)', desc: 'Círculo con dos líneas hacia lados opuestos.' },
  { id: 'desviador-f', name: 'Interruptor desviador (funcional)', desc: 'Un borne común que se conecta con uno de dos contactos.' },
  { id: 'inversor-u', name: 'Interruptor inversor (unifilar)', desc: 'Círculo con dos líneas cruzadas. Con desviadores, permite comandar desde tres o más lugares.' },
  { id: 'termomagnetico', name: 'Interruptor termomagnético (unifilar)', desc: 'Contacto con el bloque de disparo y la marca I>.' },
  { id: 'diferencial', name: 'Interruptor diferencial (unifilar)', desc: 'Contacto con el toroide (óvalo) y la marca IΔ.' },
  { id: 'fusible', name: 'Fusible', desc: 'Rectángulo atravesado por la línea.' },
  { id: 'toma', name: 'Tomacorriente', desc: 'Semicírculo con la conexión.' },
  { id: 'tierra', name: 'Puesta a tierra', desc: 'Tres líneas que se achican.' },
]

export function Simbolo({ id, size = 80 }: { id: SimboloId; size?: number }) {
  const g = (() => {
    switch (id) {
      case 'lampara':
        return (
          <>
            <line x1={0} y1={50} x2={30} y2={50} className="wire" />
            <circle cx={50} cy={50} r={20} className="wire" />
            <line x1={36} y1={36} x2={64} y2={64} className="wire" />
            <line x1={64} y1={36} x2={36} y2={64} className="wire" />
            <line x1={70} y1={50} x2={100} y2={50} className="wire" />
          </>
        )
      case 'caja':
        return (
          <>
            <line x1={0} y1={50} x2={30} y2={50} className="wire" />
            <circle cx={50} cy={50} r={20} className="wire" />
            <line x1={70} y1={50} x2={100} y2={50} className="wire" />
            <line x1={50} y1={70} x2={50} y2={100} className="wire" />
          </>
        )
      case 'int-simple-u':
        return (
          <>
            <circle cx={40} cy={62} r={8} className="wire" />
            <line x1={46} y1={56} x2={74} y2={28} className="wire" />
            <line x1={74} y1={28} x2={82} y2={36} className="wire" />
          </>
        )
      case 'desviador-u':
        return (
          <>
            <circle cx={50} cy={50} r={8} className="wire" />
            <line x1={56} y1={44} x2={80} y2={20} className="wire" />
            <line x1={80} y1={20} x2={88} y2={28} className="wire" />
            <line x1={44} y1={56} x2={20} y2={80} className="wire" />
            <line x1={20} y1={80} x2={12} y2={72} className="wire" />
          </>
        )
      case 'inversor-u':
        return (
          <>
            <circle cx={50} cy={50} r={8} className="wire" />
            <line x1={20} y1={20} x2={80} y2={80} className="wire" />
            <line x1={80} y1={20} x2={20} y2={80} className="wire" />
            <line x1={80} y1={20} x2={88} y2={28} className="wire" />
            <line x1={20} y1={80} x2={12} y2={72} className="wire" />
          </>
        )
      case 'int-simple-f':
        return (
          <>
            <line x1={50} y1={0} x2={50} y2={35} className="wire" />
            <circle cx={50} cy={35} r={2.5} className="node" />
            <line x1={50} y1={65} x2={50} y2={100} className="wire" />
            <line x1={50} y1={65} x2={30} y2={36} className="wire" />
          </>
        )
      case 'desviador-f':
        return (
          <>
            <line x1={50} y1={100} x2={50} y2={65} className="wire" />
            <line x1={50} y1={65} x2={30} y2={36} className="wire" />
            <line x1={30} y1={0} x2={30} y2={30} className="wire" />
            <line x1={70} y1={0} x2={70} y2={30} className="wire" />
            <circle cx={30} cy={33} r={2.5} className="node" />
            <circle cx={70} cy={33} r={2.5} className="node" />
          </>
        )
      case 'termomagnetico':
        return (
          <>
            <line x1={50} y1={0} x2={50} y2={30} className="wire" />
            <line x1={50} y1={70} x2={50} y2={100} className="wire" />
            <line x1={50} y1={70} x2={34} y2={34} className="wire" />
            <rect x={56} y={36} width={22} height={22} className="wire" />
            <text x={67} y={52} className="lbl sm">
              I&gt;
            </text>
          </>
        )
      case 'diferencial':
        return (
          <>
            <line x1={50} y1={0} x2={50} y2={24} className="wire" />
            <line x1={50} y1={56} x2={50} y2={100} className="wire" />
            <line x1={50} y1={56} x2={34} y2={24} className="wire" />
            <ellipse cx={50} cy={78} rx={14} ry={7} className="wire" />
            <text x={78} y={82} className="lbl sm">
              IΔ
            </text>
          </>
        )
      case 'fusible':
        return (
          <>
            <line x1={0} y1={50} x2={100} y2={50} className="wire" />
            <rect x={30} y={40} width={40} height={20} className="wire" />
          </>
        )
      case 'toma':
        return (
          <>
            <line x1={50} y1={100} x2={50} y2={60} className="wire" />
            <path d="M24 34 A26 26 0 0 1 76 34" className="wire" />
            <line x1={24} y1={60} x2={76} y2={60} className="wire" />
            <line x1={50} y1={60} x2={50} y2={48} className="wire" />
          </>
        )
      case 'tierra':
        return (
          <>
            <line x1={50} y1={0} x2={50} y2={50} className="wire" />
            <line x1={25} y1={50} x2={75} y2={50} className="wire" />
            <line x1={33} y1={62} x2={67} y2={62} className="wire" />
            <line x1={42} y1={74} x2={58} y2={74} className="wire" />
          </>
        )
    }
  })()
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="e2-sym" role="img" aria-label="Símbolo eléctrico">
      {g}
    </svg>
  )
}

/* ================================================================== funcional, unifilar y multifilar */

type Vista = 'funcional' | 'unifilar' | 'multifilar'

/** El mismo circuito (una lámpara con un interruptor) dibujado de las tres formas. */
export function TresEsquemas() {
  const [v, setV] = useState<Vista>('funcional')
  return (
    <div className="calc">
      <Segmented<Vista>
        value={v}
        onChange={setV}
        options={[
          { value: 'funcional', label: 'Funcional' },
          { value: 'unifilar', label: 'Unifilar' },
          { value: 'multifilar', label: 'Multifilar' },
        ]}
      />
      <svg viewBox="0 0 320 170" className="e2-svg" role="img" aria-label={`Esquema ${v} de una lámpara con un interruptor`}>
        {v === 'funcional' && (
          <>
            <text x={10} y={22} className="lbl start">
              F 220 V ~
            </text>
            <line x1={10} y1={30} x2={310} y2={30} className="wire f" />
            <text x={10} y={160} className="lbl start">
              N
            </text>
            <line x1={10} y1={150} x2={310} y2={150} className="wire n" />
            <line x1={160} y1={30} x2={160} y2={55} className="wire f" />
            <circle cx={160} cy={30} r={3} className="node" />
            <line x1={160} y1={85} x2={146} y2={58} className="wire" />
            <text x={172} y={74} className="lbl start">
              S1
            </text>
            <line x1={160} y1={85} x2={160} y2={100} className="wire r" />
            <circle cx={160} cy={112} r={12} className="wire" />
            <line x1={152} y1={104} x2={168} y2={120} className="wire" />
            <line x1={168} y1={104} x2={152} y2={120} className="wire" />
            <text x={180} y={116} className="lbl start">
              H1
            </text>
            <line x1={160} y1={124} x2={160} y2={150} className="wire n" />
            <circle cx={160} cy={150} r={3} className="node" />
          </>
        )}
        {v === 'unifilar' && (
          <>
            <text x={10} y={22} className="lbl start">
              F N 220 V ~ (una sola línea = la cañería)
            </text>
            <line x1={40} y1={30} x2={40} y2={90} className="wire" />
            <line x1={40} y1={90} x2={210} y2={90} className="wire" />
            <circle cx={225} cy={90} r={15} className="wire" />
            <line x1={214} y1={79} x2={236} y2={101} className="wire" />
            <line x1={236} y1={79} x2={214} y2={101} className="wire" />
            <text x={248} y={80} className="lbl start">
              H1
            </text>
            <line x1={225} y1={105} x2={225} y2={140} className="wire" />
            <circle cx={225} cy={146} r={6} className="wire" />
            <line x1={229} y1={142} x2={250} y2={124} className="wire" />
            <line x1={250} y1={124} x2={256} y2={130} className="wire" />
            <text x={262} y={150} className="lbl start">
              S1
            </text>
            {[100, 107, 114].map((x) => (
              <line key={x} x1={x - 5} y1={97} x2={x + 5} y2={83} className="wire" />
            ))}
            {[118, 125].map((y) => (
              <line key={y} x1={218} y1={y + 4} x2={232} y2={y - 4} className="wire" />
            ))}
            <text x={100} y={112} className="lbl start sm">
              3 trazos: F, N y PE · 2 trazos: F y retorno
            </text>
          </>
        )}
        {v === 'multifilar' && (
          <>
            <text x={10} y={18} className="lbl start">
              F
            </text>
            <line x1={24} y1={14} x2={310} y2={14} className="wire f" />
            <text x={10} y={36} className="lbl start">
              N
            </text>
            <line x1={24} y1={32} x2={310} y2={32} className="wire n" />
            <text x={6} y={54} className="lbl start">
              PE
            </text>
            <line x1={24} y1={50} x2={310} y2={50} className="wire pe" />
            <line x1={120} y1={14} x2={120} y2={140} className="wire f" />
            <circle cx={120} cy={14} r={3} className="node" />
            <rect x={108} y={120} width={24} height={36} rx={3} className="wire" />
            <text x={140} y={150} className="lbl start">
              S1
            </text>
            <line x1={132} y1={128} x2={220} y2={128} className="wire r" />
            <line x1={220} y1={128} x2={220} y2={110} className="wire r" />
            <circle cx={232} cy={95} r={16} className="wire" />
            <line x1={221} y1={84} x2={243} y2={106} className="wire" />
            <line x1={243} y1={84} x2={221} y2={106} className="wire" />
            <line x1={244} y1={32} x2={244} y2={82} className="wire n" />
            <circle cx={244} cy={32} r={3} className="node" />
            <line x1={260} y1={50} x2={260} y2={95} className="wire pe" />
            <circle cx={260} cy={50} r={3} className="node" />
            <text x={256} y={120} className="lbl start">
              H1
            </text>
          </>
        )}
      </svg>
      <p className="hint">
        {v === 'funcional'
          ? 'Funcional: todos los elementos con todas sus conexiones, entre la fase y el neutro. Es el más fácil para entender cómo funciona.'
          : v === 'unifilar'
            ? 'Unifilar: una sola línea representa la cañería, sin importar cuántos conductores lleva; los trazos cortos indican cuántos van por ahí.'
            : 'Multifilar: una línea por cada conductor (fase marrón, neutro celeste, retorno negro y tierra verde-amarilla).'}
      </p>
    </div>
  )
}

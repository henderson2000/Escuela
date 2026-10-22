// Teoría del taller de Torno (3er año, Electromecánica).
// Sigue el apunte «Principios de torneado – Torno paralelo» (Prof. Jorge O. Oliva, ITS Villada, 2015).
// Lo marcado como «complemento» no está en el apunte: es conocimiento estándar de taller agregado para practicar.

import { useEffect, useState, type ReactNode } from 'react'
import type { Topic } from '../data/theory'
import { Formula, Readout, Segmented, Slider, Toggle } from '../components/ui'
import './torno.css'

/* ================================================================ utilidades */

export const fmt = (n: number, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace('.', ',') : '—')

/** Grados decimales → texto con minutos (62,5 → 62°30′). */
export function dms(deg: number) {
  let d = Math.floor(deg + 1e-9)
  let m = Math.round((deg - d) * 60)
  if (m === 60) {
    d += 1
    m = 0
  }
  return m ? `${d}°${String(m).padStart(2, '0')}′` : `${d}°`
}

const rad = (deg: number) => (deg * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/** Punto a una distancia r y un ángulo (en grados, sentido antihorario, y hacia arriba) desde (cx, cy). */
const polar = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos(rad(a)), cy - r * Math.sin(rad(a))]

/** Arco SVG entre dos ángulos (grados, antihorario). */
function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  const [x1, y1] = polar(cx, cy, r, a1)
  const [x2, y2] = polar(cx, cy, r, a2)
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0
  const sweep = a2 > a1 ? 0 : 1
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

/** Flecha recta con punta. */
function Arrow({ x1, y1, x2, y2, color, width = 3, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number; opacity?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const s = 6 + width * 2
  const p1: [number, number] = [x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45)]
  const p2: [number, number] = [x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45)]
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2 - Math.cos(a) * s * 0.6} y2={y2 - Math.sin(a) * s * 0.6} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={pts([[x2, y2], p1, p2])} fill={color} />
    </g>
  )
}

const METAL = '#cbd3dd'
const METAL_DARK = '#8794a5'
const MACHINE = '#3f7396'
const MACHINE2 = '#4d86a8'
const TOOL = '#ffb020'
const RED = '#ff5a5a'
const BLUE = '#36c2ff'
const GREEN = '#2fd27a'
const HL = '#ffb020'

/* ================================================================ 1. introducción */

function RevolutionShapes() {
  return (
    <svg viewBox="0 0 560 150" className="tn-diagram" role="img" aria-label="Cilindro, cono y rosca: formas de revolución">
      {/* cilindro */}
      <g>
        <rect x={30} y={45} width={120} height={60} fill={METAL} />
        <ellipse cx={150} cy={75} rx={10} ry={30} fill="#e3e8ee" stroke={METAL_DARK} />
        <ellipse cx={30} cy={75} rx={10} ry={30} fill={METAL} stroke={METAL_DARK} />
        <text x={90} y={135} textAnchor="middle" fill="currentColor" style={{ fontSize: 14 }}>
          cilindro
        </text>
      </g>
      {/* cono */}
      <g>
        <polygon points="220,45 330,62 330,88 220,105" fill={METAL} />
        <ellipse cx={330} cy={75} rx={5} ry={13} fill="#e3e8ee" stroke={METAL_DARK} />
        <ellipse cx={220} cy={75} rx={10} ry={30} fill={METAL} stroke={METAL_DARK} />
        <text x={275} y={135} textAnchor="middle" fill="currentColor" style={{ fontSize: 14 }}>
          cono
        </text>
      </g>
      {/* rosca (hélice) */}
      <g>
        <rect x={400} y={52} width={130} height={46} fill={METAL} />
        {Array.from({ length: 9 }, (_, k) => (
          <path key={k} d={`M${404 + k * 14} 52 L${414 + k * 14} 98`} stroke={METAL_DARK} strokeWidth={3} />
        ))}
        <ellipse cx={530} cy={75} rx={8} ry={23} fill="#e3e8ee" stroke={METAL_DARK} />
        <text x={465} y={135} textAnchor="middle" fill="currentColor" style={{ fontSize: 14 }}>
          rosca (hélice)
        </text>
      </g>
      {/* eje de giro */}
      <path d="M10 75 H550" stroke={BLUE} strokeDasharray="10 4 2 4" strokeWidth={1.4} />
      <path d="M545 32 a 14 40 0 1 1 -2 0" fill="none" stroke={RED} strokeWidth={2} />
      <text x={548} y={22} textAnchor="end" fill={RED} style={{ fontSize: 12 }}>
        giro
      </text>
    </svg>
  )
}

/* ================================================================ 2. movimientos de trabajo */

type Mov = 'corte' | 'avance' | 'penetracion'
const MOV_TEXT: Record<Mov, { t: string; c: string; d: string }> = {
  corte: {
    t: 'Movimiento de corte (o de trabajo)',
    c: RED,
    d: 'Es la rotación de la pieza sobre su eje. La velocidad con que la superficie de la pieza pasa contra el filo al arrancar la viruta se llama velocidad de corte (Vc).',
  },
  avance: {
    t: 'Movimiento de avance',
    c: BLUE,
    d: 'Generalmente paralelo al eje de la pieza. La herramienta avanza uniformemente a lo largo de la pieza y así define el perfil de revolución, sacando una viruta continua.',
  },
  penetracion: {
    t: 'Movimiento de penetración',
    c: GREEN,
    d: 'Perpendicular al avance. Determina la sección o profundidad de la viruta que se saca (la profundidad de pasada).',
  },
}

function MovementsDemo() {
  const [mov, setMov] = useState<Mov>('corte')
  const [play, setPlay] = useState(true)
  const [t, setT] = useState(0.15)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!play) return
    const id = window.setInterval(() => {
      setT((x) => (x >= 1 ? 0 : x + 0.006))
      setPhase((p) => p + 0.35)
    }, 50)
    return () => window.clearInterval(id)
  }, [play])

  const cy = 120
  const R = 52
  const Rm = 40
  const x0 = 104
  const x1 = 540
  const toolX = 520 - t * 330
  const op = (m: Mov) => (m === mov ? 1 : 0.28)
  const marks = Array.from({ length: 6 }, (_, k) => phase + (k * Math.PI) / 3)
  return (
    <div className="calc">
      <Segmented<Mov>
        value={mov}
        options={[
          { value: 'corte', label: 'Corte' },
          { value: 'avance', label: 'Avance' },
          { value: 'penetracion', label: 'Penetración' },
        ]}
        onChange={setMov}
      />
      <svg viewBox="0 0 600 270" className="tn-diagram" role="img" aria-label="Movimientos de corte, avance y penetración">
        {/* plato */}
        <rect x={40} y={40} width={50} height={160} rx={6} fill={METAL_DARK} />
        <rect x={90} y={cy - R - 14} width={16} height={16} fill="#6b7787" />
        <rect x={90} y={cy + R - 2} width={16} height={16} fill="#6b7787" />
        {/* pieza: parte sin mecanizar y parte mecanizada */}
        <rect x={x0} y={cy - R} width={toolX - x0} height={2 * R} fill={METAL} />
        <rect x={toolX} y={cy - Rm} width={x1 - toolX} height={2 * Rm} fill="#dfe5ec" />
        <ellipse cx={x1} cy={cy} rx={10} ry={Rm} fill="#eef2f6" stroke={METAL_DARK} />
        {marks.map((a, k) => {
          const c = Math.cos(a)
          if (c <= 0) return null
          const y1 = cy - R * Math.sin(a)
          const y2 = cy - Rm * Math.sin(a)
          return (
            <g key={k} opacity={c * 0.45}>
              <line x1={x0} y1={y1} x2={toolX} y2={y1} stroke="#5b6b7d" strokeWidth={2} />
              <line x1={toolX} y1={y2} x2={x1} y2={y2} stroke="#5b6b7d" strokeWidth={2} />
            </g>
          )
        })}
        <path d={`M${x0} ${cy} H${x1 + 30}`} stroke={BLUE} strokeDasharray="10 4 2 4" strokeWidth={1.2} opacity={0.7} />
        <text x={x1 + 30} y={cy - 6} textAnchor="end" fill="currentColor" style={{ fontSize: 11 }}>
          eje
        </text>
        {/* herramienta */}
        <polygon points={pts([[toolX, cy + Rm], [toolX + 16, cy + Rm + 22], [toolX + 16, 262], [toolX - 4, 262], [toolX - 4, cy + Rm + 14]])} fill={TOOL} />
        {play && <path d={`M${toolX - 2} ${cy + Rm + 2} q -14 8 -10 22 q 6 10 14 2`} fill="none" stroke="#d58a12" strokeWidth={3} />}
        {/* flechas */}
        <g opacity={op('corte')}>
          <path d={`M455 ${cy - 70} A 16 70 0 0 1 455 ${cy + 70}`} fill="none" stroke={RED} strokeWidth={mov === 'corte' ? 5 : 3} />
          <polygon points={pts([[455, cy + 72], [445, cy + 58], [463, cy + 60]])} fill={RED} />
          <text x={475} y={cy - 74} fill={RED} style={{ fontSize: 14, fontWeight: 700 }}>
            corte (giro)
          </text>
        </g>
        <g opacity={op('avance')}>
          <Arrow x1={toolX + 70} y1={248} x2={toolX + 26} y2={248} color={BLUE} width={mov === 'avance' ? 5 : 3} />
          <text x={toolX + 76} y={253} fill={BLUE} style={{ fontSize: 14, fontWeight: 700 }}>
            avance
          </text>
        </g>
        <g opacity={op('penetracion')}>
          <Arrow x1={toolX - 26} y1={cy + Rm + 66} x2={toolX - 26} y2={cy + Rm + 14} color={GREEN} width={mov === 'penetracion' ? 5 : 3} />
          <text x={toolX - 34} y={cy + Rm + 60} textAnchor="end" fill={GREEN} style={{ fontSize: 14, fontWeight: 700 }}>
            penetración
          </text>
        </g>
      </svg>
      <p>
        <strong style={{ color: MOV_TEXT[mov].c }}>{MOV_TEXT[mov].t}:</strong> {MOV_TEXT[mov].d}
      </p>
      <Toggle label="Animar el torneado" value={play} onChange={setPlay} />
    </div>
  )
}

/* ================================================================ 3. partes del torno */

export interface LathePart {
  id: string
  name: string
  desc: string
  obs?: string
}

export const LATHE_PARTS: LathePart[] = [
  {
    id: 'bancada',
    name: 'Bancada',
    desc: 'Cuerpo fundamental del torno. Sirve de soporte y guía para las otras partes y apoya sobre las patas. Es de fundición de hierro gris, hueca (para el desahogo de virutas y refrigerante) con nervaduras interiores que le dan rigidez. Arriba tiene guías de perfil especial (a veces postizas de acero templado y rectificado) por donde se desplazan la contrapunta y el carro.',
    obs: 'Es una superficie de deslizamiento: mantenela limpia de virutas, bien lubricada, sin objetos pesados encima y sin golpearla. De eso dependen la calidad del mecanizado y la vida de la máquina.',
  },
  {
    id: 'cabezal',
    name: 'Cabezal fijo',
    desc: 'Caja de fundición en el extremo izquierdo, sobre la bancada. Contiene el husillo principal y los engranajes o poleas que hacen girar la pieza y las unidades de avance. Incluye el selector de velocidad, el selector de avance (caja Norton) y el selector de sentido de avance.',
    obs: 'Ningún cambio de velocidad se hace con la máquina en marcha (se rompen engranajes). Si un cambio no entra, mové el plato con la mano hasta que entre. No pongas encima cosas que puedan rodar o deslizarse por la vibración. Revisá periódicamente el nivel de aceite.',
  },
  {
    id: 'husillo',
    name: 'Husillo (eje del torno)',
    desc: 'Pieza de acero templado que sostiene en un extremo el dispositivo de amarre (plato, pinza o punto) y recibe en su parte media el giro del motor. Por lo general es hueco, para que pasen piezas largas por adentro.',
  },
  {
    id: 'plato',
    name: 'Plato',
    desc: 'Dispositivo de amarre montado en la nariz del husillo. Sujeta la pieza y la hace girar (plato de 3 mordazas, de 4 mordazas o plato liso de arrastre).',
    obs: 'Nunca dejes la llave del plato colocada.',
  },
  {
    id: 'contrapunta',
    name: 'Contrapunta (cabezal móvil)',
    desc: 'Sirve de apoyo para tornear entre puntos y para recibir mandriles portabrocas o brocas. Se desliza y se fija a lo largo de la bancada. Por adentro corre la pínula, cañón o manguito, que tiene en su extremo un agujero cónico (cono Morse); un volante con tornillo y tuerca de bronce lo hace avanzar o retroceder. Tiene dos frenos: uno la bloquea sobre la bancada y el otro bloquea el manguito.',
    obs: 'Para colocar mandriles o puntos, el manguito debe sobresalir unos 5 cm; se le da un golpe suave a mano para que clave. Para sacarlos, se hace retroceder el manguito hasta que se suelten. Nunca lo escondas del todo: siempre tiene que sobresalir un par de centímetros.',
  },
  {
    id: 'longitudinal',
    name: 'Carro longitudinal (principal)',
    desc: 'Apoyado sobre las guías de la bancada, se mueve a izquierda o derecha en forma manual o automática. Para roscar se acciona con la tuerca partida, que actúa directamente sobre el tornillo patrón.',
    obs: 'Mantené los carros limpios de virutas y lubricados; no apoyes objetos pesados ni golpees sus guías.',
  },
  {
    id: 'transversal',
    name: 'Carro transversal',
    desc: 'Montado sobre el longitudinal, se mueve perpendicular al eje del torno (manual o automático). Determina la profundidad de pasada.',
  },
  {
    id: 'charriot',
    name: 'Carro superior o charriot',
    desc: 'Formado por la base y el carro portaherramientas. La base apoya sobre una plataforma giratoria graduada en grados, para orientarlo en cualquier ángulo (conos, roscas).',
  },
  {
    id: 'torre',
    name: 'Torre portaherramientas',
    desc: 'Se monta sobre el charriot y sujeta las herramientas. Puede ser de cuatro posiciones o una torreta regulable en altura.',
  },
  {
    id: 'delantal',
    name: 'Delantal',
    desc: 'Caja de fundición donde se apoya todo el conjunto de carros. Adentro tiene los engranajes que transmiten los movimientos a los carros. Al frente: el volante del carro principal, la palanca de la tuerca partida y una palanca de 3 posiciones: arriba = cilindrar (avanza el longitudinal), medio = neutro, abajo = frentear (avanza el transversal).',
  },
  {
    id: 'norton',
    name: 'Caja Norton',
    desc: 'Caja de velocidades de los avances. Con sus palancas se eligen distintos avances automáticos y los pasos de rosca.',
  },
  {
    id: 'lira',
    name: 'Lira',
    desc: 'Tren de engranajes en el exterior del cabezal (detrás de una tapa). Lleva el giro del cabezal a la caja Norton con tres ruedas: conductora, intermedia y conducida.',
  },
  {
    id: 'patron',
    name: 'Tornillo patrón',
    desc: 'Tornillo de filete cuadrado que sale de la caja Norton. Le da avance automático al carro longitudinal cuando se rosca (se engancha con la tuerca partida).',
  },
  {
    id: 'barra',
    name: 'Barra de avances',
    desc: 'Barra hexagonal o cilíndrica con chavetero que sale de la caja Norton. Lleva el giro al delantal, donde se transforma en avance automático del carro longitudinal o del transversal.',
  },
  {
    id: 'motor',
    name: 'Motor',
    desc: 'Ubicado abajo a la izquierda, dentro de la pata. Transmite su giro al cabezal con poleas y correa (si la correa es dentada, no patina).',
  },
]

/** Dibujo frontal esquemático del torno paralelo. `highlight` resalta una parte; `onPick` la hace clickeable. */
export function LatheDiagram({ highlight, onPick, caption = true }: { highlight?: string | null; onPick?: (id: string) => void; caption?: boolean }) {
  const hl = (id: string, base: string) => (highlight === id ? HL : base)
  const part = (id: string) => ({
    className: onPick ? 'tn-part' : undefined,
    onClick: onPick ? () => onPick(id) : undefined,
    role: onPick ? 'button' : undefined,
    'aria-label': onPick ? LATHE_PARTS.find((p) => p.id === id)?.name : undefined,
  })
  const name = LATHE_PARTS.find((p) => p.id === highlight)?.name
  const stroke = '#1b2f40'
  return (
    <svg viewBox="0 0 760 330" className="tn-diagram" role="img" aria-label="Torno paralelo visto de frente">
      {/* patas y bandeja */}
      <rect x={40} y={236} width={150} height={88} rx={4} fill="#2c4f66" stroke={stroke} />
      <rect x={570} y={236} width={150} height={88} rx={4} fill="#2c4f66" stroke={stroke} />
      <rect x={190} y={232} width={380} height={14} fill="#22384a" />
      <g {...part('motor')}>
        <rect x={66} y={252} width={98} height={52} rx={8} fill={hl('motor', '#35617f')} stroke="#9aa8bd" strokeDasharray="5 3" />
        <text x={115} y={283} textAnchor="middle" fill="#e8edf5" style={{ fontSize: 13 }}>
          motor
        </text>
      </g>
      {/* bancada */}
      <g {...part('bancada')}>
        <rect x={30} y={168} width={700} height={46} fill={hl('bancada', '#2f5873')} stroke={stroke} />
        <rect x={30} y={161} width={700} height={8} fill={hl('bancada', '#9fb3c3')} />
      </g>
      {/* tornillo patrón y barra de avances */}
      <g {...part('patron')}>
        <line x1={186} y1={220} x2={730} y2={220} stroke={hl('patron', '#b8c2cf')} strokeWidth={6} strokeDasharray="3 2" />
        <line x1={186} y1={220} x2={730} y2={220} stroke="transparent" strokeWidth={14} />
      </g>
      <g {...part('barra')}>
        <line x1={186} y1={230} x2={730} y2={230} stroke={hl('barra', '#7d8898')} strokeWidth={5} />
        <line x1={186} y1={232} x2={730} y2={232} stroke="transparent" strokeWidth={10} />
      </g>
      {/* lira (tapa lateral) */}
      <g {...part('lira')}>
        <circle cx={13} cy={92} r={10} fill={hl('lira', '#6b7787')} stroke="#c9d2dd" />
        <circle cx={15} cy={118} r={8} fill={hl('lira', '#6b7787')} stroke="#c9d2dd" />
        <circle cx={13} cy={148} r={12} fill={hl('lira', '#6b7787')} stroke="#c9d2dd" />
      </g>
      {/* cabezal */}
      <g {...part('cabezal')}>
        <rect x={24} y={58} width={170} height={104} rx={6} fill={hl('cabezal', MACHINE)} stroke={stroke} />
        <rect x={112} y={70} width={70} height={40} rx={3} fill="#cfd8e2" />
        {[0, 1, 2].map((k) => (
          <line key={k} x1={118} y1={80 + k * 10} x2={176} y2={80 + k * 10} stroke="#7d8898" />
        ))}
        <circle cx={52} cy={88} r={10} fill="#22384a" />
        <line x1={52} y1={88} x2={66} y2={74} stroke="#e8edf5" strokeWidth={3} strokeLinecap="round" />
        <circle cx={84} cy={88} r={10} fill="#22384a" />
        <line x1={84} y1={88} x2={84} y2={70} stroke="#e8edf5" strokeWidth={3} strokeLinecap="round" />
        <circle cx={60} cy={132} r={8} fill="#22384a" />
        <circle cx={92} cy={132} r={8} fill="#22384a" />
      </g>
      {/* caja Norton */}
      <g {...part('norton')}>
        <rect x={36} y={172} width={146} height={40} rx={4} fill={hl('norton', MACHINE2)} stroke={stroke} />
        <line x1={64} y1={192} x2={74} y2={180} stroke="#e8edf5" strokeWidth={3} strokeLinecap="round" />
        <line x1={110} y1={192} x2={110} y2={178} stroke="#e8edf5" strokeWidth={3} strokeLinecap="round" />
        <line x1={150} y1={192} x2={160} y2={180} stroke="#e8edf5" strokeWidth={3} strokeLinecap="round" />
        {[64, 110, 150].map((x) => (
          <circle key={x} cx={x} cy={194} r={4} fill="#22384a" />
        ))}
      </g>
      {/* husillo y plato */}
      <g {...part('husillo')}>
        <rect x={194} y={100} width={16} height={30} fill={hl('husillo', '#9aa8bd')} stroke={stroke} />
      </g>
      <g {...part('plato')}>
        <rect x={208} y={72} width={24} height={86} rx={4} fill={hl('plato', '#b8c2cf')} stroke={stroke} />
        <rect x={232} y={84} width={12} height={18} fill={hl('plato', '#9aa8bd')} stroke={stroke} />
        <rect x={232} y={128} width={12} height={18} fill={hl('plato', '#9aa8bd')} stroke={stroke} />
      </g>
      {/* pieza */}
      <rect x={244} y={103} width={228} height={24} fill="#e3e8ee" stroke="#8794a5" />
      <path d="M200 115 H720" stroke={BLUE} strokeDasharray="10 4 2 4" strokeWidth={1} opacity={0.6} />
      {/* contrapunta */}
      <g {...part('contrapunta')}>
        <rect x={556} y={140} width={104} height={22} rx={3} fill={hl('contrapunta', MACHINE)} stroke={stroke} />
        <rect x={572} y={80} width={80} height={62} rx={8} fill={hl('contrapunta', MACHINE)} stroke={stroke} />
        <rect x={512} y={105} width={62} height={20} fill={hl('contrapunta', '#9aa8bd')} stroke={stroke} />
        <polygon points="472,115 492,105 512,105 512,125 492,125" fill={hl('contrapunta', '#b8c2cf')} stroke={stroke} />
        <rect x={652} y={111} width={28} height={8} fill="#9aa8bd" />
        <circle cx={688} cy={115} r={22} fill="none" stroke={hl('contrapunta', '#b8c2cf')} strokeWidth={5} />
        <line x1={688} y1={95} x2={688} y2={135} stroke="#b8c2cf" strokeWidth={3} />
        <line x1={600} y1={82} x2={612} y2={62} stroke="#e8edf5" strokeWidth={3} strokeLinecap="round" />
        <line x1={630} y1={150} x2={646} y2={134} stroke="#e8edf5" strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* carros */}
      <g {...part('longitudinal')}>
        <rect x={288} y={146} width={174} height={16} fill={hl('longitudinal', MACHINE)} stroke={stroke} />
      </g>
      <g {...part('transversal')}>
        <rect x={304} y={134} width={142} height={12} fill={hl('transversal', '#5592b8')} stroke={stroke} />
        <circle cx={298} cy={140} r={8} fill="none" stroke={hl('transversal', '#b8c2cf')} strokeWidth={3} />
      </g>
      <g {...part('charriot')}>
        <rect x={326} y={123} width={98} height={11} fill={hl('charriot', '#62a0c6')} stroke={stroke} />
        <circle cx={434} cy={128} r={6} fill="none" stroke={hl('charriot', '#b8c2cf')} strokeWidth={3} />
      </g>
      <polygon points="352,111 334,113 330,119 352,120" fill={TOOL} />
      <g {...part('torre')}>
        <rect x={350} y={100} width={42} height={23} rx={2} fill={hl('torre', '#7a8796')} stroke={stroke} />
        <line x1={371} y1={100} x2={386} y2={84} stroke="#e8edf5" strokeWidth={3} strokeLinecap="round" />
      </g>
      <g {...part('delantal')}>
        <rect x={300} y={164} width={150} height={66} rx={4} fill={hl('delantal', MACHINE2)} stroke={stroke} />
        <circle cx={338} cy={200} r={19} fill="none" stroke="#d8dee6" strokeWidth={4} />
        <circle cx={338} cy={200} r={4} fill="#d8dee6" />
        <line x1={418} y1={196} x2={432} y2={180} stroke="#e8edf5" strokeWidth={3} strokeLinecap="round" />
        <line x1={414} y1={216} x2={430} y2={216} stroke="#ff8a3d" strokeWidth={4} strokeLinecap="round" />
      </g>
      {caption && name && (
        <text x={744} y={36} textAnchor="end" fill={HL} style={{ fontSize: 20, fontWeight: 800 }}>
          {name}
        </text>
      )}
    </svg>
  )
}

function PartsExplorer() {
  const [sel, setSel] = useState<string>('bancada')
  const p = LATHE_PARTS.find((x) => x.id === sel)!
  return (
    <div className="calc">
      <p className="hint">Tocá una parte en el dibujo o en la lista.</p>
      <LatheDiagram highlight={sel} onPick={setSel} />
      <div className="tn-chips">
        {LATHE_PARTS.map((x) => (
          <button key={x.id} type="button" className={`chip${x.id === sel ? ' active' : ''}`} onClick={() => setSel(x.id)}>
            {x.name}
          </button>
        ))}
      </div>
      <div className="tn-info">
        <h4>{p.name}</h4>
        <p>{p.desc}</p>
        {p.obs && (
          <p className="warn-box">
            <strong>Observaciones:</strong> {p.obs}
          </p>
        )}
      </div>
    </div>
  )
}

/* ================================================================ 4. accesorios */

const SVG_CARD = { viewBox: '0 0 160 130', role: 'img' as const }

function Chuck({ jaws }: { jaws: 3 | 4 }) {
  const angles = jaws === 3 ? [90, 210, 330] : [0, 90, 180, 270]
  const cx = 80
  const cy = 65
  return (
    <svg {...SVG_CARD} aria-label={`Plato de ${jaws} mordazas`}>
      <circle cx={cx} cy={cy} r={54} fill="#b8c2cf" stroke="#5b6b7d" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={40} fill="none" stroke="#9aa8bd" />
      {jaws === 3 ? (
        <circle cx={cx} cy={cy} r={14} fill="#eef2f6" stroke="#5b6b7d" />
      ) : (
        <rect x={cx - 12} y={cy - 12} width={24} height={24} fill="#eef2f6" stroke="#5b6b7d" />
      )}
      {angles.map((a) => (
        <g key={a} transform={`rotate(${-a + 90} ${cx} ${cy})`}>
          <rect x={cx - 7} y={cy - 50} width={14} height={14} fill="#6b7787" stroke="#3b4656" />
          <rect x={cx - 7} y={cy - 37} width={14} height={11} fill="#7d8898" stroke="#3b4656" />
          <rect x={cx - 6} y={cy - 27} width={12} height={14 - (jaws === 4 ? 1 : 0)} fill="#8f9aa8" stroke="#3b4656" />
        </g>
      ))}
      {(jaws === 3 ? [30, 150, 270] : [45, 135, 225, 315]).map((a) => {
        const [x, y] = polar(cx, cy, 46, a)
        return <rect key={a} x={x - 3} y={y - 3} width={6} height={6} fill="#3b4656" />
      })}
    </svg>
  )
}

function PlainPlate() {
  return (
    <svg {...SVG_CARD} aria-label="Plato liso de arrastre">
      <circle cx={80} cy={65} r={54} fill="#b8c2cf" stroke="#5b6b7d" strokeWidth={2} />
      <circle cx={80} cy={65} r={9} fill="#3b4656" />
      <rect x={74} y={20} width={12} height={30} rx={6} fill="#7d8898" />
      <circle cx={80} cy={28} r={6} fill={TOOL} stroke="#7a4a00" />
      <text x={100} y={30} fill="#1f2937" style={{ fontSize: 10 }}>
        perno
      </text>
    </svg>
  )
}

function Collet() {
  return (
    <svg {...SVG_CARD} aria-label="Pinza o boquilla de apriete">
      <rect x={14} y={46} width={84} height={38} fill="#b8c2cf" stroke="#5b6b7d" />
      <polygon points="98,40 128,50 128,80 98,90" fill="#cfd8e2" stroke="#5b6b7d" />
      {[56, 74].map((y) => (
        <line key={y} x1={82} y1={y} x2={128} y2={y} stroke="#3b4656" strokeWidth={2} />
      ))}
      <rect x={120} y={58} width={34} height={14} fill="#eef2f6" stroke="#5b6b7d" />
      {Array.from({ length: 8 }, (_, k) => (
        <line key={k} x1={18 + k * 9} y1={46} x2={22 + k * 9} y2={52} stroke="#5b6b7d" />
      ))}
    </svg>
  )
}

function Center({ live }: { live: boolean }) {
  return (
    <svg {...SVG_CARD} aria-label={live ? 'Punto giratorio' : 'Punto fijo'}>
      {live ? (
        <>
          <polygon points="12,65 46,47 46,83" fill="#e3e8ee" stroke="#5b6b7d" />
          <rect x={46} y={38} width={48} height={54} rx={5} fill="#b8c2cf" stroke="#5b6b7d" />
          <circle cx={62} cy={52} r={7} fill="none" stroke="#3b4656" strokeDasharray="3 2" />
          <circle cx={62} cy={78} r={7} fill="none" stroke="#3b4656" strokeDasharray="3 2" />
          <circle cx={80} cy={52} r={7} fill="none" stroke="#3b4656" strokeDasharray="3 2" />
          <circle cx={80} cy={78} r={7} fill="none" stroke="#3b4656" strokeDasharray="3 2" />
          <polygon points="94,50 150,55 150,75 94,80" fill="#9aa8bd" stroke="#5b6b7d" />
          <text x={70} y={110} textAnchor="middle" fill="#cfd8e2" style={{ fontSize: 10 }}>
            rulemanes adentro
          </text>
        </>
      ) : (
        <>
          <polygon points="12,65 56,40 56,90" fill="#e3e8ee" stroke="#5b6b7d" />
          <polygon points="56,46 150,53 150,77 56,84" fill="#9aa8bd" stroke="#5b6b7d" />
          <path d="M18 60 q 6 -8 14 -6" fill="none" stroke={TOOL} strokeWidth={2} />
          <text x={22} y={30} fill={TOOL} style={{ fontSize: 10 }}>
            lubricar la punta
          </text>
          <text x={100} y={105} textAnchor="middle" fill="#cfd8e2" style={{ fontSize: 10 }}>
            cola cono Morse
          </text>
        </>
      )}
    </svg>
  )
}

function SteadyRest({ moving }: { moving: boolean }) {
  const cx = 80
  const cy = 58
  const shoes = moving ? [90, 0] : [90, 210, 330]
  return (
    <svg {...SVG_CARD} aria-label={moving ? 'Luneta móvil' : 'Luneta fija'}>
      {moving ? (
        <path d={`M${cx + 6} ${cy - 46} A46 46 0 0 1 ${cx + 46} ${cy + 6} L${cx + 46} 122 H${cx + 26} V${cy + 10}`} fill="none" stroke="#5592b8" strokeWidth={10} />
      ) : (
        <>
          <circle cx={cx} cy={cy} r={44} fill="none" stroke="#5592b8" strokeWidth={10} />
          <polygon points="36,122 124,122 112,98 48,98" fill="#5592b8" />
        </>
      )}
      <circle cx={cx} cy={cy} r={15} fill="#eef2f6" stroke="#5b6b7d" />
      {shoes.map((a) => (
        <g key={a} transform={`rotate(${-a + 90} ${cx} ${cy})`}>
          <rect x={cx - 4} y={cy - 46} width={8} height={30} fill="#c08a3e" stroke="#6b4a1e" />
          <rect x={cx - 6} y={cy - 54} width={12} height={8} fill="#7d8898" />
        </g>
      ))}
      {moving && (
        <>
          <polygon points={pts([[cx - 15, cy], [cx - 45, cy - 6], [cx - 70, cy - 6], [cx - 70, cy + 6], [cx - 45, cy + 6]])} fill={TOOL} />
          <text x={14} y={cy + 26} fill={TOOL} style={{ fontSize: 10 }}>
            herramienta
          </text>
        </>
      )}
    </svg>
  )
}

function Dog() {
  return (
    <svg {...SVG_CARD} aria-label="Brida de arrastre">
      <circle cx={60} cy={60} r={30} fill="#9aa8bd" stroke="#5b6b7d" strokeWidth={2} />
      <circle cx={60} cy={60} r={15} fill="#eef2f6" stroke="#5b6b7d" />
      <rect x={55} y={14} width={10} height={20} fill="#7d8898" stroke="#3b4656" />
      <rect x={51} y={8} width={18} height={8} fill="#6b7787" />
      <path d="M86 74 Q 118 86 128 116" fill="none" stroke="#9aa8bd" strokeWidth={10} strokeLinecap="round" />
      <text x={112} y={78} fill="#cfd8e2" style={{ fontSize: 10 }}>
        cola
      </text>
      <text x={72} y={22} fill="#cfd8e2" style={{ fontSize: 10 }}>
        tornillo
      </text>
    </svg>
  )
}

function AccessoryGallery() {
  const items: { svg: ReactNode; t: string; d: string }[] = [
    { svg: <Chuck jaws={3} />, t: 'Plato universal de 3 mordazas', d: 'Las tres mordazas cierran juntas con una llave (autocentrante). Para piezas cilíndricas o con un número de caras múltiplo de 3. Juegos de mordazas invertidas (diámetros grandes) y blandas (materiales blandos o para no marcar la pieza).' },
    { svg: <Chuck jaws={4} />, t: 'Plato de 4 mordazas', d: 'Cada mordaza se ajusta por separado: para piezas de geometría variada (cuadradas, irregulares, descentradas). También se pueden invertir.' },
    { svg: <PlainPlate />, t: 'Plato liso de arrastre', d: 'Sin mordazas: agujero central y un perno o tornillo de arrastre. Se usa en el montaje entre puntas, junto con la brida.' },
    { svg: <Collet />, t: 'Pinzas o boquillas', d: 'Se sacan el plato y se montan en el agujero del husillo. Sujetan muy bien, pero cada una sirve para muy pocos diámetros: hay que tener muchas.' },
    { svg: <Center live={false} />, t: 'Punto fijo', d: 'Sostiene el extremo libre de piezas largas. No gira: hay que mantener su punta constantemente lubricada.' },
    { svg: <Center live />, t: 'Punto giratorio', d: 'Tiene dos rulemanes en la cabeza: la cola queda clavada y la punta gira con la pieza. No necesita lubricación.' },
    { svg: <SteadyRest moving={false} />, t: 'Luneta fija', d: 'Cuerpo de fundición con 3 o 4 patines (bronce o rodamientos) regulables con tornillos. Se sujeta a la bancada con una zapata, bulón y tuerca.' },
    { svg: <SteadyRest moving />, t: 'Luneta móvil', d: 'Se atornilla al carro principal y lo acompaña. Tiene 2 o 3 apoyos: el punto que falta lo pone la herramienta.' },
    { svg: <Dog />, t: 'Brida (de arrastre)', d: 'Cuerpo perforado, tornillo que aprieta sobre la pieza y cola de arrastre que engancha en el plato liso. Sujeta el extremo más cercano al plato en el montaje entre puntas.' },
  ]
  return (
    <div className="tn-gallery">
      {items.map((it) => (
        <div key={it.t} className="tn-card">
          {it.svg}
          <h5>{it.t}</h5>
          <p>{it.d}</p>
        </div>
      ))}
    </div>
  )
}

/* ================================================================ 5. transmisión */

type Path5 = 'giro' | 'avance' | 'rosca'

function TransmissionDiagram() {
  const [mode, setMode] = useState<Path5>('giro')
  const on: Record<Path5, string[]> = {
    giro: ['motor', 'correa', 'cabezal', 'husillo'],
    avance: ['motor', 'correa', 'cabezal', 'husillo', 'lira', 'norton', 'barra', 'delantal', 'carros'],
    rosca: ['motor', 'correa', 'cabezal', 'husillo', 'lira', 'norton', 'patron', 'delantal', 'carros'],
  }
  const a = (id: string) => (on[mode].includes(id) ? 1 : 0.25)
  const st = (id: string) => (on[mode].includes(id) ? HL : '#5b6b7d')
  const box = (id: string, x: number, y: number, w: number, h: number, lines: string[]) => (
    <g opacity={a(id)}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#1b2536" stroke={st(id)} strokeWidth={2} />
      {lines.map((l, i) => (
        <text key={l} x={x + w / 2} y={y + h / 2 + (i - (lines.length - 1) / 2) * 15 + 5} textAnchor="middle" fill="currentColor" style={{ fontSize: 12.5, fontWeight: i ? 400 : 700 }}>
          {l}
        </text>
      ))}
    </g>
  )
  const text: Record<Path5, string> = {
    giro: 'Motor → poleas y correa → eje de entrada del cabezal → engranajes escalonados (selector de velocidad) → husillo → plato → pieza. Así se eligen las revoluciones por minuto de la pieza.',
    avance: 'Del cabezal sale el giro por la lira (conductora → intermedia → conducida) a la caja Norton. De ahí, la barra de avances lo lleva al delantal, que lo transforma en avance automático del carro longitudinal (cilindrar) o del transversal (frentear).',
    rosca: 'Mismo camino hasta la caja Norton, pero sale por el tornillo patrón. Al cerrar la tuerca partida del delantal, el carro longitudinal avanza exactamente un paso por cada vuelta de la pieza: así se tallan roscas.',
  }
  return (
    <div className="calc">
      <Segmented<Path5>
        value={mode}
        options={[
          { value: 'giro', label: 'Giro de la pieza' },
          { value: 'avance', label: 'Cilindrar / frentear' },
          { value: 'rosca', label: 'Roscar' },
        ]}
        onChange={setMode}
      />
      <svg viewBox="0 0 640 310" className="tn-diagram" role="img" aria-label="Cadena de transmisión del torno">
        {box('cabezal', 30, 30, 200, 84, ['Cabezal fijo', 'engranajes escalonados', '(selector de velocidad)'])}
        {box('motor', 40, 236, 120, 56, ['Motor', 'abajo a la izquierda'])}
        <g opacity={a('correa')}>
          <circle cx={100} cy={226} r={9} fill="none" stroke={st('correa')} strokeWidth={3} />
          <circle cx={100} cy={128} r={15} fill="none" stroke={st('correa')} strokeWidth={3} />
          <line x1={91} y1={226} x2={85} y2={128} stroke={st('correa')} strokeWidth={3} />
          <line x1={109} y1={226} x2={115} y2={128} stroke={st('correa')} strokeWidth={3} />
          <text x={124} y={182} fill="currentColor" style={{ fontSize: 12 }}>
            poleas y correa
          </text>
        </g>
        <g opacity={a('husillo')}>
          <line x1={230} y1={72} x2={300} y2={72} stroke={st('husillo')} strokeWidth={6} />
          <rect x={300} y={34} width={18} height={76} rx={3} fill="#b8c2cf" />
          <rect x={318} y={60} width={120} height={24} fill="#e3e8ee" />
          <text x={264} y={60} textAnchor="middle" fill="currentColor" style={{ fontSize: 12 }}>
            husillo
          </text>
          <text x={378} y={104} textAnchor="middle" fill="currentColor" style={{ fontSize: 12 }}>
            plato y pieza
          </text>
        </g>
        <g opacity={a('lira')}>
          <circle cx={210} cy={136} r={14} fill="none" stroke={st('lira')} strokeWidth={3} strokeDasharray="4 2" />
          <circle cx={238} cy={160} r={11} fill="none" stroke={st('lira')} strokeWidth={3} strokeDasharray="4 2" />
          <circle cx={212} cy={188} r={16} fill="none" stroke={st('lira')} strokeWidth={3} strokeDasharray="4 2" />
          <text x={256} y={140} fill="currentColor" style={{ fontSize: 11 }}>
            conductora
          </text>
          <text x={256} y={164} fill="currentColor" style={{ fontSize: 11 }}>
            intermedia
          </text>
          <text x={234} y={200} fill="currentColor" style={{ fontSize: 11 }}>
            conducida
          </text>
          <text x={166} y={162} textAnchor="end" fill="currentColor" style={{ fontSize: 12, fontWeight: 700 }}>
            LIRA
          </text>
        </g>
        {box('norton', 180, 214, 120, 50, ['Caja Norton', 'elige avance / paso'])}
        <g opacity={a('patron')}>
          <line x1={300} y1={228} x2={630} y2={228} stroke={st('patron')} strokeWidth={6} strokeDasharray="3 2" />
          <text x={320} y={220} fill="currentColor" style={{ fontSize: 12 }}>
            tornillo patrón
          </text>
        </g>
        <g opacity={a('barra')}>
          <line x1={300} y1={252} x2={630} y2={252} stroke={st('barra')} strokeWidth={5} />
          <text x={320} y={272} fill="currentColor" style={{ fontSize: 12 }}>
            barra de avances
          </text>
        </g>
        {box('delantal', 450, 200, 130, 96, ['Delantal', mode === 'rosca' ? 'tuerca partida' : 'engranajes', ''])}
        {box('carros', 450, 120, 130, 52, [mode === 'rosca' ? 'Carro longitudinal' : 'Carros', mode === 'rosca' ? '(roscado)' : 'longitudinal o transversal'])}
        <g opacity={a('carros')}>
          <Arrow x1={515} y1={200} x2={515} y2={176} color={st('carros')} width={3} />
        </g>
      </svg>
      <p>{text[mode]}</p>
    </div>
  )
}

function PulleyCalc() {
  const [n1, setN1] = useState(1440)
  const [d1, setD1] = useState(100)
  const [d2, setD2] = useState(200)
  const n2 = (n1 * d1) / d2
  return (
    <div className="calc">
      <Slider label="rpm del motor (n₁)" value={n1} min={700} max={3000} step={10} onChange={setN1} format={(x) => `${x} rpm`} />
      <Slider label="ø polea del motor (d₁)" value={d1} min={40} max={250} step={5} onChange={setD1} format={(x) => `${x} mm`} />
      <Slider label="ø polea conducida (d₂)" value={d2} min={40} max={400} step={5} onChange={setD2} format={(x) => `${x} mm`} />
      <Formula>
        n₂ = n₁ × d₁ / d₂ = {n1} × {d1} / {d2} = <strong>{fmt(n2, 1)} rpm</strong>
      </Formula>
      <p className="hint">{d2 > d1 ? 'Polea conducida más grande → gira más lento (reduce).' : d2 < d1 ? 'Polea conducida más chica → gira más rápido (multiplica).' : 'Poleas iguales → misma velocidad.'}</p>
    </div>
  )
}

/* ================================================================ 6. montajes */

type MountKind = 'aire' | 'contrapunta' | 'puntas' | 'lunetas'

function MountSketch({ kind }: { kind: MountKind }) {
  const cy = 78
  const tail = (tipX: number) => (
    <g>
      <polygon points={pts([[tipX, cy], [tipX + 18, cy - 10], [tipX + 18, cy + 10]])} fill="#b8c2cf" stroke="#5b6b7d" />
      <rect x={tipX + 18} y={cy - 10} width={34} height={20} fill="#9aa8bd" stroke="#5b6b7d" />
      <rect x={tipX + 52} y={cy - 34} width={44} height={70} rx={6} fill={MACHINE} stroke="#1b2f40" />
      <text x={tipX + 74} y={cy + 52} textAnchor="middle" fill="currentColor" style={{ fontSize: 11 }}>
        contrapunta
      </text>
    </g>
  )
  const chuck = (
    <g>
      <rect x={14} y={24} width={28} height={108} rx={4} fill="#b8c2cf" stroke="#5b6b7d" />
      <text x={28} y={148} textAnchor="middle" fill="currentColor" style={{ fontSize: 11 }}>
        plato
      </text>
    </g>
  )
  const jaws = (r: number) => (
    <>
      <rect x={42} y={cy - r - 14} width={20} height={14} fill="#6b7787" />
      <rect x={42} y={cy + r} width={20} height={14} fill="#6b7787" />
    </>
  )
  const axis = <path d={`M8 ${cy} H452`} stroke={BLUE} strokeDasharray="10 4 2 4" strokeWidth={1} opacity={0.7} />
  const tool = (x: number, y: number) => <polygon points={pts([[x, y], [x + 10, y + 16], [x + 10, y + 40], [x - 6, y + 40], [x - 6, y + 10]])} fill={TOOL} />
  return (
    <svg viewBox="0 0 460 160" className="tn-diagram" role="img" aria-label={`Montaje ${kind}`}>
      {axis}
      {kind === 'aire' && (
        <>
          {chuck}
          {jaws(26)}
          <rect x={42} y={cy - 26} width={120} height={52} fill="#e3e8ee" stroke="#8794a5" />
          {tool(150, cy + 26)}
          <text x={250} y={cy + 4} fill="currentColor" style={{ fontSize: 13 }}>
            extremo libre, «al aire»
          </text>
        </>
      )}
      {kind === 'contrapunta' && (
        <>
          {chuck}
          {jaws(16)}
          <rect x={42} y={cy - 16} width={300} height={32} fill="#e3e8ee" stroke="#8794a5" />
          <polygon points={pts([[342, cy], [334, cy - 6], [334, cy + 6]])} fill="#8794a5" />
          {tail(336)}
          {tool(220, cy + 16)}
        </>
      )}
      {kind === 'puntas' && (
        <>
          <rect x={14} y={24} width={18} height={108} rx={3} fill="#b8c2cf" stroke="#5b6b7d" />
          <text x={22} y={148} textAnchor="middle" fill="currentColor" style={{ fontSize: 11 }}>
            plato liso
          </text>
          <circle cx={40} cy={40} r={6} fill={TOOL} />
          <polygon points={pts([[66, cy], [32, cy - 12], [32, cy + 12]])} fill="#b8c2cf" stroke="#5b6b7d" />
          <rect x={60} y={cy - 16} width={282} height={32} fill="#e3e8ee" stroke="#8794a5" />
          <rect x={78} y={cy - 26} width={20} height={52} rx={4} fill="#9aa8bd" stroke="#5b6b7d" />
          <path d={`M88 ${cy - 26} Q 70 ${cy - 44} 46 40`} fill="none" stroke="#9aa8bd" strokeWidth={6} strokeLinecap="round" />
          <text x={104} y={cy - 32} fill="currentColor" style={{ fontSize: 11 }}>
            brida
          </text>
          {tail(336)}
          {tool(230, cy + 16)}
        </>
      )}
      {kind === 'lunetas' && (
        <>
          {chuck}
          {jaws(9)}
          <rect x={42} y={cy - 9} width={300} height={18} fill="#e3e8ee" stroke="#8794a5" />
          {tail(342)}
          <rect x={232} y={cy - 46} width={14} height={92} rx={3} fill="#5592b8" opacity={0.85} />
          <rect x={236} y={cy - 22} width={6} height={13} fill="#c08a3e" />
          <rect x={236} y={cy + 9} width={6} height={13} fill="#c08a3e" />
          <text x={239} y={cy - 52} textAnchor="middle" fill="currentColor" style={{ fontSize: 11 }}>
            luneta fija
          </text>
          <rect x={150} y={cy - 40} width={12} height={31} rx={3} fill="#62a0c6" />
          <rect x={153} y={cy - 22} width={6} height={13} fill="#c08a3e" />
          <text x={140} y={cy - 46} textAnchor="middle" fill="currentColor" style={{ fontSize: 11 }}>
            luneta móvil
          </text>
          {tool(156, cy + 9)}
        </>
      )}
    </svg>
  )
}

const MOUNTS: Record<MountKind, { t: string; when: string; how: string; obs: string[] }> = {
  aire: {
    t: 'Montaje al aire',
    when: 'Piezas de poca longitud, que no sobresalen demasiado del husillo, y de poco peso.',
    how: 'La pieza se sujeta por un solo extremo; el otro queda suspendido sobre la bancada. Amarre: plato universal de 3 mordazas, plato de 4 mordazas o pinza.',
    obs: ['La pieza tiene que estar firmemente ajustada.', 'Girala antes con la mano para verificar que esté centrada.', 'No dejes la llave de ajuste colocada en el plato.'],
  },
  contrapunta: {
    t: 'Montaje entre plato y contrapunta',
    when: 'Piezas delgadas o de longitud considerable, que no conviene dejar con un extremo suspendido.',
    how: 'Un extremo queda tomado en el plato y el otro se apoya en un punto colocado en la contrapunta. Antes se hace en la pieza un agujero de centro con una mecha de centrar, que deja una cavidad cónica de 60° donde apoya el punto.',
    obs: ['Pieza bien ajustada en el plato.', 'Contrapunta bloqueada con sus dos frenos: sobre la bancada y el del manguito.', 'El punto giratorio tiene que estar girando todo el tiempo.', 'El carro, al ir hacia la derecha, no debe empujar la contrapunta.'],
  },
  puntas: {
    t: 'Montaje entre puntas',
    when: 'Cuando hay que mecanizar a lo largo y dar vuelta la pieza sin perder la concentricidad (ejes escalonados, piezas que se terminan en varias etapas).',
    how: 'Se hacen agujeros de centro en los dos extremos. Se saca el plato y se coloca un punto en el cono Morse del husillo; ahí apoya el extremo izquierdo, que lleva una brida enganchada al plato liso de arrastre. El otro extremo apoya en el punto de la contrapunta. Para mecanizar el otro lado, se cambia la brida de extremo y se da vuelta la pieza: los centros no se pierden.',
    obs: ['La pieza bien ajustada a la brida, para que no patine.', 'Contrapunta bloqueada con sus dos frenos.', 'El punto giratorio tiene que estar girando.', 'El carro no debe empujar la contrapunta.', 'Cuidado con el área de giro de la brida: que no enganche ni golpee nada.'],
  },
  lunetas: {
    t: 'Montaje con lunetas',
    when: 'Piezas largas y muy delgadas que al girar o al empujarlas la herramienta se pandearían en el medio (riesgo para la herramienta y el operario). También para mecanizar el interior de piezas largas.',
    how: 'Luneta fija: 3 o 4 apoyos, sujeta a las guías de la bancada con grapa y tuerca. Luneta móvil: atornillada al carro, lo acompaña con 2 o 3 apoyos; el punto que falta es la herramienta.',
    obs: ['Los patines con la presión justa: sostener la pieza sin impedirle girar libremente.', 'La luneta fija firmemente ajustada a la bancada.', 'La luneta móvil firmemente atornillada al carro.', 'Que la luneta fija no entorpezca el desplazamiento del carro.'],
  },
}

function MountExplorer() {
  const [k, setK] = useState<MountKind>('aire')
  const m = MOUNTS[k]
  return (
    <div className="calc">
      <Segmented<MountKind>
        value={k}
        options={[
          { value: 'aire', label: 'Al aire' },
          { value: 'contrapunta', label: 'Plato y contrapunta' },
          { value: 'puntas', label: 'Entre puntas' },
          { value: 'lunetas', label: 'Con lunetas' },
        ]}
        onChange={setK}
      />
      <MountSketch kind={k} />
      <h4>{m.t}</h4>
      <p>
        <strong>¿Cuándo?</strong> {m.when}
      </p>
      <p>
        <strong>¿Cómo?</strong> {m.how}
      </p>
      <div className="warn-box">
        <strong>Observaciones:</strong>
        <ul>
          {m.obs.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ================================================================ 7. herramientas */

function ToolAngles() {
  const [alpha, setAlpha] = useState(8)
  const [gamma, setGamma] = useState(12)
  const beta = 90 - alpha - gamma
  const T: [number, number] = [250, 170]
  const th = 90 - gamma // dirección de la cara de ataque
  const dir = (a: number, L: number): [number, number] => polar(T[0], T[1], L, a)
  const Lf = (500 - T[0]) / Math.cos(rad(alpha))
  const F = dir(alpha, Lf)
  const Lr = (T[1] - 20) / Math.sin(rad(th))
  const Rtop = dir(th, Lr)
  // viruta: sube por la cara de ataque
  const nL: [number, number] = [-Math.sin(rad(th)), -Math.cos(rad(th))] // normal hacia la izquierda (coordenadas SVG)
  const c1 = dir(th, 6)
  const c2 = dir(th, 110)
  const c3: [number, number] = [c2[0] + nL[0] * 34, c2[1] + nL[1] * 34]
  const shear: [number, number] = [T[0] - 46, T[1] - 26]
  const lbl = (a: number, r: number, t: string, color: string) => {
    const [x, y] = polar(T[0], T[1], r, a)
    return (
      <text x={x} y={y + 5} textAnchor="middle" fill={color} style={{ fontSize: 16, fontWeight: 800 }}>
        {t}
      </text>
    )
  }
  return (
    <div className="calc">
      <svg viewBox="0 0 520 240" className="tn-diagram" role="img" aria-label="Ángulos de incidencia, filo y ataque de la herramienta">
        <rect x={0} y={T[1]} width={520} height={70} fill={METAL} />
        <text x={110} y={T[1] + 44} textAnchor="middle" fill="#1f2937" style={{ fontSize: 13 }}>
          pieza
        </text>
        <polygon points={pts([[20, T[1] - 26], shear, T, [20, T[1]]])} fill="#dfe5ec" />
        <text x={70} y={T[1] - 8} fill="#1f2937" style={{ fontSize: 11 }}>
          material a sacar
        </text>
        <polygon points={pts([c1, c2, c3, shear, T])} fill="#d58a12" opacity={0.9} />
        <text x={c3[0] - 6} y={c3[1] + 4} textAnchor="end" fill="#d58a12" style={{ fontSize: 13, fontWeight: 700 }}>
          viruta
        </text>
        <polygon points={pts([T, F, [500, 20], Rtop])} fill={TOOL} opacity={0.92} stroke="#7a4a00" />
        <text x={430} y={110} textAnchor="middle" fill="#3b2500" style={{ fontSize: 13, fontWeight: 700 }}>
          herramienta
        </text>
        {/* referencias */}
        <line x1={T[0]} y1={T[1]} x2={T[0]} y2={20} stroke="currentColor" strokeDasharray="4 4" opacity={0.6} />
        <line x1={T[0]} y1={T[1]} x2={510} y2={T[1]} stroke="currentColor" strokeDasharray="4 4" opacity={0.6} />
        <path d={arcPath(T[0], T[1], 80, 0, alpha)} fill="none" stroke={RED} strokeWidth={2.5} />
        {lbl(alpha / 2, 96, 'α', RED)}
        <path d={arcPath(T[0], T[1], 56, alpha, th)} fill="none" stroke={GREEN} strokeWidth={2.5} />
        {lbl((alpha + th) / 2, 40, 'β', '#0e6b3a')}
        {gamma !== 0 && <path d={arcPath(T[0], T[1], 118, th, 90)} fill="none" stroke={BLUE} strokeWidth={2.5} />}
        {lbl((th + 90) / 2, 134, 'γ', BLUE)}
        <Arrow x1={150} y1={226} x2={90} y2={226} color="#1f2937" width={2} />
        <text x={156} y={230} fill="#1f2937" style={{ fontSize: 12 }}>
          avance de la herramienta
        </text>
      </svg>
      <Slider label="Ángulo de incidencia α" value={alpha} min={2} max={15} onChange={setAlpha} format={(x) => `${x}°`} />
      <Slider label="Ángulo de ataque γ" value={gamma} min={-6} max={30} onChange={setGamma} format={(x) => `${x}°`} />
      <Formula>
        β = 90° − α − γ = 90° − {alpha}° − ({gamma}°) = <strong>{beta}°</strong>
      </Formula>
      <p className="hint">
        {gamma < 0
          ? 'Ángulo de ataque negativo: filo muy robusto (típico de insertos para materiales duros o cortes interrumpidos), pero corta “empujando”.'
          : beta < 55
            ? 'Filo muy agudo: corta fácil (bueno para aluminio y materiales blandos) pero es frágil y se desgasta rápido.'
            : beta > 75
              ? 'Filo muy robusto: aguanta materiales duros y frágiles (fundición, bronce), pero corta con más esfuerzo.'
              : 'Valores típicos para acero común con acero rápido.'}
      </p>
    </div>
  )
}

/* ================================================================ 8. factores de corte */

type Mat = 'acero' | 'aleado' | 'fundicion' | 'bronce' | 'aluminio'
type ToolMat = 'hss' | 'md'
export const VC_TABLE: Record<Mat, { name: string; hss: [number, number]; md: [number, number] }> = {
  acero: { name: 'Acero suave (SAE 1010–1020)', hss: [25, 35], md: [150, 250] },
  aleado: { name: 'Acero duro / aleado (SAE 1045, 4140)', hss: [15, 25], md: [100, 160] },
  fundicion: { name: 'Fundición gris', hss: [15, 25], md: [80, 120] },
  bronce: { name: 'Bronce / latón', hss: [40, 60], md: [150, 250] },
  aluminio: { name: 'Aluminio', hss: [80, 150], md: [250, 500] },
}
const mid = (r: [number, number]) => Math.round((r[0] + r[1]) / 2)
const LATHE_SPEEDS = [45, 70, 110, 180, 280, 450, 710, 1120, 1800]

function RpmCalc() {
  const [mat, setMat] = useState<Mat>('acero')
  const [tool, setTool] = useState<ToolMat>('hss')
  const [vc, setVc] = useState(30)
  const [d, setD] = useState(50)
  const [fn, setFn] = useState(0.2)
  const choose = (m: Mat, t: ToolMat) => {
    setMat(m)
    setTool(t)
    setVc(mid(VC_TABLE[m][t]))
  }
  const n = (1000 * vc) / (Math.PI * d)
  const below = LATHE_SPEEDS.filter((s) => s <= n)
  const sel = below.length ? below[below.length - 1] : LATHE_SPEEDS[0]
  const vcReal = (Math.PI * d * sel) / 1000
  const range = VC_TABLE[mat][tool]
  return (
    <div className="calc">
      <h4 style={{ marginTop: 0 }}>Calculadora de rpm</h4>
      <div className="row wrap">
        <Segmented<ToolMat>
          value={tool}
          options={[
            { value: 'hss', label: 'Acero rápido' },
            { value: 'md', label: 'Metal duro (inserto)' },
          ]}
          onChange={(t) => choose(mat, t)}
        />
      </div>
      <div className="tn-chips">
        {(Object.keys(VC_TABLE) as Mat[]).map((m) => (
          <button key={m} type="button" className={`chip${m === mat ? ' active' : ''}`} onClick={() => choose(m, tool)}>
            {VC_TABLE[m].name}
          </button>
        ))}
      </div>
      <p className="hint">
        Vc orientativa para {VC_TABLE[mat].name.toLowerCase()} con {tool === 'hss' ? 'acero rápido' : 'metal duro'}: {range[0]}–{range[1]} m/min.
      </p>
      <Slider label="Velocidad de corte Vc" value={vc} min={5} max={500} onChange={setVc} format={(x) => `${x} m/min`} />
      <Slider label="Diámetro de la pieza D" value={d} min={5} max={200} onChange={setD} format={(x) => `${x} mm`} />
      <Formula>
        n = 1000 × Vc / (π × D) = 1000 × {vc} / (π × {d}) = <strong>{fmt(n, 0)} rpm</strong>
      </Formula>
      <p className="hint">Gama de ejemplo de un torno: {LATHE_SPEEDS.join(' · ')} rpm. Se elige la inmediata inferior al cálculo (cuidamos la herramienta).</p>
      <Readout label="Velocidad a colocar en el cabezal" value={`${sel} rpm`} />
      <Readout label="Vc real con esa velocidad" value={`${fmt(vcReal, 1)} m/min`} />
      <Slider label="Avance fn" value={fn} min={0.05} max={0.5} step={0.01} onChange={setFn} format={(x) => `${fmt(x, 2)} mm/rev`} />
      <Readout label="Velocidad de avance del carro (fn × n)" value={`${fmt(fn * sel, 0)} mm/min`} />
    </div>
  )
}

function ChipTypes() {
  return (
    <svg viewBox="0 0 540 130" className="tn-diagram" role="img" aria-label="Tipos de viruta: arrancada, plástica y desprendida">
      {/* A arrancada */}
      <g>
        {[
          [30, 40],
          [62, 52],
          [40, 74],
          [80, 30],
          [96, 70],
          [66, 92],
          [110, 46],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} q 6 -8 14 -2 q -2 8 -12 8 z`} fill="#9aa8bd" />
        ))}
        <text x={75} y={124} textAnchor="middle" fill="currentColor" style={{ fontSize: 13 }}>
          A · arrancada
        </text>
      </g>
      {/* B plástica */}
      <g>
        <path
          d={Array.from({ length: 9 }, (_, k) => `${k ? 'L' : 'M'}${210 + k * 18} 64 a 14 30 0 1 1 9 0`).join(' ')}
          fill="none"
          stroke="#d58a12"
          strokeWidth={3}
        />
        <text x={285} y={124} textAnchor="middle" fill="currentColor" style={{ fontSize: 13 }}>
          B · plástica (larga, espiralada)
        </text>
      </g>
      {/* C desprendida */}
      <g>
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M${420 + k * 36} ${40 + (k % 2) * 30} q 10 -18 24 -6 q 8 12 -6 22 q -10 6 -12 -4`} fill="none" stroke="#b07a2a" strokeWidth={4} />
        ))}
        <text x={470} y={124} textAnchor="middle" fill="currentColor" style={{ fontSize: 13 }}>
          C · desprendida
        </text>
      </g>
    </svg>
  )
}

/* ================================================================ 9. tipos de mecanizado */

export type OpKind = 'frenteado' | 'cilindrado' | 'perforado' | 'conico' | 'ranurado' | 'tronzado' | 'moleteado' | 'interior' | 'roscado'

/** Bosquejo de cada operación (pieza en el plato, herramienta y su movimiento). */
export function OpSketch({ op, width }: { op: OpKind; width?: number }) {
  const cy = 70
  const R = 36
  const x0 = 34
  const x1 = 250
  const tool = (x: number, y: number, w = 12) => <polygon points={pts([[x, y], [x + w / 2, y + 14], [x + w / 2, 136], [x - w / 2, 136], [x - w / 2, y + 14]])} fill={TOOL} />
  let body: ReactNode = null
  switch (op) {
    case 'frenteado':
      body = (
        <>
          <rect x={x0} y={cy - R} width={x1 - x0} height={2 * R} fill={METAL} />
          <rect x={x1 - 4} y={cy - R} width={4} height={2 * R} fill={HL} />
          <polygon points={pts([[x1 + 2, cy + 18], [x1 + 18, cy + 30], [x1 + 40, cy + 70], [x1 + 26, cy + 76], [x1 + 4, cy + 34]])} fill={TOOL} />
          <Arrow x1={x1 + 30} y1={cy + 46} x2={x1 + 30} y2={cy - 4} color={BLUE} />
        </>
      )
      break
    case 'cilindrado':
      body = (
        <>
          <rect x={x0} y={cy - R} width={150 - x0} height={2 * R} fill={METAL} />
          <rect x={150} y={cy - R + 8} width={x1 - 150} height={2 * (R - 8)} fill="#dfe5ec" />
          {tool(152, cy + R - 8)}
          <Arrow x1={196} y1={128} x2={126} y2={128} color={BLUE} />
        </>
      )
      break
    case 'perforado':
      body = (
        <>
          <rect x={x0} y={cy - R} width={x1 - x0} height={2 * R} fill={METAL} />
          <rect x={160} y={cy - 9} width={x1 - 160} height={18} fill="#0c1220" opacity={0.75} />
          <polygon points={pts([[150, cy], [160, cy - 9], [160, cy + 9]])} fill="#0c1220" opacity={0.75} />
          <rect x={162} y={cy - 8} width={130} height={16} fill="#b8c2cf" stroke="#5b6b7d" />
          {[175, 195, 215, 235, 255, 275].map((x) => (
            <line key={x} x1={x} y1={cy - 8} x2={x + 10} y2={cy + 8} stroke="#5b6b7d" strokeWidth={2} />
          ))}
          <Arrow x1={300} y1={cy + 26} x2={250} y2={cy + 26} color={BLUE} />
        </>
      )
      break
    case 'conico':
      body = (
        <>
          <polygon points={pts([[x0, cy - R], [170, cy - R], [x1, cy - 16], [x1, cy + 16], [170, cy + R], [x0, cy + R]])} fill={METAL} />
          <line x1={170} y1={cy + R} x2={x1} y2={cy + 16} stroke={HL} strokeWidth={3} />
          <polygon points={pts([[214, cy + 26], [228, cy + 34], [244, cy + 80], [230, cy + 84], [214, cy + 40]])} fill={TOOL} />
          <Arrow x1={262} y1={cy + 34} x2={186} y2={cy + 52} color={BLUE} />
        </>
      )
      break
    case 'ranurado':
    case 'tronzado':
      body = (
        <>
          <rect x={x0} y={cy - R} width={x1 - x0} height={2 * R} fill={METAL} />
          {op === 'ranurado' ? (
            <rect x={160} y={cy + R - 14} width={12} height={14} fill="#0c1220" />
          ) : (
            <>
              <rect x={160} y={cy + 4} width={8} height={R - 4} fill="#0c1220" />
              <line x1={164} y1={cy - R} x2={164} y2={cy + 4} stroke={HL} strokeDasharray="4 3" strokeWidth={2} />
            </>
          )}
          {op === 'ranurado' ? tool(166, cy + R - 14, 12) : tool(164, cy + 4, 8)}
          <Arrow x1={190} y1={132} x2={190} y2={cy + R + 6} color={BLUE} />
        </>
      )
      break
    case 'moleteado':
      body = (
        <>
          <rect x={x0} y={cy - R} width={x1 - x0} height={2 * R} fill={METAL} />
          {Array.from({ length: 13 }, (_, k) => (
            <g key={k} stroke="#5b6b7d" strokeWidth={1.4}>
              <line x1={120 + k * 8} y1={cy - R} x2={136 + k * 8} y2={cy + R} />
              <line x1={136 + k * 8} y1={cy - R} x2={120 + k * 8} y2={cy + R} />
            </g>
          ))}
          <circle cx={170} cy={cy + R + 12} r={12} fill="#9aa8bd" stroke="#3b4656" />
          <circle cx={198} cy={cy + R + 12} r={12} fill="#9aa8bd" stroke="#3b4656" />
          <rect x={164} y={cy + R + 22} width={40} height={30} fill={TOOL} />
        </>
      )
      break
    case 'interior':
      body = (
        <>
          <rect x={x0} y={cy - R} width={x1 - x0} height={2 * R} fill={METAL} />
          <rect x={140} y={cy - 18} width={x1 - 140} height={36} fill="#0c1220" opacity={0.8} />
          <rect x={164} y={cy + 2} width={140} height={12} fill="#b8c2cf" stroke="#5b6b7d" />
          <polygon points={pts([[156, cy + 18], [170, cy + 2], [170, cy + 14]])} fill={TOOL} />
          <Arrow x1={240} y1={cy + 52} x2={180} y2={cy + 52} color={BLUE} />
        </>
      )
      break
    case 'roscado':
      body = (
        <>
          <rect x={x0} y={cy - R} width={140 - x0} height={2 * R} fill={METAL} />
          <path
            d={`M140 ${cy - R} ${Array.from({ length: 10 }, (_, k) => `L${145 + k * 11} ${cy - R + 8} L${150 + k * 11} ${cy - R}`).join(' ')} L${x1} ${cy - R} V${cy + R} ${Array.from(
              { length: 10 },
              (_, k) => `L${245 - k * 11} ${cy + R - 8} L${240 - k * 11} ${cy + R}`,
            ).join(' ')} L140 ${cy + R} Z`}
            fill={METAL}
          />
          <polygon points={pts([[196, cy + R - 8], [202, cy + R + 4], [202, 136], [190, 136], [190, cy + R + 4]])} fill={TOOL} />
          <Arrow x1={240} y1={128} x2={210} y2={128} color={BLUE} />
          <text x={244} y={132} fill={BLUE} style={{ fontSize: 11 }}>
            fn = p
          </text>
        </>
      )
      break
  }
  return (
    <svg viewBox="0 0 310 145" className="tn-sketch" style={width ? { maxWidth: width } : undefined} role="img" aria-label={`Operación de ${op}`}>
      <rect x={6} y={14} width={28} height={112} rx={4} fill={METAL_DARK} />
      {body}
      <path d={`M6 ${cy} H306`} stroke={BLUE} strokeDasharray="10 4 2 4" strokeWidth={1} opacity={0.5} />
    </svg>
  )
}

const OPS: { k: OpKind; t: string; d: string }[] = [
  { k: 'frenteado', t: 'Frenteado (desbaste frontal)', d: 'Se limpia el frente de la pieza con el carro transversal. El filo principal forma un ángulo pequeño contra la cara a mecanizar; conviene un ángulo de entrada cercano a 90° y avanzar hacia el eje (mejor viruta y menos vibración).' },
  { k: 'cilindrado', t: 'Cilindrado (desbaste lateral)', d: 'Se mecaniza la cara lateral: penetración con el carro transversal y avance paralelo al eje con el longitudinal. Se recomienda que el filo forme con la superficie un ángulo levemente mayor a 90° (92°–93°): se logra con el portainsertos perpendicular al eje.' },
  { k: 'perforado', t: 'Perforado', d: 'En la cara frontal, sobre el eje. Gira la pieza y la broca (mecha) entra montada en un portabrocas (mandril) clavado en el manguito de la contrapunta, que se avanza con su volante con la contrapunta bloqueada. Para diámetros grandes: brocas de cola cónica; en CNC, brocas con insertos.' },
  { k: 'conico', t: 'Desbaste cónico', d: 'Se avanza con el charriot inclinado en lugar del longitudinal (sólo a mano: terminación algo imperfecta), o se desplaza la contrapunta para conos largos y poco pronunciados (sólo entre puntas).' },
  { k: 'ranurado', t: 'Ranurado', d: 'Una herramienta de perfil delgado penetra perpendicular al eje. Si la ranura es más ancha que la herramienta, se desplaza paralela al eje con cuidado: el filo trabajando de costado sufre esfuerzos adicionales.' },
  { k: 'tronzado', t: 'Tronzado', d: 'Es un ranurado que llega hasta el centro y corta la pieza (si el inserto y el porta lo permiten).' },
  { k: 'roscado', t: 'Roscado', d: 'Con una herramienta de perfil especial se talla una hélice; el avance por vuelta es igual al paso de la rosca (fn = p). Lo vemos en detalle en el próximo tema.' },
  { k: 'moleteado', t: 'Moleteado', d: 'Es la única operación del torno que NO saca viruta: una o dos ruedas labradas (moleta) se comprimen contra la pieza y le dibujan un grabado para que no resbale en la mano.' },
  { k: 'interior', t: 'Torneado interior', d: 'Todas las operaciones exteriores (menos el moleteado) se pueden hacer adentro. Primero se perfora para que entre la herramienta, que suele ser larga y de formato especial (barra de interiores).' },
]

function OpsGallery() {
  const [k, setK] = useState<OpKind>('frenteado')
  const o = OPS.find((x) => x.k === k)!
  return (
    <div className="calc">
      <div className="tn-chips">
        {OPS.map((x) => (
          <button key={x.k} type="button" className={`chip${x.k === k ? ' active' : ''}`} onClick={() => setK(x.k)}>
            {x.t.split(' (')[0]}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <OpSketch op={k} width={420} />
      </div>
      <div className="tn-info">
        <h4>{o.t}</h4>
        <p>{o.d}</p>
      </div>
    </div>
  )
}

type ConeMode = 'charriot' | 'contrapunta'

function ConeCalc() {
  const [mode, setMode] = useState<ConeMode>('contrapunta')
  const [D, setD] = useState(100)
  const [d, setd] = useState(80)
  const [Lc, setLc] = useState(200)
  const [LT, setLT] = useState(300)
  const dd = Math.min(d, D - 1)
  const lt = Math.max(LT, Lc)
  const alpha = deg(Math.atan((D - dd) / (2 * Lc)))
  const S = ((D - dd) * lt) / (2 * Lc)

  // ---- dibujo
  let drawing: ReactNode
  if (mode === 'contrapunta') {
    const P0: [number, number] = [70, 100]
    const LTpx = 440
    const LcPx = (LTpx * Lc) / lt
    const realPhi = deg(Math.atan(S / lt))
    let phi = Math.min(8, Math.max(2.5, realPhi * 6))
    const Rbig = 34
    if (Rbig - LcPx * Math.tan(rad(phi)) < 8) phi = deg(Math.atan((Rbig - 8) / LcPx))
    const u: [number, number] = [Math.cos(rad(phi)), Math.sin(rad(phi))]
    const n: [number, number] = [-Math.sin(rad(phi)), Math.cos(rad(phi))]
    const R = (s: number) => (s <= LTpx - LcPx ? Rbig : Rbig - (s - (LTpx - LcPx)) * Math.tan(rad(phi)))
    const at = (s: number, side: number): [number, number] => [P0[0] + s * u[0] + side * R(s) * n[0], P0[1] + s * u[1] + side * R(s) * n[1]]
    const ss = [0, LTpx - LcPx, LTpx]
    const outline = [...ss.map((s) => at(s, -1)), ...[...ss].reverse().map((s) => at(s, 1))]
    const E: [number, number] = [P0[0] + LTpx * u[0], P0[1] + LTpx * u[1]]
    const sm = LTpx - LcPx / 2
    const tp = at(sm, 1)
    drawing = (
      <svg viewBox="0 0 620 210" className="tn-diagram" role="img" aria-label="Cono por desplazamiento de la contrapunta (vista de arriba)">
        <polygon points={pts(outline)} fill={METAL} stroke="#8794a5" />
        <line x1={at(LTpx - LcPx, 1)[0]} y1={at(LTpx - LcPx, 1)[1]} x2={at(LTpx, 1)[0]} y2={at(LTpx, 1)[1]} stroke={HL} strokeWidth={3} />
        <path d={`M30 ${P0[1]} H600`} stroke={BLUE} strokeDasharray="10 4 2 4" strokeWidth={1.2} />
        <text x={600} y={P0[1] - 6} textAnchor="end" fill={BLUE} style={{ fontSize: 11 }}>
          eje del torno
        </text>
        <line x1={P0[0]} y1={P0[1]} x2={E[0]} y2={E[1]} stroke="currentColor" strokeDasharray="6 4" opacity={0.6} />
        <polygon points={pts([[P0[0], P0[1]], [P0[0] - 22, P0[1] - 9], [P0[0] - 22, P0[1] + 9]])} fill="#b8c2cf" />
        <polygon points={pts([[E[0], E[1]], [E[0] + 22, E[1] - 9], [E[0] + 22, E[1] + 9]])} fill="#b8c2cf" />
        <rect x={E[0] + 22} y={E[1] - 14} width={50} height={28} rx={4} fill={MACHINE} />
        <line x1={E[0] + 84} y1={P0[1]} x2={E[0] + 84} y2={E[1]} stroke={RED} strokeWidth={2} />
        <line x1={E[0] + 76} y1={E[1]} x2={E[0] + 92} y2={E[1]} stroke={RED} strokeWidth={2} />
        <text x={E[0] + 90} y={(P0[1] + E[1]) / 2 + 26} fill={RED} style={{ fontSize: 13, fontWeight: 700 }}>
          S
        </text>
        <polygon points={pts([tp, [tp[0] + 8, tp[1] + 16], [tp[0] + 8, tp[1] + 50], [tp[0] - 8, tp[1] + 50], [tp[0] - 8, tp[1] + 12]])} fill={TOOL} />
        <Arrow x1={tp[0] + 60} y1={tp[1] + 40} x2={tp[0] + 16} y2={tp[1] + 40} color={BLUE} />
        <text x={tp[0] + 66} y={tp[1] + 44} fill={BLUE} style={{ fontSize: 12 }}>
          avance paralelo al eje
        </text>
        <text x={20} y={16} fill="currentColor" opacity={0.7} style={{ fontSize: 11 }}>
          Vista de arriba · el desplazamiento está exagerado para que se vea
        </text>
      </svg>
    )
  } else {
    const cy = 96
    const Rbig = 46
    let phi = alpha < 8 ? Math.max(4, alpha * 2) : Math.min(alpha, 40)
    let LcPx = 150
    if (Rbig - LcPx * Math.tan(rad(phi)) < 8) LcPx = (Rbig - 8) / Math.tan(rad(phi))
    if (LcPx < 30) {
      LcPx = 30
      phi = deg(Math.atan((Rbig - 8) / LcPx))
    }
    const xEnd = 430
    const xc = xEnd - LcPx
    const r2 = Rbig - LcPx * Math.tan(rad(phi))
    const mx = (xc + xEnd) / 2
    const my = cy + (Rbig + r2) / 2
    drawing = (
      <svg viewBox="0 0 620 230" className="tn-diagram" role="img" aria-label="Cono con el charriot inclinado (vista de arriba)">
        <rect x={20} y={cy - 70} width={30} height={140} rx={4} fill={METAL_DARK} />
        <polygon points={pts([[50, cy - Rbig], [xc, cy - Rbig], [xEnd, cy - r2], [xEnd, cy + r2], [xc, cy + Rbig], [50, cy + Rbig]])} fill={METAL} stroke="#8794a5" />
        <line x1={xc} y1={cy + Rbig} x2={xEnd} y2={cy + r2} stroke={HL} strokeWidth={3} />
        <path d={`M10 ${cy} H600`} stroke={BLUE} strokeDasharray="10 4 2 4" strokeWidth={1.2} />
        <g transform={`rotate(${-phi} ${mx} ${my + 70})`}>
          <rect x={mx - 110} y={my + 52} width={220} height={36} rx={5} fill="#62a0c6" opacity={0.85} />
          <text x={mx} y={my + 75} textAnchor="middle" fill="#0b1018" style={{ fontSize: 13, fontWeight: 700 }}>
            charriot girado α
          </text>
          <polygon points={pts([[mx, my + 4], [mx + 8, my + 18], [mx + 8, my + 52], [mx - 8, my + 52], [mx - 8, my + 14]])} fill={TOOL} />
          <line x1={mx - 100} y1={my + 100} x2={mx + 60} y2={my + 100} stroke={BLUE} strokeWidth={3} />
          <polygon points={pts([[mx - 108, my + 100], [mx - 94, my + 93], [mx - 94, my + 107]])} fill={BLUE} />
        </g>
        <path d={arcPath(xEnd, cy + r2, 80, 180, 180 + phi)} fill="none" stroke={RED} strokeWidth={2} />
        <line x1={xEnd} y1={cy + r2} x2={xEnd - 100} y2={cy + r2} stroke="currentColor" strokeDasharray="4 3" opacity={0.6} />
        <text x={xEnd - 92} y={cy + r2 + 12 + 4} fill={RED} style={{ fontSize: 14, fontWeight: 700 }}>
          α
        </text>
        <text x={20} y={222} fill="currentColor" opacity={0.7} style={{ fontSize: 11 }}>
          Vista de arriba{alpha < 8 ? ' · ángulo exagerado para que se vea' : ''}
        </text>
      </svg>
    )
  }

  return (
    <div className="calc">
      <h4 style={{ marginTop: 0 }}>Calculadora de conos</h4>
      <Segmented<ConeMode>
        value={mode}
        options={[
          { value: 'contrapunta', label: 'Desplazando la contrapunta' },
          { value: 'charriot', label: 'Con el charriot' },
        ]}
        onChange={setMode}
      />
      {drawing}
      <Slider label="ø mayor D" value={D} min={10} max={200} onChange={(v) => setD(v)} format={(x) => `${x} mm`} />
      <Slider label="ø menor d" value={dd} min={2} max={D - 1} onChange={setd} format={(x) => `${x} mm`} />
      <Slider label="Largo del cono Lc" value={Lc} min={10} max={500} step={5} onChange={setLc} format={(x) => `${x} mm`} />
      {mode === 'contrapunta' && <Slider label="Largo total (entre puntas) LT" value={lt} min={Lc} max={1000} step={5} onChange={setLT} format={(x) => `${x} mm`} />}
      {mode === 'contrapunta' ? (
        <>
          <Formula>
            S = (ø Mayor − ø Menor) × Largo Total / (Largo Cono × 2) = ({D} − {dd}) × {lt} / ({Lc} × 2) = <strong>{fmt(S, 2)} mm</strong>
          </Formula>
          <p className="hint">
            Sólo con montaje entre puntas. Se corre el cuerpo de la contrapunta con los tornillos de registro laterales, mirando la regla milimetrada de atrás.
            {lt === Lc && ' Si el cono ocupa toda la pieza (Lc = LT), S es simplemente (D − d) / 2.'}
          </p>
          {S > 15 && <p className="warn-box">El desplazamiento es grande: para conos tan pronunciados conviene el charriot.</p>}
        </>
      ) : (
        <>
          <Formula>
            tan α = (D − d) / (2 × Lc) = ({D} − {dd}) / (2 × {Lc}) = {fmt((D - dd) / (2 * Lc), 4)} → <strong>α = {fmt(alpha, 2)}° ≈ {dms(alpha)}</strong>
          </Formula>
          <Readout label="Ángulo total del cono (2α)" value={`${fmt(2 * alpha, 2)}°`} />
          <p className="hint">Se aflojan las tuercas de la base del charriot y se gira α según la graduación en grados. El avance se da a mano con el volante del charriot. Revisá que el largo del cono entre en la carrera del charriot.</p>
        </>
      )}
    </div>
  )
}

/* ================================================================ 10. roscado */

function ThreadProfile({ angle }: { angle: number }) {
  const p = 80
  const h = p / (2 * Math.tan(rad(angle / 2)))
  const top = 46
  const root = top + h
  const x0 = 30
  const pointsTop: [number, number][] = [[x0, root]]
  for (let k = 0; k < 4; k++) {
    pointsTop.push([x0 + k * p + p / 2, top], [x0 + (k + 1) * p, root])
  }
  const right = x0 + 4 * p
  return (
    <svg viewBox="0 0 500 230" className="tn-diagram" role="img" aria-label="Perfil de una rosca">
      <polygon points={pts([...pointsTop, [right, 220], [x0, 220]])} fill={METAL} stroke="#8794a5" />
      <line x1={x0} y1={top} x2={right + 70} y2={top} stroke="currentColor" strokeDasharray="5 4" opacity={0.6} />
      <line x1={x0} y1={root} x2={right + 70} y2={root} stroke="currentColor" strokeDasharray="5 4" opacity={0.6} />
      <text x={right + 74} y={top + 4} fill="currentColor" style={{ fontSize: 12 }}>
        ø exterior
      </text>
      <text x={right + 74} y={root + 4} fill="currentColor" style={{ fontSize: 12 }}>
        ø interior
      </text>
      {/* paso */}
      <line x1={x0 + p / 2} y1={top - 22} x2={x0 + p / 2 + p} y2={top - 22} stroke={BLUE} strokeWidth={2} />
      <line x1={x0 + p / 2} y1={top - 30} x2={x0 + p / 2} y2={top - 2} stroke={BLUE} />
      <line x1={x0 + p * 1.5} y1={top - 30} x2={x0 + p * 1.5} y2={top - 2} stroke={BLUE} />
      <text x={x0 + p} y={top - 28} textAnchor="middle" fill={BLUE} style={{ fontSize: 13, fontWeight: 700 }}>
        paso p
      </text>
      {/* profundidad */}
      <line x1={right + 40} y1={top} x2={right + 40} y2={root} stroke={RED} strokeWidth={2} />
      <text x={right + 30} y={(top + root) / 2 + 5} textAnchor="end" fill={RED} style={{ fontSize: 14, fontWeight: 800 }}>
        h
      </text>
      {/* ángulo del filete */}
      <path d={arcPath(x0 + 2.5 * p, top, 34, 270 - angle / 2, 270 + angle / 2)} fill="none" stroke={GREEN} strokeWidth={2.5} />
      <text x={x0 + 2.5 * p} y={top + 56} textAnchor="middle" fill="#0e6b3a" style={{ fontSize: 13, fontWeight: 800 }}>
        α = {angle}°
      </text>
      <text x={x0 + 3.5 * p} y={top + h + 30} textAnchor="middle" fill="#1f2937" style={{ fontSize: 12 }}>
        filete (hilo)
      </text>
    </svg>
  )
}

function FlankFeed({ angle }: { angle: number }) {
  const a2 = angle / 2
  const A: [number, number] = [200, 170]
  const L = 120
  const S: [number, number] = [A[0] - L * Math.sin(rad(a2)), A[1] - L * Math.cos(rad(a2))]
  const beta = 90 - a2
  return (
    <svg viewBox="0 0 400 210" className="tn-diagram" role="img" aria-label="Penetración en flanco con el charriot">
      <polygon points={pts([[40, 30], [A[0] - 140 * Math.tan(rad(a2)), 30], A, [A[0] + 140 * Math.tan(rad(a2)), 30], [360, 30], [360, 200], [40, 200]])} fill={METAL} opacity={0.9} />
      <path d={`M20 ${A[1] + 22} H380`} stroke={BLUE} strokeDasharray="10 4 2 4" strokeWidth={1} />
      <text x={380} y={A[1] + 16} textAnchor="end" fill={BLUE} style={{ fontSize: 11 }}>
        eje del torno
      </text>
      <line x1={S[0]} y1={S[1]} x2={A[0]} y2={S[1]} stroke="currentColor" strokeDasharray="4 3" opacity={0.6} />
      <Arrow x1={A[0] + 0.01} y1={S[1]} x2={A[0]} y2={A[1] - 2} color={RED} width={2.5} />
      <text x={A[0] + 8} y={(S[1] + A[1]) / 2} fill={RED} style={{ fontSize: 15, fontWeight: 800 }}>
        h
      </text>
      <Arrow x1={S[0]} y1={S[1]} x2={A[0] - 2} y2={A[1] - 3} color={TOOL} width={3} />
      <text x={(S[0] + A[0]) / 2 - 16} y={(S[1] + A[1]) / 2} textAnchor="end" fill={TOOL} style={{ fontSize: 15, fontWeight: 800 }}>
        x
      </text>
      <path d={arcPath(A[0], A[1], 36, 90, 90 + a2)} fill="none" stroke={GREEN} strokeWidth={2} />
      <text x={A[0] - 8} y={A[1] - 42} textAnchor="end" fill="#0e6b3a" style={{ fontSize: 12, fontWeight: 800 }}>
        α/2
      </text>
      <line x1={A[0]} y1={A[1]} x2={A[0] - 120} y2={A[1]} stroke="currentColor" strokeDasharray="4 3" opacity={0.6} />
      <path d={arcPath(A[0], A[1], 64, 180 - beta, 180)} fill="none" stroke={BLUE} strokeWidth={2} />
      <text x={A[0] - 74} y={A[1] - 8} textAnchor="end" fill={BLUE} style={{ fontSize: 13, fontWeight: 800 }}>
        β = {dms(beta)}
      </text>
      <text x={40} y={20} fill="currentColor" style={{ fontSize: 11 }}>
        el charriot avanza la herramienta en la dirección de x
      </text>
    </svg>
  )
}

type ThreadType = 'M' | 'W'

function ThreadCalc() {
  const [type, setType] = useState<ThreadType>('W')
  const [De, setDe] = useState('9,525')
  const [Di, setDi] = useState('8')
  const angle = type === 'M' ? 60 : 55
  const a2 = angle / 2
  const beta = 90 - a2
  const D = parseFloat(De.replace(',', '.'))
  const d = parseFloat(Di.replace(',', '.'))
  const ok = Number.isFinite(D) && Number.isFinite(d) && D > d && d > 0
  const h = ok ? (D - d) / 2 : NaN
  const x = h / Math.cos(rad(a2))
  const pick = (t: ThreadType) => {
    setType(t)
    if (t === 'M') {
      setDe('10')
      setDi('8,16')
    } else {
      setDe('9,525')
      setDi('8')
    }
  }
  return (
    <div className="calc">
      <h4 style={{ marginTop: 0 }}>Calculadora de rosca</h4>
      <Segmented<ThreadType>
        value={type}
        options={[
          { value: 'M', label: 'Métrica (60°)' },
          { value: 'W', label: 'Whitworth (55°)' },
        ]}
        onChange={pick}
      />
      <div className="tn-two">
        <ThreadProfile angle={angle} />
        <FlankFeed angle={angle} />
      </div>
      <div className="tn-inputs">
        <label className="field">
          <span className="field-label">ø exterior (mm)</span>
          <input className="input num" inputMode="decimal" value={De} onChange={(e) => setDe(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">ø interior (mm, por tabla)</span>
          <input className="input num" inputMode="decimal" value={Di} onChange={(e) => setDi(e.target.value)} />
        </label>
      </div>
      {!ok && <p className="warn-box">El ø exterior tiene que ser mayor que el interior.</p>}
      <Formula>
        β = 90° − α/2 = 90° − {dms(a2)} = <strong>{dms(beta)}</strong>
      </Formula>
      <Formula>
        h = (ø ext − ø int) / 2 = ({fmt(D, 3)} − {fmt(d, 3)}) / 2 = <strong>{fmt(h, 4)} mm</strong>
      </Formula>
      <Formula>
        x = h / cos(α/2) = {fmt(h, 4)} / cos {dms(a2)} = <strong>{fmt(x, 3)} mm</strong>
      </Formula>
      <Readout label="Lo que avanza el charriot (en flanco)" value={`${fmt(x, 2)} mm`} />
      <Readout label="Pasadas aprox. (1 a 2 décimas por pasada)" value={ok ? `${Math.ceil(x / 0.2 - 1e-9)} a ${Math.ceil(x / 0.1 - 1e-9)}` : '—'} />
      <p className="hint">
        {type === 'W'
          ? 'Ejemplo del apunte: W 3/8" → ø ext 9,525 mm, ø int 8 mm → h = 0,7625 mm y x ≈ 0,86 mm.'
          : 'Ejemplo: M10 × 1,5 → ø ext 10 mm, ø de núcleo ≈ 8,16 mm (tabla ISO).'}
      </p>
    </div>
  )
}

/* ================================================================ 11. seguridad */

const CHECKS = [
  'Ropa ajustada, sin pulseras, relojes, anillos ni collares; pelo largo atado.',
  'Anteojos de seguridad puestos (con cierres laterales si es fundición).',
  'Pieza bien ajustada y centrada (la giré con la mano).',
  'Llave del plato sacada.',
  'Contrapunta y manguito bloqueados (si se usan).',
  'Nada sobre la bancada ni sobre el cabezal; herramientas en la tablita.',
  'Piso limpio y sin estorbos alrededor de la máquina.',
  'Velocidad elegida con la máquina detenida.',
]

function SafetyChecklist() {
  const [v, setV] = useState<boolean[]>(CHECKS.map(() => false))
  const done = v.every(Boolean)
  return (
    <div className="calc">
      <h4 style={{ marginTop: 0 }}>Antes de arrancar el torno</h4>
      <div className="tn-checklist">
        {CHECKS.map((c, i) => (
          <Toggle key={c} label={c} value={v[i]} onChange={(x) => setV(v.map((y, j) => (j === i ? x : y)))} />
        ))}
      </div>
      <p className={`tn-big ${done ? 'tn-ok' : 'tn-bad'}`}>{done ? '✔ Todo listo: podés arrancar.' : `✘ Faltan ${v.filter((x) => !x).length} controles. No arranques todavía.`}</p>
    </div>
  )
}

/* ================================================================ temas */

export const TORNO_TOPICS: Topic[] = [
  {
    id: 'torno-intro',
    title: 'Máquinas herramientas y el torno',
    icon: '🏭',
    summary: 'Qué es una máquina herramienta, qué es un torno y un poco de historia.',
    content: (
      <>
        <h4>Máquinas herramientas</h4>
        <p>
          Para hacer una pieza se pueden usar herramientas de mano (por ejemplo, limas) o una máquina que le da forma a un material sólido. Hay tres maneras de hacerlo:
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Forma de trabajar</th>
                <th>Ejemplos</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Extrayendo material (arranque de viruta)</td>
                <td>torno, fresadora, amoladora, perforadora</td>
              </tr>
              <tr>
                <td>Aportando material</td>
                <td>soldadoras</td>
              </tr>
              <tr>
                <td>Conservando la misma cantidad de material</td>
                <td>plegadoras, prensas</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Las máquinas que trabajan <strong>arrancando viruta por medio de una herramienta</strong> se llaman <strong>máquinas herramientas</strong>. Las hay{' '}
          <strong>manuales</strong> (taladros, amoladoras, sierras circulares, caladoras, lijadoras) y <strong>estacionarias</strong>, mucho más grandes. El torno
          pertenece a este último grupo.
        </p>
        <Formula>
          «Máquina herramienta es un tipo de máquina donde se utilizan herramientas especiales para dar forma a materiales sólidos, principalmente metales. Su característica
          principal es su tamaño y robustez, lo que impide su traslado; por esa razón se las denomina máquinas estacionarias.»
        </Formula>
        <h4>El torno</h4>
        <p>
          <strong>Torno</strong> viene del latín <em>tornus</em> y este del griego <em>τόρνος</em>: giro, vuelta. Es una máquina herramienta que mecaniza piezas con forma
          geométrica de <strong>revolución</strong> (cilindros, conos, hélices): hace <strong>girar la pieza</strong> mientras una o varias herramientas de corte avanzan
          contra su superficie y cortan lo que sobra en forma de <strong>viruta</strong>.
        </p>
        <RevolutionShapes />
        <h4>Un poco de historia</h4>
        <ul className="tn-timeline">
          <li>
            <strong>Antigüedad:</strong> tornos de arco o de pedal, con la herramienta sostenida a mano (complemento).
          </li>
          <li>
            <strong>1751:</strong> Jacques de Vaucanson construye el que se considera el primer torno máquina herramienta: fue el primero que puso el instrumento de corte
            en una cabeza ajustable mecánicamente, <strong>sacándolo de las manos del operario</strong>.
          </li>
          <li>
            <strong>Revolución industrial:</strong> el torno se vuelve una máquina básica del mecanizado industrial (hacia 1800, Henry Maudslay difunde el torno de roscar
            con tornillo patrón — complemento).
          </li>
          <li>
            <strong>Hoy:</strong> conviven el torno paralelo convencional y los tornos con Control Numérico Computarizado (CNC).
          </li>
        </ul>
      </>
    ),
    activities: [
      {
        id: 'tt-1-1',
        type: 'mc',
        q: '¿Por qué se llaman «máquinas herramientas»?',
        options: ['Porque se manejan con herramientas de mano', 'Porque trabajan arrancando viruta por medio de una herramienta', 'Porque fabrican herramientas', 'Porque son portátiles'],
        answer: 1,
        explain: 'Trabajan arrancando viruta por medio de una herramienta.',
      },
      {
        id: 'tt-1-2',
        type: 'mc',
        q: 'El torno permite mecanizar piezas con forma…',
        options: ['Plana', 'De revolución (cilindros, conos, hélices)', 'Cualquiera, incluso cúbica', 'Sólo roscas'],
        answer: 1,
        explain: 'La pieza gira: todo lo que sale del torno es de revolución.',
      },
      {
        id: 'tt-1-3',
        type: 'num',
        q: '¿En qué año se considera que Jacques de Vaucanson inventó el primer torno máquina herramienta?',
        answer: 1751,
        tolerance: 0,
        unit: '',
        explain: 'Alrededor de 1751: puso la herramienta en una cabeza ajustable mecánicamente, fuera de las manos del operario.',
      },
      {
        id: 'tt-1-4',
        type: 'mc',
        q: 'Una soldadora da forma a la pieza…',
        options: ['Extrayendo material', 'Aportando material', 'Conservando la misma cantidad de material', 'Arrancando viruta'],
        answer: 1,
        explain: 'La soldadora aporta material.',
      },
      {
        id: 'tt-1-5',
        type: 'mc',
        q: 'Por su tamaño y robustez, el torno es una máquina herramienta…',
        options: ['Manual', 'Estacionaria', 'Portátil', 'De aporte'],
        answer: 1,
        explain: 'No se puede trasladar fácilmente: es estacionaria.',
      },
      {
        id: 'tt-1-6',
        type: 'mc',
        q: 'La palabra «torno» viene del griego τόρνος, que significa…',
        options: ['Cortar', 'Giro, vuelta', 'Hierro', 'Máquina'],
        answer: 1,
        explain: 'Giro, vuelta: justamente lo que hace la pieza.',
      },
    ],
  },
  {
    id: 'torno-movimientos',
    title: 'El torno paralelo y los movimientos de trabajo',
    icon: '🔄',
    summary: 'Por qué se llama «paralelo» y los tres movimientos: corte, avance y penetración.',
    content: (
      <>
        <p>
          Con el tiempo aparecieron muchos tipos de tornos. Nosotros estudiamos el <strong>torno paralelo</strong>, que debe su nombre a que el carro que lleva las
          herramientas se desplaza sobre <strong>dos guías paralelas entre sí y paralelas al eje del torno</strong>, que coincide con el eje de giro de la pieza.
        </p>
        <p>
          La pieza se sujeta al eje de la máquina y se pone a girar; al mismo tiempo, la herramienta se mueve contra ella y arranca viruta. Este proceso se llama{' '}
          <strong>torneado</strong>. En él hay tres movimientos de trabajo:
        </p>
        <MovementsDemo />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Movimiento</th>
                <th>Quién lo hace</th>
                <th>Qué define</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Corte (trabajo)</td>
                <td>La pieza, girando</td>
                <td>La velocidad de corte</td>
              </tr>
              <tr>
                <td>Avance</td>
                <td>La herramienta, paralela al eje (carro longitudinal)</td>
                <td>El perfil de revolución</td>
              </tr>
              <tr>
                <td>Penetración</td>
                <td>La herramienta, perpendicular al avance (carro transversal)</td>
                <td>La sección o profundidad de viruta</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
    activities: [
      {
        id: 'tt-2-1',
        type: 'mc',
        q: '¿Por qué se llama «torno paralelo»?',
        options: ['Porque tiene dos motores en paralelo', 'Porque el carro se desplaza sobre guías paralelas al eje del torno', 'Porque mecaniza dos piezas a la vez', 'Porque la herramienta es paralela al piso'],
        answer: 1,
        explain: 'El carro corre sobre dos guías paralelas entre sí y al eje de giro de la pieza.',
      },
      {
        id: 'tt-2-2',
        type: 'mc',
        q: 'El movimiento de corte en el torno es…',
        options: ['El avance del carro', 'La rotación de la pieza sobre su eje', 'La penetración de la herramienta', 'El giro de la herramienta'],
        answer: 1,
        explain: 'En el torno gira la pieza; la herramienta no gira.',
      },
      {
        id: 'tt-2-3',
        type: 'mc',
        q: '¿Qué movimiento determina la profundidad de la viruta que se saca?',
        options: ['Corte', 'Avance', 'Penetración'],
        answer: 2,
        explain: 'La penetración, perpendicular al avance, fija la sección o profundidad de viruta.',
      },
      {
        id: 'tt-2-4',
        type: 'mc',
        q: 'El movimiento de avance generalmente es…',
        options: ['Perpendicular al eje de la pieza', 'Paralelo al eje de la pieza', 'Circular', 'Vertical'],
        answer: 1,
        explain: 'Avanza a lo largo de la pieza y define el perfil de revolución.',
      },
      {
        id: 'tt-2-5',
        type: 'mc',
        q: 'La velocidad con que la pieza se mueve contra la herramienta al arrancar la viruta se llama…',
        options: ['Velocidad de avance', 'Velocidad de corte', 'Revoluciones del motor', 'Paso'],
        answer: 1,
        explain: 'Es la velocidad de corte (Vc), en m/min.',
      },
    ],
  },
  {
    id: 'torno-partes',
    title: 'Partes principales del torno',
    icon: '⚙️',
    summary: 'Bancada, cabezal fijo, contrapunta, carros y delantal (con sus cuidados). Dibujo interactivo.',
    content: (
      <>
        <p>
          El torno tiene muchas piezas que podemos agrupar en cuatro componentes principales: la <strong>bancada</strong>, el <strong>cabezal fijo</strong>, la{' '}
          <strong>contrapunta</strong> y el <strong>carro portaherramientas</strong> (con su delantal). Explorá el dibujo:
        </p>
        <PartsExplorer />
        <h4>El carro portaherramientas</h4>
        <ul>
          <li>
            <strong>Carro longitudinal</strong> (principal): sobre las guías de la bancada; se mueve a lo largo, a mano o automático. Para roscar usa la tuerca partida
            sobre el tornillo patrón.
          </li>
          <li>
            <strong>Carro transversal</strong>: sobre el anterior, perpendicular al eje. Da la profundidad de pasada.
          </li>
          <li>
            <strong>Charriot</strong> (carro superior): base sobre una plataforma giratoria graduada en grados; se orienta en cualquier ángulo.
          </li>
          <li>
            <strong>Torre portaherramientas</strong>: sobre el charriot; de cuatro posiciones o regulable en altura.
          </li>
          <li>
            <strong>Delantal</strong>: caja de fundición donde se apoya todo; adentro, los engranajes de los avances. Palanca de tres posiciones:{' '}
            <strong>arriba = cilindrar</strong>, <strong>medio = neutro</strong>, <strong>abajo = frentear</strong>.
          </li>
        </ul>
        <p className="warn-box">
          <strong>Cuidados generales:</strong> guías y carros limpios de virutas y lubricados; nada pesado encima; no golpearlos. Ningún cambio de velocidad con la
          máquina en marcha. El manguito de la contrapunta siempre tiene que sobresalir.
        </p>
      </>
    ),
    activities: [
      {
        id: 'tt-3-1',
        type: 'mc',
        q: '¿De qué material es la bancada?',
        options: ['Aluminio', 'Fundición de hierro gris', 'Acero inoxidable', 'Bronce'],
        answer: 1,
        explain: 'Fundición gris, hueca y con nervaduras para ser rígida.',
      },
      {
        id: 'tt-3-2',
        type: 'mc',
        q: '¿Por qué la bancada es hueca?',
        options: ['Para que pese menos y se pueda mover', 'Para el desahogo de virutas y líquidos refrigerantes', 'Para guardar herramientas', 'Para que pase el motor'],
        answer: 1,
        explain: 'Hueca para que caigan virutas y refrigerante; las nervaduras interiores le mantienen la rigidez.',
      },
      {
        id: 'tt-3-3',
        type: 'mc',
        q: 'Necesitás cambiar la velocidad del cabezal. ¿Cuándo lo hacés?',
        options: ['Con la máquina en marcha, despacio', 'Con la máquina detenida', 'Cuando el motor está caliente', 'Da igual'],
        answer: 1,
        explain: 'Con la máquina en marcha se rompen engranajes. Si no entra, mové el plato a mano.',
      },
      {
        id: 'tt-3-4',
        type: 'mc',
        q: 'El agujero del extremo del manguito de la contrapunta es…',
        options: ['Roscado', 'Cónico (cono Morse)', 'Cuadrado', 'Hexagonal'],
        answer: 1,
        explain: 'Cono Morse, para recibir mandriles portabrocas y puntos.',
      },
      {
        id: 'tt-3-5',
        type: 'mc',
        q: '¿Qué carro determina la profundidad de pasada?',
        options: ['Longitudinal', 'Transversal', 'Charriot', 'Ninguno: la da el plato'],
        answer: 1,
        explain: 'El carro transversal, que se mueve perpendicular al eje.',
      },
      {
        id: 'tt-3-6',
        type: 'mc',
        q: 'La palanca de tres posiciones del delantal, hacia abajo, acciona…',
        options: ['El cilindrado (carro longitudinal)', 'El neutro', 'El frenteado (carro transversal)', 'La tuerca partida'],
        answer: 2,
        explain: 'Arriba = cilindrar, medio = neutro, abajo = frentear.',
      },
      {
        id: 'tt-3-7',
        type: 'mc',
        q: '¿Cuántos frenos tiene la contrapunta?',
        options: ['Ninguno', 'Uno, sobre la bancada', 'Dos: uno sobre la bancada y otro para el manguito', 'Tres'],
        answer: 2,
        explain: 'Una palanca la bloquea sobre la bancada y la otra bloquea el cañón o manguito.',
      },
    ],
  },
  {
    id: 'torno-accesorios',
    title: 'Accesorios: platos, pinzas, puntos, lunetas y bridas',
    icon: '🔩',
    summary: 'Con qué se sujeta y se sostiene la pieza.',
    content: (
      <>
        <p>Los accesorios sirven para sujetar la pieza durante el mecanizado, sostener sus extremos o su parte media, y arrastrarla.</p>
        <AccessoryGallery />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pieza</th>
                <th>Accesorio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cilíndrica, hexagonal (caras múltiplo de 3)</td>
                <td>Plato universal de 3 mordazas</td>
              </tr>
              <tr>
                <td>Cuadrada, irregular, a descentrar</td>
                <td>Plato de 4 mordazas</td>
              </tr>
              <tr>
                <td>Diámetro grande</td>
                <td>Mordazas invertidas</td>
              </tr>
              <tr>
                <td>Material blando o pieza terminada que no hay que marcar</td>
                <td>Mordazas blandas</td>
              </tr>
              <tr>
                <td>Muchas piezas del mismo diámetro chico</td>
                <td>Pinza</td>
              </tr>
              <tr>
                <td>Extremo libre de una pieza larga</td>
                <td>Punto (fijo o giratorio) en la contrapunta</td>
              </tr>
              <tr>
                <td>Pieza larga y delgada</td>
                <td>Luneta fija y/o móvil</td>
              </tr>
              <tr>
                <td>Montaje entre puntas</td>
                <td>Plato liso de arrastre + brida</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
    activities: [
      {
        id: 'tt-4-1',
        type: 'mc',
        q: '¿Se puede sujetar una barra hexagonal en el plato de 3 mordazas?',
        options: ['No, nunca', 'Sí: sus caras son múltiplo de 3', 'Sólo con mordazas blandas', 'Sólo entre puntas'],
        answer: 1,
        explain: 'El plato de 3 mordazas toma piezas cilíndricas o con caras múltiplo de 3 (6 caras).',
      },
      {
        id: 'tt-4-2',
        type: 'mc',
        q: 'En el plato de 4 mordazas…',
        options: ['Las mordazas cierran todas juntas', 'Cada mordaza se ajusta por separado', 'No hay mordazas', 'Sólo se toman piezas redondas'],
        answer: 1,
        explain: 'Independientes: sirve para geometrías variadas.',
      },
      {
        id: 'tt-4-3',
        type: 'mc',
        q: '¿Qué punto hay que mantener con la punta constantemente lubricada?',
        options: ['El punto giratorio', 'El punto fijo', 'Ninguno', 'Los dos'],
        answer: 1,
        explain: 'El fijo no gira y roza con la pieza; el giratorio tiene rulemanes.',
      },
      {
        id: 'tt-4-4',
        type: 'mc',
        q: 'La luneta móvil se sujeta…',
        options: ['A la bancada', 'Al carro principal, y lo acompaña', 'A la contrapunta', 'Al plato'],
        answer: 1,
        explain: 'Se atornilla al carro; la fija va a la bancada.',
      },
      {
        id: 'tt-4-5',
        type: 'mc',
        q: '¿Cuál es el inconveniente de las pinzas?',
        options: ['No sujetan bien', 'Cada una sirve para muy pocos diámetros', 'Marcan la pieza', 'Necesitan lubricación'],
        answer: 1,
        explain: 'Si cambiás seguido de diámetro, necesitás muchas pinzas.',
      },
      {
        id: 'tt-4-6',
        type: 'mc',
        q: 'El plato liso de arrastre se usa junto con…',
        options: ['Una luneta', 'Una brida, en el montaje entre puntas', 'Una pinza', 'Mordazas blandas'],
        answer: 1,
        explain: 'La cola de la brida engancha en el perno del plato liso y arrastra la pieza.',
      },
      {
        id: 'tt-4-7',
        type: 'mc',
        q: 'Las mordazas blandas se usan para…',
        options: ['Diámetros grandes', 'Materiales blandos o para no lastimar la pieza', 'Piezas cuadradas', 'Piezas muy largas'],
        answer: 1,
        explain: 'Para diámetros grandes están las invertidas.',
      },
    ],
  },
  {
    id: 'torno-transmision',
    title: 'Transmisión de los movimientos',
    icon: '⛓️',
    summary: 'Del motor al husillo, la lira, la caja Norton, la barra de avances y el tornillo patrón.',
    content: (
      <>
        <h4>Del motor al eje</h4>
        <p>
          El motor está abajo a la izquierda y le pasa su giro al cabezal con <strong>poleas y correa</strong> (si es dentada, transmite sin patinar). La última polea
          está en un eje que entra al cabezal, paralelo al husillo, con <strong>engranajes escalonados</strong> que le dan al husillo —y a la pieza— un número
          determinado de revoluciones.
        </p>
        <h4>De la caja Norton a los automáticos de los carros</h4>
        <p>
          Afuera del cabezal está la <strong>lira</strong>, un tren de tres ruedas (<strong>conductora, intermedia y conducida</strong>) que lleva el giro a la{' '}
          <strong>caja Norton</strong>. Adentro de esta, una palanca oscilante hace engranar una rueda con otras de distinto tamaño: así se eligen distintos avances.
        </p>
        <p>De la caja Norton salen dos barras:</p>
        <ul>
          <li>
            <strong>Barra de avances</strong> (hexagonal o cilíndrica con chavetero): lleva el giro al delantal, que lo convierte en avance automático del carro
            longitudinal o transversal.
          </li>
          <li>
            <strong>Tornillo patrón</strong> (filete cuadrado): da el avance automático del carro longitudinal para <strong>roscar</strong>.
          </li>
        </ul>
        <TransmissionDiagram />
        <h4>Complemento: relación de poleas</h4>
        <p>
          En una transmisión por correa, la velocidad periférica de las dos poleas es la misma, así que <strong>n₁ × d₁ = n₂ × d₂</strong>. Una polea conducida más
          grande gira más despacio.
        </p>
        <PulleyCalc />
      </>
    ),
    activities: [
      {
        id: 'tt-5-1',
        type: 'mc',
        q: '¿Cómo llega el giro del motor al cabezal?',
        options: ['Por la barra de avances', 'Con poleas y correa', 'Con el tornillo patrón', 'Directamente, sin transmisión'],
        answer: 1,
        explain: 'Polea y correa; si la correa es dentada no patina.',
      },
      {
        id: 'tt-5-2',
        type: 'mc',
        q: '¿Cuáles son las tres ruedas de la lira?',
        options: ['Motora, libre y final', 'Conductora, intermedia y conducida', 'Grande, mediana y chica', 'Norton, patrón y barra'],
        answer: 1,
        explain: 'Conductora → intermedia → conducida, hacia la caja Norton.',
      },
      {
        id: 'tt-5-3',
        type: 'mc',
        q: '¿Para qué sirve la caja Norton?',
        options: ['Para elegir las rpm del husillo', 'Para elegir distintos avances automáticos y pasos de rosca', 'Para frenar el torno', 'Para refrigerar'],
        answer: 1,
        explain: 'Combina ruedas de distintos tamaños para dar distintos avances.',
      },
      {
        id: 'tt-5-4',
        type: 'mc',
        q: 'Vas a cilindrar con avance automático. ¿Qué lleva el movimiento al delantal?',
        options: ['El tornillo patrón', 'La barra de avances', 'La correa', 'La lira directamente'],
        answer: 1,
        explain: 'La barra de avances; el tornillo patrón queda para roscar.',
      },
      {
        id: 'tt-5-5',
        type: 'mc',
        q: 'El tornillo patrón tiene filete…',
        options: ['Triangular de 60°', 'Cuadrado', 'Redondo', 'No tiene filete'],
        answer: 1,
        explain: 'Es un tornillo de filete cuadrado.',
      },
      {
        id: 'tt-5-6',
        type: 'num',
        q: '(Complemento) Un motor de 1440 rpm tiene una polea de ø 100 mm que mueve otra de ø 200 mm. ¿A cuántas rpm gira la conducida?',
        answer: 720,
        tolerance: 0.01,
        unit: 'rpm',
        explain: 'n₂ = 1440 × 100 / 200 = 720 rpm.',
      },
    ],
  },
  {
    id: 'torno-montajes',
    title: 'Montajes de la pieza',
    icon: '🗜️',
    summary: 'Al aire, entre plato y contrapunta, entre puntas y con lunetas: cuándo usar cada uno.',
    content: (
      <>
        <p>Según el largo, el diámetro, el peso y lo que haya que hacer, la pieza se monta de distintas maneras. Elegí cada una:</p>
        <MountExplorer />
        <h4>Regla práctica (complemento)</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Largo que sobresale / diámetro</th>
                <th>Montaje recomendado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Hasta unas 3 veces el diámetro</td>
                <td>Al aire</td>
              </tr>
              <tr>
                <td>Más de 3 veces el diámetro</td>
                <td>Plato y contrapunta (o entre puntas)</td>
              </tr>
              <tr>
                <td>Muy esbelta (más de 10–12 veces el diámetro)</td>
                <td>Además, luneta fija o móvil</td>
              </tr>
              <tr>
                <td>Hay que darla vuelta sin perder concentricidad</td>
                <td>Entre puntas</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="tip">
          La <strong>mecha de centrar</strong> hace en la cara de la pieza una cavidad cónica de <strong>60°</strong>, que es donde apoya el punto.
        </p>
      </>
    ),
    activities: [
      {
        id: 'tt-6-1',
        type: 'mc',
        q: 'Una pieza corta y liviana que casi no sobresale del plato se monta…',
        options: ['Al aire', 'Entre puntas', 'Con lunetas', 'Entre plato y contrapunta'],
        answer: 0,
        explain: 'Al aire: tomada de un solo extremo.',
      },
      {
        id: 'tt-6-2',
        type: 'num',
        q: '¿De cuántos grados es la cavidad cónica que deja la mecha de centrar?',
        answer: 60,
        tolerance: 0,
        unit: '°',
        explain: '60°, igual que la punta de los puntos.',
      },
      {
        id: 'tt-6-3',
        type: 'mc',
        q: '¿Cuál es la gran ventaja del montaje entre puntas?',
        options: ['Es el más rápido', 'Se puede dar vuelta la pieza sin perder la concentricidad', 'No necesita contrapunta', 'Permite piezas cuadradas'],
        answer: 1,
        explain: 'Los agujeros de centro no se pierden: basta cambiar la brida de extremo.',
      },
      {
        id: 'tt-6-4',
        type: 'mc',
        q: '¿Cómo se ajustan los patines de una luneta?',
        options: ['Lo más apretados posible', 'Con la presión justa para sostener la pieza sin impedirle girar', 'Flojos, sin tocar la pieza', 'No se ajustan'],
        answer: 1,
        explain: 'Sostener sin frenar el giro.',
      },
      {
        id: 'tt-6-5',
        type: 'mc',
        q: 'En el montaje entre plato y contrapunta, el carro al ir hacia la derecha…',
        options: ['Debe empujar la contrapunta para fijarla', 'No debe empujar la contrapunta', 'Debe estar desconectado', 'Lleva la luneta'],
        answer: 1,
        explain: 'Nunca debe empujarla: hay que verlo antes de mecanizar.',
      },
      {
        id: 'tt-6-6',
        type: 'mc',
        q: 'Terminaste de ajustar la pieza en el plato. ¿Qué hacés con la llave?',
        options: ['La dejo puesta para el próximo ajuste', 'La saco: no se deja colocada en el plato', 'La apoyo sobre la bancada', 'La dejo sobre el cabezal'],
        answer: 1,
        explain: 'Con el plato girando, la llave sale despedida. Va a su lugar (tablita).',
      },
    ],
  },
  {
    id: 'torno-herramientas',
    title: 'Herramientas de corte',
    icon: '🔪',
    summary: 'Acero rápido, ángulos α, β, γ, insertos de metal duro y portainsertos.',
    content: (
      <>
        <p>
          Para sacar el material sobrante se usan útiles o herramientas de corte. Las más usadas en la industria son las <strong>herramientas integrales</strong> y los{' '}
          <strong>portainsertos</strong>.
        </p>
        <h4>Herramientas integrales de acero súper rápido</h4>
        <p>
          Son de acero aleado al cobalto, con <strong>entre 4 % y 18 % de Co</strong>: eso les da cierta dureza para trabajar materiales ferrosos y una importante
          resistencia a la temperatura. Su punto débil: cuando pierden el filo hay que <strong>reafilarlas</strong>, se pierde el perfil original y se gastan
          horas-hombre y horas-máquina. Hoy están siendo reemplazadas por los insertos.
        </p>
        <p>
          Partes: <strong>vástago</strong> (cuerpo), <strong>cabeza</strong>, <strong>cortante principal</strong> y <strong>secundario</strong>,{' '}
          <strong>flanco principal</strong> y <strong>secundario</strong>, y <strong>base</strong>.
        </p>
        <h4>Los ángulos de la herramienta</h4>
        <ul>
          <li>
            <strong style={{ color: RED }}>α · incidencia</strong>: entre el flanco y la superficie ya cortada; evita que la herramienta roce la pieza.
          </li>
          <li>
            <strong style={{ color: GREEN }}>β · filo</strong>: el ángulo de la «cuña» que corta.
          </li>
          <li>
            <strong style={{ color: BLUE }}>γ · ataque</strong>: inclinación de la cara por donde sale la viruta.
          </li>
        </ul>
        <Formula>α + β + γ = 90°</Formula>
        <ToolAngles />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Material (complemento, acero rápido)</th>
                <th>α incidencia</th>
                <th>γ ataque</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Acero común</td>
                <td>6°–8°</td>
                <td>10°–14°</td>
              </tr>
              <tr>
                <td>Fundición gris / bronce</td>
                <td>6°–8°</td>
                <td>0°–6°</td>
              </tr>
              <tr>
                <td>Aluminio</td>
                <td>8°–12°</td>
                <td>20°–30°</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h4>Insertos (plaquitas)</h4>
        <p>
          Están hechos principalmente de <strong>carburo de tungsteno y cobalto</strong> (metal duro), con agregados de carburo de titanio, tántalo, niobio, cromo,
          molibdeno y vanadio; algunas calidades incluyen carbonitruro de titanio y/o níquel. La forma, el tamaño y la calidad dependen del material de la pieza y del
          mecanizado. En la cara superior tienen surcos llamados <strong>rompevirutas</strong>, para que no se formen virutas largas.
        </p>
        <h4>Portainsertos</h4>
        <p>
          El tamaño y la forma del inserto más el ángulo de posición definen el portainsertos. Tiene que dejar fluir la viruta, ser versátil y necesitar poco
          mantenimiento. Se elige <strong>el mayor tamaño posible</strong>: base más rígida para el filo y menos voladizo (que provocaría vibraciones).
        </p>
      </>
    ),
    activities: [
      {
        id: 'tt-7-1',
        type: 'mc',
        q: '¿Qué porcentaje de cobalto tienen los aceros súper rápidos de las herramientas integrales?',
        options: ['Menos de 1 %', 'Entre 4 % y 18 %', 'Entre 30 % y 50 %', '100 %'],
        answer: 1,
        explain: 'Entre 4 % y 18 % de Co.',
      },
      {
        id: 'tt-7-2',
        type: 'mc',
        q: '¿Cuál es el punto débil de la herramienta integral de acero rápido?',
        options: ['No resiste temperatura', 'Al perder el filo hay que reafilarla: cambia su perfil y se pierde tiempo', 'No corta acero', 'Es muy cara'],
        answer: 1,
        explain: 'El reafilado le cambia el perfil y consume horas-hombre y horas-máquina.',
      },
      {
        id: 'tt-7-3',
        type: 'num',
        q: 'Una herramienta tiene α = 8° y γ = 12°. ¿Cuánto vale el ángulo de filo β?',
        answer: 70,
        tolerance: 0,
        unit: '°',
        explain: 'β = 90° − 8° − 12° = 70°.',
      },
      {
        id: 'tt-7-4',
        type: 'mc',
        q: 'Los insertos están hechos principalmente de…',
        options: ['Acero al carbono', 'Carburo de tungsteno y cobalto', 'Bronce', 'Cerámica de vidrio'],
        answer: 1,
        explain: 'Metal duro: carburo de tungsteno con cobalto (y otros carburos).',
      },
      {
        id: 'tt-7-5',
        type: 'mc',
        q: '¿Para qué sirven los rompevirutas del inserto?',
        options: ['Para refrigerar', 'Para evitar la formación de virutas largas', 'Para fijar el inserto', 'Para marcar el tamaño'],
        answer: 1,
        explain: 'Cortan la viruta en trozos cortos.',
      },
      {
        id: 'tt-7-6',
        type: 'mc',
        q: '¿Qué tamaño de portainsertos conviene elegir?',
        options: ['El más chico posible', 'El mayor posible, para más rigidez y menos voladizo', 'Da igual', 'El más largo, para llegar lejos'],
        answer: 1,
        explain: 'Más grande = base más rígida y menos vibraciones.',
      },
      {
        id: 'tt-7-7',
        type: 'mc',
        q: 'El ángulo de incidencia α sirve para…',
        options: ['Que salga la viruta', 'Que el flanco no roce la superficie ya cortada', 'Que el filo sea más fuerte', 'Que la herramienta quede centrada'],
        answer: 1,
        explain: 'Es el «despeje» entre el flanco y la pieza.',
      },
    ],
  },
  {
    id: 'torno-factores',
    title: 'Factores de corte, viruta y refrigerantes',
    icon: '📏',
    summary: 'Vc, rpm, avance, profundidad de pasada. Calculadora de rpm. Tipos de viruta y refrigeración.',
    content: (
      <>
        <p>Los datos de corte dependen de la combinación material de la pieza – material de la herramienta.</p>
        <ul>
          <li>
            <strong>Velocidad de corte Vc</strong> [m/min]: velocidad tangencial, la que tiene el material (viruta) sobre la superficie de la herramienta. En los tornos
            CNC se mantiene constante, por eso el husillo acelera a medida que la herramienta se acerca al centro.
          </li>
          <li>
            <strong>Avance fn</strong> [mm/revolución]: lo que avanza la herramienta por cada vuelta de la pieza (la velocidad del carro). Es clave para formar bien
            la viruta y para la terminación superficial.
          </li>
          <li>
            <strong>Profundidad de pasada ap</strong> [mm]: la semidiferencia entre el diámetro sin cortar y el cortado.
          </li>
          <li>
            <strong>Ángulo de posición κr</strong>: el del filo respecto a la superficie de la pieza; incide en la formación y dirección de la viruta. Va de{' '}
            <strong>45° a 95°</strong> según la operación.
          </li>
        </ul>
        <Formula>
          Vc = π × D × n / 1000 &nbsp;&nbsp;·&nbsp;&nbsp; n = Vc × 1000 / (π × D) &nbsp;&nbsp;·&nbsp;&nbsp; ap = (D sin mecanizar − D mecanizado) / 2
        </Formula>
        <p className="hint">D en mm, n en rpm, Vc en m/min. Los datos se encuentran en la caja de las plaquitas o en manuales.</p>
        <RpmCalc />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vc orientativa (complemento)</th>
                <th>Acero rápido</th>
                <th>Metal duro</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(VC_TABLE) as Mat[]).map((m) => (
                <tr key={m}>
                  <td>{VC_TABLE[m].name}</td>
                  <td>
                    {VC_TABLE[m].hss[0]}–{VC_TABLE[m].hss[1]} m/min
                  </td>
                  <td>
                    {VC_TABLE[m].md[0]}–{VC_TABLE[m].md[1]} m/min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="warn-box">Una mala elección de los factores de corte baja mucho la producción o perjudica la herramienta: se acorta su vida útil o se rompe.</p>
        <h4>Viruta</h4>
        <p>
          La herramienta actúa como una <strong>cuña</strong> que comprime el material sobre su cara superior y lo desprende. Un material <strong>dúctil</strong>{' '}
          (acero) forma viruta larga; uno <strong>frágil</strong> (fundición) se desprende en partículas.
        </p>
        <ul>
          <li>
            <strong>Viruta libre</strong>: un solo filo de corte; sale una viruta libremente sobre la herramienta.
          </li>
          <li>
            <strong>Viruta vinculada</strong>: varios filos a la vez (roscado, tronzado, ranurado); las virutas se estorban entre sí y hacen mucha presión sobre la
            herramienta.
          </li>
        </ul>
        <ChipTypes />
        <ul>
          <li>
            <strong>A · arrancada</strong>: trozos cortos e iguales → material frágil.
          </li>
          <li>
            <strong>B · plástica</strong>: larga y espiralada, típica de aceros dúctiles. Un inserto con buen rompevirutas la reduce.
          </li>
          <li>
            <strong>C · desprendida</strong>: trozos más o menos largos y quebrados → algo está mal: herramienta inadecuada, velocidad de corte inconveniente o material y
            herramienta incompatibles.
          </li>
        </ul>
        <div className="warn-box">
          <strong>Observaciones:</strong>
          <ul>
            <li>Es peligroso trabajar sin protección ocular. Con fundición, anteojos con cierres laterales.</li>
            <li>Nunca toques la viruta con las manos (caliente y cortante): usá ganchos. Para manipular material cerca de virutas, guantes.</li>
            <li>Evitá las virutas largas: se enganchan en la ropa, la máquina, etc.</li>
            <li>
              En materiales blandos se forma un <strong>filo falso</strong> (material pegado al filo): desprendelo con un material más duro y evitalo refrigerando bien.
            </li>
          </ul>
        </div>
        <h4>Refrigerantes</h4>
        <p>
          La refrigeración absorbe el calor del arranque de viruta, evita el aumento excesivo de temperatura y facilita que la viruta resbale sobre la herramienta. Así
          dura más la herramienta y mejora la terminación. Los aceites de corte deben ser <strong>lubricantes, refrigerantes, antioxidantes y antisépticos</strong>.
        </p>
        <ul>
          <li>Se usan puros o mezclados con agua: emulsión con <strong>más agua → más refrigerante</strong> (mucho calor); <strong>más aceite → más lubricante</strong> (para que se desprenda la viruta).</li>
          <li>
            Los insertos con recubrimientos permiten mecanizar <strong>«en seco»</strong>, evitando los problemas de los fluidos (alergias, problemas de piel, oxidación y
            desgaste de las máquinas).
          </li>
          <li>Pero donde el refrigerante mejora el corte no se suspende: perforados, algunos aceros inoxidables y aceros muy blandos.</li>
        </ul>
      </>
    ),
    activities: [
      {
        id: 'tt-8-1',
        type: 'num',
        q: 'Hay que cilindrar una barra de ø 50 mm con Vc = 30 m/min. ¿Cuántas rpm da el cálculo?',
        answer: 190.99,
        tolerance: 0.01,
        unit: 'rpm',
        explain: 'n = 30 × 1000 / (π × 50) ≈ 191 rpm.',
      },
      {
        id: 'tt-8-2',
        type: 'num',
        q: 'Pasás de ø 60 mm a ø 55 mm. ¿Cuál fue la profundidad de pasada ap?',
        answer: 2.5,
        tolerance: 0,
        unit: 'mm',
        explain: 'ap = (60 − 55) / 2 = 2,5 mm.',
      },
      {
        id: 'tt-8-3',
        type: 'num',
        q: 'Una pieza de ø 30 mm gira a 600 rpm. ¿Qué velocidad de corte tiene?',
        answer: 56.55,
        tolerance: 0.01,
        unit: 'm/min',
        explain: 'Vc = π × 30 × 600 / 1000 ≈ 56,5 m/min.',
      },
      {
        id: 'tt-8-4',
        type: 'mc',
        q: 'Con la misma Vc, si el diámetro de la pieza aumenta, las rpm…',
        options: ['Aumentan', 'Disminuyen', 'No cambian'],
        answer: 1,
        explain: 'n = 1000 Vc / (π D): D más grande → menos rpm.',
      },
      {
        id: 'tt-8-5',
        type: 'mc',
        q: 'La viruta larga y espiralada, típica de los aceros dúctiles, se llama…',
        options: ['Arrancada', 'Plástica', 'Desprendida', 'Vinculada'],
        answer: 1,
        explain: 'Viruta plástica (B).',
      },
      {
        id: 'tt-8-6',
        type: 'mc',
        q: 'En el roscado, el tronzado y el ranurado trabajan varios filos a la vez. La viruta es…',
        options: ['Libre', 'Vinculada', 'Arrancada', 'No hay viruta'],
        answer: 1,
        explain: 'Viruta vinculada: las virutas se estorban y aumenta la presión sobre la herramienta.',
      },
      {
        id: 'tt-8-7',
        type: 'mc',
        q: 'Se genera mucho calor en el corte. ¿Cómo preparás la emulsión?',
        options: ['Con más aceite', 'Con más agua (más refrigerante)', 'Aceite puro siempre', 'Sin refrigerante'],
        answer: 1,
        explain: 'Más agua → más refrigerante; más aceite → más lubricante.',
      },
    ],
  },
  {
    id: 'torno-mecanizados',
    title: 'Tipos de mecanizado',
    icon: '🛠️',
    summary: 'Frenteado, cilindrado, perforado, conos, ranurado, tronzado, moleteado y torneado interior. Calculadora de conos.',
    content: (
      <>
        <p>
          En el torno siempre se obtienen volúmenes de revolución. Antes que nada, la <strong>herramienta tiene que estar perfectamente centrada</strong> en altura (en
          algunas operaciones se admite levemente por arriba del centro). Para centrarla se usa como referencia un punto en la contrapunta, un calibre con la altura del
          eje sobre la bancada, o se hace tangencia en el frente del material girando y se mira si la punta queda a la altura del centro.
        </p>
        <OpsGallery />
        <h4>Desbaste cónico</h4>
        <div className="tn-two">
          <div>
            <h5>Con el charriot</h5>
            <p>
              Se aflojan las tuercas de adelante y de atrás de la base del charriot y se gira el ángulo necesario sobre el carro transversal. Se avanza con el charriot en
              lugar del longitudinal: <strong>sólo a mano</strong>, con terminación algo imperfecta. Sirve para conos cortos (la carrera del charriot es limitada).
            </p>
            <Formula>tan α = (D − d) / (2 × Lc)</Formula>
          </div>
          <div>
            <h5>Desplazando la contrapunta</h5>
            <p>
              Para conos <strong>largos y poco pronunciados</strong>. Con los tornillos de registro laterales se corre el cuerpo de la contrapunta (regla milimetrada
              atrás). El eje de la pieza queda desalineado del eje del torno y, como el carro avanza paralelo al eje, saca más material de un lado.{' '}
              <strong>Sólo con montaje entre puntas.</strong>
            </p>
            <Formula>Desplazamiento = (ø Mayor − ø Menor) × Largo Total / (Largo Cono × 2)</Formula>
          </div>
        </div>
        <p className="tip">
          Ejemplo del apunte: ø mayor 100 mm, ø menor 80 mm, largo del cono 200 mm, distancia entre puntas 300 mm → (100 − 80) × 300 / (200 × 2) = <strong>15 mm</strong>.
        </p>
        <ConeCalc />
      </>
    ),
    activities: [
      {
        id: 'tt-9-1',
        type: 'num',
        q: 'ø mayor 100 mm, ø menor 80 mm, largo del cono 200 mm, distancia entre puntas 300 mm. ¿Cuánto se desplaza la contrapunta?',
        answer: 15,
        tolerance: 0.01,
        unit: 'mm',
        explain: '(100 − 80) × 300 / (200 × 2) = 6000 / 400 = 15 mm.',
      },
      {
        id: 'tt-9-2',
        type: 'mc',
        q: 'El cono por desplazamiento de la contrapunta sólo se puede hacer con montaje…',
        options: ['Al aire', 'Entre puntas', 'Con pinza', 'En plato de 4 mordazas'],
        answer: 1,
        explain: 'La pieza tiene que estar apoyada en los dos puntos.',
      },
      {
        id: 'tt-9-3',
        type: 'mc',
        q: '¿Cuál es el inconveniente de hacer conos con el charriot?',
        options: ['No se puede inclinar', 'El avance sólo es manual y la terminación queda algo imperfecta', 'Sólo hace conos largos', 'Necesita montaje entre puntas'],
        answer: 1,
        explain: 'El charriot no tiene avance automático.',
      },
      {
        id: 'tt-9-4',
        type: 'num',
        q: 'Cono con el charriot: D = 40 mm, d = 30 mm, Lc = 50 mm. ¿Cuántos grados se gira el charriot? (tan α = (D − d) / 2Lc)',
        answer: 5.71,
        tolerance: 0.01,
        unit: '°',
        explain: 'tan α = 10 / 100 = 0,1 → α ≈ 5,71° (5°43′).',
      },
      {
        id: 'tt-9-5',
        type: 'mc',
        q: '¿Cuál es la única operación del torno que no saca viruta?',
        options: ['Tronzado', 'Moleteado', 'Frenteado', 'Perforado'],
        answer: 1,
        explain: 'La moleta comprime y graba la superficie.',
      },
      {
        id: 'tt-9-6',
        type: 'mc',
        q: 'En el cilindrado se recomienda que el filo forme con la superficie un ángulo de…',
        options: ['45°', 'Levemente mayor a 90° (92°–93°)', 'Exactamente 60°', '120°'],
        answer: 1,
        explain: 'Se logra poniendo el portainsertos perpendicular al eje.',
      },
      {
        id: 'tt-9-7',
        type: 'mc',
        q: 'Para perforar, la mecha va en un mandril clavado en…',
        options: ['La torre portaherramientas', 'El manguito de la contrapunta, que se bloquea en la bancada', 'El plato', 'El charriot'],
        answer: 1,
        explain: 'Se avanza con el volante de la contrapunta, con la contrapunta bloqueada.',
      },
    ],
  },
  {
    id: 'torno-roscado',
    title: 'Roscado en el torno',
    icon: '🌀',
    summary: 'Partes de la rosca, métrica y Whitworth, inclinación del charriot, procedimiento y profundidad. Calculadora de rosca.',
    content: (
      <>
        <p>
          Con una herramienta de perfil especial se talla un filete de rosca: la pieza gira a velocidad moderada y la herramienta avanza paralela al eje labrando una
          hélice. <strong>El avance es igual al paso de la rosca: fn = p.</strong>
        </p>
        <h4>Partes de la rosca</h4>
        <ul>
          <li>
            <strong>Filete</strong> (o hilo): la forma triangular característica.
          </li>
          <li>
            <strong>Paso</strong>: distancia entre dos filetes consecutivos.
          </li>
          <li>
            <strong>Diámetro exterior</strong> y <strong>diámetro interior</strong> (de fondo o de agujero).
          </li>
          <li>
            <strong>Profundidad</strong>: h = (ø exterior − ø interior) / 2.
          </li>
          <li>
            <strong>Ángulo del filete α</strong>: <strong>60° en la rosca métrica</strong> y <strong>55° en la Whitworth</strong>.
          </li>
        </ul>
        <h4>¿Penetración recta o en flanco?</h4>
        <p>
          Si la rosca es de poca profundidad, la herramienta puede penetrar perpendicular al eje (con el transversal). Si el filete es profundo, conviene penetrar con el{' '}
          <strong>charriot inclinado</strong> a la mitad del ángulo del filete (más uno o dos grados): así la punta, de perfil delicado, no sufre grandes esfuerzos.
        </p>
        <Formula>β = 90° − α/2 &nbsp;&nbsp;→&nbsp;&nbsp; métrica: β = 60° · Whitworth: β = 62°30′</Formula>
        <h4>Procedimiento</h4>
        <ol className="tn-steps">
          <li>Colocar la herramienta perfectamente centrada con el eje de la pieza.</li>
          <li>Si se inclina el charriot, calcular β = 90° − α/2 respecto al eje del torno.</li>
          <li>Asegurar que la herramienta quede perpendicular a la pieza: apoyándola en el frente del plato, con una escuadra o con una plantilla de ángulos.</li>
          <li>
            Poner pocas revoluciones (según la velocidad de corte de la herramienta) y acomodar las palancas de la caja Norton según los hilos por pulgada (Whitworth) o el
            paso (métrica), sacados de una tabla de roscas.
          </li>
          <li>Hacer tangencia en la pieza y poner en «cero» los nonios del transversal y del charriot.</li>
          <li>Cerrar la palanca de la tuerca partida (en el delantal) sobre el tornillo patrón.</li>
          <li>Encender: la herramienta labra la hélice. Al final, detener la máquina sin levantar la palanca del tornillo patrón.</li>
          <li>Alejar la herramienta con el transversal y poner el torno en contramarcha hasta el principio de la rosca.</li>
          <li>Ahí detener el torno y volver el transversal a la posición cero del nonio.</li>
          <li>Profundizar con el charriot «en flanco» según lo recomendado para la herramienta (en general, una o dos décimas).</li>
          <li>Volver al paso 7 y seguir hasta alcanzar la profundidad de rosca necesaria.</li>
        </ol>
        <p>
          La profundidad se verifica con un <strong>peine de roscas</strong> o calculándola. Como el charriot avanza inclinado, lo que hay que avanzar con él (x) es un poco
          más que la profundidad h:
        </p>
        <Formula>h = (ø ext − ø int) / 2 &nbsp;&nbsp;·&nbsp;&nbsp; cos(α/2) = h / x &nbsp;→&nbsp; x = h / cos(α/2)</Formula>
        <p className="tip">
          Ejemplo del apunte, rosca exterior W 3/8": ø exterior 9,525 mm, ø interior 8 mm (de tabla), α/2 = 27°30′ → h = (9,525 − 8) / 2 = <strong>0,7625 mm</strong> y x
          = 0,7625 / cos 27°30′ = <strong>0,86 mm</strong>.
        </p>
        <ThreadCalc />
        <p>
          Otra manera de roscar en el torno: con <strong>terraja</strong> o <strong>macho de roscar</strong>, montados entre la pieza y la contrapunta, con el plato girando a
          muy bajas revoluciones.
        </p>
      </>
    ),
    activities: [
      {
        id: 'tt-10-1',
        type: 'num',
        q: 'Rosca métrica (α = 60°). ¿Cuántos grados se inclina el charriot (β = 90° − α/2)?',
        answer: 60,
        tolerance: 0,
        unit: '°',
        explain: 'β = 90° − 30° = 60°.',
      },
      {
        id: 'tt-10-2',
        type: 'num',
        q: 'Rosca Whitworth (α = 55°). ¿Cuánto vale β en grados decimales?',
        answer: 62.5,
        tolerance: 0,
        unit: '°',
        explain: 'β = 90° − 27,5° = 62,5° = 62°30′.',
      },
      {
        id: 'tt-10-3',
        type: 'num',
        q: 'W 3/8": ø exterior 9,525 mm y ø interior 8 mm. ¿Cuál es la profundidad h?',
        answer: 0.7625,
        tolerance: 0.005,
        unit: 'mm',
        explain: 'h = (9,525 − 8) / 2 = 0,7625 mm.',
      },
      {
        id: 'tt-10-4',
        type: 'num',
        q: 'Para esa rosca W 3/8" (h = 0,7625 mm, α/2 = 27°30′), ¿cuánto hay que avanzar con el charriot en flanco (x)?',
        answer: 0.86,
        tolerance: 0.01,
        unit: 'mm',
        explain: 'x = 0,7625 / cos 27°30′ = 0,7625 / 0,887 ≈ 0,86 mm.',
      },
      {
        id: 'tt-10-5',
        type: 'mc',
        q: 'En el roscado, el avance por vuelta (fn) es igual…',
        options: ['A la profundidad de rosca', 'Al paso de la rosca', 'Al diámetro', 'A 0,1 mm'],
        answer: 1,
        explain: 'Por cada vuelta de la pieza, la herramienta avanza un paso.',
      },
      {
        id: 'tt-10-6',
        type: 'mc',
        q: 'Terminaste una pasada de rosca. ¿Qué hacés?',
        options: [
          'Levanto la palanca del tornillo patrón y vuelvo el carro a mano',
          'Detengo sin levantar la palanca, alejo la herramienta con el transversal y voy en contramarcha al principio',
          'Sigo en marcha y doy otra pasada hacia atrás',
          'Saco la pieza',
        ],
        answer: 1,
        explain: 'Pasos 7 y 8: sin soltar la tuerca partida para no perder la sincronización.',
      },
      {
        id: 'tt-10-7',
        type: 'mc',
        q: '¿Cuánto se profundiza con el charriot en cada pasada, en general?',
        options: ['1 a 2 mm', 'Una o dos décimas de milímetro', 'Todo de una vez', '5 mm'],
        answer: 1,
        explain: 'En el orden de 0,1 a 0,2 mm, según la herramienta.',
      },
    ],
  },
  {
    id: 'torno-seguridad',
    title: 'Seguridad, orden, limpieza y lubricación',
    icon: '🦺',
    summary: 'Las normas del taller para trabajar seguro y cuidar la máquina.',
    content: (
      <>
        <p>
          El torno, de por sí, no es una máquina muy peligrosa; pero como cualquier máquina puede producir accidentes, a veces graves, al operario distraído que descuida
          las normas.
        </p>
        <SafetyChecklist />
        <h4>Orden</h4>
        <ol className="tn-steps">
          <li>Ubicar los materiales de trabajo en un sitio determinado, para tenerlos a mano.</li>
          <li>Al terminar de usar una herramienta, colocarla siempre en el mismo lugar.</li>
          <li>
            No poner piezas ni herramientas sobre la bancada (desgaste y pérdida de precisión): tener una <strong>tablita</strong> sobre el torno para llaves, calibres y
            herramientas.
          </li>
          <li>Cada máquina con su armario con casilleros: herramientas, calibres, piezas, dibujos y equipos especiales.</li>
          <li>Mantener limpios los engranajes de roscar y no mezclarlos con los de otras máquinas, aunque sean de la misma medida.</li>
        </ol>
        <h4>Limpieza</h4>
        <ol className="tn-steps">
          <li>Al terminar cualquier operación, antes de dejar el trabajo.</li>
          <li>Una vez por semana, limpieza especial de todos los órganos, también los internos.</li>
          <li>Sacar virutas y polvo con cepillo o trapo, y limpiar las guías de los carros con querosén y un trapo limpio.</li>
        </ol>
        <h4>Lubricación</h4>
        <p>
          Salvo otra indicación del fabricante, todos los órganos en movimiento se lubrican <strong>al menos una vez al día</strong>, en general después de la limpieza;
          los engranajes, con aceite. Hay que verificar que los tubitos que llevan el aceite no estén tapados. Con criterio: poco acelera el desgaste; demasiado es un
          desperdicio.
        </p>
        <h4>Advertencias</h4>
        <ul>
          <li>Antes de arrancar, probar siempre a mano girando el eje, para ver que no haya estorbos.</li>
          <li>Para golpear un órgano de la máquina: martillo de cobre o mazo de madera; nunca martillos de acero ni llaves.</li>
          <li>No poner en marcha el torno con la llave del plato colocada.</li>
        </ul>
        <h4>Precauciones para evitar accidentes</h4>
        <ol className="tn-steps">
          <li>Ropa ajustada al cuerpo, nunca suelta. Sin pulseras, relojes, anillos, collares ni nada que cuelgue. Pelo largo atado (colita).</li>
          <li>Posición correcta: no apoyar el torso ni los codos sobre el torno.</li>
          <li>Piso limpio y sin estorbos alrededor, para no caer sobre el torno en movimiento.</li>
          <li>Para quitar correas, usar el pasacorreas o una varilla, tubo o regla de madera.</li>
          <li>Antes de limpiar, lubricar o desmontar una pieza interna: parar el torno, asegurarlo para que no arranque y colocar la parada de emergencia.</li>
          <li>No tocar descuidadamente órganos o piezas en movimiento.</li>
          <li>Con metales quebradizos (fundición, bronce) y al afilar en la amoladora: anteojos de seguridad.</li>
        </ol>
        <p className="tip">
          Complemento: los guantes sirven para manipular material y virutas con la máquina detenida, pero <strong>nunca</strong> se usan cerca de la pieza girando: un
          guante enganchado arrastra la mano.
        </p>
      </>
    ),
    activities: [
      {
        id: 'tt-11-1',
        type: 'mc',
        q: '¿Cómo tiene que estar vestido el tornero?',
        options: ['Con ropa suelta y cómoda', 'Con ropa ajustada, sin pulseras, relojes, anillos ni collares, y el pelo atado', 'Con bufanda en invierno', 'Da igual'],
        answer: 1,
        explain: 'Todo lo que cuelga puede engancharse en las partes que giran.',
      },
      {
        id: 'tt-11-2',
        type: 'mc',
        q: 'Necesitás golpear una pieza de la máquina. ¿Con qué?',
        options: ['Con la llave del plato', 'Con un martillo de acero', 'Con un martillo de cobre o un mazo de madera', 'Con una barra'],
        answer: 2,
        explain: 'Los martillos de acero y las llaves arruinan la máquina.',
      },
      {
        id: 'tt-11-3',
        type: 'mc',
        q: '¿Cómo sacás la viruta enredada en la pieza?',
        options: ['Con la mano, rápido', 'Con un gancho, con la máquina detenida', 'Con aire soplando con la boca', 'Con la mano y guantes, con la máquina girando'],
        answer: 1,
        explain: 'La viruta está caliente y corta: gancho y máquina parada.',
      },
      {
        id: 'tt-11-4',
        type: 'mc',
        q: '¿Cada cuánto se lubrican los órganos en movimiento (salvo otra indicación)?',
        options: ['Una vez por mes', 'Al menos una vez al día', 'Una vez por año', 'Nunca, vienen lubricados'],
        answer: 1,
        explain: 'Al menos una vez al día, en general después de la limpieza.',
      },
      {
        id: 'tt-11-5',
        type: 'mc',
        q: '¿Cada cuánto se hace la limpieza especial de todos los órganos, incluso los internos?',
        options: ['Todos los días', 'Una vez por semana', 'Una vez por mes', 'Cuando se rompe'],
        answer: 1,
        explain: 'Semanalmente; además, una limpieza al terminar cada trabajo.',
      },
      {
        id: 'tt-11-6',
        type: 'mc',
        q: '¿Dónde dejás los calibres y las llaves mientras trabajás?',
        options: ['Sobre la bancada', 'Sobre el cabezal', 'En una tablita sobre el torno', 'En el bolsillo'],
        answer: 2,
        explain: 'Sobre la bancada se desgasta y pierde precisión; sobre el cabezal se caen por la vibración.',
      },
      {
        id: 'tt-11-7',
        type: 'mc',
        q: 'Antes de limpiar o lubricar la máquina…',
        options: ['Bajo la velocidad', 'Paro el torno, lo aseguro para que no arranque y coloco la parada de emergencia', 'Le aviso a un compañero', 'Me pongo guantes'],
        answer: 1,
        explain: 'Precaución 5 del apunte.',
      },
    ],
  },
]

export const getTornoTopic = (id: string) => TORNO_TOPICS.find((t) => t.id === id)

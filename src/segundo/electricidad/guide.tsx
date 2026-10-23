// Guía de Electricidad, 2do año: «Resolución de circuitos eléctricos» (6 circuitos) y repaso del apunte.
import type { Activity } from '../../catalog/types'
import type { GuideSection } from '../../lib/subject'
import { CircuitoSvg, GUIA_CIRCUITOS, resolver, type CircuitoGuia } from './Esquemas'

const f = (n: number, d = 2) => Number(n.toFixed(d)).toString().replace('.', ',')

function actividades(c: CircuitoGuia): Activity[] {
  const s = resolver(c)
  const id = (x: string) => `e2g-c${c.n}-${x}`
  const regla =
    c.tipo === 'serie'
      ? `RT = ${c.r.join(' + ')}`
      : c.tipo === 'paralelo'
        ? `1/RT = ${c.r.map((r) => `1/${r}`).join(' + ')}`
        : (() => {
            const so = c.sola ?? 0
            const par = c.r.map((_, k) => k).filter((k) => k !== so)
            return `RT = R${so + 1} + (R${par[0] + 1} ∥ R${par[1] + 1}) = ${c.r[so]} + ${f(1 / (1 / c.r[par[0]] + 1 / c.r[par[1]]))}`
          })()
  const out: Activity[] = [
    { id: id('rt'), type: 'num', q: `Circuito ${c.n}: resistencia total RT (Ω)`, answer: s.rt, tolerance: 0.02, unit: 'Ω', explain: `${regla} = ${f(s.rt)} Ω.` },
    { id: id('it'), type: 'num', q: `Circuito ${c.n}: corriente total IT (A)`, answer: s.it, tolerance: 0.02, unit: 'A', explain: `IT = U / RT = ${c.u} / ${f(s.rt)} = ${f(s.it, 3)} A.` },
  ]
  c.r.forEach((r, k) => {
    out.push({
      id: id(`i${k + 1}`),
      type: 'num',
      q: `Circuito ${c.n}: corriente I${k + 1} en R${k + 1} = ${r} Ω (A)`,
      answer: s.i[k],
      tolerance: 0.02,
      unit: 'A',
      explain: c.tipo === 'serie' || (c.tipo === 'mixto' && k === c.sola) ? `En serie es la misma corriente total: ${f(s.it, 3)} A.` : `I${k + 1} = U${k + 1} / R${k + 1} = ${f(s.v[k], 1)} / ${r} = ${f(s.i[k], 3)} A.`,
    })
  })
  c.r.forEach((r, k) => {
    out.push({
      id: id(`u${k + 1}`),
      type: 'num',
      q: `Circuito ${c.n}: caída de tensión U${k + 1} en R${k + 1} (V)`,
      answer: s.v[k],
      tolerance: 0.02,
      unit: 'V',
      explain: c.tipo === 'paralelo' ? `En paralelo todas tienen la tensión de la fuente: ${c.u} V.` : `U${k + 1} = I${k + 1} × R${k + 1} = ${f(s.i[k], 3)} × ${r} = ${f(s.v[k], 1)} V.`,
    })
  })
  return out
}

const TIPO = { serie: 'en serie', paralelo: 'en paralelo', mixto: 'mixto' }

export const ELECTRICIDAD2_GUIDE: GuideSection[] = [
  ...GUIA_CIRCUITOS.map((c) => ({
    id: `e2g-c${c.n}`,
    title: `Circuito ${c.n} · ${TIPO[c.tipo]} (${c.u} V)`,
    intro: (
      <>
        <p>Calculá la resistencia total, la corriente total, la corriente en cada resistencia y sus caídas de tensión. Se aceptan errores de redondeo de hasta 2 %.</p>
        <div className="e2-guide-fig">
          <CircuitoSvg c={c} />
        </div>
      </>
    ),
    activities: actividades(c),
  })),
  {
    id: 'e2g-teoria',
    title: 'Repaso del apunte',
    intro: 'Preguntas sobre protecciones, esquemas, seguridad y medición.',
    activities: [
      { id: 'e2g-t1', type: 'mc', q: 'Enunciá la ley de Ohm.', options: ['La corriente es directamente proporcional a la tensión e inversamente proporcional a la resistencia', 'La tensión es inversamente proporcional a la corriente', 'La resistencia es proporcional a la corriente', 'La corriente que entra a un nodo es igual a la que sale'], answer: 0, explain: 'La última opción es la ley de Kirchhoff.' },
      { id: 'e2g-t2', type: 'mc', q: '¿Qué diferencia hay entre f.e.m. y caída de tensión?', options: ['La f.e.m. la genera la fuente; la caída se pierde en los receptores', 'Son lo mismo', 'La f.e.m. se pierde en los cables', 'La caída la genera la batería'], answer: 0, explain: 'Las dos se miden en volt.' },
      { id: 'e2g-t3', type: 'mc', q: '¿Qué protege el termomagnético?', options: ['Al circuito, contra sobrecargas y cortocircuitos', 'A las personas contra contactos', 'Sólo contra rayos', 'Nada'], answer: 0, explain: 'A las personas las protege el diferencial.' },
      { id: 'e2g-t4', type: 'mc', q: '¿En qué se basa el funcionamiento del diferencial?', options: ['En la ley de Kirchhoff', 'En la ley de Ohm', 'En el calentamiento de un bimetal', 'En la fusión de un filamento'], answer: 0, explain: 'Compara la corriente que entra con la que sale.' },
      { id: 'e2g-t5', type: 'mc', q: '¿Cuál es la tercera regla de oro?', options: ['Verificar la ausencia de tensión', 'Desconexión', 'Bloqueo y señalización', 'Señalizar la zona de trabajo'], answer: 0, explain: '1 desconectar, 2 bloquear, 3 verificar, 4 tierra y cortocircuito, 5 señalizar.' },
      { id: 'e2g-t6', type: 'mc', q: 'Un circuito de iluminación consume 6 A y el cable soporta 15 A. ¿Cuál termomagnético cumple IB ≤ In ≤ IZ?', options: ['10 A', '4 A', '20 A', '32 A'], answer: 0, explain: '6 ≤ 10 ≤ 15. Con 4 A cortaría siempre; con 20 o 32 A el cable se recalentaría antes de que corte.' },
      { id: 'e2g-t7', type: 'mc', q: 'Para dibujar la instalación de una casa entera conviene el esquema…', options: ['Unifilar', 'Multifilar', 'Funcional', 'Ninguno'], answer: 0, explain: 'Es el más simple para planos grandes.' },
      { id: 'e2g-t8', type: 'mc', q: '¿Cómo se mide la corriente con el multímetro?', options: ['En serie con el elemento', 'En paralelo', 'Sin tensión', 'Con la punta en el neutro'], answer: 0, explain: 'Hay que abrir el circuito.' },
      { id: 'e2g-t9', type: 'num', q: 'Dos lámparas iguales de 806 Ω en paralelo a 220 V. ¿Corriente total? (A)', answer: 0.546, tolerance: 0.02, unit: 'A', explain: 'RT = 403 Ω → IT = 220 / 403 ≈ 0,546 A.' },
      { id: 'e2g-t10', type: 'num', q: 'Las mismas dos lámparas en serie a 220 V. ¿Tensión en cada una? (V)', answer: 110, tolerance: 0.01, unit: 'V', explain: 'Iguales en serie: la mitad cada una.' },
    ],
  },
]

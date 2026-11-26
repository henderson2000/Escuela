// Datos de Atomo (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.
import { ELEMENTS, SHELL_NAMES, shellsWithCharge } from '../../../primero/electricidad/atoms'

export interface AtomoParams {
  sym: string
  charge: number
  spin: boolean
}

export function atomParts(p: AtomoParams) {
  const el = ELEMENTS.find((e) => e.sym === p.sym) ?? ELEMENTS[0]
  const shells = shellsWithCharge(el, p.charge)
  return [
    { id: 'nucleo', name: 'Núcleo', desc: `Protones (rojos, carga +) y neutrones (grises, sin carga). ${el.name}: ${el.z} protones y ${el.n} neutrones.` },
    ...shells.map((n, i) => ({
      id: `capa-${SHELL_NAMES[i]}`,
      name: `Capa ${SHELL_NAMES[i]}${i === shells.length - 1 ? ' (valencia)' : ''}`,
      desc:
        i === shells.length - 1
          ? `La capa más externa: tiene ${n} electrón${n === 1 ? '' : 'es'} de valencia (amarillos). Son los que participan en los enlaces y definen cómo conduce el material.`
          : `Capa ${SHELL_NAMES[i]} con ${n} electrones (carga −). Admite hasta ${[2, 8, 18, 32][i]}.`,
    })),
  ]
}

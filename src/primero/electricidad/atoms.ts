// Elementos para el modelo del átomo (modelo de capas de Bohr, simplificado para 1er año).

export type Kind = 'conductor' | 'semiconductor' | 'aislante' | 'gas'

export interface Element {
  sym: string
  name: string
  z: number
  /** neutrones del isótopo más común */
  n: number
  /** electrones por capa (K, L, M, N) en el átomo neutro */
  shells: number[]
  kind: Kind
  note: string
}

export const SHELL_NAMES = ['K', 'L', 'M', 'N']
export const SHELL_MAX = [2, 8, 18, 32]

export const ELEMENTS: Element[] = [
  { sym: 'H', name: 'Hidrógeno', z: 1, n: 0, shells: [1], kind: 'gas', note: 'El átomo más simple: un protón y un electrón.' },
  { sym: 'He', name: 'Helio', z: 2, n: 2, shells: [2], kind: 'gas', note: 'Su única capa está completa: casi no reacciona.' },
  { sym: 'C', name: 'Carbono', z: 6, n: 6, shells: [2, 4], kind: 'semiconductor', note: '4 electrones de valencia. Como grafito conduce; como diamante, aísla.' },
  { sym: 'O', name: 'Oxígeno', z: 8, n: 8, shells: [2, 6], kind: 'gas', note: 'Le faltan 2 electrones para completar el octeto.' },
  { sym: 'Ne', name: 'Neón', z: 10, n: 10, shells: [2, 8], kind: 'gas', note: 'Capa externa completa (octeto): es un gas noble.' },
  { sym: 'Na', name: 'Sodio', z: 11, n: 12, shells: [2, 8, 1], kind: 'conductor', note: 'Un solo electrón de valencia, muy fácil de soltar.' },
  { sym: 'Al', name: 'Aluminio', z: 13, n: 14, shells: [2, 8, 3], kind: 'conductor', note: 'Buen conductor y liviano: se usa en líneas aéreas.' },
  { sym: 'Si', name: 'Silicio', z: 14, n: 14, shells: [2, 8, 4], kind: 'semiconductor', note: '4 electrones de valencia: la base de diodos, transistores y paneles solares.' },
  { sym: 'Cl', name: 'Cloro', z: 17, n: 18, shells: [2, 8, 7], kind: 'gas', note: 'Le falta 1 electrón: tiende a ganarlo y formar un ion negativo.' },
  { sym: 'Cu', name: 'Cobre', z: 29, n: 35, shells: [2, 8, 18, 1], kind: 'conductor', note: '1 electrón de valencia poco ligado: el conductor de los cables.' },
  { sym: 'Ge', name: 'Germanio', z: 32, n: 41, shells: [2, 8, 18, 4], kind: 'semiconductor', note: '4 electrones de valencia, como el silicio. Se usó en los primeros transistores.' },
]

export const KIND_NAMES: Record<Kind, string> = {
  conductor: 'Conductor',
  semiconductor: 'Semiconductor',
  aislante: 'Aislante',
  gas: 'No metal / gas',
}

/** electrones por capa con carga: +1 = perdió un electrón (ion positivo), −1 = ganó uno (ion negativo) */
export function shellsWithCharge(el: Element, charge: number): number[] {
  const s = [...el.shells]
  if (charge > 0) {
    s[s.length - 1] -= 1
    if (s[s.length - 1] === 0) s.pop()
  } else if (charge < 0) {
    const last = s.length - 1
    if (s[last] < SHELL_MAX[last]) s[last] += 1
    else s.push(1)
  }
  return s
}

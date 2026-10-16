// Símbolos esquemáticos en SVG. Cada símbolo ocupa una caja de 80 × 40,
// con sus terminales en (0, 20) y (80, 20).

export type SymbolKind =
  | 'resistencia'
  | 'led'
  | 'bateria'
  | 'interruptor'
  | 'capacitor'
  | 'lampara'
  | 'diodo'
  | 'potenciometro'
  | 'motor'
  | 'masa'

export const SYMBOL_NAMES: Record<SymbolKind, string> = {
  resistencia: 'Resistencia',
  led: 'LED',
  bateria: 'Pila / batería',
  interruptor: 'Interruptor',
  capacitor: 'Capacitor',
  lampara: 'Lámpara',
  diodo: 'Diodo',
  potenciometro: 'Potenciómetro',
  motor: 'Motor',
  masa: 'Masa / GND',
}

export function SymbolPaths({ kind }: { kind: SymbolKind }) {
  switch (kind) {
    case 'resistencia':
      return <path d="M0 20 H18 L22 10 L30 30 L38 10 L46 30 L54 10 L58 20 H80" />
    case 'potenciometro':
      return (
        <>
          <path d="M0 20 H18 L22 10 L30 30 L38 10 L46 30 L54 10 L58 20 H80" />
          <path d="M28 38 L52 4" />
          <path d="M52 4 L44 6 M52 4 L50 12" />
        </>
      )
    case 'led':
      return (
        <>
          <path d="M0 20 H28 M52 20 H80" />
          <path d="M28 8 L52 20 L28 32 Z" className="fill" />
          <path d="M52 8 V32" />
          <path d="M44 6 L52 -2 M48 -2 H52 V2 M52 8 L60 0 M56 0 H60 V4" className="thin" />
        </>
      )
    case 'diodo':
      return (
        <>
          <path d="M0 20 H28 M52 20 H80" />
          <path d="M28 8 L52 20 L28 32 Z" className="fill" />
          <path d="M52 8 V32" />
        </>
      )
    case 'bateria':
      return (
        <>
          <path d="M0 20 H34 M46 20 H80" />
          <path d="M34 4 V36" />
          <path d="M46 12 V28" className="bold" />
          <text x="24" y="10" className="sym-text">+</text>
        </>
      )
    case 'interruptor':
      return (
        <>
          <path d="M0 20 H26 M56 20 H80" />
          <circle cx="28" cy="20" r="2.5" className="fill" />
          <circle cx="56" cy="20" r="2.5" className="fill" />
          <path d="M28 20 L54 6" />
        </>
      )
    case 'capacitor':
      return <path d="M0 20 H36 M44 20 H80 M36 6 V34 M44 6 V34" />
    case 'lampara':
      return (
        <>
          <path d="M0 20 H26 M54 20 H80" />
          <circle cx="40" cy="20" r="14" />
          <path d="M30 10 L50 30 M50 10 L30 30" />
        </>
      )
    case 'motor':
      return (
        <>
          <path d="M0 20 H26 M54 20 H80" />
          <circle cx="40" cy="20" r="14" />
          <text x="34" y="26" className="sym-text">M</text>
        </>
      )
    case 'masa':
      return <path d="M0 20 H40 M40 8 V32 M46 12 V28 M52 16 V24" />
  }
}

export function SymbolIcon({ kind, size = 80 }: { kind: SymbolKind; size?: number }) {
  return (
    <svg viewBox="-4 -6 88 48" width={size} height={size * 0.55} className="sym" aria-label={SYMBOL_NAMES[kind]}>
      <SymbolPaths kind={kind} />
    </svg>
  )
}

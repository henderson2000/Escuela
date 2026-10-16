import { COLORS } from '../lib/resistor'

const fmtMult = (m?: number) => {
  if (m === undefined) return '—'
  if (m < 1) return `× ${String(m).replace('.', ',')}`
  if (m >= 1e9) return '× 1 G'
  if (m >= 1e6) return `× ${m / 1e6} M`
  if (m >= 1e3) return `× ${m / 1e3} k`
  return `× ${m}`
}

export function ColorCodeTable() {
  return (
    <div className="table-wrap">
      <table className="color-table">
        <thead>
          <tr>
            <th>Color</th>
            <th>Cifra</th>
            <th>Multiplicador</th>
            <th>Tolerancia</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(COLORS).map((c) => (
            <tr key={c.name}>
              <td>
                <span className="dot" style={{ background: c.hex }} /> {c.label}
              </td>
              <td>{c.digit ?? '—'}</td>
              <td>{fmtMult(c.multiplier)}</td>
              <td>{c.tolerance !== undefined ? `± ${String(c.tolerance).replace('.', ',')} %` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

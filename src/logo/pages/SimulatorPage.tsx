import { useState } from 'react'
import { LogoEditor } from '../Editor'
import { EXAMPLES } from '../examples'

const KEY = 'logo-simulador-libre'

export function SimulatorPage() {
  const [version, setVersion] = useState(0)
  const [initial, setInitial] = useState(() => EXAMPLES[0].build())
  const [chosen, setChosen] = useState('')

  const load = (id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id)
    if (!ex) return
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* sin almacenamiento */
    }
    setChosen(id)
    setInitial(ex.build())
    setVersion((v) => v + 1)
  }

  const desc = EXAMPLES.find((e) => e.id === chosen)?.desc

  return (
    <div className="page wide">
      <h1>🧩 Simulador LOGO!</h1>
      <p className="lead">
        Armá tu programa en diagrama de funciones (FUP), igual que en LOGO!Soft Comfort. La simulación corre en vivo: tocá los
        botones de las entradas y mirá las salidas. Tu programa queda guardado en esta computadora.
      </p>
      <div className="row wrap">
        <label className="field inline">
          <span className="field-label">Cargar un ejemplo</span>
          <select className="input" value={chosen} onChange={(e) => load(e.target.value)}>
            <option value="" disabled>
              Elegí…
            </option>
            {EXAMPLES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        {desc && <p className="hint">{desc}</p>}
      </div>
      <LogoEditor key={version} initial={initial} storageKey={KEY} minHeight={460} />
    </div>
  )
}

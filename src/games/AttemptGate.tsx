import type { ReactNode } from 'react'
import type { RankedGame } from './useRankedGame'
import { MAX_ATTEMPTS } from '../lib/config'
import { bestOf, myAttempts, useStore } from '../lib/scores'

/** Pantalla previa a jugar: muestra los intentos que quedan y deja elegir puntos o práctica. */
export function AttemptGate({ g, intro, onLogin }: { g: RankedGame; intro?: ReactNode; onLogin: () => void }) {
  return (
    <div className="card gate">
      {intro}
      <div className="attempt-dots" aria-label={`Intentos usados: ${g.used} de ${g.max}`}>
        {Array.from({ length: g.max }, (_, i) => (
          <span key={i} className={i < g.used ? 'used' : ''}>
            Intento {i + 1}
          </span>
        ))}
      </div>
      {g.loggedIn ? (
        g.left > 0 ? (
          <p>
            Te {g.left === 1 ? 'queda' : 'quedan'} <strong>{g.left}</strong> {g.left === 1 ? 'intento' : 'intentos'} por puntos.
            {g.used > 0 && <> Tu mejor puntaje: <strong>{g.best}</strong>.</>} El intento cuenta desde que empezás.
          </p>
        ) : (
          <p>
            Ya usaste tus {g.max} intentos. Tu mejor puntaje quedó en <strong>{g.best}</strong>. Podés seguir practicando.
          </p>
        )
      ) : (
        <p>
          Para jugar por puntos tenés que ingresar con tu nombre y apellido.{' '}
          <button type="button" className="btn small primary" onClick={onLogin}>
            Ingresar
          </button>
        </p>
      )}
      <div className="row center">
        <button
          type="button"
          className="btn primary big"
          disabled={!g.loggedIn || g.syncing || g.left === 0 || g.starting}
          onClick={() => g.start('puntos')}
        >
          {g.starting ? 'Empezando…' : g.syncing ? 'Cargando tus intentos…' : '🏆 Jugar por puntos'}
        </button>
        <button type="button" className="btn big" onClick={() => g.start('practica')}>
          Practicar (no suma)
        </button>
      </div>
      {g.error && <p className="feedback bad">{g.error}</p>}
    </div>
  )
}

/** Cartel que se ve mientras se juega. */
export function ModeBadge({ g }: { g: RankedGame }) {
  if (!g.session) return null
  return g.ranked ? (
    <span className="mode-badge ranked">🏆 Por puntos · intento {g.session.n} de {g.max}</span>
  ) : (
    <span className="mode-badge">Práctica · no suma puntos</span>
  )
}

/** Pestañas de niveles con el mejor puntaje y los intentos usados en cada uno. */
export function LevelTabs({
  game,
  levels,
  current,
  locked,
  onSelect,
}: {
  game: string
  levels: { id: string; title: string }[]
  current: number
  locked: boolean
  onSelect: (i: number) => void
}) {
  const s = useStore()
  return (
    <div className="level-tabs">
      {levels.map((l, i) => {
        const at = myAttempts(s, game, l.id)
        const best = bestOf(at)
        return (
          <button
            key={l.id}
            type="button"
            className={`chip ${i === current ? 'active' : ''}`}
            disabled={locked && i !== current}
            title={locked ? 'Terminá o abandoná el intento actual para cambiar de nivel' : undefined}
            onClick={() => onSelect(i)}
          >
            {l.title}
            {s.me && (
              <small>
                {' '}
                · {best} pts · {at.length}/{MAX_ATTEMPTS}
              </small>
            )}
          </button>
        )
      })}
    </div>
  )
}

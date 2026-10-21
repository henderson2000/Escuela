import { useEffect, useState } from 'react'
import { useSubject } from '../lib/subject'
import { MAX_ATTEMPTS, ONLINE } from '../lib/config'
import { adminCheckPin, adminDeletePlayer, adminResetAttempts, download, loadRanking, rankingCSV, useStore, type RankRow } from '../lib/scores'

const REFRESH_MS = 20000

export function RankingPage() {
  const s = useStore()
  const { games: GAMES } = useSubject()
  const [curso, setCurso] = useState<string>('')
  const [pin, setPin] = useState('')
  const [teacher, setTeacher] = useState(false)
  const [teacherOpen, setTeacherOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, setPending] = useState<{ action: 'borrar' | 'reiniciar'; row: RankRow } | null>(null)

  useEffect(() => {
    loadRanking()
    if (!ONLINE) return
    const t = setInterval(loadRanking, REFRESH_MS)
    return () => clearInterval(t)
  }, [])

  // puntos sólo de los juegos de este taller
  const all = (s.ranking ?? []).map((r) => ({ ...r, points: GAMES.reduce((a, g) => a + (r.byGame[g.id] ?? 0), 0) }))
  const cursos = [...new Set(all.map((r) => r.player.curso))].sort()
  const rows = all
    .filter((r) => !curso || r.player.curso === curso)
    .sort((a, b) => b.points - a.points || a.player.name.localeCompare(b.player.name))

  const enterTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    try {
      if (await adminCheckPin(pin)) setTeacher(true)
      else setMsg('El PIN no es correcto.')
    } catch (err) {
      setMsg((err as Error).message)
    }
  }

  const confirmAction = async () => {
    if (!pending) return
    const { action, row } = pending
    setPending(null)
    try {
      if (action === 'borrar') await adminDeletePlayer(pin, row.player.id)
      else await adminResetAttempts(pin, row.player.id, null)
      setMsg(action === 'borrar' ? `Se borró a ${row.player.name}.` : `${row.player.name} puede volver a jugar todo.`)
    } catch (err) {
      setMsg((err as Error).message)
    }
  }

  return (
    <div className="page">
      <h1>🏆 Ranking</h1>
      <p className="lead">
        Cada alumno suma su <strong>mejor intento</strong> de cada juego y nivel (hay {MAX_ATTEMPTS} intentos por puntos en
        cada uno). {ONLINE ? 'El ranking se actualiza solo cada 20 segundos.' : ''}
      </p>
      {!ONLINE && (
        <p className="warn-box">
          Modo sin servidor: este ranking sólo muestra a quienes jugaron en esta computadora. Para el ranking online del curso
          hay que configurar la base de datos (ver README).
        </p>
      )}

      <div className="row wrap">
        <button type="button" className={`chip ${curso === '' ? 'active' : ''}`} onClick={() => setCurso('')}>
          Todos los cursos
        </button>
        {cursos.map((c) => (
          <button key={c} type="button" className={`chip ${curso === c ? 'active' : ''}`} onClick={() => setCurso(c)}>
            {c}
          </button>
        ))}
        {ONLINE && (
          <button type="button" className="btn small ghost" onClick={() => loadRanking()}>
            ↻ Actualizar
          </button>
        )}
      </div>

      {s.rankingError && <p className="msg bad">{s.rankingError}</p>}

      {s.ranking === null ? (
        <p className="card">Cargando ranking…</p>
      ) : rows.length === 0 ? (
        <p className="card">Todavía no hay jugadores. ¡Ingresá con tu nombre y jugá!</p>
      ) : (
        <div className="table-wrap card">
          <table className="ranking">
            <thead>
              <tr>
                <th>#</th>
                <th>Alumno</th>
                <th>Curso</th>
                {GAMES.map((g) => (
                  <th key={g.id} title={g.title} className="hide-sm num">
                    {g.icon}
                  </th>
                ))}
                <th className="num">Puntos</th>
                {teacher && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.player.id} className={r.player.id === s.me?.id ? 'me' : ''}>
                  <td className="pos">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                  <td>{r.player.name}</td>
                  <td>{r.player.curso}</td>
                  {GAMES.map((g) => (
                    <td key={g.id} className="hide-sm num">
                      {r.byGame[g.id] ?? 0}
                    </td>
                  ))}
                  <td className="pts-cell num">{r.points}</td>
                  {teacher && (
                    <td className="actions">
                      <button type="button" className="btn small" onClick={() => setPending({ action: 'reiniciar', row: r })}>
                        Devolver intentos
                      </button>
                      <button type="button" className="btn small danger" onClick={() => setPending({ action: 'borrar', row: r })}>
                        Borrar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pending && (
        <div className="card confirm">
          <p>
            {pending.action === 'borrar'
              ? `¿Borrar a ${pending.row.player.name} (${pending.row.player.curso}) con todos sus puntos? No se puede deshacer.`
              : `¿Borrar los intentos de ${pending.row.player.name} para que pueda volver a jugar todos los niveles? Sus puntos vuelven a 0.`}
          </p>
          <div className="row">
            <button type="button" className="btn danger" onClick={confirmAction}>
              Sí, confirmar
            </button>
            <button type="button" className="btn" onClick={() => setPending(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <section className="card teacher">
        <div className="row space">
          <h3>Zona docente</h3>
          <button type="button" className="btn small ghost" onClick={() => setTeacherOpen(!teacherOpen)}>
            {teacherOpen ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {teacherOpen && (
          <>
            <div className="row wrap">
              <button
                type="button"
                className="btn"
                disabled={rows.length === 0}
                onClick={() => download(`ranking${curso ? '-' + curso : ''}-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + rankingCSV(rows, GAMES))}
              >
                📊 Descargar planilla (CSV)
              </button>
            </div>
            {!teacher ? (
              <form className="row wrap" onSubmit={enterTeacher}>
                <label className="field inline">
                  <span className="field-label">PIN docente (para borrar alumnos o devolver intentos)</span>
                  <input id="pin-docente" className="input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" />
                </label>
                <button type="submit" className="btn primary" disabled={!pin}>
                  Entrar
                </button>
              </form>
            ) : (
              <p className="hint">Modo docente activo: en cada fila aparecen los botones para devolver intentos o borrar.</p>
            )}
          </>
        )}
        {msg && <p className="hint">{msg}</p>}
      </section>
    </div>
  )
}

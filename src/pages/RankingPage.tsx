import { useRef, useState } from 'react'
import { GAMES } from '../games/registry'
import {
  activitiesDone,
  bestScore,
  deletePlayer,
  download,
  exportCSV,
  exportJSON,
  importJSON,
  resetAll,
  totalPoints,
  useStore,
} from '../lib/scores'

export function RankingPage() {
  const s = useStore()
  const cursos = [...new Set(s.players.map((p) => p.curso))].sort()
  const [curso, setCurso] = useState<string>('')
  const [msg, setMsg] = useState('')
  const [teacher, setTeacher] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const rows = s.players
    .filter((p) => !curso || p.curso === curso)
    .map((p) => ({ p, pts: totalPoints(s, p.id), acts: activitiesDone(s, p.id) }))
    .sort((a, b) => b.pts - a.pts || b.acts - a.acts)

  const onImport = async (f: File) => {
    try {
      const r = importJSON(await f.text())
      setMsg(`Importado: ${r.players} alumnos nuevos y ${r.scores} partidas.`)
    } catch (e) {
      setMsg(`No se pudo importar: ${(e as Error).message}`)
    }
  }

  return (
    <div className="page">
      <h1>🏆 Ranking</h1>
      <p className="lead">
        El puntaje de cada alumno es la suma de su <strong>mejor partida</strong> en cada juego y nivel. Repetir un juego
        sólo suma si superás tu récord.
      </p>

      <div className="row wrap">
        <button type="button" className={`chip ${curso === '' ? 'active' : ''}`} onClick={() => setCurso('')}>
          Todos
        </button>
        {cursos.map((c) => (
          <button key={c} type="button" className={`chip ${curso === c ? 'active' : ''}`} onClick={() => setCurso(c)}>
            {c}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
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
                  <th key={g.id} title={g.title} className="hide-sm">
                    {g.icon}
                  </th>
                ))}
                <th>Actividades</th>
                <th>Puntos</th>
                {teacher && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, pts, acts }, i) => (
                <tr key={p.id} className={p.id === s.currentPlayerId ? 'me' : ''}>
                  <td className="pos">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.curso}</td>
                  {GAMES.map((g) => (
                    <td key={g.id} className="hide-sm">
                      {g.levels
                        ? g.levels.reduce((a, l) => a + bestScore(s, p.id, g.id, l), 0)
                        : bestScore(s, p.id, g.id)}
                    </td>
                  ))}
                  <td>{acts}</td>
                  <td className="pts-cell">{pts}</td>
                  {teacher && (
                    <td>
                      <button
                        type="button"
                        className="btn small danger"
                        onClick={() => confirm(`¿Borrar a ${p.name} y todos sus puntos?`) && deletePlayer(p.id)}
                      >
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

      <section className="card teacher">
        <div className="row space">
          <h3>Zona docente</h3>
          <button type="button" className="btn small ghost" onClick={() => setTeacher(!teacher)}>
            {teacher ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {teacher && (
          <>
            <p>
              Los puntajes se guardan en <strong>esta computadora</strong>. Para juntar los de varias PCs: en cada una
              tocá <em>Exportar</em> y después, en tu compu, <em>Importar</em> todos los archivos (no se duplican).
            </p>
            <div className="row wrap">
              <button type="button" className="btn" onClick={() => download(`puntajes-${new Date().toISOString().slice(0, 10)}.json`, exportJSON())}>
                ⬇ Exportar (JSON)
              </button>
              <button type="button" className="btn" onClick={() => file.current?.click()}>
                ⬆ Importar (JSON)
              </button>
              <button type="button" className="btn" onClick={() => download('ranking.csv', '﻿' + exportCSV(), 'text/csv')}>
                📊 Descargar planilla (CSV)
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => confirm('¿Borrar TODOS los jugadores y puntajes de esta computadora? No se puede deshacer.') && resetAll()}
              >
                Reiniciar todo
              </button>
              <input
                ref={file}
                type="file"
                accept="application/json,.json"
                multiple
                hidden
                onChange={async (e) => {
                  for (const f of Array.from(e.target.files ?? [])) await onImport(f)
                  e.target.value = ''
                }}
              />
            </div>
            {msg && <p className="hint">{msg}</p>}
          </>
        )}
      </section>
    </div>
  )
}

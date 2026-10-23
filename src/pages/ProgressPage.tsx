import { use, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBJECTS, getYear } from '../data/curriculum'
import { MAX_ATTEMPTS, MAX_POINTS } from '../lib/config'
import { SUBJECT_KEYS, loadSubject, type SubjectEntry } from '../subjects'
import { bestOfGame, download, exportProgress, importProgress, myAttempts, resetProgress, useStore, type State } from '../lib/scores'

let all: Promise<[string, SubjectEntry][]> | null = null
function loadAll() {
  if (!all) {
    all = Promise.all(SUBJECT_KEYS.map(async (k) => [k, await loadSubject(k)] as [string, SubjectEntry]))
    // si falla (sin internet), que se pueda reintentar
    all.catch(() => (all = null))
  }
  return all
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

function Bar({ label, n, total }: { label: string; n: number; total: number }) {
  return (
    <div className="pg-bar">
      <span>{label}</span>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={n} aria-label={label}>
        <div style={{ width: `${pct(n, total)}%` }} />
      </div>
      <b>
        {n} / {total}
      </b>
    </div>
  )
}

function SubjectProgress({ k, entry, s }: { k: string; entry: SubjectEntry; s: State }) {
  const [anio, materia] = k.split('/')
  const subject = SUBJECTS[materia]
  const acts = [...entry.topics.flatMap((t) => t.activities), ...entry.catalog.flatMap((c) => c.activities)]
  const count = (ids: string[]) => ids.filter((id) => s.done[id] === true).length
  return (
    <section className="card pg-subject">
      <h2>
        <Link to={`/${anio}/${materia}`}>
          {subject.icon} {subject.name}
        </Link>{' '}
        <small className="muted">{getYear(anio)?.name}</small>
      </h2>
      {entry.progress?.map((g) => <Bar key={g.label} label={g.label} n={count(g.ids)} total={g.ids.length} />)}
      {entry.guide && entry.guide.length > 0 && (
        <Bar label="Guía de ejercicios" n={count(entry.guide.flatMap((g) => g.activities.map((a) => a.id)))} total={entry.guide.reduce((t, g) => t + g.activities.length, 0)} />
      )}
      {acts.length > 0 && <Bar label="Actividades" n={count(acts.map((a) => a.id))} total={acts.length} />}
      {entry.games.length > 0 && (
        <table className="pg-games">
          <thead>
            <tr>
              <th>Juego</th>
              <th>Mejor puntaje</th>
              <th>Intentos usados</th>
            </tr>
          </thead>
          <tbody>
            {entry.games.map((g) => {
              const levels = g.levels ?? ['']
              const used = levels.reduce((t, l) => t + myAttempts(s, g.id, l).length, 0)
              const max = (MAX_POINTS[g.id] ?? 0) * levels.length
              return (
                <tr key={g.id}>
                  <td>
                    {g.icon} {g.title}
                  </td>
                  <td>
                    <b>{bestOfGame(s, g.id, levels)}</b>
                    {max > 0 && <span className="muted"> / {max}</span>}
                  </td>
                  <td>
                    {used} / {levels.length * MAX_ATTEMPTS}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}

function Backup() {
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const stamp = new Date().toISOString().slice(0, 10)
  return (
    <section className="card pg-backup">
      <h2>Copia de seguridad</h2>
      <p className="hint">
        El progreso vive en el navegador de esta computadora. Si se borran los datos del navegador se pierde. Podés descargar una copia y
        cargarla después (o en otra computadora).
      </p>
      <div className="row wrap">
        <button type="button" className="btn" onClick={() => download(`progreso-talleres-${stamp}.json`, exportProgress(), 'application/json')}>
          ⬇ Descargar copia
        </button>
        <button type="button" className="btn" onClick={() => file.current?.click()}>
          ⬆ Cargar copia
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            if (!confirm('Esto reemplaza el progreso de esta computadora por el de la copia. ¿Seguir?')) return
            const err = importProgress(await f.text())
            setMsg(err ? { ok: false, text: err } : { ok: true, text: 'Listo: se cargó la copia.' })
          }}
        />
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (prompt('Se borra TODO el progreso, los puntajes y las lamparitas de esta computadora. Para confirmar escribí BORRAR') !== 'BORRAR') return
            resetProgress()
            setMsg({ ok: true, text: 'Se borró el progreso de esta computadora.' })
          }}
        >
          Borrar todo
        </button>
      </div>
      {msg && (
        <p className={`feedback ${msg.ok ? 'ok' : 'bad'}`} role="status">
          {msg.text}
        </p>
      )}
    </section>
  )
}

export function ProgressPage() {
  const s = useStore()
  const entries = use(loadAll())
  return (
    <div className="page narrow">
      <Link to="/" className="back">
        ← Inicio
      </Link>
      <h1>📊 Progreso de esta computadora</h1>
      <p className="lead">
        Lo resuelto, los mejores puntajes de los juegos y las lamparitas. Cada computadora guarda su propio progreso.
      </p>
      <div className="card pg-bulbs">
        <span className="pg-bulb-n">💡 {s.bulbs}</span>
        <span>lamparitas disponibles</span>
      </div>
      {entries.map(([k, entry]) => (
        <SubjectProgress key={k} k={k} entry={entry} s={s} />
      ))}
      <Backup />
    </div>
  )
}

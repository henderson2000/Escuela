import { useCallback } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useSub } from '../../lib/nav'
import { markActivity, useStore } from '../../lib/scores'
import { requestLogin } from '../../components/PlayerBadge'
import { findLesson, lessonActivityId } from '../course'
import { LessonWorkspace } from '../Workspace'

export function LessonPage() {
  const { lesson: lid } = useParams()
  // la key reinicia el espacio de trabajo al cambiar de lección
  return <LessonView key={lid} id={lid} />
}

function LessonView({ id }: { id?: string }) {
  const sub = useSub()
  const s = useStore()
  const found = findLesson(id)
  const onChecked = useCallback(
    (_r: boolean[], ok: boolean) => {
      if (ok && id) markActivity(lessonActivityId(id), true)
    },
    [id],
  )
  if (!found) return <Navigate to={sub('')} replace />
  const { track, lesson, index, all } = found
  const prev = all[index - 1]
  const next = all[index + 1]
  const mod = track.modules.find((m) => m.lessons.some((l) => l.id === lesson.id))
  const done = !!(s.me && s.activities[s.me.id]?.[lessonActivityId(lesson.id)])

  return (
    <div className="page wide">
      <div className="lesson-head">
        <Link to={sub(`/curso/${track.id}`)} className="back">
          ← {track.title}
        </Link>
        <span className="lesson-crumb">
          {mod?.title} · Lección {index + 1} de {all.length}
        </span>
      </div>
      <div className="lesson-head">
        <h1>
          {track.icon} {lesson.title}
        </h1>
        {done && <span className="tag ok">✔ resuelta</span>}
      </div>
      <LessonWorkspace
        lesson={lesson}
        onChecked={onChecked}
        actions={
          <>
            {!s.me && (
              <p className="hint">
                Para guardar tu progreso,{' '}
                <button type="button" className="btn small" onClick={requestLogin}>
                  ingresá con tu nombre
                </button>
              </p>
            )}
            <div className="lesson-nav">
              {prev ? (
                <Link to={sub(`/curso/${track.id}/${prev.id}`)} className="btn small">
                  ← Anterior
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link to={sub(`/curso/${track.id}/${next.id}`)} className="btn small primary">
                  Siguiente →
                </Link>
              ) : (
                <Link to={sub('')} className="btn small primary">
                  🎉 Terminaste {track.title}
                </Link>
              )}
            </div>
          </>
        }
      />
    </div>
  )
}

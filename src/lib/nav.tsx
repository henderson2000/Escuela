import { createContext, useContext, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Ruta base del taller actual (ej. "/3/electronica"). Todas las páginas internas cuelgan de acá. */
export const BaseContext = createContext('/3/electronica')

/** Arma un link dentro del taller actual: sub('/juegos') → "/3/electronica/juegos" */
export function useSub() {
  const base = useContext(BaseContext)
  return (path = '') => base + path
}

/** Link a una sección del taller actual: <SubLink to="/componentes/x">…</SubLink> */
export function SubLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const sub = useSub()
  return (
    <Link to={sub(to)} className={className}>
      {children}
    </Link>
  )
}

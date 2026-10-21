import { createContext, useContext } from 'react'

/** Ruta base del taller actual (ej. "/3/electronica"). Todas las páginas internas cuelgan de acá. */
export const BaseContext = createContext('/3/electronica')

/** Arma un link dentro del taller actual: sub('/juegos') → "/3/electronica/juegos" */
export function useSub() {
  const base = useContext(BaseContext)
  return (path = '') => base + path
}

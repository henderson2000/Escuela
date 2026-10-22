// Configuración de puntajes.
// La plataforma se usa sin iniciar sesión: el progreso, los intentos y los puntajes quedan guardados
// en cada computadora (navegador). No hay ranking ni servidor.

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
export const ONLINE = false && !!SUPABASE_URL && !!SUPABASE_KEY

/** Cantidad de veces que se puede jugar por puntos cada juego/nivel en cada computadora. */
export const MAX_ATTEMPTS = 2

/** Puntaje máximo aceptado por juego (también lo controla la base de datos). */
export const MAX_POINTS: Record<string, number> = {
  protoboard: 100,
  plano: 100,
  partes: 200,
  colores: 1500,
  // Electricidad (LOGO!)
  'logo-programa': 100,
  'logo-compuertas': 200,
  'logo-tiempos': 200,
  // Computación
  'compu-desafios': 100,
  'compu-quiz': 200,
  // Torno
  'torno-partes': 200,
  'torno-montajes': 200,
  'torno-seguridad': 200,
  'torno-calculos': 200,
}

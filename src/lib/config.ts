// Configuración del ranking online (Supabase).
// Se completa con variables de entorno al compilar (ver README y .env.example).
// Si faltan, la app funciona en modo local: los puntos quedan en cada computadora.

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
export const ONLINE = !!SUPABASE_URL && !!SUPABASE_KEY

/** Cantidad de veces que cada alumno puede jugar por puntos cada nivel. */
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
}

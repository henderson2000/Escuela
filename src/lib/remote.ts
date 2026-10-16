// Cliente mínimo para la API REST de Supabase (sin dependencias).
import { SUPABASE_KEY, SUPABASE_URL } from './config'

export class RemoteError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...init.headers,
      },
    })
  } catch {
    throw new RemoteError('red', 'No hay conexión con el servidor del ranking. Revisá internet y probá de nuevo.')
  }
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    const msg: string = body?.message ?? `Error ${res.status}`
    // los errores propios de las funciones SQL vienen como "CODIGO: mensaje"
    const m = msg.match(/^([A-Z_]+): (.*)$/)
    if (m) throw new RemoteError(m[1], m[2])
    throw new RemoteError('servidor', msg)
  }
  return body as T
}

export const rpc = <T>(fn: string, args: Record<string, unknown>) =>
  request<T>(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) })

export const select = <T>(table: string, query: string) => request<T>(`${table}?${query}`)

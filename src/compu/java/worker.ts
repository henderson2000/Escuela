/// <reference lib="webworker" />
// Trabajador que compila y ejecuta programas Java dentro del navegador.
// Compila con javac (OpenJDK) + TeaVM a WebAssembly y ejecuta el resultado con un WASI mínimo.
import { compileJava, loadCompiler, type JavaCompilerLib } from './teavmGlue'

export type ToWorker =
  | { type: 'run'; id: number; base: string; files: { path: string; content: string }[]; entry: string; inputs: string[] }
  | { type: 'warmup'; base: string }

export type FromWorker =
  | { type: 'status'; text: string; progress?: number }
  | { type: 'compiled'; id: number; ok: boolean; errors: string; ms: number }
  | { type: 'stream'; id: number; run: number; stream: 'out' | 'err'; text: string }
  | { type: 'exit'; id: number; run: number; code: number; crashed: string | null; ms: number }
  | { type: 'done'; id: number }
  | { type: 'fatal'; message: string }

const post = (m: FromWorker) => (self as unknown as Worker).postMessage(m)

const CACHE = 'its-java-v1'
const FILES = {
  compiler: 'compiler.wasm.gz',
  sdk: 'compile-classlib.bin.gz',
  runtime: 'runtime-classlib.bin.gz',
}

/** Descarga (o toma de la caché del navegador) un archivo y lo descomprime. */
async function fetchAsset(base: string, name: string, onBytes: (n: number) => void): Promise<Uint8Array> {
  const url = new URL(name, base).href
  let res: Response | undefined
  let cache: Cache | undefined
  try {
    cache = await caches.open(CACHE)
    res = await cache.match(url)
  } catch {
    /* sin Cache Storage (por ejemplo, ventana privada) */
  }
  if (!res) {
    const net = await fetch(url)
    if (!net.ok) throw new Error(`No se pudo descargar ${name} (${net.status})`)
    // leer con progreso
    const reader = net.body!.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      total += value.length
      onBytes(value.length)
    }
    const all = new Uint8Array(total)
    let o = 0
    for (const c of chunks) {
      all.set(c, o)
      o += c.length
    }
    try {
      await cache?.put(url, new Response(all))
    } catch {
      /* caché llena: no pasa nada */
    }
    res = new Response(all)
  } else {
    const len = Number(res.headers.get('content-length') ?? 0)
    if (len) onBytes(len)
  }
  const bytes = new Uint8Array(await res.arrayBuffer())
  // si el servidor ya lo descomprimió, se usa tal cual
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes
  const ds = new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')))
  return new Uint8Array(await ds.arrayBuffer())
}

const TOTAL_GZ = 19_535_068 // tamaño aproximado de los tres archivos comprimidos
let ready: Promise<{ lib: JavaCompilerLib; sdk: Uint8Array; runtime: Uint8Array }> | null = null

function prepare(base: string) {
  if (!ready) {
    ready = (async () => {
      let got = 0
      const onBytes = (n: number) => {
        got += n
        post({ type: 'status', text: 'Preparando Java (sólo la primera vez)…', progress: Math.min(1, got / TOTAL_GZ) })
      }
      post({ type: 'status', text: 'Preparando Java…', progress: 0 })
      const [compiler, sdk, runtime] = await Promise.all([
        fetchAsset(base, FILES.compiler, onBytes),
        fetchAsset(base, FILES.sdk, onBytes),
        fetchAsset(base, FILES.runtime, onBytes),
      ])
      post({ type: 'status', text: 'Iniciando el compilador…', progress: 1 })
      const lib = await loadCompiler(compiler)
      return { lib, sdk, runtime }
    })()
    ready.catch(() => {
      ready = null
    })
  }
  return ready
}

/* ------------------------------------------------------------------ WASI mínimo */

class Exit {
  constructor(public code: number) {}
}

function runWasi(module: WebAssembly.Module, stdin: string, onOut: (s: string) => void, onErr: (s: string) => void): number {
  const input = new TextEncoder().encode(stdin)
  let inPos = 0
  let mem: WebAssembly.Memory
  const view = () => new DataView(mem.buffer)
  const outDec = new TextDecoder()
  const errDec = new TextDecoder()
  const t0 = performance.now()
  const wasi: Record<string, (...a: number[]) => number> = {
    fd_write(fd, iovs, n, nwritten) {
      const v = view()
      let total = 0
      for (let i = 0; i < n; i++) {
        const p = v.getUint32(iovs + i * 8, true)
        const l = v.getUint32(iovs + i * 8 + 4, true)
        const bytes = new Uint8Array(mem.buffer, p, l).slice()
        if (fd === 1) onOut(outDec.decode(bytes, { stream: true }))
        else onErr(errDec.decode(bytes, { stream: true }))
        total += l
      }
      v.setUint32(nwritten, total, true)
      return 0
    },
    fd_read(_fd, iovs, n, nread) {
      const v = view()
      let total = 0
      for (let i = 0; i < n && inPos < input.length; i++) {
        const p = v.getUint32(iovs + i * 8, true)
        const l = v.getUint32(iovs + i * 8 + 4, true)
        const chunk = input.subarray(inPos, inPos + l)
        new Uint8Array(mem.buffer, p, chunk.length).set(chunk)
        inPos += chunk.length
        total += chunk.length
      }
      v.setUint32(nread, total, true)
      return 0
    },
    clock_time_get(id, _prec, out) {
      const ns = id === 0 ? BigInt(Date.now()) * 1_000_000n : BigInt(Math.round((performance.now() - t0) * 1e6))
      view().setBigUint64(out, ns, true)
      return 0
    },
    args_sizes_get(argc, size) {
      const v = view()
      v.setUint32(argc, 0, true)
      v.setUint32(size, 0, true)
      return 0
    },
    args_get: () => 0,
    environ_sizes_get(c, s) {
      const v = view()
      v.setUint32(c, 0, true)
      v.setUint32(s, 0, true)
      return 0
    },
    environ_get: () => 0,
    proc_exit(code) {
      throw new Exit(code)
    },
    random_get(p, l) {
      crypto.getRandomValues(new Uint8Array(mem.buffer, p, l))
      return 0
    },
  }
  const imports = {
    wasi_snapshot_preview1: new Proxy(wasi, { get: (t, k: string) => t[k] ?? (() => 52) }),
    teavmMath: Math,
  } as unknown as WebAssembly.Imports
  const inst = new WebAssembly.Instance(module, imports)
  mem = inst.exports.memory as WebAssembly.Memory
  const start = (inst.exports._start ?? inst.exports.start) as () => void
  try {
    start()
    return 0
  } catch (e) {
    if (e instanceof Exit) return e.code
    throw e
  }
}

/* ------------------------------------------------------------------ mensajes */

/** Pequeños arreglos al código para esquivar límites conocidos de la biblioteca del navegador. */
function patchSource(src: string): string {
  // %n dentro de printf/format no está soportado: se cambia por \n (mismo resultado)
  return src.replace(/"(?:[^"\\\n]|\\.)*"/g, (lit) => lit.replace(/%n/g, '\\n'))
}

self.onmessage = async (ev: MessageEvent<ToWorker>) => {
  const m = ev.data
  try {
    if (m.type === 'warmup') {
      await prepare(m.base)
      post({ type: 'status', text: 'Java listo', progress: 1 })
      return
    }
    const env = await prepare(m.base)
    post({ type: 'status', text: 'Compilando…' })
    const t0 = performance.now()
    const r = await compileJava(
      env.lib,
      { entry: m.entry, files: m.files.map((f) => ({ path: f.path, content: patchSource(f.content) })), optimization: 'debug' },
      { sdk: env.sdk, runtime: env.runtime },
    )
    const ms = Math.round(performance.now() - t0)
    if (!r.success || !r.wasm) {
      post({ type: 'compiled', id: m.id, ok: false, errors: r.stderr || 'Error de compilación.', ms })
      post({ type: 'done', id: m.id })
      return
    }
    post({ type: 'compiled', id: m.id, ok: true, errors: r.stderr, ms })
    const mod = await WebAssembly.compile(r.wasm as BufferSource)
    for (let k = 0; k < m.inputs.length; k++) {
      post({ type: 'status', text: 'Ejecutando…' })
      const t1 = performance.now()
      let crashed: string | null = null
      let code = 0
      try {
        code = runWasi(
          mod,
          m.inputs[k],
          (text) => post({ type: 'stream', id: m.id, run: k, stream: 'out', text }),
          (text) => post({ type: 'stream', id: m.id, run: k, stream: 'err', text }),
        )
      } catch (e) {
        crashed = (e as Error)?.message ?? String(e)
      }
      post({ type: 'exit', id: m.id, run: k, code, crashed, ms: Math.round(performance.now() - t1) })
    }
    post({ type: 'done', id: m.id })
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e)
    post({ type: 'fatal', message: msg })
  }
}

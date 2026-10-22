import { createRoot } from 'react-dom/client'
import { Viewer } from './src/three/Viewer'
import { TornoModel, type TornoParams } from './src/three/models/Torno'
import { PlatosModel, PuntosModel, HerramientasModel } from './src/three/models/TornoAccesorios'

const q = new URLSearchParams(location.search)
const m = q.get('m') ?? 'torno'
const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d)
const cam = (q.get('cam') ?? '').split(',').filter(Boolean).map(Number) as [number, number, number]
const tgt = (q.get('tgt') ?? '').split(',').filter(Boolean).map(Number) as [number, number, number]
const explode = num('ex', 0)
const labels = q.get('labels') === '1'
let el: React.ReactNode
let defCam: [number, number, number] = [6, 4, 24]
let defTgt: [number, number, number] = [0, -2.5, 0]
let shadow = -9
if (m === 'torno') {
  const p: TornoParams = {
    rpmIdx: num('rpm', 7), on: q.get('on') === '1', carro: num('carro', 40), trans: num('trans', 30), charriot: num('ch', 30),
    contrapunta: num('cp', 70), manguito: num('mg', 40), montaje: (q.get('mont') ?? 'aire') as any, avance: (q.get('av') ?? 'neutro') as any,
    tuerca: q.get('tu') === '1', tapa: q.get('tapa') === '1',
  }
  el = <TornoModel {...p} />
} else if (m === 'platos') {
  defCam = [20, 13, 26]; defTgt = [2, 0, 0]; shadow = -12
  el = <PlatosModel kind={(q.get('k') ?? '3m') as any} clampD={num('d', 40)} inverted={q.get('inv') === '1'} jaws4={[35, 40, 15, 20]} showKey={q.get('key') !== '0'} />
} else if (m === 'puntos') {
  defCam = [14, 9, 22]; defTgt = [0, 1, 0]; shadow = -8
  el = <PuntosModel kind={(q.get('k') ?? 'giratorio') as any} tool={(q.get('t') ?? 'broca') as any} barD={num('d', 40)} spin={false} />
} else {
  defCam = [8, 7, 13]; defTgt = [0, 0, 0]; shadow = -3
  el = <HerramientasModel kind={(q.get('k') ?? 'integral') as any} angles={q.get('ang') !== '0'} />
}
const names = new Proxy({}, { get: (_t, k) => String(k) }) as Record<string, string>
createRoot(document.getElementById('root')!).render(
  <Viewer camera={cam.length === 3 ? cam : defCam} target={tgt.length === 3 ? tgt : defTgt} shadowY={shadow} parts={{ explode, labels, names }}>
    {el}
  </Viewer>,
)

import { useEffect, useState } from 'react'
import type { ComponentDef } from '../../catalog/types'
import { Field, Readout, Segmented, Slider, Toggle } from '../../components/ui'
import { InstalacionModel, estado, instalacionParts, type Circuito2, type Falla, type InstalacionParams } from '../../three/models/segundo/Instalacion'
import { DIF_PARTS, DiferencialModel, MULTI_PARTS, MultimetroModel, PIA_PARTS, PiaModel, TIEMPO_DISPARO, lectura, type DiferencialParams, type ModoMulti, type MultimetroParams, type PiaParams, type Situacion } from '../../three/models/segundo/Protecciones'

const fmt = (n: number, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace('.', ',') : '—')

/* ------------------------------------------------------------------ instalación */

const CIRCUITOS: Record<Circuito2, string> = {
  simple: 'Una lámpara comandada por un interruptor de un punto.',
  serie: 'Dos lámparas en serie comandadas por un interruptor.',
  paralelo: 'Dos lámparas en paralelo comandadas por un interruptor.',
  escalera: 'Una lámpara comandada desde dos lugares con dos llaves de combinación (circuito de escalera).',
}

const FALLAS: Record<Falla, string> = {
  ninguna: 'Todo en orden.',
  cortocircuito: 'Se tocan la fase y el neutro en el portalámparas: la corriente sube a miles de amperes.',
  sobrecarga: 'Se enchufaron demasiados artefactos al circuito: pasa más corriente que la que soportan los cables.',
  fuga: 'Una falla de aislamiento pone bajo tensión una parte metálica y una persona la toca: la corriente se va a tierra por su cuerpo.',
}

const DISPARO: Record<InstalacionParams['disparo'], string> = {
  '': '',
  magnetico: 'Actuó la parte MAGNÉTICA del termomagnético: cortó el cortocircuito en milésimas de segundo.',
  termico: 'Actuó la parte TÉRMICA del termomagnético: el bimetal se calentó con la sobrecarga y cortó después de unos segundos.',
  diferencial: 'Actuó el DIFERENCIAL: detectó que la corriente que vuelve por el neutro es menor que la que va por la fase (se escapaba por la persona).',
}

function InstalacionControls({ params, set }: { params: InstalacionParams; set: (p: Partial<InstalacionParams>) => void }) {
  const st = estado(params)
  const [left, setLeft] = useState<number | null>(null)
  // las protecciones actúan solas según la falla
  useEffect(() => {
    if (!st.energia) return
    if (params.falla === 'cortocircuito') set({ pia: false, disparo: 'magnetico' })
    else if (params.falla === 'fuga') set({ dif: false, disparo: 'diferencial' })
    else if (params.falla === 'sobrecarga') {
      let n = 5
      setLeft(n)
      const id = window.setInterval(() => {
        n -= 1
        setLeft(n)
        if (n <= 0) {
          window.clearInterval(id)
          setLeft(null)
          set({ pia: false, disparo: 'termico' })
        }
      }, 1000)
      return () => {
        window.clearInterval(id)
        setLeft(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.falla, st.energia])
  return (
    <>
      <Field label="Circuito">
        <Segmented<Circuito2>
          value={params.circuito}
          onChange={(circuito) => set({ circuito })}
          options={[
            { value: 'simple', label: 'Simple' },
            { value: 'serie', label: 'Serie' },
            { value: 'paralelo', label: 'Paralelo' },
            { value: 'escalera', label: 'Escalera' },
          ]}
        />
      </Field>
      <p className="hint">{CIRCUITOS[params.circuito]}</p>
      <Toggle label={params.circuito === 'escalera' ? 'Llave S1 (abajo)' : 'Interruptor S1'} value={params.s1} onChange={(s1) => set({ s1 })} />
      {params.circuito === 'escalera' && <Toggle label="Llave S2 (arriba)" value={params.s2} onChange={(s2) => set({ s2 })} />}
      <Field label="Simular una falla">
        <select className="input" value={params.falla} onChange={(e) => set({ falla: e.target.value as Falla })}>
          <option value="ninguna">Sin fallas</option>
          <option value="sobrecarga">Sobrecarga</option>
          <option value="cortocircuito">Cortocircuito</option>
          <option value="fuga">Persona que toca una parte con tensión (fuga a tierra)</option>
        </select>
      </Field>
      <p className="hint">{FALLAS[params.falla]}</p>
      {left !== null && <Readout label="El bimetal se calienta… corta en" value={`${left} s`} />}
      <Readout label="Diferencial" value={params.dif ? 'cerrado' : 'disparado'} />
      <Readout label="Termomagnético" value={params.pia ? 'cerrado' : 'disparado'} />
      {params.disparo && <p className="hint">⚡ {DISPARO[params.disparo]}</p>}
      {(!params.pia || !params.dif) && (
        <button type="button" className="btn" onClick={() => set({ pia: true, dif: true, disparo: '' })}>
          Rearmar (subir las palancas)
        </button>
      )}
      {(!params.pia || !params.dif) && params.falla !== 'ninguna' && <p className="hint">Si la falla sigue, al rearmar vuelve a disparar: primero hay que encontrar y reparar la falla.</p>}
      <Readout label="Lámparas encendidas" value={[st.h1 && 'H1', st.h2 && 'H2'].filter(Boolean).join(' y ') || 'ninguna'} />
      {(st.h1 || st.h2) && (
        <>
          <Readout label="Tensión en cada lámpara" value={`${st.uLamp} V`} />
          <Readout label="Potencia de cada lámpara" value={`${fmt(st.pLamp, 1)} W`} />
          <Readout label="Corriente total" value={`${fmt(st.i, 3)} A`} />
        </>
      )}
    </>
  )
}

const instalacion: ComponentDef = {
  id: 'instalacion',
  name: 'Los circuitos del taller',
  category: 'Instalación eléctrica',
  icon: '💡',
  short: 'Tablero de práctica con diferencial, termomagnético y los cuatro circuitos: simple, serie, paralelo y escalera. Probá las llaves y simulá fallas.',
  parts: (p) => instalacionParts(p as InstalacionParams),
  camera: [3, 1.5, 23],
  target: [0, 0, 0],
  shadowY: -6.2,
  defaultParams: { circuito: 'simple', s1: true, s2: false, falla: 'ninguna', pia: true, dif: true, disparo: '' } satisfies InstalacionParams,
  render: (p) => <InstalacionModel {...(p as InstalacionParams)} />,
  Controls: InstalacionControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        Son los cuatro planos del taller: <b>una lámpara con un interruptor</b>, <b>dos lámparas en serie</b>, <b>dos lámparas en paralelo</b> y{' '}
        <b>dos lámparas en escalera</b> (combinación). Todos se alimentan con <b>220 V</b> de corriente alterna (fase y neutro) y pasan primero por el
        tablero con el <b>interruptor diferencial</b> y el <b>termomagnético</b>.
      </p>
      <ul>
        <li>
          El interruptor siempre corta la <b>fase</b>: así, con la llave abierta, la lámpara queda sin tensión.
        </li>
        <li>
          En <b>serie</b> cada lámpara de 220 V recibe 110 V: da la cuarta parte de su potencia y alumbra poco.
        </li>
        <li>
          En <b>paralelo</b> las dos reciben 220 V. Es como se conecta todo en una casa.
        </li>
        <li>
          En <b>escalera</b>, con dos llaves de combinación, la lámpara se prende o se apaga desde cualquiera de los dos lugares.
        </li>
      </ul>
    </>
  ),
  activities: [
    { id: 'e2-inst-1', type: 'mc', q: '¿Qué conductor corta el interruptor?', options: ['La fase', 'El neutro', 'La tierra', 'Cualquiera'], answer: 0, explain: 'Así, con la llave abierta, la lámpara queda sin tensión.' },
    { id: 'e2-inst-2', type: 'mc', q: 'Dos lámparas de 220 V en serie conectadas a 220 V…', options: ['Alumbran poco: cada una recibe 110 V', 'Alumbran normal', 'Se queman', 'No prenden nunca'], answer: 0, explain: 'La tensión se divide entre las dos.' },
    { id: 'e2-inst-3', type: 'mc', q: '¿Qué circuito permite prender una lámpara desde dos lugares?', options: ['Escalera (combinación)', 'Serie', 'Simple', 'Paralelo con un interruptor'], answer: 0, explain: 'Usa dos llaves de combinación.' },
    { id: 'e2-inst-4', type: 'mc', q: '¿Qué protección actúa si una persona toca una parte con tensión?', options: ['El diferencial', 'La parte térmica del termomagnético', 'El fusible', 'Ninguna'], answer: 0, explain: 'Detecta la corriente que se escapa a tierra.' },
    { id: 'e2-inst-5', type: 'mc', q: '¿De qué color es el neutro?', options: ['Celeste', 'Marrón', 'Verde y amarillo', 'Rojo'], answer: 0, explain: 'Fase marrón (o negro/rojo), tierra verde-amarilla.' },
  ],
}

/* ------------------------------------------------------------------ termomagnético */

function PiaControls({ params, set }: { params: PiaParams; set: (p: Partial<PiaParams>) => void }) {
  const t = TIEMPO_DISPARO[params.situacion]
  return (
    <>
      <Field label="Qué pasa en el circuito">
        <Segmented<Situacion>
          value={params.situacion}
          onChange={(situacion) => set({ situacion, rearme: params.rearme + 1 })}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'sobrecarga', label: 'Sobrecarga' },
            { value: 'cortocircuito', label: 'Cortocircuito' },
          ]}
        />
      </Field>
      <Readout label="Corriente" value={params.situacion === 'normal' ? '8 A (menos que 10 A)' : params.situacion === 'sobrecarga' ? '15 A (1,5 × In)' : '¡2000 A!'} />
      <Readout label="Actúa" value={params.situacion === 'normal' ? 'nada: sigue cerrado' : params.situacion === 'sobrecarga' ? `la parte térmica, a los ${t} s` : 'la parte magnética, al instante'} />
      <Toggle label="Sacar la tapa transparente" value={params.corte} onChange={(corte) => set({ corte })} />
      <button type="button" className="btn" onClick={() => set({ rearme: params.rearme + 1 })}>
        Rearmar y repetir
      </button>
    </>
  )
}

const termomagnetico: ComponentDef = {
  id: 'termomagnetico',
  name: 'Termomagnético por dentro',
  category: 'Protecciones',
  icon: '🔌',
  short: 'Mirá cómo el bimetal corta una sobrecarga y la bobina un cortocircuito.',
  parts: PIA_PARTS,
  camera: [6, 2, 13],
  target: [0, 0.4, 0],
  shadowY: -4.2,
  defaultParams: { situacion: 'sobrecarga', rearme: 0, corte: false } satisfies PiaParams,
  render: (p) => <PiaModel {...(p as PiaParams)} />,
  Controls: PiaControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        El <b>interruptor termomagnético</b> (PIA, pequeño interruptor automático) corta la corriente cuando pasa de cierto valor. Usa dos efectos
        de la corriente:
      </p>
      <ul>
        <li>
          <b>Térmico</b>: un bimetal se calienta y se curva. Corta las <b>sobrecargas</b> (demasiados artefactos), más rápido cuanto más grande es.
        </li>
        <li>
          <b>Magnético</b>: una bobina atrae un percutor. Corta los <b>cortocircuitos</b> al instante.
        </li>
      </ul>
      <p>
        Para elegirlo se cumple <b>IB ≤ In ≤ IZ</b>: la corriente del circuito, la nominal del interruptor y la que soporta el cable.
      </p>
    </>
  ),
  activities: [
    { id: 'e2-pia-1', type: 'mc', q: '¿Qué parte del termomagnético corta un cortocircuito?', options: ['La magnética (bobina)', 'La térmica (bimetal)', 'El botón de prueba', 'La cámara apagachispas'], answer: 0, explain: 'Actúa al instante.' },
    { id: 'e2-pia-2', type: 'mc', q: '¿Qué parte corta una sobrecarga?', options: ['La térmica (bimetal)', 'La magnética', 'El neutro', 'El diferencial'], answer: 0, explain: 'El bimetal se calienta y se curva.' },
    { id: 'e2-pia-3', type: 'mc', q: '¿Para qué sirve la cámara apagachispas?', options: ['Para dividir y enfriar el arco al abrir los contactos', 'Para medir la corriente', 'Para probar el interruptor', 'Para conectar la tierra'], answer: 0, explain: 'Son placas metálicas.' },
  ],
}

/* ------------------------------------------------------------------ diferencial */

function DifControls({ params, set }: { params: DiferencialParams; set: (p: Partial<DiferencialParams>) => void }) {
  const dispara = params.fuga >= params.sensibilidad
  return (
    <>
      <Slider label="Corriente que se escapa a tierra" value={params.fuga} min={0} max={60} step={1} onChange={(fuga) => set({ fuga })} format={(x) => `${x} mA`} />
      <Field label="Sensibilidad">
        <Segmented<number>
          value={params.sensibilidad}
          onChange={(sensibilidad) => set({ sensibilidad })}
          options={[
            { value: 10, label: '10 mA' },
            { value: 30, label: '30 mA' },
          ]}
        />
      </Field>
      <Readout label="Va por la fase" value="200 mA" />
      <Readout label="Vuelve por el neutro" value={`${200 - params.fuga} mA`} />
      <Readout label="Diferencia" value={`${params.fuga} mA`} />
      <Readout label="Estado" value={dispara ? '⚡ DISPARA' : 'cerrado'} />
      <p className="hint">
        {dispara
          ? 'La diferencia supera la sensibilidad: el diferencial abre el circuito en menos de 30 ms y protege a la persona.'
          : 'Por Kirchhoff, si no hay fugas, la corriente que entra es igual a la que sale. Subí la fuga para ver cuándo dispara.'}
      </p>
    </>
  )
}

const diferencial: ComponentDef = {
  id: 'diferencial',
  name: 'Diferencial por dentro',
  category: 'Protecciones',
  icon: '🛡️',
  short: 'El toroide compara la corriente que va con la que vuelve. Si se escapan 30 mA, dispara.',
  parts: DIF_PARTS,
  camera: [5, 2, 11],
  target: [0, 0, 0],
  shadowY: -4,
  defaultParams: { fuga: 0, sensibilidad: 30, rearme: 0 } satisfies DiferencialParams,
  render: (p) => <DiferencialModel {...(p as DiferencialParams)} />,
  Controls: DifControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        El <b>interruptor diferencial</b> protege a las <b>personas y animales</b> de contactos directos e indirectos. Se basa en la{' '}
        <b>ley de Kirchhoff</b>: la corriente que entra a un circuito es igual a la que sale.
      </p>
      <p>
        Si una parte de la corriente se escapa a tierra (por ejemplo, por el cuerpo de una persona), la que vuelve por el neutro es menor. Cuando esa
        diferencia supera su <b>sensibilidad</b> (en las casas, <b>30 mA</b>), el diferencial abre el circuito.
      </p>
    </>
  ),
  activities: [
    { id: 'e2-dif-1', type: 'mc', q: '¿Qué compara el diferencial?', options: ['La corriente que va por la fase con la que vuelve por el neutro', 'La tensión con la corriente', 'La potencia con la energía', 'La fase con la tierra'], answer: 0, explain: 'Si no son iguales, hay una fuga.' },
    { id: 'e2-dif-2', type: 'num', q: '¿Cuál es la sensibilidad habitual de un diferencial domiciliario? (mA)', answer: 30, tolerance: 0, unit: 'mA', explain: '30 mA.' },
    { id: 'e2-dif-3', type: 'mc', q: '¿El diferencial protege contra los cortocircuitos entre fase y neutro?', options: ['No: para eso está el termomagnético', 'Sí, siempre', 'Sólo de noche', 'Sólo si tiene botón T'], answer: 0, explain: 'En un cortocircuito F-N la corriente que va y vuelve es la misma.' },
  ],
}

/* ------------------------------------------------------------------ multímetro */

function MultiControls({ params, set }: { params: MultimetroParams; set: (p: Partial<MultimetroParams>) => void }) {
  const l = lectura(params)
  return (
    <>
      <Field label="Llave selectora">
        <Segmented<ModoMulti>
          value={params.modo}
          onChange={(modo) => set({ modo })}
          options={[
            { value: 'OFF', label: 'OFF' },
            { value: 'V~', label: 'V~' },
            { value: 'A', label: 'A' },
            { value: 'Ω', label: 'Ω' },
          ]}
        />
      </Field>
      <Field label="Conectado a la lámpara (60 W, 220 V) en…">
        <Segmented<'paralelo' | 'serie'>
          value={params.conexion}
          onChange={(conexion) => set({ conexion })}
          options={[
            { value: 'paralelo', label: 'Paralelo' },
            { value: 'serie', label: 'Serie' },
          ]}
        />
      </Field>
      <Readout label="Display" value={l.text || '—'} />
      <p className="hint">
        {l.ok ? '✔ ' : '✘ '}
        {l.msg}
      </p>
    </>
  )
}

const multimetro: ComponentDef = {
  id: 'multimetro',
  name: 'Multímetro (tester)',
  category: 'Instrumentos',
  icon: '📟',
  short: 'Medí tensión en paralelo y corriente en serie. ¿Qué pasa si lo conectás mal?',
  parts: MULTI_PARTS,
  camera: [0, 1, 18],
  target: [0, -2.2, 0],
  shadowY: -6,
  defaultParams: { modo: 'V~', conexion: 'paralelo' } satisfies MultimetroParams,
  render: (p) => <MultimetroModel {...(p as MultimetroParams)} />,
  Controls: MultiControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        El <b>multímetro</b> o tester mide magnitudes activas (tensión, corriente) y pasivas (resistencia), en continua o en alterna y en varios rangos.
      </p>
      <ul>
        <li>
          <b>Tensión</b>: en <b>paralelo</b> con el elemento.
        </li>
        <li>
          <b>Corriente</b>: en <b>serie</b>, abriendo el circuito.
        </li>
        <li>
          <b>Resistencia</b>: siempre <b>sin tensión</b>.
        </li>
      </ul>
    </>
  ),
  activities: [
    { id: 'e2-multi-1', type: 'mc', q: '¿Cómo se conecta el multímetro para medir tensión?', options: ['En paralelo', 'En serie', 'Sin tensión', 'A tierra'], answer: 0, explain: 'Entre los dos bornes del elemento.' },
    { id: 'e2-multi-2', type: 'mc', q: '¿Cómo se conecta para medir corriente?', options: ['En serie', 'En paralelo', 'Entre fase y tierra', 'No se puede'], answer: 0, explain: 'La corriente tiene que pasar por el instrumento.' },
    { id: 'e2-multi-3', type: 'mc', q: '¿Qué pasa si conectás el amperímetro en paralelo con la línea?', options: ['Hace un cortocircuito', 'Mide la tensión', 'Mide bien la corriente', 'No pasa nada'], answer: 0, explain: 'Su resistencia es casi cero.' },
  ],
}

export const ELECTRICIDAD2_CATALOG: ComponentDef[] = [instalacion, termomagnetico, diferencial, multimetro]

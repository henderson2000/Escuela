import type { ComponentDef } from '../../catalog/types'
import { Field, Readout, Segmented, Toggle } from '../../components/ui'
import { DiscoModel, discoParts, PC_PARTS, PcModel, PERIF_PARTS, PerifericosModel, type DiscoParams, type PcParams, type PerifParams } from '../../three/models/primero/Computadora'

const pc: ComponentDef = {
  id: 'pc',
  name: 'El gabinete por dentro',
  category: 'La computadora',
  icon: '🖥️',
  short: 'Placa base, procesador, memoria RAM, placa de video, fuente y discos. Sacale la tapa y despiezala.',
  parts: PC_PARTS,
  camera: [7.5, 6.5, 7.5],
  target: [0, 2.1, 0],
  shadowY: 0,
  defaultParams: { encendida: true },
  render: (p) => <PcModel {...(p as PcParams)} />,
  Controls: ({ params, set }) => (
    <>
      <Toggle label="Encendida (giran los ventiladores)" value={!!params.encendida} onChange={(encendida) => set({ encendida })} />
      <p className="hint">
        Los tres componentes fundamentales son el <b>procesador</b>, la <b>memoria RAM</b> y el <b>disco</b>. Tocá cada pieza para ver
        para qué sirve.
      </p>
    </>
  ),
  theory: (
    <>
      <p>
        Una computadora procesa datos en forma automática siguiendo instrucciones, con un ciclo básico: <b>entrada</b>,{' '}
        <b>procesamiento</b>, <b>salida</b> y <b>almacenamiento</b>.
      </p>
      <p>
        La <b>CPU</b> toma instrucciones y datos de la <b>RAM</b>, los procesa y devuelve los resultados a la memoria o a la salida. El{' '}
        <b>disco</b> guarda todo en forma permanente. Todo está conectado a la <b>placa base</b>, por donde viajan los datos como señales
        eléctricas.
      </p>
    </>
  ),
  activities: [
    { id: 'c1-pc-1', type: 'mc', q: '¿Qué componente es el "cerebro" de la computadora?', options: ['El procesador (CPU)', 'La memoria RAM', 'El disco rígido', 'La fuente'], answer: 0, explain: 'La CPU procesa las instrucciones y los datos.' },
    { id: 'c1-pc-2', type: 'mc', q: 'Se cortó la luz. ¿Qué se pierde?', options: ['Lo que estaba sólo en la RAM', 'Lo guardado en el disco', 'Los programas instalados', 'Nada'], answer: 0, explain: 'La RAM es volátil: se borra al apagar. Lo guardado en el disco queda.' },
    { id: 'c1-pc-3', type: 'mc', q: '¿Qué componente conecta a todos los demás?', options: ['La placa base (motherboard)', 'La placa de video', 'El gabinete', 'El ventilador'], answer: 0, explain: 'Tiene ranuras y conectores para todo.' },
    { id: 'c1-pc-4', type: 'mc', q: '¿Qué hace la fuente de alimentación?', options: ['Transforma los 220 V del enchufe en tensiones continuas bajas', 'Procesa las imágenes', 'Guarda los archivos', 'Enfría el procesador'], answer: 0, explain: 'Los componentes usan 12 V, 5 V y 3,3 V de continua.' },
    { id: 'c1-pc-5', type: 'mc', q: '¿Qué componente procesa las imágenes que se ven en el monitor?', options: ['La placa de video (GPU)', 'La RAM', 'El disco', 'La fuente'], answer: 0, explain: 'Tiene su propio procesador y memoria dedicados a gráficos.' },
  ],
}

const disco: ComponentDef = {
  id: 'disco',
  name: 'Disco rígido y SSD',
  category: 'La computadora',
  icon: '💽',
  short: 'Mirá por dentro un disco rígido (HDD) con su plato girando y un disco sólido (SSD) con sus memorias flash.',
  parts: (p) => discoParts(p as DiscoParams),
  camera: [4.5, 4.5, 5.5],
  target: [0, 0.3, 0],
  shadowY: -0.1,
  defaultParams: { tipo: 'hdd', encendido: true },
  render: (p) => <DiscoModel {...(p as DiscoParams)} />,
  Controls: ({ params, set }) => (
    <>
      <Field label="Tipo de disco">
        <Segmented<'hdd' | 'ssd'>
          value={params.tipo}
          onChange={(tipo) => set({ tipo })}
          options={[
            { value: 'hdd', label: 'Disco rígido (HDD)' },
            { value: 'ssd', label: 'Disco sólido (SSD)' },
          ]}
        />
      </Field>
      {params.tipo === 'hdd' && <Toggle label="Funcionando (gira el plato)" value={!!params.encendido} onChange={(encendido) => set({ encendido })} />}
      <Readout label="Partes móviles" value={params.tipo === 'hdd' ? 'Sí: plato y cabezal' : 'No: sólo chips'} />
      <Readout label="Velocidad" value={params.tipo === 'hdd' ? 'unos 150 MB/s' : 'unos 550 MB/s (o más en M.2)'} />
      <Readout label="Golpes" value={params.tipo === 'hdd' ? 'Sensible' : 'Resistente'} />
    </>
  ),
  theory: (
    <>
      <p>
        El <b>disco</b> es el dispositivo de almacenamiento principal: guarda en forma permanente los programas, archivos y datos, incluso
        con la computadora apagada.
      </p>
      <p>
        El <b>HDD</b> guarda la información en discos magnéticos que giran a alta velocidad, y un cabezal la lee y la escribe. El{' '}
        <b>SSD</b> usa memorias flash: no tiene partes móviles, es más rápido y menos sensible a los golpes.
      </p>
    </>
  ),
  activities: [
    { id: 'c1-ds-1', type: 'mc', q: '¿Cómo guarda los datos un disco rígido (HDD)?', options: ['En discos magnéticos que giran', 'En chips de memoria flash', 'En la RAM', 'En papel'], answer: 0, explain: 'Un cabezal magnetiza zonas del plato: unos y ceros.' },
    { id: 'c1-ds-2', type: 'mc', q: '¿Por qué un SSD aguanta mejor los golpes?', options: ['Porque no tiene partes móviles', 'Porque es más pesado', 'Porque gira más rápido', 'Porque no guarda nada'], answer: 0, explain: 'Usa memorias flash, sin platos ni cabezales.' },
    { id: 'c1-ds-3', type: 'mc', q: 'Apagás la computadora. Lo que está en el disco…', options: ['Se conserva', 'Se borra', 'Pasa a la RAM', 'Se imprime'], answer: 0, explain: 'El almacenamiento es permanente.' },
    { id: 'c1-ds-4', type: 'mc', q: '¿Qué disco es más rápido?', options: ['El SSD', 'El HDD', 'Son iguales', 'Depende del color'], answer: 0, explain: 'El SSD no tiene que esperar que gire el plato ni que se mueva el cabezal.' },
  ],
}

const perifericos: ComponentDef = {
  id: 'perifericos',
  name: 'Periféricos',
  category: 'Periféricos',
  icon: '⌨️',
  short: 'Monitor, teclado, mouse, parlantes, impresora y cámara: ¿cuáles son de entrada y cuáles de salida?',
  parts: PERIF_PARTS,
  camera: [0, 5, 9.5],
  target: [0, 1.4, 0],
  shadowY: 0,
  defaultParams: { resaltar: 'todos' },
  render: (p) => <PerifericosModel {...(p as PerifParams)} />,
  Controls: ({ params, set }) => (
    <>
      <Field label="Resaltar">
        <Segmented<PerifParams['resaltar']>
          value={params.resaltar}
          onChange={(resaltar) => set({ resaltar })}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'entrada', label: 'Entrada' },
            { value: 'salida', label: 'Salida' },
          ]}
        />
      </Field>
      <p className="hint">
        <b>Entrada</b>: el usuario ingresa datos (teclado, mouse, cámara, micrófono). <b>Salida</b>: la computadora muestra resultados
        (monitor, parlantes, impresora).
      </p>
    </>
  ),
  theory: (
    <>
      <p>
        Los <b>periféricos</b> son dispositivos conectados a la computadora que permiten la entrada y salida de datos. El teclado y el mouse
        son de <b>entrada</b>: con ellos el usuario ingresa datos y comandos. La pantalla y la impresora son de <b>salida</b>: muestran la
        información o la imprimen en papel.
      </p>
    </>
  ),
  activities: [
    { id: 'c1-pe-1', type: 'mc', q: 'El teclado es un dispositivo de…', options: ['Entrada', 'Salida', 'Almacenamiento', 'Procesamiento'], answer: 0, explain: 'Con él se ingresan datos y comandos.' },
    { id: 'c1-pe-2', type: 'mc', q: 'La impresora es un dispositivo de…', options: ['Salida', 'Entrada', 'Almacenamiento', 'Procesamiento'], answer: 0, explain: 'Pasa la información al papel.' },
    { id: 'c1-pe-3', type: 'mc', q: '¿Cuál de estos es de entrada?', options: ['La cámara web', 'Los parlantes', 'El monitor', 'La impresora'], answer: 0, explain: 'Captura imagen y la ingresa a la computadora.' },
    { id: 'c1-pe-4', type: 'mc', q: '¿Cuál de estos es de salida?', options: ['Los parlantes', 'El mouse', 'El micrófono', 'El teclado'], answer: 0, explain: 'Transforman la señal en sonido para el usuario.' },
  ],
}

export const COMPU1_CATALOG: ComponentDef[] = [pc, disco, perifericos]

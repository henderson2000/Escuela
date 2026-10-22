import type { ReactNode } from 'react'
import { QuizGame, shuffle, type QuizRound } from '../../games/QuizGame'
import { OpSketch, type OpKind } from '../theory'
import { PieceSketch, type PieceSpec } from './sketches'

export const MOUNT_GAME = 'torno-montajes'

type Cat = 'Montaje' | 'Accesorio' | 'Herramienta' | 'Operación' | 'Carro'

interface Situation {
  cat: Cat
  q: string
  /** pieza dibujada con cotas, o bosquejo de una operación */
  piece?: PieceSpec
  op?: OpKind
  /** la primera es la correcta */
  options: [string, string, string, string]
  explain: string
}

const M_AIRE = 'Al aire (plato de 3 mordazas)'
const M_CONTRA = 'Entre plato y contrapunta'
const M_PUNTAS = 'Entre puntas (brida y plato liso)'
const M_LUNETA = 'Con contrapunta y luneta'

export const SITUATIONS: Situation[] = [
  {
    cat: 'Montaje',
    q: 'Eje de acero de 600 mm de largo y ø 20 mm para cilindrar en todo su largo. ¿Qué montaje?',
    piece: { L: 600, D: 20 },
    options: [M_LUNETA, M_AIRE, M_CONTRA, 'En una pinza'],
    explain: 'Es 30 veces más largo que su diámetro: largo y delgado se pandea. Además de la contrapunta lleva luneta.',
  },
  {
    cat: 'Montaje',
    q: 'Buje de ø 40 mm y 30 mm de largo. ¿Qué montaje?',
    piece: { L: 30, D: 40, shape: 'tube' },
    options: [M_AIRE, M_PUNTAS, M_LUNETA, M_CONTRA],
    explain: 'Pieza corta y liviana: al aire, tomada de un solo extremo.',
  },
  {
    cat: 'Montaje',
    q: 'Eje de ø 30 mm y 250 mm de largo para cilindrar de una sola vez. ¿Qué montaje?',
    piece: { L: 250, D: 30 },
    options: [M_CONTRA, M_AIRE, M_LUNETA, 'En una pinza'],
    explain: 'Más de 8 veces el diámetro: no conviene un extremo suspendido. Plato y contrapunta, con agujero de centro.',
  },
  {
    cat: 'Montaje',
    q: 'Eje escalonado que hay que mecanizar de los dos lados manteniendo todos los diámetros concéntricos. ¿Qué montaje?',
    piece: { L: 300, D: 40, shape: 'stepped' },
    options: [M_PUNTAS, M_AIRE, 'Plato de 4 mordazas', 'Con luneta móvil solamente'],
    explain: 'Entre puntas: se cambia la brida de extremo y se da vuelta la pieza sin perder los centros.',
  },
  {
    cat: 'Montaje',
    q: 'Cono largo y poco pronunciado (ø 40 → ø 36 mm en 400 mm) hecho desplazando la contrapunta. ¿Qué montaje es obligatorio?',
    piece: { L: 400, D: 40, feature: 'longcone' },
    options: [M_PUNTAS, M_AIRE, M_CONTRA, 'Con pinza'],
    explain: 'El desplazamiento de la contrapunta sólo se puede hacer entre puntas.',
  },
  {
    cat: 'Montaje',
    q: 'Disco de ø 60 mm y 15 mm de espesor para frentear. ¿Qué montaje?',
    piece: { L: 15, D: 60, feature: 'face' },
    options: [M_AIRE, M_PUNTAS, M_LUNETA, M_CONTRA],
    explain: 'Corto y liviano: al aire.',
  },
  {
    cat: 'Montaje',
    q: 'Hay que tornear el interior del extremo de un tubo de 800 mm de largo. ¿Cómo lo sostenés del lado del extremo libre?',
    piece: { L: 800, D: 50, shape: 'tube', feature: 'bore' },
    options: ['Con una luneta fija cerca del extremo', 'Con la contrapunta', 'Al aire, sin apoyo', 'Con la brida'],
    explain: 'Para mecanizar interiormente piezas largas se usa la luneta fija: la contrapunta ocuparía el agujero.',
  },
  {
    cat: 'Accesorio',
    q: 'Barra hexagonal de 24 mm entre caras. ¿Qué plato?',
    piece: { L: 120, D: 24, shape: 'hex' },
    options: ['Plato universal de 3 mordazas', 'Plato liso de arrastre', 'Plato de 4 mordazas solamente', 'Ninguno: no se puede tornear'],
    explain: 'El plato de 3 mordazas toma piezas con caras múltiplo de 3: el hexágono tiene 6.',
  },
  {
    cat: 'Accesorio',
    q: 'Barra cuadrada de 30 mm a la que hay que hacerle una punta cilíndrica. ¿Qué plato?',
    piece: { L: 100, D: 30, shape: 'square' },
    options: ['Plato de 4 mordazas', 'Plato de 3 mordazas', 'Plato liso de arrastre', 'Pinza redonda'],
    explain: 'Cuatro caras: plato de 4 mordazas, cada una se ajusta por separado.',
  },
  {
    cat: 'Accesorio',
    q: 'Tapa de fundición con forma irregular, hay que hacerle un agujero centrado. ¿Qué plato?',
    piece: { L: 40, D: 90, shape: 'irregular', feature: 'drill' },
    options: ['Plato de 4 mordazas', 'Plato de 3 mordazas', 'Plato liso de arrastre', 'Pinza'],
    explain: 'Geometría variada: 4 mordazas independientes.',
  },
  {
    cat: 'Accesorio',
    q: 'Hay que hacer 300 pernos iguales de ø 8 mm. ¿Qué conviene para sujetarlos rápido y precisos?',
    piece: { L: 40, D: 8, note: '× 300 piezas' },
    options: ['Una pinza de ø 8 mm', 'Plato de 4 mordazas', 'Luneta fija', 'Entre puntas'],
    explain: 'La pinza sujeta muy bien; su desventaja (pocos diámetros) no importa si todas son iguales.',
  },
  {
    cat: 'Accesorio',
    q: 'Pieza de aluminio ya terminada: hay que hacerle un chaflán sin marcarla. ¿Qué usás?',
    piece: { L: 60, D: 40, feature: 'chamfer', note: 'aluminio, terminada' },
    options: ['Mordazas blandas', 'Mordazas invertidas', 'Punto fijo', 'Brida'],
    explain: 'Mordazas blandas: para materiales blandos o para no lastimar la pieza.',
  },
  {
    cat: 'Accesorio',
    q: 'Brida de ø 260 mm y 25 mm de espesor. ¿Cómo la tomás en el plato de 3 mordazas?',
    piece: { L: 25, D: 260 },
    options: ['Con mordazas invertidas', 'Con mordazas blandas', 'Con pinza', 'No se puede'],
    explain: 'Las mordazas invertidas son para diámetros grandes.',
  },
  {
    cat: 'Accesorio',
    q: 'Montaje entre puntas: ¿qué hace girar a la pieza?',
    piece: { L: 300, D: 35, feature: 'center' },
    options: ['La brida enganchada en el perno del plato liso', 'El punto de la contrapunta', 'La luneta', 'El tornillo patrón'],
    explain: 'La cola de la brida engancha en el perno del plato liso de arrastre.',
  },
  {
    cat: 'Accesorio',
    q: 'Con contrapunta, vas a trabajar mucho rato a muchas rpm. ¿Qué punto ponés?',
    piece: { L: 250, D: 30, feature: 'center' },
    options: ['Punto giratorio (con rulemanes)', 'Punto fijo sin lubricar', 'Ninguno', 'Una pinza'],
    explain: 'El giratorio gira con la pieza y no necesita lubricación. El fijo debe estar siempre lubricado.',
  },
  {
    cat: 'Accesorio',
    q: 'Eje largo y delgado para cilindrar a lo largo: querés un apoyo que acompañe a la herramienta. ¿Cuál?',
    piece: { L: 500, D: 16 },
    options: ['Luneta móvil (atornillada al carro)', 'Luneta fija', 'Brida', 'Plato liso'],
    explain: 'La luneta móvil acompaña al carro; la herramienta pone el apoyo que falta.',
  },
  {
    cat: 'Herramienta',
    q: 'Antes de apoyar un punto, ¿con qué hacés el agujero en la cara de la pieza?',
    piece: { L: 200, D: 30, feature: 'center' },
    options: ['Mecha de centrar (cono de 60°)', 'Moleta', 'Herramienta de tronzar', 'Macho de roscar'],
    explain: 'La mecha de centrar deja una cavidad cónica de 60° donde apoya el punto.',
  },
  {
    cat: 'Herramienta',
    q: 'Agujero de ø 10 mm en el centro de la cara. ¿Con qué?',
    piece: { L: 60, D: 40, feature: 'drill' },
    options: ['Mecha en un mandril portabrocas en la contrapunta', 'Herramienta de cilindrar', 'Moleta', 'Luneta'],
    explain: 'La mecha va en el mandril clavado en el manguito; se avanza con el volante, con la contrapunta bloqueada.',
  },
  {
    cat: 'Herramienta',
    q: 'Agujero de ø 40 mm en una pieza grande. ¿Qué broca?',
    piece: { L: 80, D: 100, feature: 'drill' },
    options: ['Broca de cola cónica (cono Morse en el manguito)', 'Mecha de centrar', 'Mecha de ø 4 mm', 'Moleta'],
    explain: 'Para diámetros grandes, brocas de cola cónica directamente en el cono Morse.',
  },
  {
    cat: 'Herramienta',
    q: 'Rosca M12 × 1,75 exterior. ¿Qué herramienta?',
    piece: { L: 80, D: 12, feature: 'thread', note: 'M12 × 1,75' },
    options: ['Herramienta de roscar de 60°', 'Herramienta de roscar de 55°', 'Herramienta de tronzar', 'Moleta'],
    explain: 'La rosca métrica tiene un ángulo de filete de 60°.',
  },
  {
    cat: 'Herramienta',
    q: 'Rosca W 1/2" exterior. ¿Qué herramienta?',
    piece: { L: 80, D: 12.7, feature: 'thread', note: 'W 1/2"' },
    options: ['Herramienta de roscar de 55°', 'Herramienta de roscar de 60°', 'Mecha de centrar', 'Barra de interiores'],
    explain: 'La rosca Whitworth tiene un ángulo de filete de 55°.',
  },
  {
    cat: 'Herramienta',
    q: 'Rosca interna chica (M6) en el torno, sin herramienta de roscar interior. ¿Qué usás?',
    piece: { L: 30, D: 20, feature: 'bore', note: 'rosca interior M6' },
    options: ['Macho de roscar apoyado en la contrapunta, a muy bajas rpm', 'Terraja a muchas rpm', 'Moleta', 'Mecha de centrar'],
    explain: 'Macho (interior) o terraja (exterior), montados entre la pieza y la contrapunta, con muy pocas vueltas.',
  },
  {
    cat: 'Herramienta',
    q: 'Producción de muchas piezas de acero a alta velocidad de corte. ¿Qué herramienta conviene?',
    piece: { L: 120, D: 40, note: 'acero · 500 piezas' },
    options: ['Inserto de metal duro en un portainsertos', 'Acero rápido, reafilando seguido', 'Una lima', 'Una moleta'],
    explain: 'El inserto no se reafila (se gira o cambia) y admite Vc mucho mayores.',
  },
  {
    cat: 'Herramienta',
    q: 'Agrandar con precisión un agujero ya perforado de ø 20 a ø 24 mm. ¿Qué herramienta?',
    piece: { L: 60, D: 50, shape: 'tube' },
    options: ['Barra de interiores (torneado interior)', 'Herramienta de frentear', 'Moleta', 'Herramienta de tronzar'],
    explain: 'Torneado interior: herramienta larga y de formato especial, que entra en el agujero previo.',
  },
  {
    cat: 'Operación',
    q: '¿Qué operación es esta?',
    op: 'moleteado',
    options: ['Moleteado', 'Roscado', 'Ranurado', 'Frenteado'],
    explain: 'La moleta comprime y graba la superficie: la única operación que no saca viruta.',
  },
  {
    cat: 'Operación',
    q: 'Hay que cortar la pieza terminada y separarla de la barra. ¿Qué operación?',
    piece: { L: 160, D: 30, feature: 'part' },
    options: ['Tronzado', 'Moleteado', 'Frenteado', 'Perforado'],
    explain: 'Tronzado: un ranurado que llega hasta el centro.',
  },
  {
    cat: 'Operación',
    q: 'Alojamiento para un o-ring en un eje. ¿Qué operación?',
    piece: { L: 120, D: 30, feature: 'groove' },
    options: ['Ranurado', 'Moleteado', 'Roscado', 'Cilindrado'],
    explain: 'Una herramienta de perfil delgado penetra perpendicular al eje.',
  },
  {
    cat: 'Operación',
    q: 'Mango que tiene que tener agarre para que no resbale en la mano. ¿Qué operación?',
    piece: { L: 120, D: 25, feature: 'knurl' },
    options: ['Moleteado', 'Tronzado', 'Roscado', 'Perforado'],
    explain: 'El grabado de la moleta evita el deslizamiento.',
  },
  {
    cat: 'Operación',
    q: '¿Qué operación es esta?',
    op: 'frenteado',
    options: ['Frenteado', 'Cilindrado', 'Tronzado', 'Moleteado'],
    explain: 'Se limpia el frente de la pieza avanzando hacia el eje.',
  },
  {
    cat: 'Operación',
    q: '¿Qué operación es esta?',
    op: 'interior',
    options: ['Torneado interior', 'Perforado', 'Roscado', 'Ranurado'],
    explain: 'Herramienta larga dentro de un agujero previo.',
  },
  {
    cat: 'Operación',
    q: 'Un material frágil, como la fundición gris, ¿qué viruta da?',
    piece: { L: 100, D: 60, note: 'fundición gris' },
    options: ['Arrancada (trozos cortos e iguales)', 'Plástica (larga y espiralada)', 'Desprendida', 'No da viruta'],
    explain: 'Material frágil → viruta arrancada. Ojo: anteojos con cierres laterales.',
  },
  {
    cat: 'Carro',
    q: 'Bajar el diámetro de 50 a 46 mm a lo largo de la pieza. ¿Qué carro avanza?',
    op: 'cilindrado',
    options: ['Carro longitudinal (cilindrado)', 'Carro transversal', 'Charriot', 'Contrapunta'],
    explain: 'Cilindrado: avance paralelo al eje con el longitudinal; la penetración la da el transversal.',
  },
  {
    cat: 'Carro',
    q: 'Dejar plano el extremo de la barra. ¿Qué carro avanza?',
    piece: { L: 120, D: 40, feature: 'face' },
    options: ['Carro transversal (frenteado)', 'Carro longitudinal', 'Charriot', 'Contrapunta'],
    explain: 'Frenteado: el transversal lleva la herramienta hacia el eje (palanca del delantal hacia abajo).',
  },
  {
    cat: 'Carro',
    q: 'Cono corto y pronunciado en la punta de la pieza. ¿Con qué carro lo hacés?',
    piece: { L: 80, D: 40, feature: 'cone' },
    options: ['Charriot inclinado, avanzando a mano', 'Carro longitudinal en automático', 'Carro transversal en automático', 'Desplazando la contrapunta'],
    explain: 'Charriot girado el semiángulo del cono; el avance sólo es manual.',
  },
  {
    cat: 'Carro',
    q: 'En el cilindrado, ¿qué carro da la profundidad de pasada?',
    op: 'cilindrado',
    options: ['Carro transversal', 'Carro longitudinal', 'Charriot', 'Delantal'],
    explain: 'La penetración, perpendicular al eje, es con el transversal.',
  },
  {
    cat: 'Carro',
    q: 'Rosca profunda de paso grande: ¿con qué penetrás para no forzar la punta de la herramienta?',
    op: 'roscado',
    options: ['Con el charriot inclinado (en flanco, β = 90° − α/2)', 'Con el transversal, recto', 'Con el longitudinal', 'Con la contrapunta'],
    explain: 'Penetrando en flanco con el charriot, la punta de perfil delicado trabaja menos.',
  },
  {
    cat: 'Carro',
    q: 'Cilindrado con avance automático: ¿qué lleva el movimiento desde la caja Norton al delantal?',
    op: 'cilindrado',
    options: ['La barra de avances', 'El tornillo patrón', 'La correa', 'La brida'],
    explain: 'La barra de avances; el tornillo patrón (con la tuerca partida) es para roscar.',
  },
  {
    cat: 'Carro',
    q: 'Al roscar, ¿qué cerrás sobre el tornillo patrón para que avance el carro longitudinal?',
    op: 'roscado',
    options: ['La tuerca partida', 'El freno de la contrapunta', 'La luneta', 'El plato'],
    explain: 'La palanca de la tuerca partida (en el delantal) engancha el carro con el tornillo patrón.',
  },
]

const CAT_ICON: Record<Cat, string> = {
  Montaje: '🗜️',
  Accesorio: '🔩',
  Herramienta: '🔪',
  Operación: '🛠️',
  Carro: '↔️',
}

function visualOf(s: Situation): ReactNode {
  return (
    <div className="tn-scene">
      <span className="tn-tag">
        {CAT_ICON[s.cat]} {s.cat}
      </span>
      {s.piece ? <PieceSketch {...s.piece} /> : s.op ? <OpSketch op={s.op} width={360} /> : null}
    </div>
  )
}

export function makeMountRounds(n = 10): QuizRound[] {
  return shuffle(SITUATIONS)
    .slice(0, n)
    .map((s) => {
      const opts = s.options.map((label, i) => ({ id: String(i), label }))
      return {
        prompt: s.q,
        visual: visualOf(s),
        options: shuffle(opts),
        answer: '0',
        explain: s.explain,
      }
    })
}

export function MountGame() {
  return (
    <QuizGame
      game={MOUNT_GAME}
      title="¿Cómo lo mecanizo?"
      icon="🗜️"
      info="Mirá la pieza y lo que hay que hacer: elegí el montaje, el accesorio, la herramienta, la operación o el carro. Cada partida trae situaciones distintas."
      intro={<p>10 situaciones de taller. Respuesta correcta: 15 puntos + hasta 5 de bonus por rapidez (máximo 200).</p>}
      makeRounds={() => makeMountRounds(10)}
    />
  )
}

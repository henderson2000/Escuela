// Guía de Ajuste, 1er año: trabajo práctico de limado, plano y ciclo de fabricación del martillo de peña.
import type { GuideSection } from '../../lib/subject'

export const AJUSTE1_GUIDE: GuideSection[] = [
  {
    id: 'a1g-tp1',
    title: 'Trabajo práctico · 1 a 3: limado, desbastado y acabado, partes de la lima',
    intro: 'Preguntas 1, 2 y 3 del trabajo práctico de Ajuste.',
    activities: [
      { id: 'a1g-1a', type: 'mc', q: '1. ¿Cuál es el objetivo del limado en el ajuste de piezas metálicas?', options: ['Dar a la pieza la forma y las dimensiones deseadas quitando pequeñas cantidades de metal', 'Unir dos piezas', 'Endurecer el metal', 'Cortar la barra a medida con sierra'], answer: 0, explain: 'Es una operación manual de arranque de material.' },
      { id: 'a1g-2a', type: 'mc', q: '2. ¿Cuál es la diferencia entre desbastado y acabado?', options: ['Desbastado: mucho material y huellas visibles. Acabado: poco material y superficie lisa', 'Son lo mismo', 'El acabado saca más material', 'El desbastado se hace con lima fina'], answer: 0, explain: 'El desbastado aproxima a la medida; el acabado termina.' },
      { id: 'a1g-3a', type: 'mc', q: '3. ¿Qué función cumple la espiga?', options: ['Se inserta dentro del mango', 'Tiene los dientes', 'Es la empuñadura', 'Es el extremo libre'], answer: 0, explain: 'Mango = empuñadura; cuerpo = dientes; punta = extremo opuesto.' },
      { id: 'a1g-3b', type: 'mc', q: '3. ¿Qué parte de la lima tiene el picado?', options: ['El cuerpo', 'El mango', 'La espiga', 'La punta solamente'], answer: 0, explain: 'Es la parte activa.' },
    ],
  },
  {
    id: 'a1g-tp2',
    title: 'Trabajo práctico · 4 a 7: clasificación, tamaño, formas y picado',
    intro: 'Preguntas 4 a 7 del trabajo práctico.',
    activities: [
      { id: 'a1g-4a', type: 'mc', q: '4. ¿Cuáles son los cuatro criterios para clasificar las limas?', options: ['Tamaño, forma, picado y grado de corte', 'Color, peso, marca y precio', 'Largo del mango, material, forma y color', 'Dureza, peso, tamaño y marca'], answer: 0, explain: 'Son los cuatro factores críticos para elegir la lima.' },
      { id: 'a1g-5a', type: 'mc', q: '5. ¿Qué problema aparece si la lima es demasiado pequeña para la pieza?', options: ['El acabado queda irregular', 'Se pierde el control', 'No pasa nada', 'La lima se rompe siempre'], answer: 0, explain: 'Caso A.' },
      { id: 'a1g-5b', type: 'mc', q: '5. ¿Y si es demasiado grande?', options: ['Se pierde el control de la herramienta', 'Queda un acabado espejo', 'Corta más fino', 'Nada'], answer: 0, explain: 'Caso B.' },
      { id: 'a1g-6a', type: 'mc', q: '6. Tenés que limar el interior de un agujero redondo. ¿Qué forma de lima usás?', options: ['Redonda', 'Plana', 'Cuadrada', 'Triangular'], answer: 0, explain: 'Superficies cóncavas y agujeros.' },
      { id: 'a1g-6b', type: 'mc', q: '6. Para un ángulo interno agudo, ¿qué lima?', options: ['Triangular', 'Redonda', 'Media caña', 'Plana'], answer: 0, explain: 'Caras a 60°.' },
      { id: 'a1g-6c', type: 'mc', q: '6. Para pasar de una superficie plana a una curva cóncava…', options: ['Media caña', 'Cuadrada', 'Triangular', 'Escofina'], answer: 0, explain: 'Una cara plana y otra curva.' },
      { id: 'a1g-7a', type: 'mc', q: '7. ¿Qué diferencia al picado doble del simple?', options: ['Tiene dos filas de surcos cruzadas que rompen la viruta', 'Tiene el doble de largo', 'Es para madera', 'No tiene dientes'], answer: 0, explain: 'Dientes de diamante; el estándar para acero.' },
      { id: 'a1g-7b', type: 'mc', q: '7. ¿En qué materiales se usa la escofina?', options: ['Madera, caucho y cuero', 'Acero templado', 'Vidrio', 'Bronce y acero'], answer: 0, explain: 'Dientes individuales muy salientes.' },
    ],
  },
  {
    id: 'a1g-tp3',
    title: 'Trabajo práctico · 8 a 10: etapas, postura y dirección',
    intro: 'Preguntas 8, 9 y 10 del trabajo práctico.',
    activities: [
      { id: 'a1g-8a', type: 'mc', q: '8. ¿En qué orden van las etapas del limado?', options: ['Desbastado → afinado → pulido', 'Pulido → afinado → desbastado', 'Afinado → desbastado → pulido', 'Sólo se pule'], answer: 0, explain: 'Cada etapa prepara la superficie para la siguiente.' },
      { id: 'a1g-8b', type: 'mc', q: '8. ¿Qué herramienta se usa en el desbastado?', options: ['Lima basta', 'Lima fina con tiza', 'Tela esmeril', 'Lima extrafina'], answer: 0, explain: 'Arranca material rápido.' },
      { id: 'a1g-9a', type: 'mc', q: '9. Un alumno zurdo, ¿qué pie pone adelante?', options: ['El derecho', 'El izquierdo', 'Ninguno', 'Cambia en cada pasada'], answer: 0, explain: 'Diestro: izquierdo; zurdo: derecho.' },
      { id: 'a1g-9b', type: 'mc', q: '9. ¿Cómo se toma el mango con la mano hábil?', options: ['Pulgar arriba y los demás dedos por debajo', 'Con dos dedos', 'Con el puño cerrado del lado de la punta', 'No se toma el mango'], answer: 0, explain: 'Agarre firme y controlado.' },
      { id: 'a1g-9c', type: 'mc', q: '9. ¿Qué pasa si se hace fuerza también al volver la lima?', options: ['Se desafilan los dientes y se raya la pieza', 'Corta el doble', 'Nada', 'La pieza queda más lisa'], answer: 0, explain: 'El material se desprende sólo en el avance.' },
      { id: 'a1g-10a', type: 'mc', q: '10. ¿Cómo debe realizarse la dirección del limado?', options: ['A 45° en la primera pasada y cambiando de dirección en la segunda', 'Siempre en la misma dirección', 'En círculos', 'Sólo hacia arriba'], answer: 0, explain: 'Queda una superficie uniforme.' },
      { id: 'a1g-10b', type: 'mc', q: '10. Para un agujero ciego se usa…', options: ['Una lima pequeña de perfil adecuado', 'La lima más grande', 'Una escofina', 'Una lima plana de 14"'], answer: 0, explain: 'Tiene que entrar y dejar controlar el movimiento.' },
    ],
  },
  {
    id: 'a1g-plano',
    title: 'Lectura del plano del martillo (M01-2020)',
    intro: 'Mirá el martillo en 3D con las cotas activadas. Medidas en milímetros.',
    activities: [
      { id: 'a1g-pl-1', type: 'num', q: '¿Cuál es el lado de la sección cuadrada de la barra?', answer: 22, tolerance: 0, unit: 'mm', explain: '□22.' },
      { id: 'a1g-pl-2', type: 'num', q: '¿Cuánto mide la peña a lo largo?', answer: 35, tolerance: 0, unit: 'mm', explain: 'La cota de 35.' },
      { id: 'a1g-pl-3', type: 'num', q: '¿Cuánto material hay que bajar en la punta de la peña? (de 22 mm a 5 mm)', answer: 17, tolerance: 0, unit: 'mm', explain: '22 − 5 = 17 mm.' },
      { id: 'a1g-pl-4', type: 'num', q: '¿A qué distancia de la punta de la peña empieza el ojo? (centro a 45 mm, radio 5 mm)', answer: 40, tolerance: 0, unit: 'mm', explain: '45 − 5 = 40 mm.' },
      { id: 'a1g-pl-5', type: 'num', q: '¿Qué distancia hay entre los centros del oblongo?', answer: 10, tolerance: 0, unit: 'mm', explain: '55 − 45 = 10 mm.' },
      { id: 'a1g-pl-6', type: 'num', q: 'La tolerancia es ±0,5 mm. ¿Cuál es la medida máxima aceptable del largo de 95 mm?', answer: 95.5, tolerance: 0, unit: 'mm', explain: '95 + 0,5 = 95,5 mm (la mínima es 94,5 mm).' },
      { id: 'a1g-pl-7', type: 'mc', q: 'El plano está en escala 1:1. Eso significa que…', options: ['El dibujo tiene el mismo tamaño que la pieza real', 'El dibujo es el doble', 'El dibujo es la mitad', 'No tiene medidas'], answer: 0, explain: '1:1 = tamaño natural.' },
    ],
  },
  {
    id: 'a1g-ciclo',
    title: 'Ciclo de fabricación del martillo de peña',
    intro: 'Seguí el ciclo (operaciones 10 a 110) en la teoría o en el modelo 3D.',
    activities: [
      { id: 'a1g-ci-1', type: 'mc', q: 'Op. 10: ¿cómo se numeran las caras?', options: ['Como un dado: las opuestas suman 7', 'De 1 a 6 en cualquier orden', 'Con letras', 'No se numeran'], answer: 0, explain: 'La identificación va en la cara 6.' },
      { id: 'a1g-ci-2', type: 'mc', q: 'Op. 20: ¿con qué se controla el paralelismo de la cara 1?', options: ['Regla metálica', 'Granete', 'Gramil', 'Tela esmeril'], answer: 0, explain: 'Se lima con lima bastarda y se controla con la regla.' },
      { id: 'a1g-ci-3', type: 'mc', q: 'Op. 30: además del paralelismo, ¿qué se controla entre cara 1 y cara 2?', options: ['Que estén a escuadra (90°)', 'Que tengan el mismo color', 'Que estén pulidas', 'Nada'], answer: 0, explain: 'Con la escuadra de 90°.' },
      { id: 'a1g-ci-4', type: 'mc', q: 'Op. 70: ¿qué se traza con el gramil apoyando la cara 3 en el mármol?', options: ['Líneas a 35, 45 y 55 mm', 'El oblongo con compás', 'La peña con sierra', 'El cabo'], answer: 0, explain: 'Después se traza el oblongo según el plano.' },
      { id: 'a1g-ci-5', type: 'mc', q: 'Op. 80: ¿con qué se puntean los centros del oblongo?', options: ['Granete', 'Lima redonda', 'Gramil', 'Escuadra'], answer: 0, explain: 'Así la mecha arranca en el lugar justo.' },
      { id: 'a1g-ci-6', type: 'mc', q: 'Op. 90: ¿en qué máquina se perfora el oblongo?', options: ['Taladro de banco', 'Torno', 'Guillotina', 'Plegadora'], answer: 0, explain: 'Con mechas sucesivas, y se termina con lima redonda.' },
      { id: 'a1g-ci-7', type: 'mc', q: '¿Qué operación va justo después de perforar el oblongo?', options: ['Cortar el sobrante de la peña con la sierra y terminarlo a lima (op. 100)', 'Numerar las caras', 'Pintar con sulfato', 'Limar la cara 1'], answer: 0, explain: 'Después viene el pulido (op. 110).' },
      { id: 'a1g-ci-8', type: 'mc', q: 'Op. 110: ¿con qué se pule?', options: ['Lima fina y tela esmeril (con tiza)', 'Lima basta', 'Escofina sola', 'Amoladora'], answer: 0, explain: 'Al terminar se coloca el cabo y se barniza.' },
    ],
  },
]

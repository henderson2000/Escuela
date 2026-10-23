// Guía de autoevaluación del apunte «Soldadura eléctrica por arco» (Prof. Jorge Omar Oliva): 28 preguntas.
import type { GuideSection } from '../../lib/subject'

export const SOLDADURA2_GUIDE: GuideSection[] = [
  {
    id: 's2g-seguridad',
    title: 'Autoevaluación · 1 a 7: seguridad y protección',
    intro: 'Preguntas 1 a 7 de la guía de autoevaluación.',
    activities: [
      { id: 's2g-1', type: 'mc', q: '1. ¿Qué se entiende por familiarización con el equipo?', options: ['Recibir instrucciones exactas y completas sobre su manejo antes de usarlo', 'Limpiar el equipo', 'Conocer la marca', 'Usarlo un rato para aprender'], answer: 0, explain: 'Usarlo sin instrucciones pone en riesgo el equipo y a las personas.' },
      { id: 's2g-2a', type: 'mc', q: '2. ¿Cuál es una medida correcta frente al riesgo eléctrico?', options: ['Aislarse de la pieza y de tierra pisando superficies secas y aislantes', 'Soldar con guantes mojados', 'Usar cables con empalmes pelados', 'Tocar el electrodo para ver si hay corriente'], answer: 0, explain: 'También: ropa seca, máquina desconectada para mover o mantener, cables sanos.' },
      { id: 's2g-2b', type: 'mc', q: '2. ¿Cuándo se desconecta la máquina?', options: ['Antes de moverla o hacerle mantenimiento', 'Nunca', 'Sólo a fin de año', 'Mientras se suelda'], answer: 0, explain: 'Y se apaga cuando no se usa.' },
      { id: 's2g-3', type: 'mc', q: '3. ¿Qué medida previene fuego o explosiones?', options: ['Alejar o cubrir los inflamables y tener un matafuego a mano', 'Soldar cerca de aerosoles', 'Tapar las ranuras de la mesa', 'Conectar la masa lejos'], answer: 0, explain: 'También: mesa con ranuras y masa cerca de la soldadura.' },
      { id: 's2g-4a', type: 'mc', q: '4. ¿Qué protege la máscara de soldar?', options: ['Ojos, cara y cuello', 'Sólo las manos', 'El torso', 'Los pies'], answer: 0, explain: 'Con el vidrio inactínico adecuado.' },
      { id: 's2g-4b', type: 'mc', q: '4. ¿Qué protegen los guantes de cuero de puño largo?', options: ['Manos y muñecas', 'La cara', 'El torso', 'Los oídos'], answer: 0, explain: 'Deben ser flexibles.' },
      { id: 's2g-4c', type: 'mc', q: '4. ¿Qué protegen los zapatos de seguridad?', options: ['Los pies y tobillos de las salpicaduras', 'Las rodillas', 'La vista', 'Las manos'], answer: 0, explain: 'Tienen que cubrir los tobillos.' },
      { id: 's2g-5', type: 'mc', q: '5. ¿Por qué es tan importante proteger la vista?', options: ['Las radiaciones invisibles (UV, IR) dañan córnea y cristalino sin que lo notemos', 'Por la luz solamente', 'Porque el humo molesta', 'No es importante'], answer: 0, explain: 'Pueden causar úlceras, quemaduras y catarata profesional.' },
      { id: 's2g-6', type: 'num', q: '6. Se suelda con un electrodo de 2,5 mm (35 a 40 A/mm). ¿Qué número de filtro DIN se usa?', answer: 11, tolerance: 0, unit: '', explain: '2,5 × 35 = 87,5 A y 2,5 × 40 = 100 A: rango 80 – 174 A → DIN 11.' },
      { id: 's2g-7', type: 'mc', q: '7. ¿Qué ventaja tiene una máscara con visor electrónico (fotosensible)?', options: ['Se oscurece sola al encender el arco: no hay riesgo de mirarlo sin protección', 'Es más liviana siempre', 'No necesita filtro', 'Sirve de lentes'], answer: 0, explain: 'Tiene un estado claro y otro oscuro (tono 9 a 13).' },
    ],
  },
  {
    id: 's2g-proceso',
    title: 'Autoevaluación · 8 a 13: soldadura, proceso y arco',
    intro: 'Preguntas 8 a 13.',
    activities: [
      { id: 's2g-8', type: 'mc', q: '8. ¿Cuál es la definición de soldadura?', options: ['Unir sólida y permanentemente dos piezas metálicas, en general elevando su temperatura', 'Pegar dos piezas con adhesivo', 'Atornillar dos chapas', 'Cortar metal con arco'], answer: 0, explain: 'Para que resistan como una sola pieza.' },
      { id: 's2g-9', type: 'mc', q: '9. ¿Por qué la soldadura se volvió un proceso de fabricación importante?', options: ['Sus uniones son más livianas y resistentes que con tornillos o remaches', 'Porque es lenta', 'Porque no necesita energía', 'Porque se puede desarmar'], answer: 0, explain: 'Además sirve para reparar y recubrir.' },
      { id: 's2g-10', type: 'mc', q: '10. ¿Cuál es una característica del proceso con electrodo revestido?', options: ['Es versátil, simple y de bajo costo', 'Sólo sirve en posición plana', 'No produce escoria', 'El arco funciona todo el tiempo'], answer: 0, explain: 'Se suelda casi cualquier espesor en posiciones diversas.' },
      { id: 's2g-11', type: 'mc', q: '11. ¿En qué orden se forma el cordón?', options: ['Arco → gotas al charco de fusión → avance → solidificación → escoria', 'Escoria → arco → charco', 'Cordón → arco → charco', 'Charco → escoria → arco'], answer: 0, explain: 'La escoria se forma encima y se saca al final.' },
      { id: 's2g-12', type: 'mc', q: '12. ¿Cómo se produce el arco eléctrico?', options: ['Con un breve contacto que calienta y luego un gas ionizado que conduce', 'Con una llama', 'Por fricción', 'Con un imán'], answer: 0, explain: 'El revestimiento forma el gas ionizado.' },
      { id: 's2g-13', type: 'mc', q: '13. Una diferencia entre máquinas de corriente alterna y continua es…', options: ['La continua da un arco más estable; la alterna es más simple y casi no tiene soplo magnético', 'La alterna no necesita electrodo', 'La continua no tiene polaridad', 'No hay diferencias'], answer: 0, explain: 'Ver el complemento del tema "El arco eléctrico".' },
    ],
  },
  {
    id: 's2g-electrodo',
    title: 'Autoevaluación · 14 a 17: el electrodo',
    intro: 'Preguntas 14 a 17.',
    activities: [
      { id: 's2g-14a', type: 'mc', q: '14. ¿Qué es el alma del electrodo?', options: ['La varilla de metal que conduce y se funde como aporte', 'El polvo exterior', 'El mango', 'La escoria'], answer: 0, explain: 'Su diámetro es el del electrodo.' },
      { id: 's2g-14b', type: 'mc', q: '14. ¿Dónde está el revestimiento?', options: ['Depositado alrededor del alma, en forma concéntrica', 'Dentro del alma', 'Sólo en la punta', 'En la pinza'], answer: 0, explain: 'Es la parte más importante.' },
      { id: 's2g-15', type: 'mc', q: '15. ¿Cuál es una función del revestimiento?', options: ['Generar gases que protegen el charco del aire', 'Aislar el cable de masa', 'Enfriar la máquina', 'Medir la corriente'], answer: 0, explain: 'También facilita el arco, limpia impurezas y forma la escoria.' },
      { id: 's2g-16', type: 'mc', q: '16. ¿Qué se analiza antes de elegir el tipo de electrodo?', options: ['Metal base, espesor, máquina, posición y tipo de unión', 'Sólo el precio', 'El color de la pieza', 'La hora del día'], answer: 0, explain: 'Cinco factores.' },
      { id: 's2g-17', type: 'mc', q: '17. ¿De qué depende la elección del diámetro?', options: ['Del espesor de las piezas y la preparación de la junta', 'De la marca', 'Del largo del cable', 'Del filtro'], answer: 0, explain: 'Más grueso no siempre es mejor.' },
    ],
  },
  {
    id: 's2g-tecnica',
    title: 'Autoevaluación · 18 a 24: técnica',
    intro: 'Preguntas 18 a 24.',
    activities: [
      { id: 's2g-18', type: 'mc', q: '18. ¿Cuál es el paso correcto para encender el arco?', options: ['Raspar la punta como un fósforo y separar unos milímetros', 'Apoyar y dejar apoyado', 'Golpear fuerte hasta romper el revestimiento', 'Acercar sin tocar nunca'], answer: 0, explain: 'Después se ubica en posición y se avanza.' },
      { id: 's2g-19a', type: 'mc', q: '19. ¿Cómo reconocés que la intensidad está ALTA?', options: ['Arco fuerte, salpicaduras, mordeduras y riesgo de perforar', 'El arco se apaga solo', 'Poca penetración', 'Cordón muy fino'], answer: 0, explain: 'Hay que bajarla.' },
      { id: 's2g-19b', type: 'mc', q: '19. ¿Y que está BAJA?', options: ['El arco se apaga, poca penetración y cordón fino', 'Muchas salpicaduras', 'Se perfora la pieza', 'Mordeduras'], answer: 0, explain: 'Hay que subirla.' },
      { id: 's2g-20', type: 'mc', q: '20. ¿Con qué frecuencia se regula la intensidad?', options: ['En cada trabajo nuevo, al cambiar de diámetro o de posición', 'Una vez por año', 'Nunca', 'Cada 10 electrodos'], answer: 0, explain: 'Tres situaciones.' },
      { id: 's2g-21', type: 'mc', q: '21. ¿Qué separación se aconseja entre la punta del electrodo y la pieza?', options: ['Aproximadamente igual al diámetro del electrodo', 'El doble del diámetro', '1 cm siempre', 'Ninguna: tocando'], answer: 0, explain: 'Muy corto se pega; muy largo, poca penetración.' },
      { id: 's2g-22', type: 'mc', q: '22. ¿Cómo influye la velocidad de avance?', options: ['Si se frena el cordón se ensancha; si se apura, se angosta', 'No influye', 'Sólo cambia el color', 'Cambia la escoria'], answer: 0, explain: 'Hay que mantenerla constante.' },
      { id: 's2g-23', type: 'mc', q: '23. ¿Qué ángulos se usan en una soldadura plana a tope?', options: ['Transversal 90° y de avance 60° a 80°', 'Transversal 45° y de avance 60°', '30° y 30°', '90° y 90°'], answer: 0, explain: 'Son dos ángulos.' },
      { id: 's2g-24', type: 'mc', q: '24. ¿Cómo influye el ángulo del electrodo?', options: ['Más vertical: más penetración; más inclinado: menos', 'No influye', 'Más inclinado: más penetración', 'Sólo cambia la escoria'], answer: 0, explain: 'El ángulo dirige la fuerza del arco.' },
    ],
  },
  {
    id: 's2g-uniones',
    title: 'Autoevaluación · 25 a 28: soplo magnético, uniones y posiciones',
    intro: 'Preguntas 25 a 28. El soplo magnético está explicado en el tema "Técnica" (complemento).',
    activities: [
      { id: 's2g-25', type: 'mc', q: '25. ¿Por qué se produce el soplo magnético?', options: ['Por los campos magnéticos de la corriente de soldadura, que desvían el arco', 'Por el viento', 'Por la humedad del electrodo', 'Por usar máscara'], answer: 0, explain: 'Más común con corriente continua y cerca de los extremos.' },
      { id: 's2g-26', type: 'mc', q: '26. ¿Qué acción corrige el soplo magnético?', options: ['Cambiar de lugar la pinza de masa o inclinar el electrodo', 'Subir mucho la intensidad', 'Alargar el arco', 'Soldar más rápido sin mirar'], answer: 0, explain: 'También acortar el arco o usar corriente alterna.' },
      { id: 's2g-27', type: 'mc', q: '27. ¿Cuáles son los tipos de uniones soldadas?', options: ['A tope, en ángulo, en T y solapadas', 'Plana, horizontal, vertical y sobre cabeza', '1G, 2G, 3G y 4G', 'Con y sin escoria'], answer: 0, explain: 'Las otras son posiciones.' },
      { id: 's2g-28a', type: 'mc', q: '28. ¿Cuáles son las posiciones de soldadura?', options: ['Plana, horizontal, vertical y sobre cabeza', 'A tope, en ángulo, en T y solapada', 'Alta, media y baja', 'Fría y caliente'], answer: 0, explain: 'Se numeran 1 a 4.' },
      { id: 's2g-28b', type: 'mc', q: '28. ¿Cuáles son las más comunes?', options: ['En ángulo 1F y 2F, en T 2F y a tope 1G', 'Sobre cabeza 4G', 'Vertical 3G', 'Ninguna'], answer: 0, explain: 'La plana es la más fácil.' },
    ],
  },
]

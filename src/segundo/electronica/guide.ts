// Guía de ejercicios de Electrónica de 2do año: cálculos, componentes, soldadura y circuito impreso, y fuente de alimentación.
import type { GuideSection } from '../../lib/subject'

export const ELECTRONICA2_GUIDE: GuideSection[] = [
  {
    id: 'e2g-led',
    title: '1 · Resistencias y LEDs',
    intro: 'R = (V − VLED) ÷ I. Para la potencia: P = I² × R. Usá la tensión directa: rojo 2 V, verde 2,2 V, azul y blanco 3 V.',
    activities: [
      { id: 'e2g-1', type: 'num', q: '1. LED rojo con una fuente de 5 V y 20 mA. ¿Qué resistencia se calcula? (Ω)', answer: 150, tolerance: 0.01, unit: 'Ω', explain: '(5 − 2) ÷ 0,02 = 150 Ω.' },
      { id: 'e2g-2', type: 'num', q: '2. LED azul con 9 V y 15 mA. ¿Qué resistencia se calcula? (Ω)', answer: 400, tolerance: 0.01, unit: 'Ω', explain: '(9 − 3) ÷ 0,015 = 400 Ω → valor comercial 470 Ω.' },
      { id: 'e2g-3', type: 'num', q: '3. LED verde con 12 V y 10 mA. ¿Qué resistencia se calcula? (Ω)', answer: 980, tolerance: 0.01, unit: 'Ω', explain: '(12 − 2,2) ÷ 0,01 = 980 Ω → 1 kΩ.' },
      { id: 'e2g-4', type: 'num', q: '4. Un LED rojo con una resistencia de 220 Ω a 5 V. ¿Qué corriente circula? (mA)', answer: 13.6, tolerance: 0.02, unit: 'mA', explain: '(5 − 2) ÷ 220 = 0,0136 A.' },
      { id: 'e2g-5', type: 'num', q: '5. ¿Qué potencia disipa una resistencia de 470 Ω con 20 mA? (W)', answer: 0.188, tolerance: 0.02, unit: 'W', explain: '0,02² × 470 = 0,188 W: alcanza una de ¼ W.' },
      { id: 'e2g-6', type: 'num', q: '6. Dos LEDs rojos en serie a 9 V con 15 mA. ¿Qué resistencia hace falta? (Ω)', answer: 333, tolerance: 0.01, unit: 'Ω', explain: '(9 − 2 − 2) ÷ 0,015 = 333 Ω → 330 Ω.' },
      { id: 'e2g-7', type: 'mc', q: '7. Un LED se conectó a 5 V sin resistencia. ¿Qué pasa?', options: ['Se quema por exceso de corriente', 'Brilla normal', 'No enciende nunca', 'Se ilumina más tenue'], answer: 0, explain: 'Sin nada que limite la corriente, pasa mucho más de 20 mA.' },
    ],
  },
  {
    id: 'e2g-componentes',
    title: '2 · Componentes',
    intro: 'Códigos, polaridades y cómo se comportan los semiconductores.',
    activities: [
      { id: 'e2g-8', type: 'num', q: '8. Un capacitor cerámico dice 103. ¿Cuántos nF tiene?', answer: 10, tolerance: 0, unit: 'nF', explain: '10 × 10³ pF = 10 000 pF = 10 nF.' },
      { id: 'e2g-9', type: 'num', q: '9. Un capacitor cerámico dice 471. ¿Cuántos pF tiene?', answer: 470, tolerance: 0, unit: 'pF', explain: '47 × 10¹ = 470 pF.' },
      { id: 'e2g-10', type: 'num', q: '10. Una resistencia es marrón, negro, rojo. ¿Cuántos Ω tiene?', answer: 1000, tolerance: 0, unit: 'Ω', explain: '1, 0 y × 100 = 1000 Ω = 1 kΩ.' },
      { id: 'e2g-11', type: 'num', q: '11. Una resistencia es amarillo, violeta, marrón. ¿Cuántos Ω tiene?', answer: 470, tolerance: 0, unit: 'Ω', explain: '4, 7 y × 10 = 470 Ω.' },
      { id: 'e2g-12', type: 'mc', q: '12. ¿Qué pata de un LED va hacia el positivo?', options: ['La larga (ánodo)', 'La corta (cátodo)', 'Cualquiera', 'La del lado plano'], answer: 0, explain: 'El lado plano del encapsulado marca el cátodo.' },
      { id: 'e2g-13', type: 'num', q: '13. Un transistor con β = 200 tiene 0,5 mA de base. ¿Cuántos mA puede pasar por el colector?', answer: 100, tolerance: 0.01, unit: 'mA', explain: 'Ic = β × Ib = 200 × 0,5 mA.' },
      { id: 'e2g-14', type: 'mc', q: '14. ¿Qué pasa si un electrolítico se conecta al revés?', options: ['Puede calentarse, inflarse y explotar', 'Funciona igual', 'Se descarga solo', 'Aumenta su capacidad'], answer: 0, explain: 'La franja marca el negativo.' },
      { id: 'e2g-15', type: 'mc', q: '15. En la prueba de diodo, uno sano marca…', options: ['~0,6 V en directa y OL en inversa', '0 V en los dos sentidos', 'OL en los dos sentidos', '220 V'], answer: 0, explain: '0 en los dos sentidos = en corto; OL en los dos = abierto.' },
    ],
  },
  {
    id: 'e2g-soldadura',
    title: '3 · Soldadura y circuito impreso',
    intro: 'El punto de soldadura, sus defectos y los pasos para fabricar una placa.',
    activities: [
      { id: 'e2g-16', type: 'mc', q: '16. ¿A qué temperatura se usa la punta con estaño 60/40?', options: ['320 a 350 °C', '100 °C', '183 °C justos', '600 °C'], answer: 0, explain: 'Más caliente que el punto de fusión para que el calor pase rápido.' },
      { id: 'e2g-17', type: 'mc', q: '17. Ordená los pasos: ¿qué va primero?', options: ['Calentar pad y pata a la vez', 'Poner estaño en la punta y llevarlo a la pata', 'Retirar el soldador', 'Cortar la pata'], answer: 0, explain: 'Después se acerca el estaño a la pieza caliente.' },
      { id: 'e2g-18', type: 'mc', q: '18. Una soldadura quedó como una bola que tapa la pata. ¿Qué defecto es?', options: ['Exceso de estaño', 'Soldadura fría', 'Poco estaño', 'Pad levantado'], answer: 0, explain: 'No deja ver si el estaño mojó bien.' },
      { id: 'e2g-19', type: 'mc', q: '19. El pad se despegó de la placa al soldar. ¿Por qué?', options: ['Demasiado calor o demasiado tiempo', 'Faltó estaño', 'La punta estaba fría', 'Se usó flux'], answer: 0, explain: 'Calentar 2 a 4 segundos como máximo.' },
      { id: 'e2g-20', type: 'mc', q: '20. ¿Con qué se saca un puente de estaño?', options: ['Con malla desoldante', 'Con agua', 'Con un imán', 'Soplando'], answer: 0, explain: 'O con la bomba desoldadora.' },
      { id: 'e2g-21', type: 'mc', q: '21. En el método del planchado, ¿qué protege el cobre del percloruro?', options: ['El tóner transferido', 'El papel', 'La plancha', 'El flux'], answer: 0, explain: 'Debajo del tóner queda el cobre de las pistas.' },
      { id: 'e2g-22', type: 'num', q: '22. ¿Con qué mecha (mm) se perforan los pads de los componentes comunes?', answer: 0.8, tolerance: 0.15, unit: 'mm', explain: 'De 0,8 mm; 1 mm para patas gruesas como los diodos de 1 A o las borneras.' },
      { id: 'e2g-23', type: 'mc', q: '23. ¿Qué componentes se sueldan primero en la placa?', options: ['Los más bajos', 'Los más altos', 'Los electrolíticos', 'La bornera'], answer: 0, explain: 'Así la placa apoya pareja.' },
    ],
  },
  {
    id: 'e2g-fuente',
    title: '4 · Fuente de alimentación',
    intro: 'Vpico = Vef × 1,41 · rectificada = Vpico − 1,4 V · ripple ≈ I ÷ (100 × C) · el regulador necesita 2 V más que su salida.',
    activities: [
      { id: 'e2g-24', type: 'num', q: '24. Un secundario de 9 V eficaces, ¿qué tensión pico tiene? (V)', answer: 12.73, tolerance: 0.02, unit: 'V', explain: '9 × 1,414 = 12,73 V.' },
      { id: 'e2g-25', type: 'num', q: '25. Ese secundario de 9 V después del puente, ¿qué pico queda? (V)', answer: 11.33, tolerance: 0.02, unit: 'V', explain: '12,73 − 1,4 = 11,33 V.' },
      { id: 'e2g-26', type: 'num', q: '26. Transformador 220 V / 9 V con 1210 vueltas en el primario. ¿Cuántas tiene el secundario?', answer: 49.5, tolerance: 0.02, unit: 'vueltas', explain: '1210 × 9 ÷ 220 = 49,5 vueltas.' },
      { id: 'e2g-27', type: 'num', q: '27. Con 500 mA y un capacitor de 1000 µF, ¿cuánto ripple hay? (V)', answer: 5, tolerance: 0.02, unit: 'V', explain: '0,5 ÷ (100 × 0,001) = 5 V: es mucho, conviene un capacitor más grande.' },
      { id: 'e2g-28', type: 'num', q: '28. ¿Qué capacidad (µF) hace falta para tener 1 V de ripple con 1 A?', answer: 10000, tolerance: 0.02, unit: 'µF', explain: 'C = I ÷ (100 × Vr) = 1 ÷ 100 = 0,01 F = 10 000 µF.' },
      { id: 'e2g-29', type: 'mc', q: '29. Una fuente con 9 V de secundario, ¿sirve para un 7812?', options: ['No: después de rectificar quedan unos 11 V, menos de los 14 V que necesita', 'Sí, sobra', 'Sí, si el capacitor es grande', 'Depende del fusible'], answer: 0, explain: 'El 7812 necesita al menos 14 V en la entrada.' },
      { id: 'e2g-30', type: 'num', q: '30. Un 7805 recibe 9 V y entrega 0,5 A. ¿Cuánta potencia transforma en calor? (W)', answer: 2, tolerance: 0.01, unit: 'W', explain: '(9 − 5) × 0,5 = 2 W: necesita disipador.' },
    ],
  },
]

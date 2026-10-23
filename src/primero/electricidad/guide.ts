// Guía de ejercicios de Electricidad, 1er año (apunte «Instalaciones eléctricas básicas»).
import type { GuideSection } from '../../lib/subject'

export const ELECTRICIDAD1_GUIDE: GuideSection[] = [
  {
    id: 'e1g-ohm',
    title: '1. Ley de Ohm',
    intro: 'U = I · R · I = U / R · R = U / I. Usá volts, amperes y ohms. Si te dan mA o kΩ, convertí primero.',
    activities: [
      { id: 'e1g-ohm-1', type: 'num', q: 'Una estufa de 22 Ω está conectada a 220 V. ¿Qué corriente consume?', answer: 10, tolerance: 0.01, unit: 'A', explain: 'I = 220 / 22 = 10 A.' },
      { id: 'e1g-ohm-2', type: 'num', q: 'Una lámpara de auto conectada a 12 V consume 2 A. ¿Cuál es su resistencia?', answer: 6, tolerance: 0.01, unit: 'Ω', explain: 'R = 12 / 2 = 6 Ω.' },
      { id: 'e1g-ohm-3', type: 'num', q: 'Por una resistencia de 470 Ω circulan 0,02 A. ¿Qué tensión tiene?', answer: 9.4, tolerance: 0.01, unit: 'V', explain: 'U = 0,02 · 470 = 9,4 V.' },
      { id: 'e1g-ohm-4', type: 'num', q: 'Dos pilas AA en serie (3 V) alimentan una linterna de 15 Ω. ¿Qué corriente circula?', answer: 0.2, tolerance: 0.01, unit: 'A', explain: 'I = 3 / 15 = 0,2 A.' },
      { id: 'e1g-ohm-5', type: 'num', q: 'Una pava eléctrica toma 8 A de la red de 220 V. ¿Cuál es su resistencia?', answer: 27.5, tolerance: 0.01, unit: 'Ω', explain: 'R = 220 / 8 = 27,5 Ω.' },
      { id: 'e1g-ohm-6', type: 'num', q: 'Un cargador USB (5 V) alimenta un circuito de 10 Ω. ¿Qué corriente circula?', answer: 0.5, tolerance: 0.01, unit: 'A', explain: 'I = 5 / 10 = 0,5 A.' },
      { id: 'e1g-ohm-7', type: 'num', q: 'Por una resistencia de 1 kΩ circulan 12 mA. ¿Qué tensión tiene? (en V)', answer: 12, tolerance: 0.01, unit: 'V', explain: '1 kΩ = 1000 Ω; 12 mA = 0,012 A. U = 0,012 · 1000 = 12 V.' },
      { id: 'e1g-ohm-8', type: 'num', q: 'La batería de un auto (12 V) alimenta un motor de arranque de 0,1 Ω. ¿Qué corriente pide?', answer: 120, tolerance: 0.01, unit: 'A', explain: 'I = 12 / 0,1 = 120 A. ¡Por eso los cables de batería son tan gruesos!' },
    ],
  },
  {
    id: 'e1g-serie',
    title: '2. Resistencias en serie',
    intro: 'En serie se suman: RT = R1 + R2 + … La corriente es la misma en todas.',
    activities: [
      { id: 'e1g-se-1', type: 'num', q: 'R1 = 47 Ω, R2 = 33 Ω en serie. ¿RT?', answer: 80, tolerance: 0, unit: 'Ω', explain: '47 + 33 = 80 Ω.' },
      { id: 'e1g-se-2', type: 'num', q: 'R1 = 1 kΩ, R2 = 470 Ω y R3 = 330 Ω en serie. ¿RT en ohms?', answer: 1800, tolerance: 0, unit: 'Ω', explain: '1000 + 470 + 330 = 1800 Ω.' },
      { id: 'e1g-se-3', type: 'num', q: 'Dos resistencias de 60 Ω en serie se conectan a 12 V. ¿Qué corriente circula?', answer: 0.1, tolerance: 0.01, unit: 'A', explain: 'RT = 120 Ω; I = 12 / 120 = 0,1 A.' },
      { id: 'e1g-se-4', type: 'num', q: 'Siguiendo el ejercicio anterior, ¿qué tensión queda sobre cada resistencia de 60 Ω?', answer: 6, tolerance: 0.01, unit: 'V', explain: 'U = 0,1 · 60 = 6 V. Dos iguales en serie se reparten la tensión por mitades.' },
      { id: 'e1g-se-5', type: 'num', q: 'Una guirnalda tiene 20 lamparitas de 11 Ω en serie. ¿Cuál es la resistencia total?', answer: 220, tolerance: 0, unit: 'Ω', explain: '20 · 11 = 220 Ω.' },
    ],
  },
  {
    id: 'e1g-paralelo',
    title: '3. Resistencias en paralelo',
    intro: 'Para dos: RT = R1·R2 / (R1 + R2). Para más: 1/RT = 1/R1 + 1/R2 + … La tensión es la misma en todas.',
    activities: [
      { id: 'e1g-pa-1', type: 'num', q: 'R1 = 20 Ω y R2 = 20 Ω en paralelo. ¿RT?', answer: 10, tolerance: 0, unit: 'Ω', explain: '20·20 / 40 = 10 Ω.' },
      { id: 'e1g-pa-2', type: 'num', q: 'R1 = 40 Ω y R2 = 10 Ω en paralelo. ¿RT?', answer: 8, tolerance: 0, unit: 'Ω', explain: '400 / 50 = 8 Ω.' },
      { id: 'e1g-pa-3', type: 'num', q: 'R1 = 120 Ω y R2 = 60 Ω en paralelo. ¿RT?', answer: 40, tolerance: 0, unit: 'Ω', explain: '7200 / 180 = 40 Ω.' },
      { id: 'e1g-pa-4', type: 'num', q: 'Cuatro resistencias de 100 Ω en paralelo. ¿RT?', answer: 25, tolerance: 0.01, unit: 'Ω', explain: '1/RT = 4/100 → RT = 25 Ω.' },
      { id: 'e1g-pa-5', type: 'num', q: 'R1 = 10 Ω, R2 = 20 Ω y R3 = 20 Ω en paralelo. ¿RT?', answer: 5, tolerance: 0.01, unit: 'Ω', explain: '1/RT = 0,1 + 0,05 + 0,05 = 0,2 → RT = 5 Ω.' },
      { id: 'e1g-pa-6', type: 'num', q: 'Dos lámparas de 484 Ω en paralelo en la red de 220 V. ¿Qué corriente total consumen?', answer: 0.909, tolerance: 0.02, unit: 'A', explain: 'RT = 242 Ω; I = 220 / 242 ≈ 0,91 A.' },
    ],
  },
  {
    id: 'e1g-circuitos',
    title: '4. Circuitos completos',
    intro: 'Primero calculá la resistencia equivalente, después la corriente total con la ley de Ohm.',
    activities: [
      { id: 'e1g-ci-1', type: 'num', q: 'Una pila de 9 V alimenta R1 = 100 Ω y R2 = 200 Ω en serie. ¿Corriente total en mA?', answer: 30, tolerance: 0.01, unit: 'mA', explain: 'RT = 300 Ω; I = 9 / 300 = 0,03 A = 30 mA.' },
      { id: 'e1g-ci-2', type: 'num', q: 'Una fuente de 12 V alimenta R1 = 6 Ω y R2 = 12 Ω en paralelo. ¿Corriente total?', answer: 3, tolerance: 0.01, unit: 'A', explain: 'RT = 72/18 = 4 Ω; I = 12 / 4 = 3 A. (Por R1 pasan 2 A y por R2, 1 A).' },
      { id: 'e1g-ci-3', type: 'num', q: 'En el circuito anterior, ¿qué corriente pasa por R1 = 6 Ω?', answer: 2, tolerance: 0.01, unit: 'A', explain: 'En paralelo cada una tiene 12 V: I1 = 12 / 6 = 2 A.' },
      { id: 'e1g-ci-4', type: 'mc', q: 'En serie se quema una lámpara. ¿Qué pasa con la corriente total?', options: ['Se hace cero', 'Se duplica', 'No cambia', 'Se vuelve alterna'], answer: 0, explain: 'Hay un solo camino: si se corta, no circula corriente.' },
      { id: 'e1g-ci-5', type: 'mc', q: 'Las lámparas de una casa están conectadas en…', options: ['Paralelo: cada una recibe 220 V y funcionan independientes', 'Serie: se reparten los 220 V', 'Serie y se apagan todas juntas', 'No están conectadas'], answer: 0, explain: 'En paralelo, si se quema una, las otras siguen funcionando.' },
    ],
  },
  {
    id: 'e1g-cables',
    title: '5. Cables: identificar y elegir',
    intro: 'Usá la clasificación del apunte: color, conductores, hebras, sección, tensión, aislación y aplicación.',
    activities: [
      { id: 'e1g-cb-1', type: 'mc', q: 'Necesitás un alargue para una amoladora del taller. ¿Qué cable usás?', options: ['TPR tripolar multifilar', 'Alambre desnudo', 'Alambre esmaltado', 'Unipolar unifilar de 1 mm²'], answer: 0, explain: 'TPR: flexible y con cubierta reforzada; tripolar para llevar fase, neutro y tierra.' },
      { id: 'e1g-cb-2', type: 'mc', q: 'Para bobinar un pequeño transformador se usa…', options: ['Alambre de cobre esmaltado', 'Cable TPR', 'Cable subterráneo', 'Cable de silicona'], answer: 0, explain: 'El esmalte aísla con muy poco espesor: entran muchas vueltas.' },
      { id: 'e1g-cb-3', type: 'mc', q: 'Una línea de 13,2 kV es de…', options: ['Media tensión', 'Baja tensión', 'Alta tensión', 'Muy alta tensión'], answer: 0, explain: 'MT: más de 1 kV y hasta 33 kV.' },
      { id: 'e1g-cb-4', type: 'mc', q: 'Un cable de 2,5 mm² con aislación verde y amarilla se usa para…', options: ['La puesta a tierra', 'La fase', 'El neutro', 'El retorno'], answer: 0, explain: 'Verde y amarillo es siempre tierra (PE).' },
      { id: 'e1g-cb-5', type: 'mc', q: 'Una bomba que trabaja dentro de un pozo de agua necesita un cable…', options: ['Sumergible', 'Libre de halógenos', 'Desnudo', 'Esmaltado'], answer: 0, explain: 'Está diseñado para funcionar permanentemente bajo el agua.' },
      { id: 'e1g-cb-6', type: 'mc', q: 'En un tablero trifásico hay cables marrón, negro y rojo. Son…', options: ['Las fases L1, L2 y L3', 'Neutro, tierra y retorno', 'Positivo, negativo y tierra', 'Tres neutros'], answer: 0, explain: 'L1 marrón, L2 negro, L3 rojo.' },
    ],
  },
  {
    id: 'e1g-unidades',
    title: '6. Unidades y conversiones',
    intro: 'kilo (k) = × 1000 · mili (m) = ÷ 1000.',
    activities: [
      { id: 'e1g-un-1', type: 'num', q: '¿Cuántos ohms son 2,2 kΩ?', answer: 2200, tolerance: 0, unit: 'Ω', explain: '2,2 × 1000 = 2200 Ω.' },
      { id: 'e1g-un-2', type: 'num', q: '¿Cuántos amperes son 75 mA?', answer: 0.075, tolerance: 0, unit: 'A', explain: '75 / 1000 = 0,075 A.' },
      { id: 'e1g-un-3', type: 'num', q: '¿Cuántos volts son 33 kV?', answer: 33000, tolerance: 0, unit: 'V', explain: '33 × 1000 = 33 000 V.' },
      { id: 'e1g-un-4', type: 'num', q: '¿Cuántos miliamperes son 1,5 A?', answer: 1500, tolerance: 0, unit: 'mA', explain: '1,5 × 1000 = 1500 mA.' },
      { id: 'e1g-un-5', type: 'num', q: '¿Cuántos kΩ son 47 000 Ω?', answer: 47, tolerance: 0, unit: 'kΩ', explain: '47 000 / 1000 = 47 kΩ.' },
    ],
  },
]

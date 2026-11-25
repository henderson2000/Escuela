import type { Placed } from '../../lib/circuit'

export interface Example {
  id: string
  title: string
  desc: string
  code: string
  circuit: Omit<Placed, 'id'>[]
}

const RED = '#ff2a2a'
const GREEN = '#2aff5a'
const YELLOW = '#ffd21a'
const C = { rojo: '#e02424', negro: '#202020', amarillo: '#f2c40f', azul: '#2563eb', verde: '#16a34a' }

const cable = (a: string, b: string, color: string): Omit<Placed, 'id'> => ({ kind: 'cable', legs: [a, b], color })
const res = (a: string, b: string, value: number): Omit<Placed, 'id'> => ({ kind: 'resistencia', legs: [a, b], value })
const led = (a: string, c: string, color: string): Omit<Placed, 'id'> => ({ kind: 'led', legs: [a, c], color })

/** LED con su resistencia de 220 Ω desde un pin, empezando en la columna k. */
const ledOnPin = (pin: string, k: number, color: string, wire: string) => [
  cable(`ard:${pin}`, `j${k}`, wire),
  res(`h${k}`, `h${k + 4}`, 220),
  led(`g${k + 4}`, `g${k + 5}`, color),
  cable(`j${k + 5}`, `T-${k + 5}`, C.negro),
]
const GND_RAIL = cable('ard:GND2', 'T-3', C.negro)

export const EXAMPLES: Example[] = [
  {
    id: 'blink',
    title: 'Blink',
    desc: 'Un LED en el pin 13 que prende y apaga cada un segundo (el LED "L" de la placa también).',
    code: `// Blink: prende y apaga un LED cada un segundo
const int LED = 13;

void setup() {
  pinMode(LED, OUTPUT);   // el pin 13 es una salida
}

void loop() {
  digitalWrite(LED, HIGH); // 5 V: se prende
  delay(1000);             // espera un segundo
  digitalWrite(LED, LOW);  // 0 V: se apaga
  delay(1000);
}
`,
    circuit: [GND_RAIL, ...ledOnPin('13', 10, RED, C.amarillo)],
  },
  {
    id: 'semaforo',
    title: 'Semáforo',
    desc: 'Tres LEDs en los pines 10, 9 y 8 que se prenden en orden, con una función propia.',
    code: `// Semáforo con tres LEDs
const int ROJO = 10;
const int AMARILLO = 9;
const int VERDE = 8;

void luz(int pin, int tiempo) {
  digitalWrite(pin, HIGH);
  delay(tiempo);
  digitalWrite(pin, LOW);
}

void setup() {
  pinMode(ROJO, OUTPUT);
  pinMode(AMARILLO, OUTPUT);
  pinMode(VERDE, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  Serial.println("Verde");
  luz(VERDE, 3000);
  Serial.println("Amarillo");
  luz(AMARILLO, 1000);
  Serial.println("Rojo");
  luz(ROJO, 3000);
}
`,
    circuit: [GND_RAIL, ...ledOnPin('10', 4, RED, C.rojo), ...ledOnPin('9', 11, YELLOW, C.amarillo), ...ledOnPin('8', 18, GREEN, C.verde)],
  },
  {
    id: 'pulsador',
    title: 'Pulsador',
    desc: 'Con INPUT_PULLUP no hace falta resistencia: al apretar, el pin 2 lee LOW y se prende el LED de la placa.',
    code: `// Pulsador en el pin 2 con la resistencia pull-up interna
const int BOTON = 2;

void setup() {
  pinMode(BOTON, INPUT_PULLUP); // sin apretar lee HIGH
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(BOTON) == LOW) { // apretado: conecta el pin con GND
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println("¡Apretado!");
  } else {
    digitalWrite(LED_BUILTIN, LOW);
  }
  delay(100);
}
`,
    circuit: [GND_RAIL, cable('ard:2', 'j12', C.azul), { kind: 'pulsador', legs: ['f12', 'f14'] }, cable('j14', 'T-14', C.negro)],
  },
  {
    id: 'potenciometro',
    title: 'Potenciómetro y PWM',
    desc: 'Lee el potenciómetro en A0 y regula el brillo del LED del pin 9 con analogWrite.',
    code: `// El potenciómetro regula el brillo del LED
int valor;

void setup() {
  pinMode(9, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  valor = analogRead(A0);                  // 0 a 1023
  int brillo = map(valor, 0, 1023, 0, 255); // 0 a 255
  analogWrite(9, brillo);                   // PWM
  float volts = valor * 5.0 / 1023;
  Serial.print("A0 = ");
  Serial.print(valor);
  Serial.print("  (");
  Serial.print(volts);
  Serial.println(" V)");
  delay(200);
}
`,
    circuit: [
      GND_RAIL,
      { kind: 'potenciometro', legs: ['a10', 'a11', 'a12'], value: 10000 },
      cable('ard:5V', 'c10', C.rojo),
      cable('ard:A0', 'c11', C.amarillo),
      cable('ard:GND', 'c12', C.negro),
      ...ledOnPin('9', 20, RED, C.verde),
    ],
  },
  {
    id: 'luz-nocturna',
    title: 'Luz nocturna (LDR)',
    desc: 'La LDR con una resistencia de 10 kΩ forma un divisor de tensión en A0. Cuando oscurece, se prende el LED del pin 9.',
    code: `// Luz nocturna: LDR en A0 (divisor con 10 kΩ) y LED en el pin 9
const int LED = 9;
const int UMBRAL = 300; // por debajo de este valor, "está oscuro"

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int luz = analogRead(A0); // más luz → número más alto
  Serial.print("Luz: ");
  Serial.println(luz);
  if (luz < UMBRAL) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
  delay(200);
}
`,
    circuit: [
      GND_RAIL,
      cable('ard:5V', 'c10', C.rojo),
      { kind: 'ldr', legs: ['a10', 'a12'] },
      cable('ard:A0', 'c12', C.amarillo),
      res('b12', 'b16', 10000),
      cable('d16', 'T-16', C.negro),
      ...ledOnPin('9', 20, RED, C.verde),
    ],
  },
  {
    id: 'servo',
    title: 'Servo de barrido',
    desc: 'Un servo SG90 en el pin 9 que va de 0° a 180° y vuelve, con la librería Servo.',
    code: `// Barrido de un servo SG90 (señal en el pin 9)
#include <Servo.h>

Servo motor;

void setup() {
  motor.attach(9);
  Serial.begin(9600);
}

void loop() {
  for (int angulo = 0; angulo <= 180; angulo += 30) {
    motor.write(angulo);
    Serial.println(angulo);
    delay(400);
  }
  for (int angulo = 180; angulo >= 0; angulo -= 30) {
    motor.write(angulo);
    delay(400);
  }
}
`,
    circuit: [GND_RAIL, { kind: 'servo', legs: ['a20', 'a21', 'a22'] }, cable('c20', 'T-20', C.negro), cable('c21', 'ard:5V', C.rojo), cable('c22', 'ard:9', C.amarillo)],
  },
  {
    id: 'distancia',
    title: 'Alarma de distancia',
    desc: 'El sensor ultrasónico mide la distancia y, si algo se acerca a menos de 20 cm, suena el buzzer del pin 8. Mové la perilla "Distancia".',
    code: `// Alarma de distancia con HC-SR04 (Trig 9, Echo 10) y buzzer en el 8
const int TRIG = 9;
const int ECHO = 10;
const int BUZZER = 8;

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  // pulso de 10 microsegundos en Trig
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long duracion = pulseIn(ECHO, HIGH); // ida y vuelta del sonido, en µs
  int cm = duracion / 58;
  Serial.print(cm);
  Serial.println(" cm");

  if (cm > 0 && cm < 20) {
    tone(BUZZER, 1000);
  } else {
    noTone(BUZZER);
  }
  delay(150);
}
`,
    circuit: [
      GND_RAIL,
      { kind: 'ultrasonico', legs: ['a10', 'a11', 'a12', 'a13'] },
      cable('c10', 'ard:5V', C.rojo),
      cable('c11', 'ard:9', C.amarillo),
      cable('c12', 'ard:10', C.azul),
      cable('c13', 'T-14', C.negro),
      { kind: 'buzzer', legs: ['a20', 'a22'] },
      cable('ard:8', 'c20', C.verde),
      cable('c22', 'T-22', C.negro),
    ],
  },
  {
    id: 'vacio',
    title: 'Proyecto vacío',
    desc: 'Mesa limpia y un programa en blanco para armar lo que quieras.',
    code: `void setup() {
  // se ejecuta una vez al encender
}

void loop() {
  // se repite para siempre
}
`,
    circuit: [],
  },
]

export const WIRE_COLORS = C

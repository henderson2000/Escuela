// Desafíos de código en Java: más difíciles que las lecciones, con pistas mínimas.
// Las pruebas son estrictas con el formato de salida: está indicado exacto en cada consigna.
import { codeOnly, lines, type JavaLesson } from './types'

const J = (s: string) => s.replace(/^\n/, '')
const L = (o: string) => lines(o.replace(/(\d),(\d)/g, '$1.$2'))
const usa = (code: string, re: RegExp) => re.test(codeOnly(code))

/** programa vacío que ya trae el Scanner */
const BASE = J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // tu código
    }
}
`)

const FIZZ = (n: number) =>
  Array.from({ length: n }, (_, i) => i + 1)
    .map((i) => (i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i)))
    .join('|')

export const JAVA_CHALLENGES: JavaLesson[] = [
  {
    id: 'dj-primo',
    kind: 'java',
    title: '¿Es primo?',
    intro: <p>Un número es primo si es mayor que 1 y solo se puede dividir (sin resto) por 1 y por sí mismo.</p>,
    task: (
      <>
        <p>
          Leé un entero <code>n</code> (n ≥ 1) y mostrá <code>Es primo</code> o <code>No es primo</code>.
        </p>
        <pre>
          <code>{'Entrada: 7    Salida: Es primo\nEntrada: 1    Salida: No es primo'}</code>
        </pre>
      </>
    ),
    hint: <p>Probá dividir por todos los números entre 2 y n - 1 (o hasta la raíz de n).</p>,
    sampleInput: '7',
    starter: BASE,
    solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        boolean primo = n > 1;
        for (int d = 2; d * d <= n; d++) {
            if (n % d == 0) {
                primo = false;
                break;
            }
        }
        System.out.println(primo ? "Es primo" : "No es primo");
    }
}
`),
    tests: [
      { text: 'Con 7: "Es primo"', input: '7', check: (o) => lines(o).join('|') === 'Es primo' },
      { text: 'Con 1: "No es primo"', input: '1', check: (o) => lines(o).join('|') === 'No es primo' },
      { text: 'Con 2: "Es primo"', input: '2', check: (o) => lines(o).join('|') === 'Es primo' },
      { text: 'Con 91: "No es primo" (7 × 13)', input: '91', check: (o) => lines(o).join('|') === 'No es primo' },
      { text: 'Con 97: "Es primo"', input: '97', check: (o) => lines(o).join('|') === 'Es primo' },
    ],
  },
  {
    id: 'dj-fizzbuzz',
    kind: 'java',
    title: 'FizzBuzz',
    intro: <p>Un clásico de las entrevistas de programación.</p>,
    task: (
      <>
        <p>
          Leé <code>n</code> y mostrá los números del 1 al n, uno por línea, pero: si es múltiplo de 3 mostrá <code>Fizz</code>, si es
          múltiplo de 5 mostrá <code>Buzz</code>, y si es múltiplo de los dos, <code>FizzBuzz</code>.
        </p>
        <pre>
          <code>{'Entrada: 5\nSalida:\n1\n2\nFizz\n4\nBuzz'}</code>
        </pre>
      </>
    ),
    hint: <p>El orden de las preguntas importa.</p>,
    sampleInput: '15',
    starter: BASE,
    solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        for (int i = 1; i <= n; i++) {
            if (i % 15 == 0) System.out.println("FizzBuzz");
            else if (i % 3 == 0) System.out.println("Fizz");
            else if (i % 5 == 0) System.out.println("Buzz");
            else System.out.println(i);
        }
    }
}
`),
    tests: [
      { text: 'Con 5: 1, 2, Fizz, 4, Buzz', input: '5', check: (o) => lines(o).join('|') === FIZZ(5) },
      { text: 'Con 15: termina en FizzBuzz', input: '15', check: (o) => lines(o).join('|') === FIZZ(15) },
      { text: 'Con 31: las 31 líneas correctas', input: '31', check: (o) => lines(o).join('|') === FIZZ(31) },
    ],
  },
  {
    id: 'dj-palindromo',
    kind: 'java',
    title: 'Palíndromo',
    intro: <p>Un palíndromo se lee igual al derecho y al revés, como «Neuquén» o «Anita lava la tina».</p>,
    task: (
      <>
        <p>
          Leé una línea (sin tildes) y mostrá <code>Es palíndromo</code> o <code>No es palíndromo</code>. No importan las mayúsculas
          ni los espacios.
        </p>
        <pre>
          <code>{'Entrada: Anita lava la tina    Salida: Es palíndromo'}</code>
        </pre>
      </>
    ),
    hint: <p>Primero armá un texto limpio (minúsculas, sin espacios) y después comparalo con su versión al revés.</p>,
    sampleInput: 'Anita lava la tina',
    starter: BASE,
    solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().toLowerCase().replace(" ", "");
        String rev = new StringBuilder(s).reverse().toString();
        System.out.println(s.equals(rev) ? "Es palíndromo" : "No es palíndromo");
    }
}
`),
    tests: [
      { text: 'Con "Anita lava la tina": es palíndromo', input: 'Anita lava la tina', check: (o) => lines(o).join('|') === 'Es palíndromo' },
      { text: 'Con "Neuquen": es palíndromo', input: 'Neuquen', check: (o) => lines(o).join('|') === 'Es palíndromo' },
      { text: 'Con "Villada": no es palíndromo', input: 'Villada', check: (o) => lines(o).join('|') === 'No es palíndromo' },
      { text: 'Con "abca": no es palíndromo', input: 'abca', check: (o) => lines(o).join('|') === 'No es palíndromo' },
    ],
  },
  {
    id: 'dj-vocales',
    kind: 'java',
    title: 'Contar cada vocal',
    intro: <p>Contá cuántas veces aparece cada vocal en un texto.</p>,
    task: (
      <>
        <p>
          Leé una línea (sin tildes) y mostrá 5 líneas, una por vocal, en este orden y formato. Las mayúsculas cuentan igual.
        </p>
        <pre>
          <code>{'Entrada: Taller de Computacion\nSalida:\na: 2\ne: 2\ni: 1\no: 2\nu: 1'}</code>
        </pre>
      </>
    ),
    sampleInput: 'Taller de Computacion',
    starter: BASE,
    solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().toLowerCase();
        String vocales = "aeiou";
        for (int v = 0; v < vocales.length(); v++) {
            char x = vocales.charAt(v);
            int cont = 0;
            for (int i = 0; i < s.length(); i++) {
                if (s.charAt(i) == x) cont++;
            }
            System.out.println(x + ": " + cont);
        }
    }
}
`),
    tests: [
      { text: 'Con "Taller de Computacion": 2, 2, 1, 2, 1', input: 'Taller de Computacion', check: (o) => lines(o).join('|') === 'a: 2|e: 2|i: 1|o: 2|u: 1' },
      { text: 'Con "AEIOU aeiou": 2 de cada una', input: 'AEIOU aeiou', check: (o) => lines(o).join('|') === 'a: 2|e: 2|i: 2|o: 2|u: 2' },
      { text: 'Con "xyz": todas en 0', input: 'xyz', check: (o) => lines(o).join('|') === 'a: 0|e: 0|i: 0|o: 0|u: 0' },
    ],
  },
  {
    id: 'dj-mayor',
    kind: 'java',
    title: 'El mayor de la lista',
    intro: <p>Encontrá el número más grande de una lista y cuántas veces aparece.</p>,
    task: (
      <>
        <p>
          Se lee la cantidad <code>n</code> (n ≥ 1) y después n enteros (pueden ser negativos). Mostrá exactamente:
        </p>
        <pre>
          <code>{'Entrada:\n6\n4 9 -2 9 7 1\nSalida:\nMayor: 9 (aparece 2 veces)'}</code>
        </pre>
        <p>
          Si aparece una sola vez, igual se escribe <code>(aparece 1 veces)</code>.
        </p>
      </>
    ),
    hint: <p>Ojo con arrancar el máximo en 0: puede que todos sean negativos.</p>,
    sampleInput: '6\n4 9 -2 9 7 1',
    starter: BASE,
    solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int mayor = sc.nextInt();
        int veces = 1;
        for (int i = 1; i < n; i++) {
            int x = sc.nextInt();
            if (x > mayor) {
                mayor = x;
                veces = 1;
            } else if (x == mayor) {
                veces++;
            }
        }
        System.out.println("Mayor: " + mayor + " (aparece " + veces + " veces)");
    }
}
`),
    tests: [
      { text: 'Con 4 9 -2 9 7 1: "Mayor: 9 (aparece 2 veces)"', input: '6\n4 9 -2 9 7 1', check: (o) => lines(o).join('|') === 'Mayor: 9 (aparece 2 veces)' },
      { text: 'Con todos negativos (-5 -3 -8): "Mayor: -3 (aparece 1 veces)"', input: '3\n-5 -3 -8', check: (o) => lines(o).join('|') === 'Mayor: -3 (aparece 1 veces)' },
      { text: 'Con 1 2 3 3 3: "Mayor: 3 (aparece 3 veces)"', input: '5\n1 2 3 3 3', check: (o) => lines(o).join('|') === 'Mayor: 3 (aparece 3 veces)' },
      { text: 'Con un solo número: "Mayor: 42 (aparece 1 veces)"', input: '1\n42', check: (o) => lines(o).join('|') === 'Mayor: 42 (aparece 1 veces)' },
    ],
  },
  {
    id: 'dj-posiciones',
    kind: 'java',
    title: 'Tabla de posiciones',
    intro: <p>Armá la tabla del torneo intercursos de fútbol.</p>,
    task: (
      <>
        <p>
          Se lee la cantidad de equipos y, para cada uno, una línea con <code>nombre ganados empatados perdidos</code> (el nombre es
          una palabra). Ganar da 3 puntos y empatar 1. Mostrá la tabla ordenada de mayor a menor puntaje; si empatan en puntos, por
          orden alfabético del nombre:
        </p>
        <pre>
          <code>{'Entrada:\n3\n3B 2 1 0\n3A 3 0 0\n3C 0 1 2\nSalida:\n1. 3A - 9 pts\n2. 3B - 7 pts\n3. 3C - 1 pts'}</code>
        </pre>
      </>
    ),
    hint: <p>Una clase Equipo, un ArrayList y un ordenamiento (con un for doble o con sort y un comparador).</p>,
    sampleInput: '3\n3B 2 1 0\n3A 3 0 0\n3C 0 1 2',
    starter: BASE,
    solution: J(`
import java.util.ArrayList;
import java.util.Scanner;

class Equipo {
    String nombre;
    int puntos;

    Equipo(String nombre, int puntos) {
        this.nombre = nombre;
        this.puntos = puntos;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        ArrayList<Equipo> tabla = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String nombre = sc.next();
            int g = sc.nextInt();
            int e = sc.nextInt();
            sc.nextInt();
            tabla.add(new Equipo(nombre, g * 3 + e));
        }
        tabla.sort((a, b) -> a.puntos != b.puntos ? b.puntos - a.puntos : a.nombre.compareTo(b.nombre));
        for (int i = 0; i < tabla.size(); i++) {
            Equipo q = tabla.get(i);
            System.out.println((i + 1) + ". " + q.nombre + " - " + q.puntos + " pts");
        }
    }
}
`),
    tests: [
      { text: 'Con 3B, 3A y 3C: el ejemplo', input: '3\n3B 2 1 0\n3A 3 0 0\n3C 0 1 2', check: (o) => lines(o).join('|') === '1. 3A - 9 pts|2. 3B - 7 pts|3. 3C - 1 pts' },
      {
        text: 'Con empate en puntos: desempata por nombre',
        input: '4\nTigres 1 1 1\nAguilas 1 1 1\nPumas 2 0 1\nLobos 0 0 3',
        check: (o) => lines(o).join('|') === '1. Pumas - 6 pts|2. Aguilas - 4 pts|3. Tigres - 4 pts|4. Lobos - 0 pts',
      },
      { text: 'Con un solo equipo: "1. 5A - 5 pts"', input: '1\n5A 1 2 0', check: (o) => lines(o).join('|') === '1. 5A - 5 pts' },
    ],
  },
  {
    id: 'dj-cajero',
    kind: 'java',
    title: 'Cajero automático',
    intro: <p>El cajero entrega billetes de $2000, $1000, $500, $200 y $100, siempre usando la menor cantidad de billetes.</p>,
    task: (
      <>
        <p>
          Leé el monto a extraer. Si no es positivo o no es múltiplo de 100, mostrá <code>Monto inválido</code>. Si no, mostrá una
          línea por cada billete que se usa (de mayor a menor, solo los que se usan) con el formato <code>$billete x cantidad</code>:
        </p>
        <pre>
          <code>{'Entrada: 5800\nSalida:\n$2000 x 2\n$1000 x 1\n$500 x 1\n$200 x 1\n$100 x 1'}</code>
        </pre>
      </>
    ),
    sampleInput: '5800',
    starter: BASE,
    solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int monto = sc.nextInt();
        if (monto <= 0 || monto % 100 != 0) {
            System.out.println("Monto inválido");
            return;
        }
        int[] billetes = {2000, 1000, 500, 200, 100};
        for (int b : billetes) {
            int cant = monto / b;
            if (cant > 0) {
                System.out.println("$" + b + " x " + cant);
                monto = monto % b;
            }
        }
    }
}
`),
    tests: [
      { text: 'Con 5800: un billete de cada uno y dos de $2000', input: '5800', check: (o) => lines(o).join('|') === '$2000 x 2|$1000 x 1|$500 x 1|$200 x 1|$100 x 1' },
      { text: 'Con 400: "$200 x 2"', input: '400', check: (o) => lines(o).join('|') === '$200 x 2' },
      { text: 'Con 10000: "$2000 x 5"', input: '10000', check: (o) => lines(o).join('|') === '$2000 x 5' },
      { text: 'Con 1550: "Monto inválido"', input: '1550', check: (o) => lines(o).join('|') === 'Monto inválido' },
      { text: 'Con 0: "Monto inválido"', input: '0', check: (o) => lines(o).join('|') === 'Monto inválido' },
    ],
  },
  {
    id: 'dj-temperaturas',
    kind: 'java',
    title: 'Conversor de temperaturas',
    intro: <p>F = C × 9 / 5 + 32, y al revés C = (F − 32) × 5 / 9.</p>,
    task: (
      <>
        <p>
          Escribí un método <code>static double convertir(double valor, char unidad)</code> que convierta a la otra unidad. Se leen
          un valor y una unidad (<code>C</code> o <code>F</code>). Mostrá la conversión con 1 decimal; si la unidad no es C ni F,{' '}
          <code>Unidad inválida</code>.
        </p>
        <pre>
          <code>{'Entrada: 100 C    Salida: 100.0 C = 212.0 F\nEntrada: 212 F    Salida: 212.0 F = 100.0 C\nEntrada: 5 K      Salida: Unidad inválida'}</code>
        </pre>
      </>
    ),
    sampleInput: '100 C',
    starter: BASE,
    solution: J(`
import java.util.Scanner;

public class Main {
    static double convertir(double valor, char unidad) {
        if (unidad == 'C') return valor * 9 / 5 + 32;
        return (valor - 32) * 5 / 9;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double valor = sc.nextDouble();
        char u = sc.next().charAt(0);
        if (u != 'C' && u != 'F') {
            System.out.println("Unidad inválida");
        } else {
            char otra = u == 'C' ? 'F' : 'C';
            System.out.printf("%.1f %c = %.1f %c%n", valor, u, convertir(valor, u), otra);
        }
    }
}
`),
    tests: [
      { text: 'Con 100 C: "100.0 C = 212.0 F"', input: '100 C', check: (o) => L(o).join('|') === '100.0 C = 212.0 F' },
      { text: 'Con 212 F: "212.0 F = 100.0 C"', input: '212 F', check: (o) => L(o).join('|') === '212.0 F = 100.0 C' },
      { text: 'Con -40 C: "-40.0 C = -40.0 F"', input: '-40 C', check: (o) => L(o).join('|') === '-40.0 C = -40.0 F' },
      { text: 'Con 5 K: "Unidad inválida"', input: '5 K', check: (o) => lines(o).join('|') === 'Unidad inválida' },
      { text: 'Tiene el método static double convertir(double, char)', check: (_o, c) => usa(c, /static\s+double\s+convertir\s*\(\s*double\s+\w+\s*,\s*char\s+\w+\s*\)/) },
    ],
  },
  {
    id: 'dj-cuenta',
    kind: 'java',
    title: 'Clase CuentaBancaria',
    intro: <p>Modelá una cuenta bancaria bien encapsulada.</p>,
    task: (
      <>
        <p>
          Hacé una clase <code>CuentaBancaria</code> con titular y saldo <b>private</b> (entero, empieza en 0). Primero se lee el
          titular (una palabra) y después operaciones hasta <code>F</code>:
        </p>
        <ul>
          <li>
            <code>D monto</code> → deposita: <code>Depósito: $monto</code>
          </li>
          <li>
            <code>E monto</code> → extrae: <code>Extracción: $monto</code>, o <code>Fondos insuficientes</code> si no alcanza
          </li>
          <li>
            en D o E, un monto que no sea positivo → <code>Monto inválido</code>
          </li>
          <li>
            <code>S</code> → <code>Saldo de Titular: $saldo</code>
          </li>
        </ul>
        <pre>
          <code>{'Entrada: Ana D 5000 E 2000 E 4000 S F\nSalida:\nDepósito: $5000\nExtracción: $2000\nFondos insuficientes\nSaldo de Ana: $3000'}</code>
        </pre>
      </>
    ),
    sampleInput: 'Ana D 5000 E 2000 E 4000 S F',
    starter: BASE,
    solution: J(`
import java.util.Scanner;

class CuentaBancaria {
    private String titular;
    private int saldo;

    CuentaBancaria(String titular) {
        this.titular = titular;
    }

    public String getTitular() { return titular; }
    public int getSaldo() { return saldo; }

    public void depositar(int monto) { saldo += monto; }

    public boolean extraer(int monto) {
        if (monto > saldo) return false;
        saldo -= monto;
        return true;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        CuentaBancaria c = new CuentaBancaria(sc.next());
        while (true) {
            String op = sc.next();
            if (op.equals("F")) break;
            if (op.equals("S")) {
                System.out.println("Saldo de " + c.getTitular() + ": $" + c.getSaldo());
                continue;
            }
            int m = sc.nextInt();
            if (m <= 0) {
                System.out.println("Monto inválido");
            } else if (op.equals("D")) {
                c.depositar(m);
                System.out.println("Depósito: $" + m);
            } else if (c.extraer(m)) {
                System.out.println("Extracción: $" + m);
            } else {
                System.out.println("Fondos insuficientes");
            }
        }
    }
}
`),
    tests: [
      { text: 'Con el ejemplo: depósito, extracción, fondos insuficientes y saldo $3000', input: 'Ana D 5000 E 2000 E 4000 S F', check: (o) => lines(o).join('|') === 'Depósito: $5000|Extracción: $2000|Fondos insuficientes|Saldo de Ana: $3000' },
      { text: 'Montos inválidos y saldo en 0', input: 'Luis D 0 E -5 S F', check: (o) => lines(o).join('|') === 'Monto inválido|Monto inválido|Saldo de Luis: $0' },
      { text: 'Puede extraer todo el saldo', input: 'Sofi D 700 E 700 S D 100 S F', check: (o) => lines(o).join('|') === 'Depósito: $700|Extracción: $700|Saldo de Sofi: $0|Depósito: $100|Saldo de Sofi: $100' },
      { text: 'La clase CuentaBancaria tiene el saldo private', check: (_o, c) => usa(c, /class\s+CuentaBancaria/) && usa(c, /private\s+(int|double|long)\s+saldo/) },
    ],
  },
  {
    id: 'dj-binario',
    kind: 'java',
    title: 'Decimal a binario',
    intro: <p>Las computadoras guardan todo en binario. Para pasar un número a binario se divide por 2 una y otra vez y se juntan los restos al revés.</p>,
    task: (
      <>
        <p>
          Leé un entero <code>n</code> (n ≥ 0) y mostrá su representación en binario, sin ceros de más adelante. No vale usar{' '}
          <code>Integer.toBinaryString</code> ni <code>Integer.toString(n, 2)</code>.
        </p>
        <pre>
          <code>{'Entrada: 13    Salida: 1101\nEntrada: 0     Salida: 0'}</code>
        </pre>
      </>
    ),
    sampleInput: '13',
    starter: BASE,
    solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        if (n == 0) {
            System.out.println("0");
            return;
        }
        String bin = "";
        while (n > 0) {
            bin = (n % 2) + bin;
            n = n / 2;
        }
        System.out.println(bin);
    }
}
`),
    tests: [
      { text: 'Con 13: "1101"', input: '13', check: (o) => lines(o).join('|') === '1101' },
      { text: 'Con 0: "0"', input: '0', check: (o) => lines(o).join('|') === '0' },
      { text: 'Con 1: "1"', input: '1', check: (o) => lines(o).join('|') === '1' },
      { text: 'Con 256: "100000000"', input: '256', check: (o) => lines(o).join('|') === '100000000' },
      { text: 'No usa toBinaryString ni toString(n, 2)', check: (_o, c) => !/toBinaryString|toString\s*\([^)]*,\s*2\s*\)/.test(codeOnly(c)) },
    ],
  },
]

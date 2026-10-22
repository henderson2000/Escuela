import { codeOnly, lines, type Track } from '../types'

export const JS_TRACK: Track = {
  id: 'js',
  title: 'JavaScript',
  icon: '⚡',
  desc: 'Programación básica: variables, decisiones, repeticiones, funciones y arreglos. Después, darle vida a tus páginas HTML con botones y campos.',
  modules: [
    {
      id: 'js-primeros',
      title: 'Primeros pasos',
      desc: 'Escribir en la consola y entender cómo se ejecuta un programa.',
      lessons: [
        {
          id: 'js-1',
          kind: 'js',
          title: 'Hola, consola',
          intro: (
            <>
              <p>
                <b>JavaScript</b> es el lenguaje de programación de las páginas web. Para empezar vamos a usar la <b>consola</b>:
                con <code>console.log</code> el programa escribe un mensaje.
              </p>
              <pre>
                <code>{'console.log("Hola");\nconsole.log(2 + 3);'}</code>
              </pre>
              <p>Cada instrucción va en una línea y termina, por costumbre, con punto y coma.</p>
            </>
          ),
          task: (
            <p>
              Hacé que el programa muestre <b>dos líneas</b>: primero <code>Hola, mundo</code> y después <code>Estoy en el ITS Villada</code>.
            </p>
          ),
          hint: <p>Usá dos veces console.log, una debajo de la otra.</p>,
          starter: 'console.log("Hola, mundo");\n',
          solution: 'console.log("Hola, mundo");\nconsole.log("Estoy en el ITS Villada");\n',
          tests: [
            { text: 'La primera línea es "Hola, mundo"', check: (out) => lines(out)[0] === 'Hola, mundo' },
            { text: 'La segunda línea es "Estoy en el ITS Villada"', check: (out) => lines(out)[1] === 'Estoy en el ITS Villada' },
            { text: 'Muestra exactamente dos líneas', check: (out) => lines(out).length === 2 },
            { text: 'Usa console.log', check: (_o, code) => /console\.log\s*\(/.test(codeOnly(code)) },
          ],
        },
      ],
    },
    {
      id: 'js-dom',
      title: 'JavaScript en la página',
      desc: 'Tomar elementos del HTML, cambiar textos y responder a los clics.',
      lessons: [
        {
          id: 'js-dom-1',
          kind: 'dom',
          title: 'Un botón que saluda',
          intro: (
            <>
              <p>
                Desde JavaScript podemos tomar un elemento de la página por su <code>id</code> y cambiarle el texto. Y con{' '}
                <code>addEventListener</code> hacemos que algo pase cuando tocan un botón:
              </p>
              <pre>
                <code>{'const boton = document.getElementById("boton");\nconst mensaje = document.getElementById("mensaje");\n\nboton.addEventListener("click", function () {\n  mensaje.textContent = "¡Me tocaste!";\n});'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Cuando se toque el botón <code>#saludar</code>, el párrafo <code>#saludo</code> tiene que decir <b>¡Hola, Villada!</b>
            </p>
          ),
          hint: <p>Tomá el botón y el párrafo con document.getElementById y cambiá el textContent dentro de la función del click.</p>,
          edit: ['js'],
          starter: {
            html: '<h1>Saludador</h1>\n<button id="saludar">Saludar</button>\n<p id="saludo">...</p>\n',
            js: '// Escribí tu código acá\n',
          },
          solution: {
            html: '<h1>Saludador</h1>\n<button id="saludar">Saludar</button>\n<p id="saludo">...</p>\n',
            js: 'const boton = document.getElementById("saludar");\nconst saludo = document.getElementById("saludo");\n\nboton.addEventListener("click", function () {\n  saludo.textContent = "¡Hola, Villada!";\n});\n',
          },
          tests: [
            { text: 'Antes de tocar, el párrafo no cambió', test: (c) => c.text('#saludo') === '...' },
            { text: 'Al tocar el botón, el párrafo dice "¡Hola, Villada!"', test: (c) => c.click('#saludar') && c.text('#saludo') === '¡Hola, Villada!' },
            { text: 'El programa no tiene errores', test: (c) => c.errors.length === 0 },
          ],
        },
      ],
    },
  ],
}

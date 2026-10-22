import type { Track } from '../types'

export const CSS_TRACK: Track = {
  id: 'css',
  title: 'CSS',
  icon: '🎨',
  desc: 'El diseño de las páginas: colores, letras, cajas, espacios y cómo acomodar los elementos.',
  modules: [
    {
      id: 'css-primeros',
      title: 'Primeros pasos',
      desc: 'Reglas, selectores y propiedades.',
      lessons: [
        {
          id: 'css-1',
          kind: 'web',
          title: 'Cambiar el color de un título',
          intro: (
            <>
              <p>
                <b>CSS</b> le da estilo al HTML. Una regla tiene un <b>selector</b> (a quién se aplica) y entre llaves las{' '}
                <b>propiedades</b> con su valor:
              </p>
              <pre>
                <code>{'h1 {\n  color: red;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              En <code>styles.css</code>, hacé que el título <code>h1</code> sea de color <b>azul</b> (<code>blue</code>).
            </p>
          ),
          hint: <p>Escribí una regla con el selector <code>h1</code> y la propiedad <code>color: blue;</code></p>,
          edit: ['css'],
          starter: { html: '<h1>Taller de Computación</h1>\n<p>Aprendiendo CSS en el ITS Villada.</p>\n', css: '/* Escribí tus reglas acá */\n' },
          solution: { html: '<h1>Taller de Computación</h1>\n<p>Aprendiendo CSS en el ITS Villada.</p>\n', css: 'h1 {\n  color: blue;\n}\n' },
          tests: [
            { text: 'Hay una regla para h1', test: (c) => /(^|[\s,}])h1\s*[{,]/.test(c.css) },
            { text: 'El título se ve azul', test: (c) => c.style('h1', 'color') === 'rgb(0, 0, 255)' },
            { text: 'El párrafo no cambió de color', test: (c) => c.style('p', 'color') !== 'rgb(0, 0, 255)' },
          ],
        },
      ],
    },
  ],
}

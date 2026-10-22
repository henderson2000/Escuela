// @ts-nocheck
// Enlace con el compilador Java (javac de OpenJDK + TeaVM) compilado a WebAssembly.
// Adaptado del trabajador "java-stage" de @wasm-oj/browser (licencia MIT, (c) WASM-OJ contributors).
// El compilador y las bibliotecas son de TeaVM (Apache-2.0) y OpenJDK (GPL-2.0 con excepción Classpath).

let ce = /.+:wasm-function\[[0-9]+]:0x([0-9a-f]+).*/,
  W = function (e) {
    return e.split(`.`).reduce((e, t) => e[t], globalThis);
  },
  le = function (e, t) {
    let n = e.split(`.`),
      r = n.pop(),
      i = n.reduce((e, t) => e[t], globalThis);
    i[r] = t;
  };
function ue(e, t, n, r, i) {
  let a = { exports: null, userExports: t, stackDeobfuscator: null };
  return (
    i || de(e),
    fe(e),
    pe(e, a),
    me(e, a, n, r),
    he(e, a),
    ve(e, a, i, n),
    (e.teavmMath = Math),
    {
      supplyExports(e) {
        a.exports = e;
      },
      supplyStackDeobfuscator(e) {
        a.stackDeobfuscator = e;
      },
    }
  );
}
let G = Symbol(`javaException`);
var K = class extends Error {
  #e;
  constructor(e, t) {
    (super(),
      (this.#e = e),
      (this[G] = t),
      e.exports[`teavm.setJsException`](t, this));
  }
  get message() {
    let e = this.#e.exports[`teavm.exceptionMessage`],
      t = this.#e.exports[`teavm.stringToJs`];
    if (typeof e == `function` && typeof t == `function`) {
      let n = e(this[G]);
      if (n != null) return t(n);
    }
    return `(could not fetch message)`;
  }
};
function de(e) {
  e[`wasm:js-string`] = {
    fromCharCode: (e) => String.fromCharCode(e),
    fromCharCodeArray: () => {
      throw Error(`Not supported`);
    },
    intoCharCodeArray: () => {
      throw Error(`Not supported`);
    },
    concat: (e, t) => e + t,
    charCodeAt: (e, t) => e.charCodeAt(t),
    length: (e) => e.length,
    substring: (e, t, n) => e.substring(t, n),
  };
}
function fe(e) {
  e.teavmDate = {
    currentTimeMillis: () => new Date().getTime(),
    dateToString: (e) => new Date(e).toString(),
    getYear: (e) => new Date(e).getFullYear(),
    setYear(e, t) {
      let n = new Date(e);
      return (n.setFullYear(t), n.getTime());
    },
    getMonth: (e) => new Date(e).getMonth(),
    setMonth(e, t) {
      let n = new Date(e);
      return (n.setMonth(t), n.getTime());
    },
    getDate: (e) => new Date(e).getDate(),
    setDate(e, t) {
      let n = new Date(e);
      return (n.setDate(t), n.getTime());
    },
    create: (e, t, n, r, i, a) => new Date(e, t, n, r, i, a).getTime(),
    createFromUTC: (e, t, n, r, i, a) => Date.UTC(e, t, n, r, i, a),
  };
}
function pe(e) {
  let t = ``,
    n = ``;
  e.teavmConsole = {
    putcharStderr(e) {
      e === 10 ? (console.error(t), (t = ``)) : (t += String.fromCharCode(e));
    },
    putcharStdout(e) {
      e === 10 ? (console.log(n), (n = ``)) : (n += String.fromCharCode(e));
    },
  };
}
function me(e, t, n, r) {
  let i = n.memory || {},
    a = new FinalizationRegistry((e) => {
      let n = t.exports[`teavm.reportGarbageCollectedValue`];
      n !== void 0 && n(e.queue, e.ref);
    }),
    o = new FinalizationRegistry((e) => {
      let n = t.exports[`teavm.reportGarbageCollectedString`];
      typeof n == `function` && n(e);
    });
  if (
    ((e.teavm = {
      createWeakRef(e, t, n) {
        return (
          n !== null && a.register(e, { ref: t, queue: n }),
          new WeakRef(e)
        );
      },
      deref: (e) => {
        let t = e.deref();
        return t === void 0 ? null : t;
      },
      createStringWeakRef(e, t) {
        return (o.register(e, t), new WeakRef(e));
      },
      stringDeref: (e) => e.deref(),
      takeStackTrace() {
        let e = Error().stack,
          n = [];
        for (let t of e.split(`
`)) {
          let e = ce.exec(t);
          if (e !== null && e.length >= 2) {
            let t = parseInt(e[1], 16);
            n.push(t);
          }
        }
        return {
          getStack() {
            let e;
            if (t.stackDeobfuscator)
              try {
                e = t.stackDeobfuscator(n);
              } catch (e) {
                console.warn(`Could not deobfuscate stack`, e);
              }
            return (
              (e ||= n.map((e) => ({
                className: `java.lang.Throwable$FakeClass`,
                method: `fakeMethod`,
                file: `Throwable.java`,
                line: e,
              }))),
              e
            );
          },
        };
      },
      decorateException(e) {
        new K(t, e);
      },
      linearMemory() {
        return t.exports[`teavm.memory`].buffer;
      },
      notifyHeapResized: i.onResize || function () {},
    }),
    r)
  ) {
    let t = _e(r);
    if (t === null ? ge(r) : t.imported) {
      let n = i.external;
      if (!n) {
        t === null && (t = {});
        let e = i.minSize || t.min || 0,
          r = i.maxSize || t.max;
        n = new WebAssembly.Memory({
          shared: i.shared === !0,
          initial: e,
          maximum: r,
        });
      }
      e.teavm.memory = n;
    }
  }
}
function he(e) {
  e.teavmAsync = {
    offer(e, t, n) {
      let r = Math.max(0, n - Date.now());
      return setTimeout(() => {
        t(e);
      }, r);
    },
    kill(e) {
      clearTimeout(e);
    },
  };
}
function ge(e) {
  return (
    WebAssembly.Module.imports(e).findIndex(
      ({ module: e, name: t, kind: n }) =>
        e === `teavm` && t === `memory` && n === `memory`,
    ) >= 0
  );
}
function _e(e) {
  let t = WebAssembly.Module.customSections(e, `teavm.memoryRequirements`);
  return t.length === 1 ? JSON.parse(new TextDecoder().decode(t[0])) : null;
}
function ve(e, t, n, r) {
  let i = Symbol(`javaObject`),
    a = Symbol(`functions`),
    o = Symbol(`functionOrigin`),
    s = Symbol(`wrapperCallMarker`),
    c = new WeakMap(),
    l = new WeakMap(),
    u = new Map(),
    d = new FinalizationRegistry((e) => u.delete(e)),
    f = new WeakMap(),
    p = 2463534242,
    m = () => {
      let e = p;
      return ((e ^= e << 13), (e ^= e >>> 17), (e ^= e << 5), (p = e), e);
    };
  function h(e) {
    return e;
  }
  function g(e) {
    let t = ``,
      n = e.charAt(0);
    t += _(n) ? n : `_`;
    for (let n = 1; n < e.length; ++n) {
      let r = e.charAt(n);
      t += v(r) ? r : `_`;
    }
    return t;
  }
  function _(e) {
    return (
      (e >= `A` && e <= `Z`) || (e >= `a` && e <= `z`) || e === `_` || e === `$`
    );
  }
  function v(e) {
    return _(e) || (e >= `0` && e <= `9`);
  }
  function y(e, t, n) {
    e === null ? le(t, n) : (e[t] = n);
  }
  function b(e) {
    if (e instanceof WebAssembly.Exception) {
      let n = t.exports[`teavm.javaException`],
        r = t.exports[`teavm.getJsException`];
      if (e.is(n)) {
        let i = e.getArg(n, 0),
          a = C(i);
        if (a !== null) return a;
        let o = r(i);
        return (o === void 0 && (o = new K(t, i)), o);
      }
    }
    return e;
  }
  function x(e) {
    return G in e ? e[G] : t.exports[`teavm.js.wrapException`](e);
  }
  function S(e) {
    t.exports[`teavm.js.throwException`](x(e));
  }
  function C(e) {
    return t.exports[`teavm.js.extractException`](e);
  }
  function w(e) {
    throw b(e);
  }
  function T(e, t) {
    try {
      return e === null ? W(t) : e[t];
    } catch (e) {
      S(e);
    }
  }
  function E(e, t) {
    let n = e.length - +!!t,
      r = function (...r) {
        try {
          return t
            ? e(...Array.from({ length: n }, (e, t) => r[t]), r.slice(n))
            : e(...Array.from({ length: n }, (e, t) => r[t]));
        } catch (e) {
          w(e);
        }
      };
    return (Object.defineProperty(r, "length", { value: n }), r);
  }
  function D(e, t) {
    return {
      [e]: function (e, n) {
        return t.call(this, e, n);
      },
    }[e];
  }
  e.teavmJso = {
    stringBuiltinsSupported: () => n,
    isUndefined: (e) => e === void 0,
    emptyArray: () => [],
    appendToArray: (e, t) => e.push(t),
    unwrapBoolean: (e) => +!!e,
    wrapBoolean: (e) => !!e,
    getProperty: T,
    setProperty: y,
    setPropertyPure: y,
    global(e) {
      try {
        return W(e);
      } catch (e) {
        S(e);
      }
    },
    createClass(e, t, n) {
      e = g(e || `JavaObject`);
      let r,
        o = D(e, function (e, t) {
          if (e === s) r.call(this, t);
          else if (n === null)
            throw Error(`This class can't be instantiated directly`);
          else
            try {
              return n.apply(null, arguments);
            } catch (e) {
              w(e);
            }
        });
      ((r =
        t === null
          ? function (e) {
              ((this[i] = e), (this[a] = null));
            }
          : function (e) {
              t.call(this, e);
            }),
        (o.prototype = Object.create(t ? t.prototype : Object.prototype)),
        (o.prototype.constructor = o));
      let c = D(e, function (e) {
        return o.call(this, s, e);
      });
      return ((c[s] = o), (c.prototype = o.prototype), c);
    },
    exportClass(e) {
      return e[s];
    },
    defineMethod(e, t, n, r) {
      let i = E(n, r);
      ((e.prototype[t] = function (...e) {
        return i(this, ...e);
      }),
        Object.defineProperty(e.prototype[t], "length", {
          value: i.length - 1,
        }));
    },
    defineStaticMethod(e, t, n, r) {
      e[t] = E(n, r);
    },
    defineFunction: E,
    defineProperty(e, t, n, r) {
      let i = {
        get() {
          try {
            return n(this);
          } catch (e) {
            w(e);
          }
        },
      };
      (r !== null &&
        (i.set = function (e) {
          try {
            r(this, e);
          } catch (e) {
            w(e);
          }
        }),
        Object.defineProperty(e.prototype, t, i));
    },
    defineStaticProperty(e, t, n, r) {
      let i = {
        get() {
          try {
            return n();
          } catch (e) {
            w(e);
          }
        },
      };
      (r !== null &&
        (i.set = function (e) {
          try {
            r(e);
          } catch (e) {
            w(e);
          }
        }),
        Object.defineProperty(e, t, i));
    },
    javaObjectToJS(e, t) {
      if (e === null) return null;
      let n = c.get(e);
      if (n !== void 0) {
        let e = n.deref();
        if (e !== void 0) return e;
      }
      let r = new t(e);
      return (c.set(e, new WeakRef(r)), r);
    },
    unwrapJavaObject(e) {
      return e[i];
    },
    asFunction(e, t) {
      if (e == null) return null;
      let n = e[a];
      n === null && ((n = Object.create(null)), (e[a] = n));
      let r = n[t];
      return (
        typeof r != `function` &&
          ((r = function () {
            return e[t].apply(e, arguments);
          }),
          (r[o] = e),
          (n[t] = r)),
        r
      );
    },
    functionAsObject(e, t) {
      if (e == null) return null;
      let n = e[o];
      if (n !== void 0) {
        let r = n[a];
        if (r !== void 0 && r[t] === e) return n;
      }
      return {
        [t]: function (...t) {
          try {
            return e(...t);
          } catch (e) {
            w(e);
          }
        },
      };
    },
    wrapObject(e) {
      if (e === null) return null;
      if (typeof e == `object` || typeof e == `function`) {
        let n = e[i];
        return typeof n == `object` ||
          ((n = l.get(e)), n !== void 0 && ((n = n.deref()), n !== void 0))
          ? n
          : ((n = t.exports[`teavm.jso.createWrapper`](e)),
            l.set(e, new WeakRef(n)),
            n);
      }
      {
        let n = u.get(e);
        return n !== void 0 && ((n = n.deref()), n !== void 0)
          ? n
          : ((n = t.exports[`teavm.jso.createWrapper`](e)),
            u.set(e, new WeakRef(n)),
            d.register(n, e),
            n);
      }
    },
    isPrimitive: (e, t) => typeof e === t || e === null,
    instanceOf: (e, t) => e instanceof t,
    instanceOfOrNull: (e, t) => e === null || e instanceof t,
    sameRef: (e, t) => e === t,
    hashCode: (e) => {
      if (
        typeof e == `object` ||
        typeof e == `function` ||
        typeof e == `symbol`
      ) {
        let t = f.get(e);
        return typeof t == `number` ? t : ((t = m()), f.set(e, t), t);
      }
      return typeof e == `number`
        ? e | 0
        : typeof e == `bigint`
          ? BigInt.asIntN(e, 32)
          : typeof e == `boolean`
            ? +!!e
            : 0;
    },
    apply: (e, t, n) => {
      try {
        return e === null ? W(t)(...n) : e[t](...n);
      } catch (e) {
        S(e);
      }
    },
    concatArray: (e, t) => [...e, ...t],
    getJavaException: (e) => e[G],
    getJSException: (e) => {
      let n = t.exports[`teavm.getJsException`];
      return n(e);
    },
    jsExports: () => t.userExports,
  };
  for (let t of [
    `wrapByte`,
    `wrapShort`,
    `wrapChar`,
    `wrapInt`,
    `wrapLong`,
    `wrapFloat`,
    `wrapDouble`,
    `unwrapByte`,
    `unwrapShort`,
    `unwrapChar`,
    `unwrapInt`,
    `unwrapLong`,
    `unwrapFloat`,
    `unwrapDouble`,
  ])
    e.teavmJso[t] = h;
  function O(e) {
    try {
      return e();
    } catch (e) {
      S(e);
    }
  }
  for (let t = 0; t < 32; ++t)
    ((e.teavmJso[`createFunction` + t] = function (...e) {
      let t = r.jsBodyFactories?.get(JSON.stringify(e));
      if (!t) throw Error(`Missing statically compiled TeaVM JavaScript body`);
      return t.bind(this, O);
    }),
      (e.teavmJso[`bindFunction` + t] = (e, ...t) => e.bind(null, ...t)),
      (e.teavmJso[`callFunction` + t] = (e, ...t) => {
        try {
          return e(...t);
        } catch (e) {
          S(e);
        }
      }),
      (e.teavmJso[`callMethod` + t] = (e, t, ...n) => {
        try {
          return e === null ? W(t)(...n) : e[t](...n);
        } catch (e) {
          S(e);
        }
      }),
      (e.teavmJso[`construct` + t] = (e, ...t) => {
        try {
          return Reflect.construct(e, t);
        } catch (e) {
          S(e);
        }
      }),
      (e.teavmJso[`arrayOf` + t] = (...e) => e));
}
let q = null;
function ye() {
  return (
    q === null &&
      (q = (async () => {
        let e = new Int8Array([
          0, 97, 115, 109, 1, 0, 0, 0, 1, 7, 1, 96, 1, 127, 1, 100, 111, 2, 31,
          1, 14, 119, 97, 115, 109, 58, 106, 115, 45, 115, 116, 114, 105, 110,
          103, 12, 102, 114, 111, 109, 67, 104, 97, 114, 67, 111, 100, 101, 0,
          0, 3, 1, 0, 5, 4, 1, 1, 0, 0, 7, 10, 1, 6, 109, 101, 109, 111, 114,
          121, 2, 0, 10, -127, -128, -128, 0, 0,
        ]);
        try {
          let t = new Response(e, {
              headers: { "Content-Type": `application/wasm` },
            }),
            n = await WebAssembly.compileStreaming(t, {
              builtins: [`js-string`],
            });
          return (
            await WebAssembly.instantiate(n, {}, { builtins: [`js-string`] }),
            !0
          );
        } catch {
          return !1;
        }
      })()),
    q
  );
}
const be = (e) => WebAssembly.compile(e, { builtins: [`js-string`] }),
  xe = new Map([
    [
      `["return Object.create(null);"]`,
      function (e) {
        return Object.create(null);
      },
    ],
    [
      `["array","return array;"]`,
      function (e, t) {
        return t;
      },
    ],
    [
      `["str","return str;"]`,
      function (e, t) {
        return t;
      },
    ],
    [
      `["__this__","return __this__;"]`,
      function (e, t) {
        return t;
      },
    ],
    [
      `["number","return number;"]`,
      function (e, t) {
        return t;
      },
    ],
    [
      `["str","return str;"]`,
      function (e, t) {
        return t;
      },
    ],
    [
      `["size","return new Array(size);"]`,
      function (e, t) {
        return Array(t);
      },
    ],
  ]);
async function Se(e) {
  let t = await be(e),
    n = {},
    r = {},
    i = ue(n, r, { jsBodyFactories: xe }, t, await ye()),
    a = await WebAssembly.instantiate(t, n);
  i.supplyExports(a.exports);
  for (let [e, t] of Object.entries(a.exports))
    t instanceof WebAssembly.Global &&
      Object.defineProperty(r, e, { get: () => t.value });
  if (typeof r.createCompiler != `function`)
    throw Error(`The pinned Java compiler has no createCompiler export.`);
  return r;
}
async function Ce(e, t, n) {
  if (!t.files.find((e) => e.path === t.entry))
    throw Error(`Java entry '${t.entry}' does not exist.`);
  let r = e.createCompiler();
  (r.setSdk(new Int8Array(n.sdk.buffer, n.sdk.byteOffset, n.sdk.byteLength)),
    r.setTeaVMClasslib(
      new Int8Array(
        n.runtime.buffer,
        n.runtime.byteOffset,
        n.runtime.byteLength,
      ),
    ));
  let i = [],
    a = [];
  r.onDiagnostic((e) => {
    if (e.type !== `javac`) {
      e.severity === `error` && a.push(e.message);
      return;
    }
    i.push({
      severity: e.severity,
      message: e.message,
      source: `java`,
      line: Math.max(1, e.lineNumber),
      column: 1,
      file: e.fileName ?? t.entry,
    });
  });
  for (let e of t.files)
    e.path.endsWith(`.java`) && r.addSourceFile(e.path, e.content);
  let o = r.compile(),
    s = i.map(
      (e) => `${e.file ?? t.entry}:${e.line ?? 1}: ${e.severity}: ${e.message}`,
    ).join(`
`);
  if (i.some((e) => e.severity === `error`))
    return { success: !1, stdout: ``, stderr: s, diagnostics: i };
  if (!o) throw Error(`Java compilation failed without source diagnostics.`);
  let c = r.findEntryClass(t.entry);
  if (!c) throw Error(`Java entry '${t.entry}' did not emit its named class.`);
  if (
    !r.generateWebAssembly({
      mainClass: c,
      outputName: `app`,
      optimization: t.optimization,
    }) ||
    a.length
  )
    throw Error(
      `Java WASI backend failed.${
        a.length
          ? `\n${a.join(`
`)}`
          : ``
      }`,
    );
  let l = r.getWebAssemblyOutputFile(`app`);
  if (!l) throw Error(`Java compiler did not produce app.wasm.`);
  let u = Uint8Array.from(l);
  try {
    await WebAssembly.compile(u);
  } catch (e) {
    throw Error(`Java compiler produced invalid WebAssembly.`, { cause: e });
  }
  return { success: !0, stdout: ``, stderr: s, diagnostics: i, wasm: u };
}

export { Se as loadCompiler, Ce as compileJava };

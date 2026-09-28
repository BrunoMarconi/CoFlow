/* Comprobaciones de src/lib/attribution.ts.
 *
 * El frontend no tiene runner de tests, y meter uno solo para esto seria
 * desproporcionado. Este script ejecuta los modulos REALES (no una copia)
 * montandoles debajo un localStorage de mentira, y devuelve codigo 1 si
 * algo falla, asi que sirve igual en local que en CI.
 *
 *   npm run verify:attribution
 *
 * Node 24 ejecuta TypeScript directamente con --experimental-strip-types.
 * El hook de resolucion de abajo existe porque los modulos importan
 * "./cookieNotice" sin extension: TypeScript lo resuelve, Node no. */

import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(
      `export async function resolve(specifier, context, next) {
         try { return await next(specifier, context); }
         catch (error) {
           if (specifier.startsWith(".")) return await next(specifier + ".ts", context);
           throw error;
         }
       }`,
    ),
);

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};
globalThis.window = { localStorage: globalThis.localStorage, dispatchEvent: () => true };
globalThis.CustomEvent = class {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
};

// new URL sobre import.meta.url ya es un file://, servible tal cual a
// import(). Pasarlo por pathToFileURL lo rompia en Windows (C:\C:\...).
const lib = new URL("../src/lib/", import.meta.url).href;
const { captureAttribution, readAttribution, attributionPayload } = await import(`${lib}attribution.ts`);
const { saveCookieConsent } = await import(`${lib}cookieNotice.ts`);

const ESN = { signup_source: "esn_malaga", signup_medium: "partner", signup_campaign: "erasmus_2026" };
const ATTRIBUTION_KEY = "coflow:attribution";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : " FALLA"} ${name}`);
  if (!ok) {
    console.log(`        esperado: ${JSON.stringify(expected)}`);
    console.log(`        recibido: ${JSON.stringify(actual)}`);
  }
}

/** Estado limpio con la analitica aceptada. */
function freshWithConsent() {
  store.clear();
  saveCookieConsent({ analytics: true, preferences: false });
}

console.log("\nConsentimiento");
store.clear();
captureAttribution("?utm_source=esn_malaga&utm_medium=partner&utm_campaign=erasmus_2026", "/erasmus");
check("sin consentimiento no captura nada", readAttribution(), null);

freshWithConsent();
captureAttribution("", "/erasmus");
saveCookieConsent({ analytics: false, preferences: false });
check("rechazar borra coflow:attribution de localStorage", localStorage.getItem(ATTRIBUTION_KEY), null);
check("y attributionPayload() queda vacio", attributionPayload(), {});

// Dato presente pero consentimiento retirado: el candado de lectura tiene
// que tapar el hueco aunque el borrado no haya ocurrido.
freshWithConsent();
captureAttribution("", "/erasmus");
const orphan = localStorage.getItem(ATTRIBUTION_KEY);
saveCookieConsent({ analytics: false, preferences: false });
localStorage.setItem(ATTRIBUTION_KEY, orphan); // simula un borrado que fallo
check("dato huerfano sin consentimiento no se devuelve", attributionPayload(), {});

// Volver a aceptar no resucita lo viejo: se captura de cero.
saveCookieConsent({ analytics: true, preferences: false });
localStorage.removeItem(ATTRIBUTION_KEY);
captureAttribution("", "/");
check("tras reaceptar, sin origen nuevo no hay atribucion", attributionPayload(), {});
captureAttribution("", "/erasmus");
check("tras reaceptar, vuelve a capturar con normalidad", attributionPayload(), ESN);

console.log("\nCaptura");
freshWithConsent();
captureAttribution("?utm_source=esn_malaga&utm_medium=partner&utm_campaign=erasmus_2026", "/");
check("captura las UTM de la URL", attributionPayload(), ESN);

freshWithConsent();
captureAttribution("", "/erasmus");
check("/erasmus sin UTM atribuye por la ruta", attributionPayload(), ESN);

freshWithConsent();
captureAttribution("", "/");
captureAttribution("", "/register");
check("trafico organico no genera atribucion", attributionPayload(), {});

freshWithConsent();
captureAttribution(`?utm_source=${encodeURIComponent("  ESN_Malaga  ")}&utm_medium=${"y".repeat(300)}`, "/");
const messy = readAttribution();
check("normaliza el source", messy.source, "esn_malaga");
check("recorta el medium al ancho de la columna", messy.medium.length, 64);

console.log("\nFirst touch y caducidad");
freshWithConsent();
captureAttribution("", "/erasmus");
captureAttribution("", "/comunidades");
captureAttribution("?utm_source=otra_campana&utm_medium=email&utm_campaign=x", "/");
captureAttribution("", "/erasmus");
captureAttribution("", "/register");
check("el primer origen gana y sobrevive a la navegacion", attributionPayload(), ESN);

freshWithConsent();
captureAttribution("", "/erasmus");
const stored = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY));
stored.capturedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(stored));
check("caduca pasados los 30 dias", readAttribution(), null);
captureAttribution("", "/erasmus");
check("y una vez caducada se puede volver a capturar", attributionPayload(), ESN);

console.log(failures === 0 ? "\nTodo correcto.\n" : `\n${failures} comprobaciones fallidas.\n`);
process.exit(failures === 0 ? 0 : 1);

/**
 * Reglas sobre qué magnitudes se pueden representar en un gráfico.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ────────────────────────────────────────────────────────────────────
 * El backend devuelve `tipo_dato` en INGLÉS (`numeric`, `boolean`, `text`,
 * `json`), pero en el frontend había comparaciones contra "booleano" (en
 * español), que nunca coincidían. Resultado: canales booleanos que se
 * intentaban graficar y producían gráficos vacíos sin explicación.
 *
 * Para que no vuelva a pasar, la decisión vive aquí y en ningún otro sitio.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ NO TODO SE PUEDE GRAFICAR
 * ────────────────────────────────────────────────────────────────────
 * Un gráfico de líneas supone que los valores son CONTINUOS y ORDENABLES:
 *
 *   - `numeric` → SÍ. Temperatura, humedad, voltaje… tienen magnitud, se
 *     pueden promediar y dibujar una línea con sentido.
 *
 *   - `boolean` → NO. Un eje Y con "true/false" no significa nada; promediar
 *     `on` y `off` es absurdo. Lo correcto es mostrar el estado actual y los
 *     cambios a lo largo del tiempo.
 *
 *   - `text` → NO. Ni se mide ni se ordena. "ok", "error",
 *     "mantenimiento"… se representan como una cronología de estados.
 *
 *   - `json` → NO. Es una estructura, no un valor.
 *
 * Además, el endpoint `/series` del backend agrupa con `avg()`, que en SQL
 * solo tiene sentido sobre columnas numéricas: filtra con
 * `valor_numerico IS NOT NULL`. Por eso un canal no numérico devuelve una
 * serie VACÍA en lugar de un error, y el gráfico saldría en blanco sin
 * explicar el motivo.
 */

/** Tipos de dato que devuelve el backend en `canales.tipo_dato`. */
export type TipoDatoMagnitud = "numeric" | "boolean" | "text" | "json";

/** Normaliza el valor que llega del backend (por si viene vacío o con mayúsculas). */
export function normalizarTipoDato(
  tipo: string | null | undefined
): TipoDatoMagnitud | "desconocido" {
  const valor = (tipo ?? "").trim().toLowerCase();

  if (valor.startsWith("numer")) return "numeric";
  if (valor.startsWith("bool")) return "boolean";
  if (valor.startsWith("text") || valor.startsWith("str")) return "text";
  if (valor.startsWith("json")) return "json";

  return "desconocido";
}

/**
 * ¿Esta magnitud se puede representar con un gráfico de líneas?
 *
 * Solo si es numérica. En cualquier otro caso el gráfico saldría vacío o sería
 * engañoso.
 */
export function sePuedeGraficar(
  tipo: string | null | undefined
): boolean {
  return normalizarTipoDato(tipo) === "numeric";
}

/** Etiqueta legible del tipo, para mensajes de la interfaz. */
export function etiquetaTipoDato(tipo: string | null | undefined): string {
  switch (normalizarTipoDato(tipo)) {
    case "numeric":
      return "numérico";
    case "boolean":
      return "booleano";
    case "text":
      return "texto";
    case "json":
      return "JSON";
    default:
      return "desconocido";
  }
}

/**
 * Explica por qué una magnitud no se puede graficar.
 *
 * Se usa para no dejar al usuario con un hueco vacío sin motivo aparente.
 */
export function motivoNoGraficable(
  tipo: string | null | undefined
): string {
  switch (normalizarTipoDato(tipo)) {
    case "boolean":
      return "Es un estado (on/off), no una magnitud continua: un gráfico de líneas no tendría sentido.";
    case "text":
      return "Es un texto de estado, no un valor medible.";
    case "json":
      return "Es una estructura de datos (JSON), no un valor.";
    case "numeric":
      return "";
    default:
      return "Tipo de dato no reconocido.";
  }
}

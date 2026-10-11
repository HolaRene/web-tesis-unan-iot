/**
 * Presentación de magnitudes y frescura de los datos.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ DOS CONCEPTOS DISTINTOS
 * ────────────────────────────────────────────────────────────────────
 *   - La MAGNITUD dice QUÉ se mide (temperatura, voltaje…). Se representa
 *     con un icono para que el panel se lea de un vistazo.
 *
 *   - La FRESCURA dice CUÁNDO se midió. Es la diferencia entre "el sensor
 *     está bien" y "el sensor dejó de enviar hace tres días".
 *
 * Sin lo segundo, un panel lleno de números verdes puede estar mostrando
 * datos de la semana pasada sin que nadie lo note.
 */
import {
  Activity,
  BatteryCharging,
  Droplets,
  Flame,
  Gauge,
  Plug,
  Power,
  Radio,
  Ruler,
  Sigma,
  Thermometer,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Nivel de frescura de un dato, de más reciente a más antiguo. */
export type Frescura = "fresco" | "retrasado" | "obsoleto" | "sin-datos";

/**
 * Umbrales de frescura en milisegundos.
 *
 * Se comparan contra la EDAD del dato (ahora − registrado_en):
 *   - fresco    → menos de 2 min: el equipo está enviando con normalidad
 *   - retrasado → hasta 15 min: puede ser normal si el envío es lento,
 *                 pero conviene mirarlo
 *   - obsoleto  → más de 15 min: el equipo casi con seguridad dejó de enviar
 */
export const UMBRAL_FRESCO_MS = 2 * 60_000;
export const UMBRAL_RETRASADO_MS = 15 * 60_000;

/**
 * Calcula la frescura de un dato.
 *
 * @param registradoEn Marca de tiempo del dato (ISO) o `null` si no hay.
 * @param ahora        Instante de referencia. Se pasa desde fuera en lugar de
 *                     usar `Date.now()` aquí para que la función sea pura y
 *                     el resultado no cambie entre renderizados.
 */
export function calcularFrescura(
  registradoEn: string | null | undefined,
  ahora: Date
): Frescura {
  if (!registradoEn) return "sin-datos";

  const t = new Date(registradoEn).getTime();
  if (Number.isNaN(t)) return "sin-datos";

  const edad = ahora.getTime() - t;

  /*
   * Edad negativa: el dato está en el futuro. Ocurre con relojes
   * desajustados entre el equipo y el servidor. Se trata como fresco, que es
   * lo más razonable, en lugar de marcarlo como error.
   */
  if (edad < 0) return "fresco";
  if (edad < UMBRAL_FRESCO_MS) return "fresco";
  if (edad < UMBRAL_RETRASADO_MS) return "retrasado";
  return "obsoleto";
}

/** Texto legible de cada nivel de frescura. */
export function textoFrescura(f: Frescura): string {
  switch (f) {
    case "fresco":
      return "Al día";
    case "retrasado":
      return "Con retraso";
    case "obsoleto":
      return "Sin datos recientes";
    default:
      return "Sin datos";
  }
}

/**
 * Clases del indicador según la frescura.
 *
 * Se devuelven clases de Tailwind (no un color suelto) para que funcionen
 * igual en tema claro y oscuro.
 */
export function clasesFrescura(f: Frescura): {
  punto: string;
  texto: string;
  badge: "secondary" | "outline" | "destructive";
} {
  switch (f) {
    case "fresco":
      return {
        punto: "bg-emerald-500",
        texto: "text-emerald-600 dark:text-emerald-400",
        badge: "secondary",
      };
    case "retrasado":
      return {
        punto: "bg-amber-500",
        texto: "text-amber-600 dark:text-amber-400",
        badge: "outline",
      };
    case "obsoleto":
      return {
        punto: "bg-red-500",
        texto: "text-red-600 dark:text-red-400",
        badge: "destructive",
      };
    default:
      return {
        punto: "bg-muted-foreground",
        texto: "text-muted-foreground",
        badge: "outline",
      };
  }
}

/**
 * Icono según la magnitud.
 *
 * El emparejamiento es por palabra clave, no por lista cerrada. Así una
 * magnitud nueva ("PM2.5", "CAUDAL"…) encuentra icono sin tocar el código:
 * basta con que su nombre o código contenga una palabra conocida.
 *
 * El orden importa: se comprueba de arriba abajo y gana la primera
 * coincidencia, así que lo más específico va primero.
 */
const ICONOS: Array<{ claves: string[]; icono: LucideIcon }> = [
  { claves: ["temperatura", "temp", "termic"], icono: Thermometer },
  { claves: ["humedad", "humidity", "humed"], icono: Droplets },
  { claves: ["co2", "voc", "aire", "air", "gas", "calidad"], icono: Wind },
  { claves: ["presion", "pressure", "hpa", "bar"], icono: Gauge },
  { claves: ["voltaje", "voltage", "tension", "volt"], icono: Zap },
  { claves: ["corriente", "current", "amper", "amperaje"], icono: Activity },
  { claves: ["potencia", "power", "watt", "kw"], icono: BatteryCharging },
  { claves: ["frecuencia", "frequency", "hz", "hercio"], icono: Radio },
  { claves: ["nivel", "level", "llenado"], icono: Ruler },
  { claves: ["caudal", "flujo", "flow"], icono: Waves },
  { claves: ["motor", "bomba", "pump"], icono: Power },
  { claves: ["enchufado", "plug", "toma", "rele", "relay"], icono: Plug },
  { claves: ["fuego", "llama", "fire", "humo", "smoke"], icono: Flame },
  { claves: ["co2"], icono: Wind },
  { claves: ["factor", "coseno", "phi"], icono: Sigma },
];

/**
 * Devuelve el icono de una magnitud.
 *
 * Se busca por el CÓDIGO y el NOMBRE a la vez: el código suele ser más
 * estable ("HUMEDAD_RELATIVA"), pero el nombre es más descriptivo en
 * instalaciones donde el código es un número.
 */
export function iconoDeMagnitud(
  codigo?: string | null,
  nombre?: string | null
): LucideIcon {
  const texto = `${codigo ?? ""} ${nombre ?? ""}`.toLowerCase();

  for (const { claves, icono } of ICONOS) {
    if (claves.some((k) => texto.includes(k))) return icono;
  }

  // Sin coincidencia: icono genérico, nunca vacío.
  return Activity;
}

/**
 * Decimales por unidad.
 *
 * No todas las magnitudes necesitan la misma precisión, y mostrar siempre un
 * decimal produce dos problemas opuestos:
 *
 *   - Frecuencia: 50,05 Hz y 50,94 Hz se verían IGUALES ("50 Hz") con un solo
 *     decimal. En una red eléctrica esa diferencia importa.
 *   - Temperatura: 26,14 °C no aporta nada frente a 26,1 °C: el sensor no
 *     tiene esa precisión real.
 */
const DECIMALES_POR_UNIDAD: Record<string, number> = {
  Hz: 2,
  A: 2,
  V: 1,
  W: 1,
  "°C": 1,
  C: 1,
  "%": 1,
  ppm: 0,
  hPa: 1,
};

/**
 * Formatea un valor según su unidad.
 *
 * Los valores grandes se abrevian (1491.5 W → "1.5 kW") para que quepan en
 * la tarjeta sin romper la alineación.
 */
export function formatearValorConUnidad(
  valor: number | null | undefined,
  unidad?: string | null,
  decimales?: number
): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";

  let numero = valor;
  let sufijo = unidad ?? "";

  /*
   * Al abreviar, se sube un decimal: 1491.5 W → 1.5 kW. Si se mantuviera el
   * de vatios, un valor de 1005 W daría "1 kW" y parecería redondeado.
   */
  let dec = decimales ?? DECIMALES_POR_UNIDAD[unidad ?? ""] ?? 1;

  if (unidad === "W" && Math.abs(valor) >= 1000) {
    numero = valor / 1000;
    sufijo = "kW";
    dec = Math.max(dec, 2);
  } else if (unidad === "ppm" && Math.abs(valor) >= 1000) {
    numero = valor / 1000;
    sufijo = "kppm";
    dec = Math.max(dec, 1);
  }

  const redondeado = Number(numero.toFixed(dec));
  return `${redondeado}${sufijo ? ` ${sufijo}` : ""}`;
}

/**
 * Configuración de los gráficos de historial agregado.
 *
 * Centraliza los rangos temporales y los intervalos de agrupación para que
 * las vistas de sensor y de canal compartan exactamente las mismas opciones.
 */

/** Intervalo de agrupación admitido por el backend. */
export type IntervaloAgregacion = "minuto" | "hora" | "dia" | "semana" | "mes";

/**
 * Milisegundos entre refrescos de la vista "en vivo" (chart por minuto).
 * Suficientemente corto para verse fluido y suficientemente largo para no
 * castigar la API.
 */
export const REFRESCO_EN_VIVO_MS = 10_000;

/** Opción de intervalo para los selectores. */
export interface OpcionIntervalo {
  valor: IntervaloAgregacion;
  etiqueta: string;
  /** Cómo se lee un punto del eje X con este intervalo. */
  formatoEje: string;
}

export const INTERVALOS: OpcionIntervalo[] = [
  { valor: "minuto", etiqueta: "Por minuto", formatoEje: "HH:mm" },
  { valor: "hora", etiqueta: "Por hora", formatoEje: "HH:mm" },
  { valor: "dia", etiqueta: "Por día", formatoEje: "dd MMM" },
  { valor: "semana", etiqueta: "Por semana", formatoEje: "'Sem' w" },
  { valor: "mes", etiqueta: "Por mes", formatoEje: "MMM yyyy" },
];

/** Rango temporal predefinido. */
export interface OpcionRango {
  valor: string;
  etiqueta: string;
  /** Horas hacia atrás desde ahora. `null` = sin límite. */
  horas: number | null;
}

export const RANGOS: OpcionRango[] = [
  { valor: "24h", etiqueta: "Últimas 24 h", horas: 24 },
  { valor: "7d", etiqueta: "Últimos 7 días", horas: 24 * 7 },
  { valor: "30d", etiqueta: "Últimos 30 días", horas: 24 * 30 },
  { valor: "90d", etiqueta: "Últimos 90 días", horas: 24 * 90 },
  { valor: "todo", etiqueta: "Todo el histórico", horas: null },
];

/** Rango por defecto de las vistas. */
export const RANGO_POR_DEFECTO = "7d";

/** Intervalo por defecto. */
export const INTERVALO_POR_DEFECTO: IntervaloAgregacion = "hora";

/**
 * Calcula el rango ISO `desde`/`hasta` a partir de un rango predefinido.
 * Devuelve `undefined` en `desde` cuando el rango es "todo".
 */
export function calcularRango(valorRango: string): {
  desde?: string;
  hasta?: string;
} {
  const rango = RANGOS.find((r) => r.valor === valorRango) ?? RANGOS[1];
  if (rango.horas === null) return {};

  const hasta = new Date();
  const desde = new Date(hasta.getTime() - rango.horas * 60 * 60 * 1000);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

/**
 * Sugiere un intervalo coherente con el rango elegido, para no acabar con
 * 720 puntos por hora en una vista de 90 días.
 *
 * El usuario puede cambiarlo después; esto solo evita el caso absurdo.
 */
export function intervaloParaRango(valorRango: string): IntervaloAgregacion {
  switch (valorRango) {
    case "24h":
      return "hora";
    case "7d":
      return "hora";
    case "30d":
      return "dia";
    case "90d":
      return "dia";
    default:
      return "mes";
  }
}

/** Color por defecto de series numéricas y de la banda de rango. */
export const COLOR_MEDIA = "#0ea5e9";
export const COLOR_BANDA = "#0ea5e9";

/**
 * Paleta para comparar varios canales del mismo sensor.
 * Orden estable para que un canal conserve su color entre renders.
 */
export const PALETA_CANALES = [
  "#0ea5e9",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#ef4444",
];

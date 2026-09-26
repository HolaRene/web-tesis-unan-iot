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
  /**
   * Días naturales hacia atrás. Tiene prioridad sobre `horas` cuando está
   * definido: "hoy" y "ayer" son días completos, no ventanas de 24 h.
   */
  dias?: number;
}

export const RANGOS: OpcionRango[] = [
  { valor: "hoy", etiqueta: "Hoy", horas: null, dias: 0 },
  { valor: "ayer", etiqueta: "Ayer", horas: null, dias: 1 },
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

/** Inicio del día local de una fecha. */
function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calcula el rango `desde`/`hasta` a partir de un rango predefinido.
 *
 * IMPORTANTE: `ahora` se REDONDEA a la hora en punto antes de calcular el
 * rango. Esa decisión resuelve dos problemas a la vez:
 *
 *   1. El bug original: `hasta` se calculaba una vez al abrir la página y se
 *      quedaba congelado, así que las mediciones posteriores no aparecían.
 *      Redondeando, el rango avanza solo con el paso de las horas.
 *
 *   2. El parpadeo que introdujo el primer arreglo: si el rango incluye los
 *      minutos y segundos actuales, su valor cambia en cada tick del reloj
 *      (cada 10 s). Como el rango forma parte de la clave de caché de
 *      TanStack Query, cada cambio se interpreta como una consulta NUEVA:
 *      el gráfico vuelve a estado "cargando" y se recarga entero.
 *
 * Con el redondeo, la clave de caché solo cambia una vez por hora, así que los
 * charts no se recargan continuamente pero acaban incluyendo los datos nuevos.
 *
 * @param valorRango 'hoy' | 'ayer' | '24h' | '7d' | '30d' | '90d' | 'todo'
 * @param ahora      Instante de referencia (normalmente el actual).
 * @param redondear  Redondear a la hora en punto (por defecto sí).
 */
export function calcularRango(
  valorRango: string,
  ahora: Date = new Date(),
  redondear = true
): {
  desde?: string;
  hasta?: string;
} {
  const rango = RANGOS.find((r) => r.valor === valorRango) ?? RANGOS[3];

  // Instante estable: se descartan minutos, segundos y milisegundos para que
  // el resultado no cambie en cada tick del reloj.
  const referencia = new Date(ahora);
  if (redondear) referencia.setMinutes(0, 0, 0);

  // "Hoy" y "Ayer" son días naturales completos.
  if (rango.dias !== undefined) {
    const inicioHoy = inicioDelDia(referencia);
    const desde = new Date(inicioHoy);
    desde.setDate(desde.getDate() - rango.dias);
    // Para "hoy" el fin es la hora en punto actual; para "ayer", el final
    // de ese día.
    const hasta =
      rango.dias === 0
        ? new Date(referencia)
        : new Date(inicioHoy.getTime() - 1);
    return { desde: desde.toISOString(), hasta: hasta.toISOString() };
  }

  if (rango.horas === null) return {};

  const desde = new Date(referencia.getTime() - rango.horas * 60 * 60 * 1000);
  return { desde: desde.toISOString(), hasta: referencia.toISOString() };
}

/**
 * Sugiere un intervalo coherente con el rango elegido, para no acabar con
 * 720 puntos por hora en una vista de 90 días.
 *
 * El usuario puede cambiarlo después; esto solo evita el caso absurdo.
 */
export function intervaloParaRango(valorRango: string): IntervaloAgregacion {
  switch (valorRango) {
    // Un solo día: se ve bien por hora (24 puntos).
    case "hoy":
    case "ayer":
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

/**
 * Utilidades de formato de fechas, números y valores de medición.
 * Usa date-fns (ya instalado) para operaciones de fecha y hora.
 */
import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Formato de fecha/hora local legible en español. */
const FORMATO_FECHA_HORA = "dd/MM/yyyy HH:mm";

/** Formato de hora corta (para gráficas). */
const FORMATO_HORA = "HH:mm";

/**
 * Formatea una fecha ISO o Date a un texto legible (dd/MM/yyyy HH:mm).
 * Devuelve em-dash si el valor no es válido.
 */
export function formatearFecha(fecha?: string | Date | null): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, FORMATO_FECHA_HORA, { locale: es });
}

/**
 * Formatea una fecha ISO/Datesólo a hora (HH:mm). Útil en ejes de gráficas.
 * Devuelve em-dash si el valor no es válido.
 */
export function formatearHora(fecha?: string | Date | null): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, FORMATO_HORA, { locale: es });
}

/**
 * Formatea un valor numérico con hasta 2 decimales en español.
 * Devuelve em-dash para nulos/indefinidos.
 */
export function formatearValor(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

/**
 * Convierte una fecha ISO y hora en una Date local.
 * Devuelve null si la entrada no es válida.
 */
export function aFechaLocal(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

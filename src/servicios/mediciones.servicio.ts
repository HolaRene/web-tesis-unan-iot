// src/servicios/medicionService.ts
import { api } from "./api";
import type { Medicion, SeriesAgregadas } from "@/tipos";

/** Filtros para la consulta de mediciones. */
export interface FiltrosMediciones {
  sensor_id?: string;
  dispositivo_id?: string;
  area_id?: string;
  tipo_variable_id?: string;
  desde?: Date;
  hasta?: Date;
  limite?: number;
}

/** Opciones de la consulta de series agregadas. */
export interface OpcionesSeries {
  intervalo?: "hora" | "dia" | "semana" | "mes";
  canal_id?: string;
  desde?: string;
  hasta?: string;
  limite?: number;
}

/**
 * Series agregadas de un sensor (media/mín/máx/muestras por intervalo).
 *
 * El backend agrupa en SQL, así que la respuesta es pequeña aunque haya
 * millones de mediciones.
 */
export async function obtenerSeriesSensor(
  sensorId: string,
  opciones: OpcionesSeries = {}
): Promise<SeriesAgregadas> {
  const p = new URLSearchParams();
  if (opciones.intervalo) p.set("intervalo", opciones.intervalo);
  if (opciones.canal_id) p.set("canal_id", opciones.canal_id);
  if (opciones.desde) p.set("desde", opciones.desde);
  if (opciones.hasta) p.set("hasta", opciones.hasta);
  if (opciones.limite) p.set("limite", String(opciones.limite));

  const respuesta = await api.obtener<SeriesAgregadas>(
    `/sensors/${sensorId}/series?${p.toString()}`
  );
  return respuesta.datos;
}

/** Series agregadas con filtros globales. */
export async function obtenerSeries(
  filtros: {
    sensor_id?: string;
    canal_id?: string;
    dispositivo_id?: string;
    area_id?: string;
    desde?: string;
    hasta?: string;
    intervalo?: "hora" | "dia" | "semana" | "mes";
    limite?: number;
  } = {}
): Promise<SeriesAgregadas> {
  const p = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      p.set(clave, String(valor));
    }
  }

  const respuesta = await api.obtener<SeriesAgregadas>(
    `/measurements/series?${p.toString()}`
  );
  return respuesta.datos;
}

/** Lista todas las mediciones con filtros opcionales. */
export async function listarMediciones(
  filtros: FiltrosMediciones = {}
): Promise<Medicion[]> {
  const query = construirQuery(filtros);
  const respuesta = await api.obtener<Medicion[]>(
    `/measurements${query ? `?${query}` : ""}`
  );
  return respuesta.datos;
}

/** Obtiene una medición por su id. */
export async function obtenerMedicion(id: number | string): Promise<Medicion> {
  const respuesta = await api.obtener<Medicion>(`/measurements/${id}`);
  return respuesta.datos;
}

/** Crea una nueva medición. */
export async function crearMedicion(
  datos: Omit<Medicion, "id" | "registrado_en">
): Promise<Medicion> {
  const respuesta = await api.enviar<Medicion>("/measurements", datos, "POST");
  return respuesta.datos;
}

/** Actualiza una medición (si lo necesitas). */
export async function actualizarMedicion(
  id: number | string,
  datos: Partial<Medicion>
): Promise<Medicion> {
  const respuesta = await api.enviar<Medicion>(
    `/measurements/${id}`,
    datos,
    "PATCH"
  );
  return respuesta.datos;
}

/** Elimina una medición por su id. */
export async function eliminarMedicion(id: number | string): Promise<void> {
  await api.eliminar(`/measurements/${id}`);
}

/** Serializa los filtros a query string robusto ante valores undefined. */
function construirQuery(filtros: FiltrosMediciones): string {
  const partes: string[] = [];
  const agregar = (clave: string, valor?: string | number | Date) => {
    if (valor === undefined || valor === null || valor === "") return;
    const normalizado =
      valor instanceof Date ? valor.toISOString() : String(valor);
    partes.push(`${encodeURIComponent(clave)}=${encodeURIComponent(normalizado)}`);
  };

  agregar("sensor_id", filtros.sensor_id);
  agregar("device_id", filtros.dispositivo_id);
  agregar("area_id", filtros.area_id);
  agregar("variable_type_id", filtros.tipo_variable_id);
  agregar("desde", filtros.desde);
  agregar("hasta", filtros.hasta);
  agregar("limite", filtros.limite);
  return partes.join("&");
}
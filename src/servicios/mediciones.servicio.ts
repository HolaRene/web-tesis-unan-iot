/**
 * Servicio de datos de Mediciones.
 *
 * Endpoint real del backend: /api/v1/measurements
 * El backend acepta filtros vía query string (p.ej. sensor_id, limite).
 */
import { api } from "./api";
import type { Medicion } from "@/tipos";

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

/** Lista mediciones aplicando filtros opcionales. */
export async function listarMediciones(
  filtros: FiltrosMediciones = {}
): Promise<Medicion[]> {
  const query = construirQuery(filtros);
  const respuesta = await api.obtener<Medicion[]>(
    `/measurements${query ? `?${query}` : ""}`
  );
  return respuesta.datos;
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

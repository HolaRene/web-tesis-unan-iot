/**
 * Servicio de datos del Dashboard (resumen dirigido).
 *
 * Endpoint real del backend: GET /api/v1/dashboard/resumen
 * Devuelve en una sola petición totales + últimas mediciones/sensores/
 * dispositivos/alertas (evita múltiples consultas en el cliente).
 */
import { api } from "./api";
import type { ResumenDirectorDashboard } from "@/tipos";

export async function obtenerResumenDashboard(): Promise<ResumenDirectorDashboard> {
  const respuesta = await api.obtener<ResumenDirectorDashboard>(
    "/dashboard/resumen"
  );
  return respuesta.datos;
}

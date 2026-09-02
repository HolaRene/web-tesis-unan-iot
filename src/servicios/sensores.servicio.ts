/**
 * Servicio de datos de Sensores.
 *
 * Endpoint real del backend: /api/v1/sensors
 */
import { api } from "./api";
import type { Sensor } from "@/tipos";

/** Lista todos los sensores. */
export async function listarSensores(): Promise<Sensor[]> {
  const respuesta = await api.obtener<Sensor[]>("/sensors");
  return respuesta.datos;
}

/** Obtiene un sensor por su id. */
export async function obtenerSensor(id: string): Promise<Sensor> {
  const respuesta = await api.obtener<Sensor>(`/sensors/${id}`);
  return respuesta.datos;
}

/** Crea un nuevo sensor. */
export async function crearSensor(datos: Partial<Sensor>): Promise<Sensor> {
  const respuesta = await api.enviar<Sensor>("/sensors", datos, "POST");
  return respuesta.datos;
}

/** Actualiza un sensor. */
export async function actualizarSensor(
  id: string,
  datos: Partial<Sensor>
): Promise<Sensor> {
  const respuesta = await api.enviar<Sensor>(`/sensors/${id}`, datos, "PATCH");
  return respuesta.datos;
}

/** Elimina un sensor por su id. */
export async function eliminarSensor(id: string): Promise<void> {
  await api.eliminar(`/sensors/${id}`);
}

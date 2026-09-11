/**
 * Servicio de datos de Sensores.
 *
 * Endpoint real del backend: /api/v1/sensors
 *
 * Un sensor puede declarar varias magnitudes (canales). Al crear/editar se
 * envía el campo opcional `canales: MagnitudSensor[]`; el backend genera un
 * canal por cada magnitud.
 */
import { api } from "./api";
import type { Canal, MagnitudSensor, Sensor } from "@/tipos";

/** Datos aceptados al crear/editar un sensor (incluye sus magnitudes). */
export type DatosSensor = Partial<Sensor> & {
  /** Magnitudes (canales) del sensor. Ej. DHT22 -> temperatura + humedad. */
  canales?: MagnitudSensor[];
};

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

/** Lista los canales (magnitudes) de un sensor. GET /sensors/:id/canales */
export async function obtenerCanalesDeSensor(id: string): Promise<Canal[]> {
  const respuesta = await api.obtener<{ sensor_id: string; canales: Canal[] }>(
    `/sensors/${id}/canales`
  );
  return respuesta.datos.canales;
}

/** Crea un nuevo sensor con sus magnitudes. */
export async function crearSensor(datos: DatosSensor): Promise<Sensor> {
  const respuesta = await api.enviar<Sensor>("/sensors", datos, "POST");
  return respuesta.datos;
}

/** Actualiza un sensor (y sincroniza sus magnitudes si se envían `canales`). */
export async function actualizarSensor(
  id: string,
  datos: DatosSensor
): Promise<Sensor> {
  const respuesta = await api.enviar<Sensor>(`/sensors/${id}`, datos, "PATCH");
  return respuesta.datos;
}

/** Elimina un sensor por su id. */
export async function eliminarSensor(id: string): Promise<void> {
  await api.eliminar(`/sensors/${id}`);
}

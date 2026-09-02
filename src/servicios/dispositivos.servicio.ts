/**
 * Servicio de datos de Dispositivos.
 *
 * Endpoint real del backend: /api/v1/devices
 */
import { api } from "./api";
import type { Dispositivo } from "@/tipos";

/** Lista todos los dispositivos. */
export async function listarDispositivos(): Promise<Dispositivo[]> {
  const respuesta = await api.obtener<Dispositivo[]>("/devices");
  return respuesta.datos;
}

/** Obtiene un dispositivo por su id. */
export async function obtenerDispositivo(id: string): Promise<Dispositivo> {
  const respuesta = await api.obtener<Dispositivo>(`/devices/${id}`);
  return respuesta.datos;
}

/** Crea un nuevo dispositivo. */
export async function crearDispositivo(
  datos: Partial<Dispositivo>
): Promise<Dispositivo> {
  const respuesta = await api.enviar<Dispositivo>("/devices", datos, "POST");
  return respuesta.datos;
}

/** Actualiza un dispositivo. */
export async function actualizarDispositivo(
  id: string,
  datos: Partial<Dispositivo>
): Promise<Dispositivo> {
  const respuesta = await api.enviar<Dispositivo>(
    `/devices/${id}`,
    datos,
    "PATCH"
  );
  return respuesta.datos;
}

/** Elimina un dispositivo por su id. */
export async function eliminarDispositivo(id: string): Promise<void> {
  await api.eliminar(`/devices/${id}`);
}

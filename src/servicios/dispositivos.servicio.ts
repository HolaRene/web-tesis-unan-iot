/**
 * Servicio de datos de Dispositivos.
 *
 * Endpoint real del backend: /api/v1/devices
 */
import { api } from "./api";
import type { Dispositivo } from "@/tipos";

/**
 * Lista dispositivos, opcionalmente filtrados por área.
 *
 * El backend acepta `area_id` en el query string, así que el filtrado se hace
 * en SQL y no en el navegador (importante cuando hay muchos dispositivos).
 */
export async function listarDispositivos(
  filtros: { area_id?: string } = {}
): Promise<Dispositivo[]> {
  const p = new URLSearchParams();
  if (filtros.area_id) p.set("area_id", filtros.area_id);
  const qs = p.toString();

  const respuesta = await api.obtener<Dispositivo[]>(
    `/devices${qs ? `?${qs}` : ""}`
  );
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

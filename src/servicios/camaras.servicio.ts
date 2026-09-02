/**
 * Servicio de datos de Cámaras.
 *
 * Endpoint real del backend: /api/v1/cameras
 */
import { api } from "./api";
import type { Camara } from "@/tipos";

/** Lista todas las cámaras. */
export async function listarCamaras(): Promise<Camara[]> {
  const respuesta = await api.obtener<Camara[]>("/cameras");
  return respuesta.datos;
}

/** Obtiene una cámara por su id. */
export async function obtenerCamara(id: string): Promise<Camara> {
  const respuesta = await api.obtener<Camara>(`/cameras/${id}`);
  return respuesta.datos;
}

/** Actualiza una cámara. */
export async function actualizarCamara(
  id: string,
  datos: Partial<Camara>
): Promise<Camara> {
  const respuesta = await api.enviar<Camara>(`/cameras/${id}`, datos, "PATCH");
  return respuesta.datos;
}

/** Elimina una cámara por su id. */
export async function eliminarCamara(id: string): Promise<void> {
  await api.eliminar(`/cameras/${id}`);
}

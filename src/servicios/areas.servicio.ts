/**
 * Servicio de datos de Áreas.
 *
 * Endpoint real del backend: /api/v1/areas
 *   GET    /                  -> listar
 *   GET    /:id               -> obtener uno
 *   POST   /                  -> crear
 *   PATCH  /:id               -> actualizar
 *   DELETE /:id               -> eliminar
 */
import { api } from "./api";
import type { Area } from "@/tipos";

/** Lista todas las áreas. */
export async function listarAreas(): Promise<Area[]> {
  const respuesta = await api.obtener<Area[]>("/areas");
  return respuesta.datos;
}

/** Obtiene un área por su id. */
export async function obtenerArea(id: string): Promise<Area> {
  const respuesta = await api.obtener<Area>(`/areas/${id}`);
  return respuesta.datos;
}

/** Crea un área nueva. */
export async function crearArea(datos: Partial<Area>): Promise<Area> {
  const respuesta = await api.enviar<Area>("/areas", datos, "POST");
  return respuesta.datos;
}

/** Actualiza los campos modificables de un área. */
export async function actualizarArea(
  id: string,
  datos: Partial<Area>
): Promise<Area> {
  const respuesta = await api.enviar<Area>(`/areas/${id}`, datos, "PATCH");
  return respuesta.datos;
}

/** Elimina un área por su id. */
export async function eliminarArea(id: string): Promise<void> {
  await api.eliminar(`/areas/${id}`);
}

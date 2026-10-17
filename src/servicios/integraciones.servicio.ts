/**
 * Servicio de datos de Integraciones.
 *
 * Endpoint real del backend: /api/v1/integrations
 * Permite registrar plataformas externas a las que publicar los datos.
 */
import { api } from "./api";
import type { Integracion } from "@/tipos";

/** Lista todas las integraciones. */
export async function listarIntegraciones(): Promise<Integracion[]> {
  const respuesta = await api.obtener<Integracion[]>("/integrations");
  return respuesta.datos;
}

/** Obtiene una integración por su id. */
export async function obtenerIntegracion(id: string): Promise<Integracion> {
  const respuesta = await api.obtener<Integracion>(`/integrations/${id}`);
  return respuesta.datos;
}

/** Actualiza una integración. */
export async function actualizarIntegracion(
  id: string,
  datos: Partial<Integracion>
): Promise<Integracion> {
  const respuesta = await api.enviar<Integracion>(
    `/integrations/${id}`,
    datos,
    "PATCH"
  );
  return respuesta.datos;
}

/** Elimina una integración por su id. */
export async function eliminarIntegracion(id: string): Promise<void> {
  await api.eliminar(`/integrations/${id}`);
}

/**
 * Servicio de datos de Alertas.
 *
 * Endpoint real del backend: /api/v1/alerts
 */
import { api } from "./api";
import type { Alerta } from "@/tipos";
/** Lista todas las alertas. */
export async function listarAlertas(): Promise<Alerta[]> {
  const respuesta = await api.obtener<Alerta[]>("/alerts");
  return respuesta.datos;
}

/** Obtiene una alerta por su id. */
export async function obtenerAlerta(id: string): Promise<Alerta> {
  const respuesta = await api.obtener<Alerta>(`/alerts/${id}`);
  return respuesta.datos;
}

/** Crea una alerta (si es necesario desde el frontend). */
export async function crearAlerta(
  datos: Omit<Alerta, "id" | "iniciada_en" | "reconocida_en" | "finalizada_en">
): Promise<Alerta> {
  const respuesta = await api.enviar<Alerta>("/alerts", datos, "POST");
  return respuesta.datos;
}

/** Actualiza una alerta (reconocer, resolver, cambiar estado). */
export async function actualizarAlerta(
  id: string,
  datos: Partial<Alerta>
): Promise<Alerta> {
  const respuesta = await api.enviar<Alerta>(`/alerts/${id}`, datos, "PATCH");
  return respuesta.datos;
}

/** Elimina una alerta por su id. */
export async function eliminarAlerta(id: string): Promise<void> {
  await api.eliminar(`/alerts/${id}`);
}

// Helper para acciones comunes
export async function reconocerAlerta(id: string): Promise<Alerta> {
  return actualizarAlerta(id, { estado: "acknowledged" });
}

export async function resolverAlerta(id: string): Promise<Alerta> {
  return actualizarAlerta(id, { estado: "resolved" });
}
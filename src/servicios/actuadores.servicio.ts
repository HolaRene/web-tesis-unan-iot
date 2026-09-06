/**
 * Servicio de datos de Actuadores.
 *
 * Endpoint real del backend: /api/v1/actuadores
 */
import { api } from "./api";
import type { Actuador } from "@/tipos";

export async function listarActuadores(): Promise<Actuador[]> {
  const respuesta = await api.obtener<Actuador[]>("/actuadores");
  return respuesta.datos;
}

export async function obtenerActuador(id: string): Promise<Actuador> {
  const respuesta = await api.obtener<Actuador>(`/actuadores/${id}`);
  return respuesta.datos;
}

export async function crearActuador(datos: {
  dispositivo_id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  estado_actual?: string;
  activo?: boolean;
}): Promise<Actuador> {
  const respuesta = await api.enviar<Actuador>("/actuadores", datos, "POST");
  return respuesta.datos;
}

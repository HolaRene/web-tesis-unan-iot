/**
 * Servicio de datos de Actuadores.
 *
 * Endpoint real del backend: /api/v1/actuadores
 */
import { api } from "./api";
import type { Actuador, ComandoActuador } from "@/tipos";

export async function listarActuadores(): Promise<Actuador[]> {
  const respuesta = await api.obtener<Actuador[]>("/actuadores");
  return respuesta.datos;
}

/**
 * Actuadores de un área concreta.
 *
 * `GET /actuadores` no acepta `area_id` (devuelve todos), pero cada actuador
 * ya incluye `area_id` en su respuesta. Se filtra aquí en lugar de añadir un
 * endpoint nuevo: el número de actuadores por instalación es pequeño.
 */
export async function listarActuadoresDeArea(
  areaId: string
): Promise<Actuador[]> {
  const todos = await listarActuadores();
  return todos.filter((a) => a.area_id === areaId);
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

/*
 * ────────────────────────────────────────────────────────────────────
 * COMANDOS
 * ────────────────────────────────────────────────────────────────────
 * Enviar un comando NO lo ejecuta: lo ENCOLA en la base de datos con estado
 * 'pendiente'. La entrega real la hace Node-RED, que consulta las órdenes
 * pendientes con su API Key y las publica por MQTT al equipo.
 *
 * Por eso `enviarComando` responde de inmediato y el comando aparece como
 * "Pendiente" en la interfaz: todavía no ha llegado al dispositivo.
 */

/** Encola un comando para un actuador (queda en estado 'pendiente'). */
export async function enviarComando(
  actuadorId: string,
  datos: { comando: string; valor?: unknown; metadatos?: Record<string, unknown> }
): Promise<ComandoActuador> {
  const respuesta = await api.enviar<ComandoActuador>(
    `/actuadores/${actuadorId}/comandos`,
    datos,
    "POST"
  );
  return respuesta.datos;
}

/** Últimos comandos de un actuador, del más reciente al más antiguo. */
export async function listarComandosDeActuador(
  actuadorId: string,
  limite = 20
): Promise<ComandoActuador[]> {
  const respuesta = await api.obtener<ComandoActuador[]>(
    `/actuadores/${actuadorId}/comandos?limite=${limite}`
  );
  return respuesta.datos;
}

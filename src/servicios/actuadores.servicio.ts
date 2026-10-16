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

/**
 * Datos para crear o actualizar un actuador.
 *
 * NO incluye `codigo`: lo genera el servidor a partir del tipo y el nombre
 * (ver `docs/identificadores-automaticos.md`). Enviarlo no tendría efecto,
 * porque el backend lo descarta.
 */
export interface DatosActuador {
  dispositivo_id: string;
  nombre: string;
  tipo: string;
  estado_actual?: string | null;
  activo?: boolean;
  /**
   * Cómo se acciona: `modbus`, `gpio`, `mqtt` o `http`.
   *
   * Sin esto, el comando solo llevaría el código del actuador y un PLC no
   * sabría dónde escribir.
   */
  protocolo?: string;
  /** Direccionamiento según el protocolo (dirección Modbus, pin GPIO…). */
  configuracion?: Record<string, unknown> | null;
}

export async function crearActuador(datos: DatosActuador): Promise<Actuador> {
  const respuesta = await api.enviar<Actuador>("/actuadores", datos, "POST");
  return respuesta.datos;
}

/**
 * Actualiza un actuador.
 *
 * El `codigo` NO se envía: es inmutable. Forma parte del tema MQTT que
 * Node-RED ya usa para publicar órdenes; si cambiara, los comandos seguirían
 * saliendo al tema antiguo y el equipo dejaría de responder.
 */
export async function actualizarActuador(
  id: string,
  datos: Partial<DatosActuador>
): Promise<Actuador> {
  const respuesta = await api.enviar<Actuador>(
    `/actuadores/${id}`,
    datos,
    "PATCH"
  );
  return respuesta.datos;
}

/** Elimina un actuador por su id. */
export async function eliminarActuador(id: string): Promise<void> {
  await api.eliminar(`/actuadores/${id}`);
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

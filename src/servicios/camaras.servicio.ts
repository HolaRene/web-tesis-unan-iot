/**
 * Servicio de datos de Cámaras IP.
 *
 * Endpoint real del backend: /api/v1/cameras
 *
 * SEGURIDAD: este servicio NUNCA envía ni recibe credenciales RTSP.
 * Solo se manejan metadatos (`ruta_stream` es un PATH, no una URL con
 * usuario:contraseña).
 */
import { api } from "./api";
import type { Camara, EstadoCamara } from "@/tipos";

/** Datos de entrada para crear una cámara (sin credenciales). */
export interface DatosCamara {
  nombre: string;
  descripcion?: string | null;
  area_id?: string | null;
  dispositivo_id?: string | null;
  direccion_ip?: string | null;
  puerto_rtsp?: number;
  protocolo?: string;
  ruta_stream: string;
  ruta_webrtc?: string | null;
  estado?: EstadoCamara;
  activa?: boolean;
  grabacion_habilitada?: boolean;
  metadatos?: Record<string, unknown>;
}

/** Filtros del listado. */
export interface FiltrosCamaras {
  area_id?: string;
  dispositivo_id?: string;
  estado?: EstadoCamara;
  activa?: boolean;
  buscar?: string;
}

/** Lista las cámaras visibles para el usuario. */
export async function listarCamaras(
  filtros: FiltrosCamaras = {}
): Promise<Camara[]> {
  const p = new URLSearchParams();
  if (filtros.area_id) p.set("area_id", filtros.area_id);
  if (filtros.dispositivo_id) p.set("dispositivo_id", filtros.dispositivo_id);
  if (filtros.estado) p.set("estado", filtros.estado);
  if (filtros.activa !== undefined) p.set("activa", String(filtros.activa));
  if (filtros.buscar) p.set("buscar", filtros.buscar);
  const qs = p.toString() ? `?${p.toString()}` : "";

  const respuesta = await api.obtener<Camara[]>(`/cameras${qs}`);
  return respuesta.datos;
}

/** Obtiene una cámara por su id. */
export async function obtenerCamara(id: string): Promise<Camara> {
  const respuesta = await api.obtener<Camara>(`/cameras/${id}`);
  return respuesta.datos;
}

/** Crea una cámara. */
export async function crearCamara(datos: DatosCamara): Promise<Camara> {
  const respuesta = await api.enviar<Camara>("/cameras", datos, "POST");
  return respuesta.datos;
}

/** Actualiza una cámara (PATCH parcial: solo se envían los campos indicados). */
export async function actualizarCamara(
  id: string,
  datos: Partial<DatosCamara>
): Promise<Camara> {
  const respuesta = await api.enviar<Camara>(`/cameras/${id}`, datos, "PATCH");
  return respuesta.datos;
}

/**
 * Cambia SOLO el estado de la cámara.
 * Endpoint pensado para pruebas y para la futura integración con MediaMTX.
 */
export async function actualizarEstadoCamara(
  id: string,
  estado: EstadoCamara
): Promise<Camara> {
  const respuesta = await api.enviar<Camara>(
    `/cameras/${id}/estado`,
    { estado },
    "PATCH"
  );
  return respuesta.datos;
}

/** Elimina una cámara por su id. */
export async function eliminarCamara(id: string): Promise<void> {
  await api.eliminar(`/cameras/${id}`);
}

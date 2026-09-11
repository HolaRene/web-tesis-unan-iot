/**
 * Tipos de eventos realtime del frontend.
 *
 * Deben coincidir con el contrato del backend (`api/src/realtime/eventos.ts`).
 */
import type { Dispositivo } from "@/tipos";

/** Eventos de dominio soportados por el canal realtime. */
export type TipoEventoTiempoReal =
  | "dispositivo:actualizado"
  | "dispositivo:online"
  | "dispositivo:offline"
  | "medicion:nueva"
  | "canal:actualizado"
  | "alerta:creada"
  | "alerta:actualizada"
  | "alerta:resuelta";

/** Sobre que viaja por el WebSocket. */
export interface EventoTiempoReal<T = unknown> {
  tipo: TipoEventoTiempoReal | "conectado" | "pong";
  datos: T;
  emitido_en: string;
}

/** Payload de `dispositivo:actualizado`. */
export interface PayloadDispositivoActualizado {
  dispositivo_id: string;
  identificador: string | null;
  estado: string;
  ultima_conexion: string | null;
  direccion_ip: string | null;
  metadatos: Record<string, unknown>;
  campos_cambiados?: string[];
}

/** Payload de `dispositivo:online`. */
export interface PayloadDispositivoOnline {
  dispositivo_id: string;
  identificador: string | null;
  estado_anterior: string;
  estado: "online";
  ultima_conexion: string | null;
}

/** Payload de `dispositivo:offline`. */
export interface PayloadDispositivoOffline {
  dispositivo_id: string;
  identificador: string | null;
  estado: "offline";
  ultima_conexion: string | null;
  detectado_en: string;
}

/** Campos que un evento de dispositivo puede aportar a la caché. */
export type ParcheDispositivo = Partial<
  Pick<
    Dispositivo,
    "estado" | "ultima_conexion" | "direccion_ip" | "metadatos"
  >
> & { id: string };

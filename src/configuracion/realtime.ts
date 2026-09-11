/**
 * Utilidades de configuración del canal realtime (WebSocket).
 *
 * Deriva la URL del WS a partir de `NEXT_PUBLIC_API_URL` (que apunta a
 * `/api/v1`), cambiando el esquema http→ws y https→wss.
 */
import { urlApi } from "./api";

/** Ruta del WebSocket en el backend (debe coincidir con `WS_PATH`). */
const RUTA_REALTIME = "realtime";

/**
 * Construye la URL del WebSocket para un token dado.
 * Ej.: `ws://localhost:4000/api/v1/realtime?token=<JWT>`
 */
export function urlWebSocket(token: string): string {
  const base = new URL(urlApi);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = `${base.pathname.replace(/\/$/, "")}/${RUTA_REALTIME}`;
  base.search = `?token=${encodeURIComponent(token)}`;
  return base.toString();
}

/** Milisegundos entre reintentos de reconexión. */
export const RECONEXION_MS = 3000;

/**
 * Polling de respaldo: si el WebSocket funciona, no hace falta refrescar cada
 * 15 s. Se deja un intervalo muy poco frecuente por si la conexión cae.
 */
export const POLLING_RESPALDO_MS = 90_000;

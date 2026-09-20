/**
 * Configuración del subsistema de vídeo (MediaMTX).
 *
 * ARQUITECTURA:
 *
 *   CÁMARA IP ──RTSP──► MEDIAMTX ──WebRTC──► NAVEGADOR
 *
 * La API Express NO transporta vídeo: solo administra los metadatos de la
 * cámara. Este archivo centraliza la configuración del frontera de vídeo
 * para no repetir URLs ni puertos por los componentes.
 *
 * SEGURIDAD:
 *   - Aquí NO hay credenciales RTSP.
 *   - El navegador solo conoce la URL pública de MediaMTX; las credenciales
 *     de la cámara viven en la configuración de MediaMTX (servidor).
 */

/**
 * URL base del servidor MediaMTX para WebRTC.
 *
 * Se expone al navegador porque el WebRTC se negocia desde el cliente
 * (RTCPeerConnection + endpoint WHEP de MediaMTX). NO contiene secretos.
 *
 * Por defecto se asume el puerto estándar de MediaMTX (8889).
 * Configurable con NEXT_PUBLIC_MEDIAMTX_WEBRTC_URL.
 */
export const urlMediaMtxWebrtc =
  process.env.NEXT_PUBLIC_MEDIAMTX_WEBRTC_URL ??
  process.env.NEXT_PUBLIC_MEDIAMTX_URL ??
  "http://localhost:8889";

/**
 * Tiempo máximo (ms) que se espera a que MediaMTX complete la negociación
 * WebRTC antes de dar el intento por fallido.
 */
export const TIEMPO_NEGOCIACION_WEBRTC_MS = 10_000;

/**
 * Milisegundos entre reintentos automáticos de conexión del reproductor.
 * 0 desactiva el reintento automático.
 */
export const RECONEXION_PLAYER_MS = 5_000;

/**
 * Milisegundos de espera antes de intentar de nuevo tras un fallo manual.
 */
export const ESPERA_REINTENTO_MANUAL_MS = 1_500;

/**
 * Construye la URL del endpoint WHEP de MediaMTX para una ruta.
 *
 * MediaMTX expone el modo WHEP (WebRTC-HTTP Egress Protocol) en
 * `{base}/{ruta}/whep`. No se asume ninguna otra API de MediaMTX: si la
 * configuración del proyecto cambia, este es el ÚNICO punto a tocar.
 *
 * @param rutaWebrtc Ruta del stream en MediaMTX (p. ej. `/camara-qui-1`).
 */
export function urlWhep(rutaWebrtc: string): string {
  const base = urlMediaMtxWebrtc.replace(/\/$/, "");
  const ruta = rutaWebrtc.startsWith("/") ? rutaWebrtc : `/${rutaWebrtc}`;
  return `${base}${ruta}/whep`;
}

/**
 * Indica si el reproductor dispone de la información mínima para intentar
 * reproducir: una ruta WebRTC configurada en la cámara.
 *
 * Sin cámara física ni ruta, el reproductor mostrará "Stream no disponible"
 * en lugar de intentar una conexión condenada a fallar.
 */
export function tieneStreamConfigurado(
  rutaWebrtc: string | null | undefined
): boolean {
  return Boolean(rutaWebrtc && rutaWebrtc.trim());
}

/**
 * Configuración del cliente HTTP de la API REST.
 *
 * La URL base se define mediante la variable de entorno
 * `NEXT_PUBLIC_API_URL`. Si no está definida, se usa un valor por defecto
 * sólo para desarrollo local.
 *
 * IMPORTANTE: La URL debe apuntar a `/api/v1` (ej.: http://localhost:4000/api/v1),
 * de modo que los servicios usen segmentos relativos como `/areas`, `/sensores`, etc.
 */
export const urlApi =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Tiempo máximo en milisegundos para una solicitud HTTP (aborta al superarlo). */
export const TIEMPO_EXPIRACION_SOLICITUD = 15000;

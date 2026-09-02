/**
 * Tipos del formato estándar de respuesta/error de la API REST.
 *
 * El backend envuelve todas sus respuestas en el siguiente contrato:
 * - Éxito:  { exito: true;  mensaje?: string; datos: T }
 * - Error:  { exito: false; mensaje: string;  detalles?: unknown }
 */

/** Respuesta exitosa genérica de la API. */
export interface RespuestaApi<T> {
  exito: true;
  mensaje?: string;
  datos: T;
}

/** Respuesta de error de la API. */
export interface RespuestaError {
  exito: false;
  mensaje: string;
  detalles?: unknown;
}

/** Códigos de estado HTTP usados comúnmente por la API para errores. */
export type CodigoErrorHttp = 400 | 401 | 403 | 404 | 409 | 422 | 500 | 501;

/**
 * Error normalizado que el cliente HTTP lanza ante una respuesta no exitosa.
 * Permite mostrar al usuario el mensaje que envía el backend de forma uniforme.
 */
export class ErrorApi extends Error {
  readonly estado: number;
  readonly detalles?: unknown;

  constructor(estado: number, mensaje: string, detalles?: unknown) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
    this.detalles = detalles;
  }
}

/** Errores de red o de autenticación que requieren trato especial. */
export const ErrorMotivos = {
  SIN_AUTORIZACION: 401,
  NO_ENCOTRADO: 404,
  CONFLICTO: 409,
} as const;

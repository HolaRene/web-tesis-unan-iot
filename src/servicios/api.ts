/**
 * Cliente HTTP reutilizable para la API REST.
 *
 * - Centraliza la URL base (NEXT_PUBLIC_API_URL).
 * - Inyecta el token JWT (Authorization: Bearer) si existe una sesión activa.
 * - Normaliza errores mediante la clase ErrorApi.
 * - No se debe llamar a fetch directamente en componentes; usar este cliente
 *   desde los servicios ({@link src/servicios}).
 */
import { urlApi, TIEMPO_EXPIRACION_SOLICITUD } from "@/configuracion/api";
import { ErrorApi, type RespuestaApi } from "@/tipos";
import { obtenerToken } from "@/utilidades/sesion";

type MetodoHttp = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** Opciones de una solicitud al cliente HTTP. */
interface OpcionesSolicitud {
  metodo?: MetodoHttp;
  /** Cuerpo JSON a enviar (se serializa). */
  datos?: unknown;
  /** Si es true se envía el token de sesión aunque sea con credenciales de mock. */
  conAutenticacion?: boolean;
  /** Encabezados adicionales. */
  cabeceras?: Record<string, string>;
  /** Señal para abortar la solicitud. */
  señal?: AbortSignal;
}

/** Resultado normalizado: los datos desempaquetados de la respuesta estándar. */
export interface ResultadoExitoso<T> {
  mensaje?: string;
  datos: T;
}

/**
 * Realiza una solicitud a la API y devuelve los datos ya desempaquetados.
 * Lanza `ErrorApi` ante respuestas no exitosas o errores de red.
 */
export async function solicitudApi<T>(
  ruta: string,
  opciones: OpcionesSolicitud = {}
): Promise<ResultadoExitoso<T>> {
  const {
    metodo = "GET",
    datos,
    conAutenticacion = true,
    cabeceras,
    señal,
  } = opciones;

  const cabecerasFinal: Record<string, string> = {
    "Content-Type": "application/json",
    ...cabeceras,
  };

  const token = obtenerToken();
  // Se adjunta el token sólo para rutas del panel y cuando exista sesión.
  if (conAutenticacion && token) {
    cabecerasFinal.Authorization = `Bearer ${token}`;
  }

  // Señal para abortar: usa la proporcionada o aplica un tiempo de espera base.
  const señalAbortar = señal ?? AbortSignal.timeout(TIEMPO_EXPIRACION_SOLICITUD);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${urlApi}${ruta}`, {
      method: metodo,
      headers: cabecerasFinal,
      body: datos !== undefined ? JSON.stringify(datos) : undefined,
      signal: señalAbortar,
      // Se evita caché del navegador por defecto (los datos son dinámicos).
      cache: "no-store",
    });
  } catch (error) {
    const motivo = error instanceof DOMException && error.name === "AbortError";
    throw new ErrorApi(
      0,
      motivo
        ? "La solicitud fue cancelada (tiempo de espera agotado)."
        : "No se pudo conectar con el servidor. Verifique la red y la URL de la API."
    );
  }

  const cuerpo = (await respuesta.json().catch(() => null)) as
    | RespuestaApi<T>
    | { exito: false; mensaje: string; detalles?: unknown }
    | null;

  if (!cuerpo) {
    throw new ErrorApi(
      respuesta.status,
      `Respuesta inválida del servidor (${respuesta.status}).`
    );
  }

  if (!respuesta.ok || cuerpo.exito === false) {
    const mensaje =
      "mensaje" in cuerpo && cuerpo.mensaje
        ? cuerpo.mensaje
        : `Error del servidor (${respuesta.status}).`;
    throw new ErrorApi(
      respuesta.status,
      mensaje,
      "detalles" in cuerpo ? cuerpo.detalles : undefined
    );
  }

  return {
    mensaje: "mensaje" in cuerpo ? cuerpo.mensaje : undefined,
    datos: cuerpo.datos,
  };
}

/** Atajos verbosos para GET, envío de datos y eliminación. */
export const api = {
  obtener: <T>(ruta: string, opciones?: Omit<OpcionesSolicitud, "metodo" | "datos">) =>
    solicitudApi<T>(ruta, { ...opciones, metodo: "GET" }),
  enviar: <T>(
    ruta: string,
    datos: unknown,
    metodo: Exclude<MetodoHttp, "GET"> = "POST"
  ) => solicitudApi<T>(ruta, { datos, metodo }),
  eliminar: <T = null>(ruta: string) =>
    solicitudApi<T>(ruta, { metodo: "DELETE" }),
};

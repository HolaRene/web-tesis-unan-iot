/**
 * Servicio de autenticación.
 *
 * Se conecta a los endpoints reales del backend:
 *   POST /api/v1/users/login    -> inicio de sesión
 *   POST /api/v1/users/registro -> registro (opcional)
 *   GET  /api/v1/users/perfil   -> obtención del perfil (requiere token)
 *
 * Además se incluye un MODO DEMO claramente identificado para poder probar la
 * interfaz sin backend activo:
 *   email: demo@monitorit.local
 *   password: demo1234
 */

import { api, solicitudApi } from "./api";
import type {
  CredencialesLogin,
  DatosRegistro,
  ResultadoLogin,
  Usuario,
  UsuarioAutenticado,
} from "@/tipos";

/** Credenciales y marcador del modo demo (sólo para desarrollo). */
export const MODO_DEMO = {
  email: "demo@monitorit.local",
  password: "demo1234",
  /** Valor del token que se almacena al iniciar sesión en modo demo. */
  tokenMarcador: "demo-token-monitorit",
} as const;

/** Usuario simulado usado en el modo demo. */
const USUARIO_DEMO: UsuarioAutenticado = {
  id: "demo-user",
  email: MODO_DEMO.email,
  rol: "admin",
};

/**
 * Indica si la sesión activa (por token) corresponde al modo demo.
 * Útil para mostrar avisos en la interfaz de que los datos son simulados.
 */
export function esSesionDemo(token: string | null): boolean {
  return token === MODO_DEMO.tokenMarcador;
}

/**
 * Inicia sesión.
 *
 * Intenta autenticarse contra el backend real. Si la API no está disponible
 * (error de red) y las credenciales coinciden con las del modo demo, devuelve
 * una sesión simulada claramente marcada.
 */
export async function iniciarSesion(
  credenciales: CredencialesLogin
): Promise<ResultadoLogin> {
  try {
    const respuesta = await solicitudApi<ResultadoLogin>("/users/login", {
      metodo: "POST",
      datos: credenciales,
      conAutenticacion: false,
    });
    return respuesta.datos;
  } catch (error) {
    if (esCredencialDemo(credenciales)) {
      // TODO(demo→real): token simulado para desarrollo. Al conectar el backend
      // real basta con eliminar este fallback y dejar que el error se propague.
      return {
        token: MODO_DEMO.tokenMarcador,
        usuario: USUARIO_DEMO,
      };
    }
    throw error;
  }
}

/** Comprueba si las credenciales corresponden al usuario de demo. */
function esCredencialDemo(credenciales: CredencialesLogin): boolean {
  return (
    credenciales.email.trim().toLowerCase() === MODO_DEMO.email &&
    credenciales.password === MODO_DEMO.password
  );
}

/** Registra un nuevo usuario en el backend. */
export async function registrarUsuario(datos: DatosRegistro): Promise<Usuario> {
  const respuesta = await solicitudApi<Usuario>("/users/registro", {
    metodo: "POST",
    datos,
    conAutenticacion: false,
  });
  return respuesta.datos;
}

/** Obtiene el perfil del usuario autenticado actual. */
export async function obtenerPerfilUsuario(): Promise<Usuario> {
  const respuesta = await api.obtener<Usuario>("/users/perfil");
  return respuesta.datos;
}

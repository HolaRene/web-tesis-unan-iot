/**
 * Servicio de autenticación y perfil de usuario.
 *
 * Se conecta a los endpoints reales del backend:
 *   POST /api/v1/users/login    -> inicio de sesión
 *   POST /api/v1/users/registro -> registro (opcional)
 *   GET  /api/v1/users/perfil   -> obtención del perfil (requiere token)
 *   PATCH /api/v1/users/:id     -> actualización de datos del perfil
 *
 * Además se incluye un MODO DEMO claramente identificado para poder probar la
 * interfaz sin backend activo:
 *   email: demo@monitorit.local
 *   password: demo1234
 */

import { api, solicitudApi } from "./api";
import { obtenerToken } from "@/utilidades/sesion";
import type {
  CredencialesLogin,
  DatosPerfilActualizacion,
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

/** Usuario simulado (autenticado) usado en el modo demo. */
const USUARIO_DEMO: UsuarioAutenticado = {
  id: "demo-user",
  email: MODO_DEMO.email,
  rol: "admin",
};

/** Perfil de demostración usado cuando no hay API activa. */
export const PERFIL_DEMO: Usuario = {
  id: "demo-user",
  nombre: "Usuario de demostración",
  email: MODO_DEMO.email,
  rol: "admin",
  activo: true,
  creado_en: new Date().toISOString(),
};

/** Indica si el token corresponde al modo demo (datos simulados). */
export function esSesionDemo(token: string | null): boolean {
  return token === MODO_DEMO.tokenMarcador;
}

/**
 * Inicia sesión contra el backend. Si la API no está disponible y las
 * credenciales coinciden con el modo demo, devuelve una sesión simulada.
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

/** Obtiene el perfil del usuario autenticado actual (GET /users/perfil). */
export async function obtenerPerfilUsuario(): Promise<Usuario> {
  const respuesta = await api.obtener<Usuario>("/users/perfil");
  return respuesta.datos;
}

/**
 * Actualiza el perfil PROPIO (nombre, email y/o contraseña) mediante
 * PATCH /users/perfil. El id se obtiene de la sesión en el backend.
 *
 * En modo demo no hay backend real; se devuelve un perfil simulado actualizado
 * sin validar la contraseña actual.
 */
export async function actualizarPerfilPropio(
  datos: DatosPerfilActualizacion
): Promise<Usuario> {
  const token = obtenerToken();
  if (token === MODO_DEMO.tokenMarcador) {
    const emailFinal = datos.email ?? PERFIL_DEMO.email;
    const nombreFinal = datos.nombre ?? PERFIL_DEMO.nombre;
    return { ...PERFIL_DEMO, nombre: nombreFinal, email: emailFinal };
  }
  const respuesta = await solicitudApi<Usuario>("/users/perfil", {
    metodo: "PATCH",
    datos,
  });
  return respuesta.datos;
}

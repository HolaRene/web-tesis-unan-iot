/**
 * Tipos del dominio de autenticación y usuarios.
 *
 * El backend expone (bajo /api/v1/users):
 *   POST /registro   -> registro de usuario
 *   POST /login      -> inicio de sesión (devuelve token JWT + usuario autenticado)
 *   GET  /perfil     -> datos del usuario autenticado (requiere token)
 */

/** Roles disponibles dentro del sistema. */
export type RolUsuario = "admin" | "operador" | "viewer";

/** Usuario autenticado (datos embebidos en el JWT y devueltos en login). */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  rol: RolUsuario;
}

/** Datos de entrada para iniciar sesión. */
export interface CredencialesLogin {
  email: string;
  password: string;
}

/** Datos de entrada para registrar un nuevo usuario. */
export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
  rol?: RolUsuario;
}

/** Respuesta del endpoint de inicio de sesión. */
export interface ResultadoLogin {
  token: string;
  usuario: UsuarioAutenticado;
}

/** Usuario completo (sólo campos expuestos por la API, sin credenciales). */
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  creado_en: string;
}

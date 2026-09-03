/**
 * Utilidades de persistencia de la sesión en el lado del cliente.
 *
 * Almacena el token JWT, el usuario autenticado (id/email/rol) y el perfil
 * completo del usuario (nombre, rol, estado, creado en) en localStorage.
 *
 * Esta es una estrategia sencilla para un cliente separado de la API.
 * Si en el futuro se prefiere HttpOnly cookies, basta con cambiar esta capa.
 */
import type { Usuario, UsuarioAutenticado } from "@/tipos";

const CLAVE_TOKEN = "monitorit_token";
const CLAVE_USUARIO = "monitorit_usuario";
const CLAVE_PERFIL = "monitorit_perfil";

/** Devuelve el token JWT almacenado, o null si no hay sesión activa. */
export function obtenerToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLAVE_TOKEN);
}

/** Devuelve el usuario autenticado parseado, o null si no existe. */
export function obtenerUsuario(): UsuarioAutenticado | null {
  if (typeof window === "undefined") return null;
  const crudo = window.localStorage.getItem(CLAVE_USUARIO);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as UsuarioAutenticado;
  } catch {
    return null;
  }
}

/** Devuelve el perfil completo (nombre, email, rol…) o null si no hay. */
export function obtenerPerfil(): Usuario | null {
  if (typeof window === "undefined") return null;
  const crudo = window.localStorage.getItem(CLAVE_PERFIL);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as Usuario;
  } catch {
    return null;
  }
}

/** Guarda token, usuario y (opcionalmente) perfil completo. */
export function guardarSesion(
  token: string,
  usuario: UsuarioAutenticado,
  perfil?: Usuario
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE_TOKEN, token);
  window.localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  if (perfil) {
    window.localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil));
  } else {
    window.localStorage.removeItem(CLAVE_PERFIL);
  }
}

/** Guarda únicamente el perfil completo del usuario. */
export function guardarPerfil(perfil: Usuario): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil));
}

/** Guarda únicamente un token sin usuario (p.ej. sesión de demo). */
export function guardarToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE_TOKEN, token);
}

/** Elimina token, usuario y perfil (cierre de sesión). */
export function cerrarSesionLocal(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLAVE_TOKEN);
  window.localStorage.removeItem(CLAVE_USUARIO);
  window.localStorage.removeItem(CLAVE_PERFIL);
}

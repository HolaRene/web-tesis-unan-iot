/**
 * Servicio de datos de API Keys.
 *
 * Endpoint real del backend: /api/v1/claves-api
 * La API Key completa solo se muestra una vez en la creación.
 */
import { api } from "./api";
import type { ClaveApi, ClaveApiCreada } from "@/tipos";

/** Lista las API Keys del usuario autenticado (sin hash, solo prefijo). */
export async function listarClavesApi(): Promise<ClaveApi[]> {
  const respuesta = await api.obtener<ClaveApi[]>("/claves-api");
  return respuesta.datos;
}

/**
 * Crea una API Key. `datos.permisos` es opcional: si no se envía, el
 * backend guarda `{}` (sin permisos específicos por ahora, se amplía luego).
 * Devuelve la clave completa (única vez visible).
 */
export async function crearClaveApi(datos: {
  nombre: string;
  permisos: Record<string, boolean>;
}): Promise<ClaveApiCreada> {
  const respuesta = await api.enviar<ClaveApiCreada>("/claves-api", datos, "POST");
  return respuesta.datos;
}

/** Revoca (desactiva) una API Key propia del usuario. */
export async function revocarClaveApi(id: string): Promise<void> {
  await api.eliminar(`/claves-api/${id}`);
}

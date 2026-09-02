/**
 * Servicio de datos de Tipos de Variable.
 *
 * Endpoint real del backend: /api/v1/variable-types
 * Permite a la interfaz funcionar con tipos de variable dinámicos
 * (no asumir que siempre son temperatura, humedad o CO2).
 */
import { api } from "./api";
import type { TipoVariable } from "@/tipos";

/** Lista todos los tipos de variable. */
export async function listarTiposVariable(): Promise<TipoVariable[]> {
  const respuesta = await api.obtener<TipoVariable[]>("/variable-types");
  return respuesta.datos;
}

/** Obtiene un tipo de variable por su id. */
export async function obtenerTipoVariable(id: string): Promise<TipoVariable> {
  const respuesta = await api.obtener<TipoVariable>(`/variable-types/${id}`);
  return respuesta.datos;
}

/** Crea un nuevo tipo de variable. */
export async function crearTipoVariable(
  datos: Partial<TipoVariable>
): Promise<TipoVariable> {
  const respuesta = await api.enviar<TipoVariable>(
    "/variable-types",
    datos,
    "POST"
  );
  return respuesta.datos;
}

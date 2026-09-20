"use client";

/**
 * Hooks de TanStack Query para el módulo de cámaras IP.
 *
 * Lectura:
 *   - useCamaras(filtros)  → GET /cameras
 *   - useCamara(id)        → GET /cameras/:id
 *
 * Escritura:
 *   - useCrearCamara()
 *   - useActualizarCamara()
 *   - useActualizarEstadoCamara()
 *   - useEliminarCamara()
 *
 * NOTA: no hay lógica de vídeo aquí. El streaming lo gestiona el
 * componente CamaraPlayer contra MediaMTX.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarCamara,
  actualizarEstadoCamara,
  crearCamara,
  eliminarCamara,
  listarCamaras,
  obtenerCamara,
  type DatosCamara,
  type FiltrosCamaras,
} from "@/servicios/camaras.servicio";
import type { Camara, EstadoCamara } from "@/tipos";

/** Claves de caché del módulo. */
export const CLAVES_CAMARAS = {
  todas: ["camaras"] as const,
  lista: (filtros?: FiltrosCamaras) => ["camaras", "lista", filtros] as const,
  detalle: (id: string) => ["camara", id] as const,
};

/** Lista las cámaras visibles para el usuario. */
export function useCamaras(filtros: FiltrosCamaras = {}) {
  return useQuery({
    queryKey: CLAVES_CAMARAS.lista(filtros),
    queryFn: () => listarCamaras(filtros),
  });
}

/** Obtiene el detalle de una cámara. */
export function useCamara(id: string) {
  return useQuery({
    queryKey: CLAVES_CAMARAS.detalle(id),
    queryFn: () => obtenerCamara(id),
    enabled: Boolean(id),
  });
}

/** Crea una cámara e invalida el listado. */
export function useCrearCamara() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosCamara) => crearCamara(datos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLAVES_CAMARAS.todas });
    },
  });
}

/** Actualiza una cámara (PATCH parcial). */
export function useActualizarCamara() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: Partial<DatosCamara> }) =>
      actualizarCamara(id, datos),
    onSuccess: (camara: Camara) => {
      qc.setQueryData(CLAVES_CAMARAS.detalle(camara.id), camara);
      qc.invalidateQueries({ queryKey: CLAVES_CAMARAS.todas });
    },
  });
}

/** Cambia solo el estado de una cámara. */
export function useActualizarEstadoCamara() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoCamara }) =>
      actualizarEstadoCamara(id, estado),
    onSuccess: (camara: Camara) => {
      qc.setQueryData(CLAVES_CAMARAS.detalle(camara.id), camara);
      qc.invalidateQueries({ queryKey: CLAVES_CAMARAS.todas });
    },
  });
}

/** Elimina una cámara. */
export function useEliminarCamara() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eliminarCamara(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLAVES_CAMARAS.todas });
    },
  });
}

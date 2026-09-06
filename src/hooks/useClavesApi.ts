// src/hooks/useClavesApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listarClavesApi,
  crearClaveApi,
  revocarClaveApi,
} from "@/servicios/claves-api.servicio";
import type { ClaveApi, ClaveApiCreada } from "@/tipos";

const CLAVES_QUERY_KEY = ["claves-api"];

/** Hook para listar las API Keys del usuario autenticado. */
export function useListarClavesApi() {
  return useQuery({
    queryKey: CLAVES_QUERY_KEY,
    queryFn: listarClavesApi,
  });
}

/** Mutaciones de API Keys (crear con la clave completa de una vez y revocar). */
export function useMutacionesClavesApi() {
  const queryClient = useQueryClient();
  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: CLAVES_QUERY_KEY });

  const crear = useMutation({
    mutationFn: (datos: { nombre: string; permisos: Record<string, boolean> }) =>
      crearClaveApi(datos),
    onSuccess: invalidar,
  });

  const revocar = useMutation({
    mutationFn: revocarClaveApi,
    onSuccess: invalidar,
  });

  return { crear, revocar };
}

export type { ClaveApi, ClaveApiCreada };

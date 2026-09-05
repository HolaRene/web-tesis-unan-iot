// src/hooks/useAlertas.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listarAlertas,
  obtenerAlerta,
  actualizarAlerta,
  eliminarAlerta,
  reconocerAlerta,
  resolverAlerta,
} from "@/servicios/alertas.servicio";
import type { Alerta } from "@/tipos";

// ------------------------------------------------------------------
// Hook para listar todas las alertas
export function useListarAlertas() {
  return useQuery({
    queryKey: ["alertas"],
    queryFn: listarAlertas,
    // Opcional: refetch cada 30 segundos para alertas en tiempo real
    refetchInterval: 1000 * 30,
  });
}

// ------------------------------------------------------------------
// Hook para obtener una alerta por ID
export function useObtenerAlerta(id: string) {
  return useQuery({
    queryKey: ["alerta", id],
    queryFn: () => obtenerAlerta(id),
    enabled: !!id,
  });
}

// ------------------------------------------------------------------
// Hook con todas las mutaciones para alertas
export function useMutacionesAlertas() {
  const queryClient = useQueryClient();

  // Actualizar alerta (genérico)
  const actualizar = useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: Partial<Alerta> }) =>
      actualizarAlerta(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });

  // Reconocer alerta
  const reconocer = useMutation({
    mutationFn: reconocerAlerta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });

  // Resolver alerta
  const resolver = useMutation({
    mutationFn: resolverAlerta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });

  // Eliminar alerta
  const eliminar = useMutation({
    mutationFn: eliminarAlerta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });

  return { actualizar, reconocer, resolver, eliminar };
}
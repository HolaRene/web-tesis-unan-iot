// src/hooks/useMediciones.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listarMediciones,
  obtenerMedicion,
  crearMedicion,
  actualizarMedicion,
  eliminarMedicion,
  type FiltrosMediciones,
} from "@/servicios/mediciones.servicio";
import type { Medicion } from "@/tipos";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";

// ------------------------------------------------------------------
// Hook para listar mediciones con filtros
export function useListarMediciones(filtros?: FiltrosMediciones) {
  return useQuery({
    queryKey: ["mediciones", filtros],
    queryFn: () => listarMediciones(filtros),
    // Polling de RESPALDO: el WebSocket inserta las mediciones nuevas vía
    // `medicion:nueva`; esto queda solo por si el WS no está disponible.
    refetchInterval: POLLING_RESPALDO_MS,
  });
}

// ------------------------------------------------------------------
// Hook para obtener una medición por ID
export function useObtenerMedicion(id: number | string) {
  return useQuery({
    queryKey: ["medicion", id],
    queryFn: () => obtenerMedicion(id),
    enabled: !!id,
  });
}

// ------------------------------------------------------------------
// Hook con todas las mutaciones (igual que sensores)
export function useMutacionesMediciones() {
  const queryClient = useQueryClient();

  // Crear medición
  const crear = useMutation({
    mutationFn: crearMedicion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mediciones"] });
    },
  });

  // Actualizar medición
  const actualizar = useMutation({
    mutationFn: ({ id, datos }: { id: number | string; datos: Partial<Medicion> }) =>
      actualizarMedicion(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mediciones"] });
    },
  });

  // Eliminar medición
  const eliminar = useMutation({
    mutationFn: eliminarMedicion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mediciones"] });
    },
  });

  return { crear, actualizar, eliminar };
}
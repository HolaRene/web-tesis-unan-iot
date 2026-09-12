"use client";

/**
 * Hook que aplica los eventos realtime de ALERTAS a la caché de TanStack Query.
 *
 * - `alerta:creada`      → inserta la alerta al inicio de `["alertas"]`.
 * - `alerta:actualizada` → reemplaza la alerta en la caché.
 * - `alerta:resuelta`    → reemplaza la alerta (estado `resolved`).
 *
 * Todo con `setQueryData`: sin refetch de toda la lista.
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/use-realtime";
import type { Alerta, EventoTiempoReal } from "@/tipos";

/** Queries a invalidar una vez al reconectar (referencia estable). */
const INVALIDAR_AL_RECONECTAR: string[][] = [["alertas"]];

export function useEventosAlertas() {
  const queryClient = useQueryClient();

  const alEvento = useCallback(
    (evento: EventoTiempoReal) => {
      const aplicar = (alerta: Alerta) => {
        queryClient.setQueryData<Alerta[]>(["alertas"], (actuales) => {
          if (!actuales) return actuales;
          const existe = actuales.some((a) => a.id === alerta.id);
          if (!existe) return [alerta, ...actuales];
          return actuales.map((a) => (a.id === alerta.id ? { ...a, ...alerta } : a));
        });
        // Detalle de alerta, si estuviera en caché.
        queryClient.setQueryData<Alerta>(["alerta", alerta.id], (actual) =>
          actual ? { ...actual, ...alerta } : actual
        );
      };

      switch (evento.tipo) {
        case "alerta:creada":
        case "alerta:actualizada":
        case "alerta:resuelta": {
          const alerta = evento.datos as Alerta;
          if (alerta?.id) aplicar(alerta);
          break;
        }
        default:
          break;
      }
    },
    [queryClient]
  );

  return useRealtime({
    alEvento,
    invalidarAlReconectar: INVALIDAR_AL_RECONECTAR,
  });
}

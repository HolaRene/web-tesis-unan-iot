"use client";

/**
 * Hook que aplica los eventos realtime de MEDICIONES y CANALES a la caché de
 * TanStack Query.
 *
 * - `medicion:nueva`    → inserta las mediciones en las claves de lista.
 * - `canal:actualizado` → invalida `["canales"]` (grilla y detalle de canal).
 *
 * No hace refetch de la lista de mediciones: inserta los datos recibidos.
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/use-realtime";
import type { EventoTiempoReal, Medicion } from "@/tipos";

/** Payload de `medicion:nueva` (una por lote). */
interface PayloadMedicionNueva {
  dispositivo: string | null;
  total: number;
  mediciones: Medicion[];
}

/** Claves de lista de mediciones usadas por los hooks. */
const CLAVES_MEDICIONES: string[][] = [["mediciones"]];

export function useEventosMediciones() {
  const queryClient = useQueryClient();

  const alEvento = useCallback(
    (evento: EventoTiempoReal) => {
      switch (evento.tipo) {
        case "medicion:nueva": {
          const datos = evento.datos as PayloadMedicionNueva;
          if (!datos?.mediciones?.length) break;

          // Inserta al inicio (más recientes primero) sin duplicar por id.
          queryClient.setQueriesData<Medicion[]>(
            { queryKey: ["mediciones"] },
            (actuales) => {
              const previas = actuales ?? [];
              const idsExistentes = new Set(previas.map((m) => m.id));
              const nuevas = datos.mediciones.filter(
                (m) => !idsExistentes.has(m.id)
              );
              if (nuevas.length === 0) return previas;
              return [...nuevas, ...previas];
            }
          );
          break;
        }
        case "canal:actualizado": {
          // El canal cambió su último valor: se refresca esa vista.
          queryClient.invalidateQueries({ queryKey: ["canales"] });
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
    invalidarAlReconectar: CLAVES_MEDICIONES,
  });
}

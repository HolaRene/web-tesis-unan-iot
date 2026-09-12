"use client";

/**
 * Hook que aplica los eventos realtime de MEDICIONES y CANALES a la caché de
 * TanStack Query, **sin refetch**.
 *
 * `medicion:nueva` (un evento por lote):
 *   - `["mediciones", filtros]` → inserta las mediciones al inicio.
 *   - `["canal-hist", canalId]` → **añade el punto** al final de la serie.
 *
 * `canal:actualizado` (un evento por canal):
 *   - `["canales", ...]` → parchea último valor / contador / fecha.
 *   - `["canal", canalId]` → parchea el detalle del canal.
 *
 * Claves cubiertas (antes solo `["mediciones"]`):
 *   ["mediciones", filtros] · ["canal-hist", id] · ["canales", ...] · ["canal", id]
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/use-realtime";
import type {
  Canal,
  EventoTiempoReal,
  Medicion,
  MedicionTiempoReal,
  PayloadCanalActualizado,
  PayloadMedicionNueva,
} from "@/tipos";

/** Queries a invalidar una vez al reconectar (referencia estable). */
const INVALIDAR_AL_RECONECTAR: string[][] = [
  ["mediciones"],
  ["canales"],
  ["canal-hist"],
  ["canal"],
];

/** Convierte una medición del evento al formato que usa la lista. */
function aMedicion(m: MedicionTiempoReal): Medicion {
  return {
    id: m.id,
    sensor_id: m.sensor_id ?? "",
    valor_numerico: m.valor_numerico,
    valor_texto: m.valor_texto,
    valor_booleano: m.valor_booleano,
    valor_json: m.valor_json,
    calidad: m.calidad,
    registrado_en: m.registrado_en ?? new Date().toISOString(),
    metadatos: null,
  };
}

export function useEventosMediciones() {
  const queryClient = useQueryClient();

  const alEvento = useCallback(
    (evento: EventoTiempoReal) => {
      switch (evento.tipo) {
        case "medicion:nueva": {
          const datos = evento.datos as PayloadMedicionNueva;
          if (!datos?.mediciones?.length) break;

          // 1) Listas de mediciones: se insertan al inicio sin duplicar por id.
          queryClient.setQueriesData<Medicion[]>(
            { queryKey: ["mediciones"] },
            (actuales) => {
              const previas = actuales ?? [];
              const ids = new Set(previas.map((m) => m.id));
              const nuevas = datos.mediciones
                .filter((m) => !ids.has(m.id))
                .map(aMedicion);
              if (nuevas.length === 0) return previas;
              return [...nuevas, ...previas];
            }
          );

          // 2) Historial por canal: se AÑADE el punto a la serie existente.
          //    Así la gráfica del detalle se mueve sin parpadeos ni refetch.
          for (const m of datos.mediciones) {
            if (!m.canal_id) continue;
            queryClient.setQueryData<{ mediciones: Array<Record<string, unknown>> }>(
              ["canal-hist", m.canal_id],
              (actual) => {
                if (!actual?.mediciones) return actual;
                if (actual.mediciones.some((x) => Number(x.id) === m.id)) {
                  return actual;
                }
                const punto: Record<string, unknown> = {
                  id: m.id,
                  sensor_id: m.sensor_id,
                  canal_id: m.canal_id,
                  valor_numerico: m.valor_numerico,
                  valor_texto: m.valor_texto,
                  valor_booleano: m.valor_booleano,
                  valor_json: m.valor_json,
                  calidad: m.calidad,
                  registrado_en: m.registrado_en,
                };
                return { ...actual, mediciones: [...actual.mediciones, punto] };
              }
            );
          }
          break;
        }

        case "canal:actualizado": {
          const datos = evento.datos as PayloadCanalActualizado;
          if (!datos?.canal_id) break;

          // Parchea el canal donde aparezca: grilla (["canales", ...]) y detalle.
          const parchear = (canal: Canal): Canal => ({
            ...canal,
            ultimo_valor_numerico:
              datos.ultimo_valor_numerico ?? canal.ultimo_valor_numerico,
            ultimo_valor_texto: datos.ultimo_valor_texto ?? canal.ultimo_valor_texto,
            ultimo_valor_booleano:
              datos.ultimo_valor_booleano ?? canal.ultimo_valor_booleano,
            ultimo_registrado_en: datos.registrado_en ?? canal.ultimo_registrado_en,
            // El contador sube con cada medición nueva del canal.
            cantidad_mediciones:
              canal.cantidad_mediciones != null
                ? canal.cantidad_mediciones + 1
                : canal.cantidad_mediciones,
          });

          queryClient.setQueriesData<Canal[]>(
            { queryKey: ["canales"] },
            (actuales) =>
              actuales?.map((c) => (c.id === datos.canal_id ? parchear(c) : c))
          );

          queryClient.setQueryData<Canal>(["canal", datos.canal_id], (actual) =>
            actual ? parchear(actual) : actual
          );
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

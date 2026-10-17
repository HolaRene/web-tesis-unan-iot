"use client";

/**
 * Eventos de tiempo real para el dashboard.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ HACE FALTA UN HOOK APARTE
 * ────────────────────────────────────────────────────────────────────
 * Los hooks de `mediciones`, `dispositivos` y `alertas` parchean las listas
 * de esos módulos. Pero el dashboard NO usa esas claves: tiene las suyas.
 *
 *     ["dashboard", "resumen"]   ← métricas del encabezado
 *     ["canales-dashboard"]      ← tarjetas de magnitud
 *     ["mini-serie", canalId]    ← mini-gráficas
 *
 * Resultado: el dashboard se quedaba congelado. Llegaban eventos, el resto
 * de la aplicación se actualizaba, y el panel seguía mostrando el dato de
 * cuando se abrió.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ SE INVALIDA EN LUGAR DE PARCHEAR
 * ────────────────────────────────────────────────────────────────────
 * Parchear exige conocer la forma exacta de cada respuesta. El resumen del
 * dashboard es un agregado (totales, últimas mediciones, dispositivos
 * recientes) y los `canales-dashboard` llevan contadores — parchearlos a
 * mano sería frágil y se rompería al cambiar el backend.
 *
 * Invalidar pregunta de nuevo a la API, que es la fuente de verdad. Cuesta
 * una petición, pero solo cuando llega un evento real.
 *
 * Además se agrupan: si llegan diez mediciones en un segundo, `invalidateQueries`
 * se llama diez veces pero TanStack Query **solo hace un refetch**, porque la
 * consulta ya está en vuelo.
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useRealtime } from "@/hooks/use-realtime";
import type { EventoTiempoReal } from "@/tipos";

/** Claves de caché que usa el dashboard. */
const CLAVES_DASHBOARD = [
  ["dashboard", "resumen"],
  ["canales-dashboard"],
  ["actividad"],
] as const;

/** Tipos de evento que afectan a lo que se ve en el panel. */
const TIPOS_RELEVANTES = new Set([
  "medicion:nueva",
  "canal:actualizado",
  "dispositivo:online",
  "dispositivo:offline",
  "dispositivo:actualizado",
  "alerta:creada",
  "alerta:actualizada",
  "alerta:resuelta",
]);

export function useEventosDashboard() {
  const queryClient = useQueryClient();

  const alEvento = useCallback(
    (evento: EventoTiempoReal) => {
      if (!TIPOS_RELEVANTES.has(evento.tipo)) return;

      for (const clave of CLAVES_DASHBOARD) {
        queryClient.invalidateQueries({ queryKey: [...clave] });
      }

      /*
       * Las mini-gráficas de cada magnitud también cambian: su clave incluye
       * el id del canal, así que se invalidan por prefijo.
       */
      queryClient.invalidateQueries({ queryKey: ["mini-serie"] });
    },
    [queryClient]
  );

  useRealtime({ alEvento });
}

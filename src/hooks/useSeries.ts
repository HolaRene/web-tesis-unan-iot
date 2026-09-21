"use client";

/**
 * Hooks de series agregadas para los gráficos de historial.
 *
 * El backend agrupa en SQL (`date_trunc`), así que estos hooks reciben
 * pocos puntos ya calculados en lugar de miles de mediciones crudas.
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/servicios/api";
import {
  obtenerSeries,
  obtenerSeriesSensor,
  type OpcionesSeries,
} from "@/servicios/mediciones.servicio";
import type { CuboSerie } from "@/tipos";

/** Claves de caché del módulo de series. */
export const CLAVES_SERIES = {
  sensor: (id: string, opciones: OpcionesSeries) =>
    ["series", "sensor", id, opciones] as const,
  global: (filtros: Record<string, unknown>) =>
    ["series", "global", filtros] as const,
};

/**
 * Series agregadas de un sensor.
 *
 * `refetchInterval` es alto a propósito: los gráficos históricos no
 * necesitan tiempo real. El WebSocket se encarga de las mediciones nuevas.
 *
 * `refrescoMs` permite que un gráfico "en vivo" se actualice solo. Para los
 * gráficos históricos se deja sin refresco (0) y basta el WebSocket.
 */
export function useSeriesSensor(
  id: string,
  opciones: OpcionesSeries = {},
  refrescoMs = 0
) {
  return useQuery({
    queryKey: CLAVES_SERIES.sensor(id, opciones),
    queryFn: () => obtenerSeriesSensor(id, opciones),
    enabled: Boolean(id),
    staleTime: refrescoMs > 0 ? 0 : 60_000,
    refetchInterval: refrescoMs > 0 ? refrescoMs : undefined,
  });
}

/**
 * Series "en vivo" de un sensor: agregadas por MINUTO en el backend.
 *
 * Antes esta vista traía hasta 500 mediciones crudas y las agrupaba en el
 * navegador. Eso tenía dos problemas:
 *
 *   1. No escalaba: un sensor a 1 medición/s son 3.600 filas por hora.
 *   2. El `limite` recortaba las mediciones MÁS ANTIGUAS, así que al subir la
 *      frecuencia la ventana se encogía sin avisar.
 *
 * Ahora se pide la agregación por minuto a SQL (`/sensors/:id/series`), que
 * devuelve como mucho 60 puntos por hora. Es más rápido, no se recorta y
 * reutiliza exactamente el mismo endpoint que el histórico.
 */
export function useSeriesEnVivo(
  sensorId: string,
  opciones: { canal_id?: string; minutos?: number } = {},
  refrescoMs = 15_000
) {
  const { canal_id, minutos = 60 } = opciones;

  return useQuery({
    queryKey: [
      'series-en-vivo',
      sensorId,
      canal_id ?? 'todos',
      minutos,
    ],
    queryFn: async () => {
      const desde = new Date(Date.now() - minutos * 60_000).toISOString();
      const p = new URLSearchParams({
        intervalo: 'minuto',
        desde,
        limite: '2000',
      });
      if (canal_id) p.set('canal_id', canal_id);

      const r = await api.obtener<{ series: CuboSerie[] }>(
        `/sensors/${sensorId}/series?${p.toString()}`
      );
      return r.datos?.series ?? [];
    },
    enabled: Boolean(sensorId),
    staleTime: 0,
    refetchInterval: refrescoMs > 0 ? refrescoMs : undefined,
  });
}

/** Series agregadas con filtros globales (varios canales). */
export function useSeries(
  filtros: {
    sensor_id?: string;
    canal_id?: string;
    dispositivo_id?: string;
    area_id?: string;
    desde?: string;
    hasta?: string;
    intervalo?: "minuto" | "hora" | "dia" | "semana" | "mes";
    limite?: number;
  } = {},
  habilitado = true
) {
  return useQuery({
    queryKey: CLAVES_SERIES.global(filtros),
    queryFn: () => obtenerSeries(filtros),
    enabled: habilitado,
    staleTime: 60_000,
  });
}

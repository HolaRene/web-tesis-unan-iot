"use client";

/**
 * Hooks de series agregadas para los gráficos de historial.
 *
 * El backend agrupa en SQL (`date_trunc`), así que estos hooks reciben
 * pocos puntos ya calculados en lugar de miles de mediciones crudas.
 */
import { useQuery } from "@tanstack/react-query";
import {
  obtenerSeries,
  obtenerSeriesSensor,
  type OpcionesSeries,
} from "@/servicios/mediciones.servicio";

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
 */
export function useSeriesSensor(id: string, opciones: OpcionesSeries = {}) {
  return useQuery({
    queryKey: CLAVES_SERIES.sensor(id, opciones),
    queryFn: () => obtenerSeriesSensor(id, opciones),
    enabled: Boolean(id),
    staleTime: 60_000,
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
    intervalo?: "hora" | "dia" | "semana" | "mes";
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

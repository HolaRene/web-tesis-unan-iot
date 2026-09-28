"use client";

/**
 * Series por canal para la vista de detalle de un sensor.
 *
 * ────────────────────────────────────────────────────────────────────
 * QUÉ RESUELVE
 * ────────────────────────────────────────────────────────────────────
 * Un sensor puede tener varias magnitudes (un DHT22 mide temperatura y
 * humedad; un analizador de red mide voltaje, corriente, potencia y
 * frecuencia). Esta vista necesita **una serie por magnitud** para:
 *
 *   1. El mini-gráfico de cada tarjeta (última hora).
 *   2. El gráfico grande de cada magnitud, con rango variable.
 *
 * Se hace con `useQueries` (una consulta por canal) en lugar de una sola
 * consulta con todos: así cada gráfico tiene su propio estado de carga y un
 * canal lento no bloquea a los demás.
 *
 * ────────────────────────────────────────────────────────────────────
 * OJO CON EL TIPO DE MAGNITUD
 * ────────────────────────────────────────────────────────────────────
 * Solo se piden series de magnitudes NUMÉRICAS. El endpoint `/series` agrupa
 * con `avg()`, que en SQL solo aplica a columnas numéricas: para un canal
 * booleano o de texto devolvería una serie vacía (no un error), y el gráfico
 * quedaría en blanco sin motivo aparente.
 *
 * El filtro lo aplica quien llama, usando `sePuedeGraficar`.
 */
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { obtenerSeriesSensor } from "@/servicios/mediciones.servicio";
import { CLAVES_SERIES } from "@/hooks/useSeries";
import type { IntervaloAgregacion } from "@/configuracion/graficos";
import type { Canal } from "@/tipos";

/** Nº máximo de canales a consultar, para no lanzar decenas de peticiones. */
export const MAX_CANALES_GRAFICADOS = 6;

export interface SeriesDeCanal {
  canal: Canal;
  /** Cubos agregados devueltos por el backend. */
  cubos: Array<{
    cubo: string;
    media: number | null;
    minimo: number | null;
    maximo: number | null;
    muestras: number;
  }>;
  cargando: boolean;
  error: Error | null;
}

/**
 * Series agregadas de cada canal numérico del sensor.
 *
 * @param sensorId   Sensor del que se piden las series.
 * @param canales    Canales ya filtrados (solo numéricos).
 * @param intervalo  Agrupación (minuto/hora/día/semana/mes).
 * @param desde      Inicio del rango (ISO). `undefined` = sin límite.
 * @param hasta      Fin del rango (ISO).
 */
export function useSeriesPorCanalDetalle(
  sensorId: string,
  canales: Canal[],
  intervalo: IntervaloAgregacion,
  desde?: string,
  hasta?: string
): SeriesDeCanal[] {
  const seleccionados = useMemo(
    () => canales.slice(0, MAX_CANALES_GRAFICADOS),
    [canales]
  );

  const consultas = useQueries({
    queries: seleccionados.map((canal) => ({
      queryKey: CLAVES_SERIES.sensor(sensorId, {
        intervalo,
        canal_id: canal.id,
        desde,
        hasta,
      }),
      queryFn: () =>
        obtenerSeriesSensor(sensorId, {
          intervalo,
          canal_id: canal.id,
          desde,
          hasta,
        }),
      enabled: Boolean(sensorId),
      // El rango está redondeado a la hora, así que la clave es estable y
      // esta caché evita repeticiones al cambiar de pestaña o de vista.
      staleTime: 60_000,
    })),
  });

  return useMemo(
    () =>
      seleccionados.map((canal, i) => ({
        canal,
        cubos: consultas[i]?.data?.series ?? [],
        cargando: consultas[i]?.isLoading ?? false,
        error: (consultas[i]?.error as Error | null) ?? null,
      })),
    [seleccionados, consultas]
  );
}

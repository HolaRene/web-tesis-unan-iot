"use client";

/**
 * Panel de historial agregado.
 *
 * Une en un solo bloque:
 *   - selector de rango temporal (24 h, 7 d, 30 d, 90 d, todo),
 *   - selector de intervalo (hora / día / semana / mes),
 *   - tarjetas de resumen (media, mín, máx, muestras),
 *   - gráfico de media con banda mín–máx,
 *   - gráfico comparativo cuando el sensor tiene varias magnitudes.
 *
 * El trabajo pesado lo hace el backend (agregación SQL): aquí solo se
 * eligen los parámetros y se pintan los cubos.
 */
import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TarjetasResumen } from "@/components/graficos/tarjetas-resumen";
import { GraficaHistorial } from "@/components/graficos/grafica-historial";
import {
  GraficaComparacion,
  type SerieCanal,
} from "@/components/graficos/grafica-comparacion";
import { useQueries } from "@tanstack/react-query";
import { useSeriesSensor, CLAVES_SERIES } from "@/hooks/useSeries";
import { obtenerSeriesSensor } from "@/servicios/mediciones.servicio";
import {
  INTERVALOS,
  RANGOS,
  RANGO_POR_DEFECTO,
  calcularRango,
  intervaloParaRango,
  type IntervaloAgregacion,
} from "@/configuracion/graficos";
import type { Canal } from "@/tipos";

interface PanelHistorialProps {
  sensorId: string;
  /** Canales (magnitudes) del sensor, para la comparación. */
  canales?: Canal[];
  /** Unidad del sensor, si solo tiene una magnitud. */
  unidad?: string;
  /**
   * Si se indica, el historial se limita a ESE canal. Se usa en el detalle
   * del canal, donde interesa una sola magnitud y no todas las del sensor.
   */
  canalId?: string;
}

export function PanelHistorial({
  sensorId,
  canales = [],
  unidad = "",
  canalId,
}: PanelHistorialProps) {
  const [rango, setRango] = useState(RANGO_POR_DEFECTO);
  // El intervalo se sugiere según el rango, pero el usuario manda.
  const [intervalo, setIntervalo] = useState<IntervaloAgregacion>(
    intervaloParaRango(RANGO_POR_DEFECTO)
  );

  const opcionesIntervalo = INTERVALOS.find((i) => i.valor === intervalo);
  const { desde, hasta } = useMemo(() => calcularRango(rango), [rango]);

  const consulta = useSeriesSensor(sensorId, {
    intervalo,
    canal_id: canalId,
    desde,
    hasta,
  });

  /** Al cambiar el rango se ajusta el intervalo a uno coherente. */
  function cambiarRango(nuevo: string | null) {
    if (!nuevo) return;
    setRango(nuevo);
    setIntervalo(intervaloParaRango(nuevo));
  }

  /*
   * Comparación de canales: se pide una serie por canal solo si hay más de
   * uno. Se usan los mismos rango e intervalo que el gráfico principal.
   *
   * Si la vista ya está enfocada en un canal concreto (`canalId`), no se
   * compara: sería redundante.
   */
  const canalesNumericos = useMemo(
    () =>
      canalId
        ? []
        : canales.filter((c) => c.tipo_dato !== "booleano"),
    [canales, canalId]
  );

  const seriesPorCanal = useSeriesPorCanal(
    sensorId,
    canalesNumericos,
    intervalo,
    desde,
    hasta
  );

  const datos = consulta.data;

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="hist-rango">Periodo</Label>
          <Select value={rango} onValueChange={cambiarRango}>
            <SelectTrigger id="hist-rango" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGOS.map((r) => (
                <SelectItem key={r.valor} value={r.valor}>
                  {r.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="hist-intervalo">Agrupar</Label>
          <Select
            value={intervalo}
            onValueChange={(v) => {
              if (v) setIntervalo(v as IntervaloAgregacion);
            }}
          >
            <SelectTrigger id="hist-intervalo" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVALOS.map((i) => (
                <SelectItem key={i.valor} value={i.valor}>
                  {i.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          {datos ? `${datos.series.length} punto(s) agregado(s)` : ""}
        </p>
      </div>

      {consulta.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[320px] w-full" />
        </div>
      )}

      {consulta.isError && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el historial</AlertTitle>
          <AlertDescription>
            {(consulta.error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {datos && (
        <>
          <TarjetasResumen resumen={datos.resumen} unidad={unidad} />

          <GraficaHistorial
            series={datos.series}
            formatoEje={opcionesIntervalo?.formatoEje ?? "dd MMM"}
            unidad={unidad}
            titulo="Media del periodo con rango mín–máx"
          />

          {canalesNumericos.length > 1 && seriesPorCanal.length > 1 && (
            <GraficaComparacion
              series={seriesPorCanal}
              formatoEje={opcionesIntervalo?.formatoEje ?? "dd MMM"}
            />
          )}

          {datos.series.length === 0 && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                <BarChart3 className="size-4" aria-hidden />
                No hay mediciones numéricas en el periodo elegido. Prueba a
                ampliar el rango temporal.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Pide una serie agregada por canal usando `useQueries`.
 *
 * `useQueries` permite un número dinámico de consultas, así que no hay que
 * fijar de antemano cuántas magnitudes tiene el sensor (ni recurrir a hooks
 * repetidos). Cada consulta se cachea por canal + rango + intervalo.
 */
function useSeriesPorCanal(
  sensorId: string,
  canales: Canal[],
  intervalo: IntervaloAgregacion,
  desde?: string,
  hasta?: string
): SerieCanal[] {
  // Límite defensivo: un sensor con decenas de magnitudes no debe lanzar
  // decenas de peticiones ni dibujar un gráfico ilegible.
  const MAX_CANALES = 6;
  const seleccionados = useMemo(
    () => canales.slice(0, MAX_CANALES),
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
      staleTime: 60_000,
    })),
  });

  return seleccionados
    .map((canal, i) => ({
      canal_id: canal.id,
      nombre: canal.nombre,
      unidad: canal.unidad ?? "",
      cubos: consultas[i]?.data?.series ?? [],
    }))
    .filter((s) => s.cubos.length > 0);
}

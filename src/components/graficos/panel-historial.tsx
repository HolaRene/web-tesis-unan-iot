"use client";

/**
 * Panel de historial: varios charts apilados, cada uno con un propósito.
 *
 *   1. PROMEDIO POR INTERVALO  — visión histórica (agregado en SQL).
 *   2. EN VIVO (por minuto)    — qué está pasando ahora; refresco automático.
 *   3. MÍN / MEDIA / MÁX       — tres líneas para leer la dispersión.
 *   4. COMPARACIÓN DE CANALES  — varias magnitudes del mismo sensor.
 *
 * Decisiones relevantes:
 *
 *   - El eje temporal se ANCLA a "ahora": los gráficos siempre terminan en el
 *     instante actual aunque no haya datos, así se ve avanzar el tiempo.
 *   - El histórico se agrega en SQL (escala); el "en vivo" se agrega en el
 *     navegador sobre las últimas mediciones (fresco, sin castigar la BD).
 *   - `refrescoMs` está activo solo donde tiene sentido: la vista en vivo.
 */
import { useMemo, useState } from "react";
import { Activity, BarChart3, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { GraficaMinMediaMax } from "@/components/graficos/grafica-min-media-max";
import {
  GraficaComparacion,
  type SerieCanal,
} from "@/components/graficos/grafica-comparacion";
import {
  useSeriesSensor,
  useSeriesEnVivo,
  CLAVES_SERIES,
} from "@/hooks/useSeries";
import { useQueries } from "@tanstack/react-query";
import { obtenerSeriesSensor } from "@/servicios/mediciones.servicio";
import {
  INTERVALOS,
  RANGOS,
  RANGO_POR_DEFECTO,
  calcularRango,
  intervaloParaRango,
  REFRESCO_EN_VIVO_MS,
  type IntervaloAgregacion,
} from "@/configuracion/graficos";

import { useAhora } from "@/hooks/useAhora";
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
  const [intervalo, setIntervalo] = useState<IntervaloAgregacion>(
    intervaloParaRango(RANGO_POR_DEFECTO)
  );

  const { desde, hasta } = useMemo(() => calcularRango(rango), [rango]);
  // "Ahora" como estado (no como llamada a Date.now() en render, que React
  // considera impuro): el eje se ancla al presente y avanza solo.
  const ahora = useAhora(REFRESCO_EN_VIVO_MS);
  const fechaDesde = useMemo(
    () =>
      desde ? new Date(desde) : new Date(ahora.getTime() - 7 * 86_400_000),
    [desde, ahora]
  );
  const fechaHasta = ahora;
  // Ventana de la vista en vivo: últimos 30 minutos.
  const desdeEnVivo = useMemo(
    () => new Date(ahora.getTime() - 30 * 60_000),
    [ahora]
  );

  // 1) Histórico agregado en SQL.
  const historico = useSeriesSensor(sensorId, {
    intervalo,
    canal_id: canalId,
    desde,
    hasta,
  });

  // 2) En vivo: cubos por minuto agregados en SQL, con refresco automático.
  //    Se piden 60 minutos (más de lo que se muestra) para que el eje tenga
  //    contexto aunque el usuario acabe de abrir la página.
  const enVivo = useSeriesEnVivo(
    sensorId,
    { canal_id: canalId, minutos: 60 },
    REFRESCO_EN_VIVO_MS
  );

  const cubosEnVivo = enVivo.data ?? [];

  /** Al cambiar el rango se ajusta el intervalo a uno coherente. */
  function cambiarRango(nuevo: string | null) {
    if (!nuevo) return;
    setRango(nuevo);
    setIntervalo(intervaloParaRango(nuevo));
  }

  /*
   * Comparación de canales: una consulta por canal. Si la vista ya está
   * enfocada en un canal concreto, no se compara (sería redundante).
   */
  const canalesNumericos = useMemo(
    () => (canalId ? [] : canales.filter((c) => c.tipo_dato !== "booleano")),
    [canales, canalId]
  );

  const seriesPorCanal = useSeriesPorCanal(
    sensorId,
    canalesNumericos,
    intervalo,
    desde,
    hasta
  );

  const datos = historico.data;
  const minutosConDatos = cubosEnVivo.length;

  return (
    <div className="space-y-4">
      {/* Controles del histórico */}
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

        {datos && (
          <p className="text-xs text-muted-foreground">
            {datos.series.length} intervalo(s) con datos
          </p>
        )}
      </div>

      {historico.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      )}

      {historico.isError && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el historial</AlertTitle>
          <AlertDescription>
            {(historico.error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {datos && (
        <>
          <TarjetasResumen resumen={datos.resumen} unidad={unidad} />

          {/* 1) Promedio por intervalo (histórico, agregado en SQL). */}
          <GraficaHistorial
            series={datos.series}
            intervalo={intervalo}
            desde={fechaDesde}
            hasta={fechaHasta}
            unidad={unidad}
            titulo="Promedio por intervalo"
            descripcion="Media de cada intervalo con su rango mín–máx. El eje llega hasta la hora actual."
          />

          {/* 2) En vivo, por minuto (agregado en el navegador). */}
          <Card>
            <CardContent className="pt-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Clock className="size-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">En vivo (por minuto)</span>
                <Badge variant="secondary" className="gap-1">
                  <Activity className="size-3" aria-hidden />
                  cada {Math.round(REFRESCO_EN_VIVO_MS / 1000)} s
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {minutosConDatos > 0
                    ? `${minutosConDatos} minuto(s) con datos en la última hora`
                    : "sin datos en la última hora"}
                </span>
              </div>
            </CardContent>
            <div className="-mt-4">
              <GraficaHistorial
                series={cubosEnVivo}
                intervalo="minuto"
                desde={desdeEnVivo}
                hasta={fechaHasta}
                unidad={unidad}
                titulo="Evolución de los últimos 30 minutos"
                descripcion="Media por minuto calculada en el navegador. Se actualiza sola."
              />
            </div>
          </Card>

          {/* 3) Mín / media / máx como líneas independientes. */}
          <GraficaMinMediaMax
            series={datos.series}
            intervalo={intervalo}
            desde={fechaDesde}
            hasta={fechaHasta}
            unidad={unidad}
          />

          {/* 4) Comparación de magnitudes del mismo sensor. */}
          {canalesNumericos.length > 1 && seriesPorCanal.length > 1 && (
            <GraficaComparacion
              series={seriesPorCanal}
              intervalo={intervalo}
              desde={fechaDesde}
              hasta={fechaHasta}
            />
          )}

          {datos.series.length === 0 && cubosEnVivo.length === 0 && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                <BarChart3 className="size-4" aria-hidden />
                No hay mediciones numéricas en el periodo elegido. Los ejes
                siguen avanzando hasta la hora actual.
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
 * fijar de antemano cuántas magnitudes tiene el sensor.
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
  const seleccionados = useMemo(() => canales.slice(0, MAX_CANALES), [canales]);

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

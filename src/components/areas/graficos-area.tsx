"use client";

/**
 * Gráficos de un ÁREA: uno por TIPO DE MAGNITUD.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ SE AGRUPA POR MAGNITUD Y NO POR SENSOR
 * ────────────────────────────────────────────────────────────────────
 * Un área puede tener varios sensores midiendo lo mismo (tres DHT22 de
 * temperatura). Un gráfico por sensor daría tres líneas casi idénticas.
 *
 * Agrupando por magnitud, cada gráfico promedia TODOS los sensores del área
 * que miden esa misma cosa: "temperatura del área", "humedad del área"…
 *
 * ────────────────────────────────────────────────────────────────────
 * ⚠️ SIN `tipo_variable_id` LOS DATOS SERÍAN BASURA
 * ────────────────────────────────────────────────────────────────────
 * El endpoint `/series` agrega con `avg()`. Si se le pide un área SIN filtrar
 * por magnitud, promedia columnas distintas en un mismo número: temperatura
 * (25 °C) con voltaje (230 V) y corriente (5 A) da algo como "287", un valor
 * sin significado físico.
 *
 * Por eso cada consulta lleva SIEMPRE su `tipo_variable_id`.
 *
 * Solo se grafican magnitudes NUMÉRICAS (ver `sePuedeGraficar`).
 */
import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraficaHistorial } from "@/components/graficos/grafica-historial";

import { obtenerSeries } from "@/servicios/mediciones.servicio";
import { useAhora } from "@/hooks/useAhora";
import { useEventosMediciones } from "@/hooks/use-eventos-mediciones";
import {
  RANGOS,
  RANGO_POR_DEFECTO,
  INTERVALOS,
  calcularRango,
  intervaloParaRango,
  PALETA_CANALES,
} from "@/configuracion/graficos";
import { sePuedeGraficar } from "@/utilidades/magnitudes";
import type { IntervaloAgregacion } from "@/configuracion/graficos";
import type { Sensor, Canal } from "@/tipos";

interface GraficosAreaProps {
  areaId: string;
  sensores: Sensor[];
}

/** Una magnitud presente en el área, con los canales que la miden. */
interface MagnitudDelArea {
  tipoVariableId: string;
  /** Nombre legible de la magnitud (p. ej. "Temperatura"). */
  etiqueta: string;
  unidad: string;
  /** Canales del área que miden esta magnitud. */
  canales: Canal[];
}

export function GraficosArea({ areaId, sensores }: GraficosAreaProps) {
  useEventosMediciones();

  const [rango, setRango] = useState(RANGO_POR_DEFECTO);
  const [intervalo, setIntervalo] = useState<IntervaloAgregacion>(
    intervaloParaRango(RANGO_POR_DEFECTO)
  );

  const ahora = useAhora(60_000);
  const { desde, hasta } = useMemo(
    () => calcularRango(rango, ahora),
    [rango, ahora]
  );

  /*
   * Se recorre lo que ya sabemos de los sensores del área para deducir qué
   * magnitudes existen. No hace falta una petición extra: cada sensor trae su
   * `tipo_codigo` / `tipo_nombre` / `unidad`.
   *
   * Se agrupa por `tipo_id` (la magnitud), no por sensor.
   */
  const magnitudes = useMemo<MagnitudDelArea[]>(() => {
    const mapa = new Map<string, MagnitudDelArea>();

    for (const sensor of sensores) {
      if (!sePuedeGraficar(sensor.tipo_dato)) continue;

      const id = sensor.tipo_id;
      if (!id) continue;

      const existente = mapa.get(id);
      if (existente) {
        existente.canales.push({
          id: sensor.id,
          sensor_id: sensor.id,
          tipo_variable_id: id,
          codigo: sensor.codigo,
          nombre: sensor.nombre,
          descripcion: null,
          unidad: sensor.unidad ?? null,
          rango_min: null,
          rango_max: null,
          precision_valor: null,
          activo: true,
          tipo_dato: sensor.tipo_dato,
        });
        continue;
      }

      mapa.set(id, {
        tipoVariableId: id,
        etiqueta: sensor.tipo_nombre ?? sensor.codigo,
        unidad: sensor.unidad ?? "",
        canales: [
          {
            id: sensor.id,
            sensor_id: sensor.id,
            tipo_variable_id: id,
            codigo: sensor.codigo,
            nombre: sensor.nombre,
            descripcion: null,
            unidad: sensor.unidad ?? null,
            rango_min: null,
            rango_max: null,
            precision_valor: null,
            activo: true,
            tipo_dato: sensor.tipo_dato,
          },
        ],
      });
    }

    return [...mapa.values()].sort((a, b) =>
      a.etiqueta.localeCompare(b.etiqueta, "es")
    );
  }, [sensores]);

  /*
   * Una consulta por magnitud. Cada una lleva su `tipo_variable_id`, que es lo
   * que evita promediar magnitudes distintas.
   */
  const consultas = useQueries({
    queries: magnitudes.map((m) => ({
      queryKey: [
        "series-area",
        areaId,
        m.tipoVariableId,
        intervalo,
        desde,
        hasta,
      ],
      queryFn: () =>
        obtenerSeries({
          area_id: areaId,
          tipo_variable_id: m.tipoVariableId,
          intervalo,
          desde,
          hasta,
        }),
      enabled: Boolean(areaId),
      staleTime: 60_000,
    })),
  });

  function cambiarRango(nuevo: string | null) {
    if (!nuevo) return;
    setRango(nuevo);
    setIntervalo(intervaloParaRango(nuevo));
  }

  // Sin magnitudes numéricas no hay nada que graficar.
  if (magnitudes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gráficos del área</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta área no tiene sensores con magnitudes numéricas, así que no hay
            nada que representar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gráficos del área</CardTitle>
          <p className="text-sm text-muted-foreground">
            Un gráfico por magnitud, promediando todos los sensores del área que
            la miden. Cada magnitud tiene su propia escala y unidad.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Periodo</span>
            <Select value={rango} onValueChange={cambiarRango}>
              <SelectTrigger className="w-44" aria-label="Periodo">
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Agrupar por</span>
            <Select
              value={intervalo}
              onValueChange={(v) => v && setIntervalo(v as IntervaloAgregacion)}
            >
              <SelectTrigger className="w-40" aria-label="Agrupación">
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
        </CardContent>
      </Card>

      {magnitudes.map((m, i) => {
        const consulta = consultas[i];
        const cubos = consulta?.data?.series ?? [];

        if (consulta?.error) {
          return (
            <Alert variant="destructive" key={m.tipoVariableId}>
              <AlertTitle>Error en «{m.etiqueta}»</AlertTitle>
              <AlertDescription>
                {(consulta.error as Error).message}
              </AlertDescription>
            </Alert>
          );
        }

        if (consulta?.isLoading) {
          return (
            <Card key={m.tipoVariableId}>
              <CardHeader>
                <CardTitle className="text-base">{m.etiqueta}</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-56 w-full" />
              </CardContent>
            </Card>
          );
        }

        const totalMuestras = cubos.reduce((t, c) => t + (c.muestras ?? 0), 0);

        return (
          <Card key={m.tipoVariableId}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base">{m.etiqueta}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {m.canales.length}{" "}
                    {m.canales.length === 1 ? "sensor" : "sensores"}
                    {m.unidad ? ` · ${m.unidad}` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Activity className="size-3" aria-hidden />
                  {totalMuestras} muestras
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {cubos.length === 0 ? (
                <div className="flex h-36 items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
                  Sin mediciones de {m.etiqueta.toLowerCase()} en el periodo
                </div>
              ) : (
                <GraficaHistorial
                  series={cubos}
                  intervalo={intervalo}
                  desde={
                    desde ? new Date(desde) : new Date(ahora.getTime() - 86_400_000)
                  }
                  hasta={hasta ? new Date(hasta) : ahora}
                  unidad={m.unidad}
                  colorLinea={PALETA_CANALES[i % PALETA_CANALES.length]}
                  titulo=""
                  descripcion=""
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

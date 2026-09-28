"use client";

/**
 * Gráficos del detalle de un sensor: uno por magnitud.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ UN GRÁFICO POR MAGNITUD Y NO UNO SOLO
 * ────────────────────────────────────────────────────────────────────
 * Superponer magnitudes distintas en un mismo eje no funciona:
 *
 *   - Temperatura (≈24 °C) y humedad (≈60 %) comparten eje → la temperatura
 *     queda aplastada contra el suelo.
 *   - Voltaje (≈230 V) y corriente (≈5 A) → la corriente es invisible.
 *
 * Cada magnitud tiene su propia escala, su unidad y su color, así que cada
 * una merece su propio gráfico.
 *
 * ────────────────────────────────────────────────────────────────────
 * TIPO DE MAGNITUD (lo importante)
 * ────────────────────────────────────────────────────────────────────
 * Solo se grafican las magnitudes NUMÉRICAS. Las booleanas (on/off), de texto
 * (ok/error) y JSON no se pueden representar con una línea: se listan aparte,
 * indicando el motivo, para no dejar huecos vacíos sin explicación.
 */
import { useMemo, useState } from "react";
import { Activity, Info } from "lucide-react";

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

import { useSeriesPorCanalDetalle } from "@/hooks/useSeriesPorCanalDetalle";
import { useAhora } from "@/hooks/useAhora";
import {
  RANGOS,
  RANGO_POR_DEFECTO,
  INTERVALOS,
  calcularRango,
  intervaloParaRango,
} from "@/configuracion/graficos";
import type { IntervaloAgregacion } from "@/configuracion/graficos";
import { PALETA_CANALES } from "@/configuracion/graficos";
import { useEventosMediciones } from "@/hooks/use-eventos-mediciones";
import {
  sePuedeGraficar,
  etiquetaTipoDato,
  motivoNoGraficable,
} from "@/utilidades/magnitudes";
import type { Canal } from "@/tipos";

interface GraficosSensorProps {
  sensorId: string;
  canales: Canal[];
}

export function GraficosSensor({ sensorId, canales }: GraficosSensorProps) {
  // Los eventos realtime refrescan los gráficos cuando llegan mediciones.
  useEventosMediciones();

  const [rango, setRango] = useState(RANGO_POR_DEFECTO);
  const [intervalo, setIntervalo] = useState<IntervaloAgregacion>(
    intervaloParaRango(RANGO_POR_DEFECTO)
  );

  // Reloj lento: el rango se redondea a la hora, así que la clave de consulta
  // es estable y los gráficos no se recargan continuamente.
  const ahora = useAhora(60_000);
  const { desde, hasta } = useMemo(
    () => calcularRango(rango, ahora),
    [rango, ahora]
  );

  /*
   * Separación por tipo de dato. Es el punto clave: solo las magnitudes
   * numéricas se pueden dibujar como línea.
   */
  const { numericos, noGraficables } = useMemo(() => {
    const nums: Canal[] = [];
    const otros: Canal[] = [];
    for (const canal of canales) {
      if (sePuedeGraficar(canal.tipo_dato)) nums.push(canal);
      else otros.push(canal);
    }
    return { numericos: nums, noGraficables: otros };
  }, [canales]);

  const series = useSeriesPorCanalDetalle(
    sensorId,
    numericos,
    intervalo,
    desde,
    hasta
  );

  function cambiarRango(nuevo: string | null) {
    if (!nuevo) return;
    setRango(nuevo);
    setIntervalo(intervaloParaRango(nuevo));
  }

  return (
    <div className="space-y-4">
      {/* Controles comunes a todos los gráficos. */}
      {numericos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Histórico por magnitud
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Un gráfico por cada magnitud medida por el sensor. Cada uno tiene
              su propia escala y unidad.
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
              <span className="text-sm text-muted-foreground">
                Agrupar por
              </span>
              <Select
                value={intervalo}
                onValueChange={(v) =>
                  v && setIntervalo(v as IntervaloAgregacion)
                }
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
      )}

      {/* Un gráfico por magnitud numérica. */}
      {series.map((s, i) => (
        <GraficaDeMagnitud
          key={s.canal.id}
          titulo={s.canal.nombre}
          codigo={s.canal.codigo}
          unidad={s.canal.unidad ?? ""}
          color={PALETA_CANALES[i % PALETA_CANALES.length]}
          cubos={s.cubos}
          cargando={s.cargando}
          error={s.error}
          intervalo={intervalo}
          desde={desde ? new Date(desde) : new Date(ahora.getTime() - 86_400_000)}
          hasta={hasta ? new Date(hasta) : ahora}
        />
      ))}

      {/* Magnitudes que NO se pueden graficar: se explica por qué. */}
      {noGraficables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-muted-foreground" aria-hidden />
              Magnitudes sin gráfico
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Estos canales no representan valores continuos, así que un
              gráfico de líneas no tendría sentido.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {noGraficables.map((canal) => (
                <li key={canal.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{canal.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        <code>{canal.codigo}</code> · {etiquetaTipoDato(canal.tipo_dato)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {etiquetaTipoDato(canal.tipo_dato)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {motivoNoGraficable(canal.tipo_dato)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Un gráfico, con su cabecera (nombre, unidad y rango) y su estado de carga. */
function GraficaDeMagnitud({
  titulo,
  codigo,
  unidad,
  color,
  cubos,
  cargando,
  error,
  intervalo,
  desde,
  hasta,
}: {
  titulo: string;
  codigo: string;
  unidad: string;
  color: string;
  cubos: Array<{
    cubo: string;
    media: number | null;
    minimo: number | null;
    maximo: number | null;
    muestras: number;
  }>;
  cargando: boolean;
  error: Error | null;
  intervalo: IntervaloAgregacion;
  desde: Date;
  hasta: Date;
}) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error en «{titulo}»</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (cargando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Sin datos en el rango pedido: se dice, en lugar de dejar un hueco vacío.
  if (cubos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{titulo}</CardTitle>
          <p className="text-xs text-muted-foreground">
            <code>{codigo}</code>
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
            Sin mediciones en el periodo seleccionado
          </div>
        </CardContent>
      </Card>
    );
  }

  const muestrasTotales = cubos.reduce((t, c) => t + (c.muestras ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{titulo}</CardTitle>
            <p className="text-xs text-muted-foreground">
              <code>{codigo}</code>
              {unidad ? ` · ${unidad}` : ""}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Activity className="size-3" aria-hidden />
            {muestrasTotales} muestras
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <GraficaHistorial
          series={cubos}
          intervalo={intervalo}
          desde={desde}
          hasta={hasta}
          unidad={unidad}
          colorLinea={color}
          titulo=""
          descripcion=""
        />
      </CardContent>
    </Card>
  );
}

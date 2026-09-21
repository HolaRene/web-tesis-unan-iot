"use client";

/**
 * Gráfico con TRES LÍNEAS: mínimo, media y máximo.
 *
 * A diferencia de la banda de rango (un área difusa), aquí cada estadístico
 * es una línea propia, para poder leer su evolución por separado.
 *
 * Usa la misma malla temporal completa, así que también avanza hasta ahora.
 */
import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { rellenarMalla, type CuboEntrada } from "@/utilidades/series-temporales";

/** Colores de cada línea (coherentes con el resto de la app). */
const COLOR_MIN = "#22c55e";
const COLOR_MEDIA = "#0ea5e9";
const COLOR_MAX = "#f97316";

interface GraficaMinMediaMaxProps {
  series: CuboEntrada[];
  intervalo: string;
  desde: Date;
  hasta: Date;
  unidad?: string;
  titulo?: string;
}

function num(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toFixed(decimales);
}

export function GraficaMinMediaMax({
  series,
  intervalo,
  desde,
  hasta,
  unidad = "",
  titulo = "Mínimo, media y máximo",
}: GraficaMinMediaMaxProps) {
  const datos = useMemo(
    () => rellenarMalla(series, intervalo, desde, hasta),
    [series, intervalo, desde, hasta]
  );

  const hayDatos = datos.some((p) => p.media !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Cada estadístico como línea independiente del mismo intervalo.
        </p>
      </CardHeader>
      <CardContent>
        {!hayDatos ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Sin mediciones en este periodo.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="etiqueta"
                tick={{ fontSize: 11 }}
                minTickGap={28}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                width={52}
                tickFormatter={(v: number) => num(v, 1)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof datos)[number];
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      <p className="mb-1 font-medium">{p.etiquetaLarga}</p>
                      {p.media === null ? (
                        <p className="text-muted-foreground">Sin datos</p>
                      ) : (
                        <>
                          <p>
                            Máx:{" "}
                            <span className="font-medium">
                              {num(p.maximo)} {unidad}
                            </span>
                          </p>
                          <p>
                            Media:{" "}
                            <span className="font-medium">
                              {num(p.media)} {unidad}
                            </span>
                          </p>
                          <p>
                            Mín:{" "}
                            <span className="font-medium">
                              {num(p.minimo)} {unidad}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            {p.muestras} muestra(s)
                          </p>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="maximo"
                name="Máximo"
                stroke={COLOR_MAX}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="media"
                name="Media"
                stroke={COLOR_MEDIA}
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="minimo"
                name="Mínimo"
                stroke={COLOR_MIN}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * Gráfico de MEDIA con banda mín–máx, sobre una malla temporal completa.
 *
 * Diferencia clave con la versión anterior: el eje X se construye con
 * `rellenarMalla`, que genera TODOS los intervalos desde `desde` hasta
 * `hasta` (normalmente ahora). Así:
 *
 *   - El gráfico avanza aunque no lleguen datos: siempre termina en el
 *     instante actual.
 *   - Los huecos sin mediciones se ven como huecos, no como puntos pegados.
 *   - El instante en curso se marca como "ahora".
 *
 * No calcula agregaciones: recibe cubos ya agregados (por SQL o por el
 * motor de cliente) y solo los coloca en la malla.
 */
import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COLOR_BANDA, COLOR_MEDIA } from "@/configuracion/graficos";
import {
  rellenarMalla,
  esCuboActual,
  type CuboEntrada,
} from "@/utilidades/series-temporales";

interface GraficaHistorialProps {
  /** Cubos con datos (del backend o del agregador de cliente). */
  series: CuboEntrada[];
  intervalo: string;
  desde: Date;
  hasta: Date;
  unidad?: string;
  titulo?: string;
  descripcion?: string;
  /**
   * Color de la línea. Se usa cuando hay varios gráficos en pantalla (uno por
   * magnitud) para que cada uno se identifique con su color.
   */
  colorLinea?: string;
}

function num(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toFixed(decimales);
}

export function GraficaHistorial({
  series,
  intervalo,
  desde,
  hasta,
  unidad = "",
  titulo = "Promedio por intervalo",
  descripcion,
  colorLinea,
}: GraficaHistorialProps) {
  const { datos, hayAlgunDato, totalMuestras } = useMemo(() => {
    const malla = rellenarMalla(series, intervalo, desde, hasta);
    return {
      datos: malla,
      hayAlgunDato: malla.some((p) => p.media !== null),
      /*
       * Suma de las mediciones que hay DETRÁS de los puntos dibujados.
       *
       * Sirve para distinguir "no llegaron datos" de "llegaron muchos y se
       * agruparon". Sin este dato, ver un solo punto y 50 mediciones parece
       * un fallo cuando en realidad la agrupación hizo su trabajo.
       */
      totalMuestras: malla.reduce((acc, p) => acc + (p.muestras ?? 0), 0),
    };
  }, [series, intervalo, desde, hasta]);

  /** Puntos realmente dibujados (los que tienen datos). */
  const puntosConDato = useMemo(
    () => datos.filter((p) => p.media !== null).length,
    [datos]
  );

  // Índice del último cubo con datos y del cubo en curso (para marcar).
  const instanteActual = useMemo(
    () => datos.find((p) => esCuboActual(p.instante, intervalo, new Date()))?.etiqueta,
    [datos, intervalo]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        {descripcion && (
          <p className="text-xs text-muted-foreground">{descripcion}</p>
        )}
        {/*
          Aviso de agrupación: cuántas mediciones hay detrás de los puntos.
          Si el número de mediciones es mucho mayor que el de puntos, es que
          se están promediando (normal), no que falten datos.
        */}
        {hayAlgunDato && (
          <p className="text-xs text-muted-foreground">
            {totalMuestras} medición{totalMuestras === 1 ? "" : "es"}
            {totalMuestras !== puntosConDato
              ? ` agrupadas en ${puntosConDato} punto${
                  puntosConDato === 1 ? "" : "s"
                }`
              : ` en ${puntosConDato} punto${puntosConDato === 1 ? "" : "s"}`}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {!hayAlgunDato ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm text-muted-foreground">
              Sin mediciones en este periodo.
            </p>
            <p className="text-xs text-muted-foreground">
              El eje sigue avanzando hasta la hora actual.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={datos} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
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
                tickFormatter={(v: number) => `${num(v, 1)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof datos)[number];
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      {/*
                        Fecha larga y explícita: incluye el día de la semana y
                        el mes en palabras. Debajo, el periodo que cubre el
                        punto, porque cada punto es el PROMEDIO de todo un
                        intervalo (una hora, un día, un mes…), no un instante.
                      */}
                      <p className="mb-0.5 font-medium">{p.etiquetaLarga}</p>
                      {p.rangoPeriodo ? (
                        <p className="mb-1 text-muted-foreground">
                          {p.rangoPeriodo}
                        </p>
                      ) : null}
                      {p.media === null ? (
                        <p className="text-muted-foreground">Sin datos</p>
                      ) : (
                        <>
                          <p>
                            Media:{" "}
                            <span className="font-medium">
                              {num(p.media)} {unidad}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Rango: {num(p.minimo)} – {num(p.maximo)} {unidad}
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

              {/* Marca del instante en curso: el gráfico "llega hasta ahora". */}
              {instanteActual && (
                <ReferenceLine
                  x={instanteActual}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  className="text-muted-foreground"
                  label={{ value: "ahora", position: "top", fontSize: 10 }}
                />
              )}

              {/* Banda mín–máx detrás de la línea. */}
              <Area
                type="monotone"
                dataKey="banda"
                name="Rango mín–máx"
                stroke="none"
                fill={COLOR_BANDA}
                fillOpacity={0.15}
                isAnimationActive={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="media"
                name="Media"
                stroke={colorLinea ?? COLOR_MEDIA}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

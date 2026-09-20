"use client";

/**
 * Gráfico de historial agregado: MEDIA con banda de mínimo/máximo.
 *
 * Recibe los cubos ya agregados por el backend (media/mín/máx/muestras) y
 * los dibuja como:
 *   - una línea con la media,
 *   - un área que cubre el rango mín–máx (la variabilidad dentro del cubo),
 *   - un tooltip con las muestras y la desviación.
 *
 * No calcula agregaciones: eso ya lo hizo SQL.
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
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COLOR_BANDA, COLOR_MEDIA } from "@/configuracion/graficos";
import type { CuboSerie } from "@/tipos";

interface GraficaHistorialProps {
  series: CuboSerie[];
  /** Cómo formatear el eje X según el intervalo activo. */
  formatoEje: string;
  /** Unidad de la magnitud (p. ej. "°C"). */
  unidad?: string;
  titulo?: string;
}

/** Punto ya normalizado para Recharts. */
interface Punto {
  etiqueta: string;
  etiquetaLarga: string;
  media: number | null;
  banda: [number, number] | null;
  minimo: number | null;
  maximo: number | null;
  muestras: number;
  desviacion: number | null;
}

/** Formatea un número evitando ruido de decimales. */
function num(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toFixed(decimales);
}

export function GraficaHistorial({
  series,
  formatoEje,
  unidad = "",
  titulo = "Historial agregado",
}: GraficaHistorialProps) {
  const datos = useMemo<Punto[]>(() => {
    return series.map((c) => {
      const fecha = parseISO(c.cubo as unknown as string);
      return {
        etiqueta: format(fecha, formatoEje, { locale: es }),
        etiquetaLarga: format(fecha, "dd MMM yyyy HH:mm", { locale: es }),
        media: c.media,
        // Recharts necesita [min, max] para el área de rango.
        banda:
          c.minimo !== null && c.maximo !== null ? [c.minimo, c.maximo] : null,
        minimo: c.minimo,
        maximo: c.maximo,
        muestras: c.muestras,
        desviacion: c.desviacion,
      };
    });
  }, [series, formatoEje]);

  if (datos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Sin datos en el periodo seleccionado.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={datos} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis
              tick={{ fontSize: 11 }}
              width={48}
              tickFormatter={(v: number) => `${num(v, 1)}${unidad}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Punto;
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                    <p className="mb-1 font-medium">{p.etiquetaLarga}</p>
                    <p>
                      Media:{" "}
                      <span className="font-medium">
                        {num(p.media)} {unidad}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Rango: {num(p.minimo)} – {num(p.maximo)} {unidad}
                    </p>
                    {p.desviacion !== null && (
                      <p className="text-muted-foreground">
                        Desviación: {num(p.desviacion)} {unidad}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {p.muestras} muestra(s)
                    </p>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {/* Banda mín–máx: se dibuja primero para quedar detrás. */}
            <Area
              type="monotone"
              dataKey="banda"
              name="Rango mín–máx"
              stroke="none"
              fill={COLOR_BANDA}
              fillOpacity={0.15}
              isAnimationActive={false}
            />
            {/* Línea de la media. */}
            <Line
              type="monotone"
              dataKey="media"
              name="Media"
              stroke={COLOR_MEDIA}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

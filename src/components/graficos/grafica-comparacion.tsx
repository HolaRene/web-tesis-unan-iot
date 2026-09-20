"use client";

/**
 * Comparación de varios canales (magnitudes) de un mismo sensor.
 *
 * Ejemplo de uso: un DHT22 expone temperatura y humedad relativa. Este
 * gráfico superpone la MEDIA de cada canal en el mismo eje temporal.
 *
 * IMPORTANTE: se usa un solo eje Y. Superponer magnitudes con unidades
 * distintas (p. ej. °C y %) en ejes separados hace que las líneas se crucen
 * y se lean mal; con un eje compartido la comparación es honesta, y cada
 * canal lleva su unidad en el tooltip.
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
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PALETA_CANALES } from "@/configuracion/graficos";
import type { CuboSerie } from "@/tipos";

/** Una serie de un canal concreto. */
export interface SerieCanal {
  canal_id: string;
  nombre: string;
  unidad: string;
  cubos: CuboSerie[];
}

interface GraficaComparacionProps {
  series: SerieCanal[];
  formatoEje: string;
  titulo?: string;
}

/** Punto combinado: un instante con la media de cada canal. */
type PuntoComparado = {
  etiqueta: string;
  etiquetaLarga: string;
  [clave: string]: string | number | null;
};

function num(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toFixed(decimales);
}

export function GraficaComparacion({
  series,
  formatoEje,
  titulo = "Comparación de magnitudes",
}: GraficaComparacionProps) {
  const { datos, canales } = useMemo(() => {
    // Se indexa por instante de cubo para alinear los canales en el tiempo.
    const mapa = new Map<string, PuntoComparado>();

    series.forEach((serie) => {
      serie.cubos.forEach((cubo) => {
        const claveTiempo = String(cubo.cubo);
        const existente = mapa.get(claveTiempo) ?? {
          etiqueta: format(parseISO(claveTiempo), formatoEje, { locale: es }),
          etiquetaLarga: format(parseISO(claveTiempo), "dd MMM yyyy HH:mm", {
            locale: es,
          }),
        };
        // La clave del dato es el id del canal para evitar colisiones.
        existente[serie.canal_id] = cubo.media;
        mapa.set(claveTiempo, existente);
      });
    });

    const ordenados = [...mapa.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, valor]) => valor);

    return { datos: ordenados, canales: series };
  }, [series, formatoEje]);

  if (datos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Sin datos suficientes para comparar magnitudes.
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
          <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as PuntoComparado;
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                    <p className="mb-1 font-medium">{p.etiquetaLarga}</p>
                    {canales.map((canal) => (
                      <p key={canal.canal_id} className="text-muted-foreground">
                        {canal.nombre}:{" "}
                        <span className="font-medium text-foreground">
                          {num(p[canal.canal_id] as number | null)}{" "}
                          {canal.unidad}
                        </span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {canales.map((canal, i) => (
              <Line
                key={canal.canal_id}
                type="monotone"
                dataKey={canal.canal_id}
                name={`${canal.nombre}${canal.unidad ? ` (${canal.unidad})` : ""}`}
                stroke={PALETA_CANALES[i % PALETA_CANALES.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * Tarjetas de resumen del periodo: media, mínimo, máximo y nº de muestras.
 *
 * Los valores vienen ya calculados por el backend sobre los cubos
 * agregados (media ponderada real, no media de medias).
 */
import { Activity, ArrowDown, ArrowUp, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { SeriesAgregadas } from "@/tipos";

interface TarjetasResumenProps {
  resumen: SeriesAgregadas["resumen"];
  unidad?: string;
}

/** Formatea el número con una precisión razonable. */
function num(valor: number | null, decimales = 2): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toFixed(decimales);
}

/**
 * Formatea enteros con separador de miles.
 *
 * Se usa "en-US" a propósito: es un locale estable en Node y en el navegador,
 * evitando diferencias de hidratación entre servidor y cliente.
 */
function entero(valor: number): string {
  return new Intl.NumberFormat("en-US").format(valor);
}

export function TarjetasResumen({ resumen, unidad = "" }: TarjetasResumenProps) {
  const elementos = [
    {
      etiqueta: "Media",
      valor: `${num(resumen.media)} ${unidad}`.trim(),
      icono: TrendingUp,
    },
    {
      etiqueta: "Mínimo",
      valor: `${num(resumen.minimo)} ${unidad}`.trim(),
      icono: ArrowDown,
    },
    {
      etiqueta: "Máximo",
      valor: `${num(resumen.maximo)} ${unidad}`.trim(),
      icono: ArrowUp,
    },
    {
      etiqueta: "Muestras",
      valor: entero(resumen.muestras),
      icono: Activity,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {elementos.map(({ etiqueta, valor, icono: Icono }) => (
        <Card key={etiqueta}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-muted p-2">
              <Icono className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{etiqueta}</p>
              <p className="truncate text-lg font-semibold">{valor}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

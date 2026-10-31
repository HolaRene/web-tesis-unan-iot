"use client";

/**
 * Tarjeta con el estado actual de una magnitud.
 *
 * ────────────────────────────────────────────────────────────────────
 * QUÉ MUESTRA Y POR QUÉ
 * ────────────────────────────────────────────────────────────────────
 *   - ICONO según la magnitud (temperatura, voltaje…): permite reconocer
 *     el dato de un vistazo sin leer el nombre.
 *   - VALOR ACTUAL con su unidad: lo que interesa.
 *   - ANTIGÜEDAD ("hace 2 min") + SEMÁFORO de frescura: distingue un sensor
 *     que funciona de uno que dejó de enviar.
 *   - MINI-GRÁFICO de la última hora: da contexto sin ocupar espacio.
 *
 * El semáforo es la parte más importante. Sin él, un panel lleno de números
 * puede estar mostrando datos de hace días y parecer correcto.
 */
import { createElement } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeNivel } from "@/components/nivel/badge-nivel";
import { cn } from "@/lib/utils";
import type { NivelMedicion } from "@/tipos";
import { MiniGrafico } from "@/components/graficos/mini-grafico";
import { api } from "@/servicios/api";
import {
  calcularFrescura,
  clasesFrescura,
  formatearValorConUnidad,
  iconoDeMagnitud,
  textoFrescura,
} from "@/utilidades/magnitudes-visual";
import { haceTiempo } from "@/utilidades";

/** Un cubo de la serie devuelta por la API. */
interface CuboSerie {
  cubo: string;
  media: number | null;
}

export interface MagnitudActual {
  /** Id del canal: es lo que identifica la magnitud dentro del sensor. */
  canalId: string;
  /** Id del sensor, para enlazar al detalle. */
  sensorId: string;
  /** Nombre legible de la magnitud ("Temperatura"). */
  nombre: string;
  /** Código del canal ("DHT1W-TEMPERATURA"). */
  codigo: string;
  /** Código de la magnitud ("TEMPERATURA"), para elegir el icono. */
  magnitudCodigo?: string | null;
  unidad?: string | null;
  /** Tipo de dato: solo los numéricos se pueden graficar. */
  tipoDato?: string | null;
  valor: number | null;
  valorTexto?: string | null;
  valorBooleano?: boolean | null;
  registradoEn?: string | null;
  /** Nombre del dispositivo al que pertenece. */
  dispositivoNombre?: string | null;
  /**
   * Nivel del valor según las reglas del canal.
   *
   * NO confundir con la frescura (¿llegan datos?). Aquí se responde «¿el
   * valor está bien?», y son dos semáforos independientes: un valor puede
   * llegar puntualísimo y estar fuera de norma.
   */
  nivel?: NivelMedicion;
}

interface TarjetaMagnitudProps {
  magnitud: MagnitudActual;
  /**
   * Instante de referencia para calcular la antigüedad.
   *
   * Se recibe desde fuera (y no se usa `Date.now()` dentro) para que todos
   * los elementos del panel compartan el MISMO "ahora" y no muestren
   * antigüedades incoherentes entre sí.
   */
  ahora: Date;
  /** Si es `false`, no se pide el mini-gráfico (ahorra peticiones). */
  conGrafico?: boolean;
}

export function TarjetaMagnitud({
  magnitud,
  ahora,
  conGrafico = true,
}: TarjetaMagnitudProps) {
  /*
   * Se resuelve el icono con `createElement` en lugar de asignarlo a una
   * variable (`const Icono = ...`). Una variable en mayúsculas hace que React
   * la trate como un componente creado DURANTE el render, lo que reiniciaría
   * su estado en cada renderizado.
   */
  const icono = iconoDeMagnitud(magnitud.magnitudCodigo, magnitud.nombre);
  const frescura = calcularFrescura(magnitud.registradoEn, ahora);
  const clases = clasesFrescura(frescura);

  const esNumerico =
    (magnitud.tipoDato ?? "").toLowerCase() === "numeric" &&
    magnitud.valor !== null &&
    magnitud.valor !== undefined;

  /*
   * Mini-gráfico de la última hora, por CANAL.
   *
   * Solo se pide si la magnitud es numérica: un estado booleano o un texto
   * no tiene sentido como línea. `enabled` evita la petición inútil.
   */
  const serieQ = useQuery({
    queryKey: ["mini-serie", magnitud.canalId],
    enabled: conGrafico && esNumerico && Boolean(magnitud.sensorId),
    staleTime: 60_000,
    queryFn: async () => {
      const desde = new Date(ahora.getTime() - 60 * 60_000).toISOString();
      const p = new URLSearchParams({
        intervalo: "minuto",
        desde,
        limite: "200",
        canal_id: magnitud.canalId,
      });
      const r = await api.obtener<{ series: CuboSerie[] }>(
        `/sensors/${magnitud.sensorId}/series?${p.toString()}`
      );
      return r.datos?.series ?? [];
    },
  });

  const puntos = (serieQ.data ?? []).map((c) => ({
    instante: c.cubo,
    media: c.media,
  }));

  /** Valor ya formateado según su tipo. */
  const valorMostrado = esNumerico
    ? formatearValorConUnidad(magnitud.valor, magnitud.unidad)
    : magnitud.valorBooleano !== null && magnitud.valorBooleano !== undefined
      ? magnitud.valorBooleano
        ? "Sí"
        : "No"
      : (magnitud.valorTexto ?? "—");

  /*
   * Borde de color según el nivel. Solo en los niveles que exigen mirada:
   * pintar de verde todas las tarjetas correctas las volvería ruido.
   */
  const bordeNivel =
    magnitud.nivel === "critico"
      ? "border-red-500/50"
      : magnitud.nivel === "advertencia"
        ? "border-amber-500/50"
        : magnitud.nivel === "falla"
          ? "border-slate-400/60"
          : "";

  return (
    <Card className={cn("@container/card", bordeNivel)}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              {createElement(icono, {
                className: "size-4 text-muted-foreground",
                "aria-hidden": true,
              })}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{magnitud.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">
                {magnitud.dispositivoNombre ?? magnitud.codigo}
              </p>
            </div>
          </div>

          {/* Semáforo de frescura: el dato más importante de la tarjeta. */}
          <span
            className="flex shrink-0 items-center gap-1.5"
            title={textoFrescura(frescura)}
          >
            <span
              className={`size-2 rounded-full ${clases.punto}`}
              aria-hidden
            />
            <span className={`text-xs ${clases.texto}`}>
              {textoFrescura(frescura)}
            </span>
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl font-semibold tabular-nums">{valorMostrado}</p>
          <div className="flex items-center gap-1.5">
            {magnitud.unidad && esNumerico ? (
              <Badge variant="outline" className="text-xs">
                {magnitud.unidad}
              </Badge>
            ) : null}
            {/*
              Icono + texto, no solo color: este panel puede ir en una
              pantalla de pared y verse de lejos.
            */}
            <BadgeNivel nivel={magnitud.nivel} />
          </div>
        </div>

        {conGrafico && esNumerico ? (
          <div>
            {serieQ.isLoading ? (
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
            ) : puntos.length >= 2 ? (
              <>
                <MiniGrafico datos={puntos} />
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="size-3" aria-hidden />
                  Última hora
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sin datos suficientes para el gráfico
              </p>
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {magnitud.registradoEn
              ? `Medido ${haceTiempo(magnitud.registradoEn)}`
              : "Sin mediciones"}
          </span>
          <Link
            href={`/sensores/${magnitud.sensorId}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            Ver sensor
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

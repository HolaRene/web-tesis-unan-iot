"use client";

/**
 * Actividad de mediciones del sistema.
 *
 * ────────────────────────────────────────────────────────────────────
 * EL PROBLEMA QUE RESUELVE
 * ────────────────────────────────────────────────────────────────────
 * Antes la gráfica se calculaba con `ultimas_mediciones` del resumen, que son
 * solo 10 filas. Con datos dispersos, esas 10 mediciones suelen caer en la
 * MISMA hora, así que el gráfico dibujaba **una única barra** y parecía vacío.
 *
 * Peor aún: no había forma de ver la actividad real, porque las filas más
 * antiguas ni siquiera se pedían.
 *
 * Ahora se pide la agregación a SQL (`/measurements/series`), que cuenta
 * TODAS las mediciones del periodo. Con los datos de ejemplo pasa de 1 barra
 * a 22 horas con 5458 mediciones.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ SE RELLENAN LOS HUECOS
 * ────────────────────────────────────────────────────────────────────
 * El backend solo devuelve las horas CON datos. Si se pintaran tal cual, dos
 * horas separadas por un día aparecerían pegadas y el eje mentiría. Se genera
 * la malla completa para que los parones se VEAN como parones.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, CalendarDays } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GraficaActividad } from "@/components/dashboard/grafica-actividad";
import { api } from "@/servicios/api";

/** Modo de agrupación de la actividad. */
type Modo = "hora" | "dia";

/** Cuántos cubos se piden como máximo. */
const LIMITE_CUBOS = 24;

/** Configuración por modo: intervalo, ventana y etiqueta. */
const MODOS: Record<
  Modo,
  { intervalo: string; cubos: number; etiqueta: string; descripcion: string }
> = {
  hora: {
    intervalo: "hora",
    cubos: 24,
    etiqueta: "Por hora",
    descripcion: "Mediciones registradas en las últimas 24 horas.",
  },
  dia: {
    intervalo: "dia",
    cubos: 14,
    etiqueta: "Por día",
    descripcion: "Mediciones registradas en los últimos 14 días.",
  },
};

interface CuboApi {
  cubo: string;
  muestras: number;
}

export function PanelActividad() {
  const [modo, setModo] = useState<Modo>("hora");
  const config = MODOS[modo];

  const serieQ = useQuery({
    queryKey: ["actividad", modo],
    queryFn: async () => {
      const ms = config.cubos * (modo === "hora" ? 3_600_000 : 86_400_000);
      const desde = new Date(Date.now() - ms).toISOString();
      const p = new URLSearchParams({
        intervalo: config.intervalo,
        desde,
        limite: String(LIMITE_CUBOS),
      });
      const r = await api.obtener<{ series: CuboApi[]; resumen: { muestras: number } }>(
        `/measurements/series?${p.toString()}`
      );
      return {
        cubos: r.datos?.series ?? [],
        total: r.datos?.resumen?.muestras ?? 0,
      };
    },
    // La actividad no necesita tiempo real: con un minuto basta.
    refetchInterval: POLLING_RESPALDO_MS,
    staleTime: 30_000,
  });

  const total = serieQ.data?.total ?? 0;

  /**
   * Rellena la malla temporal completa.
   *
   * El backend solo devuelve cubos CON datos. Sin rellenar, dos horas
   * separadas por un parón aparecerían contiguas y el eje mentiría.
   */
  const puntos = useMemo(() => {
    // Los cubos se leen DENTRO del useMemo: si se tomaran de una variable
    // creada en el cuerpo (`?? []`), el array sería nuevo en cada render y
    // el memo se recalcularía siempre.
    const cubos = serieQ.data?.cubos ?? [];
    const porCubo = new Map(
      cubos.map((c) => [new Date(c.cubo).getTime(), c.muestras])
    );

    const paso = modo === "hora" ? 3_600_000 : 86_400_000;
    const ahora = new Date();

    // Se alinea al cubo actual (hora o día en punto).
    const fin = new Date(ahora);
    if (modo === "hora") {
      fin.setMinutes(0, 0, 0);
    } else {
      fin.setHours(0, 0, 0, 0);
    }

    const inicio = new Date(fin.getTime() - (config.cubos - 1) * paso);

    const salida: Array<{ hora: string; valor: number; vacio: boolean }> = [];
    for (let i = 0; i < config.cubos; i++) {
      const t = inicio.getTime() + i * paso;
      const d = new Date(t);
      const valor = porCubo.get(t) ?? 0;

      const etiqueta =
        modo === "hora"
          ? `${String(d.getHours()).padStart(2, "0")}:00`
          : `${d.getDate()}/${d.getMonth() + 1}`;

      salida.push({ hora: etiqueta, valor, vacio: valor === 0 });
    }
    return salida;
  }, [serieQ.data, modo, config.cubos]);

  /** Horas con algún dato, para el resumen de la cabecera. */
  const cubosConDatos = puntos.filter((p) => p.valor > 0).length;

  if (serieQ.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad de mediciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (serieQ.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar la actividad</AlertTitle>
        <AlertDescription>{(serieQ.error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" aria-hidden />
          Actividad de mediciones
        </CardTitle>
        <CardDescription>
          {config.descripcion}
          {total > 0 ? (
            <>
              {" "}
              <span className="text-foreground">
                {total.toLocaleString("es-ES")} mediciones
              </span>{" "}
              en {cubosConDatos} {modo === "hora" ? "hora" : "día"}
              {cubosConDatos === 1 ? "" : "s"} con datos.
            </>
          ) : null}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={modo === "hora" ? "secondary" : "ghost"}
            onClick={() => setModo("hora")}
          >
            <Clock className="size-3.5" aria-hidden />
            Por hora
          </Button>
          <Button
            size="sm"
            variant={modo === "dia" ? "secondary" : "ghost"}
            onClick={() => setModo("dia")}
          >
            <CalendarDays className="size-3.5" aria-hidden />
            Por día
          </Button>
        </div>

        {total === 0 ? (
          <div className="flex h-[220px] flex-col items-center justify-center gap-1 text-center">
            <BarChart3 className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Sin mediciones en el periodo</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Cuando los equipos envíen datos, aquí se verá el volumen por
              intervalo.
            </p>
          </div>
        ) : (
          <GraficaActividad datos={puntos} />
        )}
      </CardContent>
    </Card>
  );
}

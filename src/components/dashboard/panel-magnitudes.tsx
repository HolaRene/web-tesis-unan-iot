"use client";

/**
 * Panel de magnitudes actuales del dashboard.
 *
 * Muestra una tarjeta por CADA canal (magnitud) con su valor actual, el
 * semáforo de frescura y un mini-gráfico de la última hora.
 *
 * ────────────────────────────────────────────────────────────────────
 * DE DÓNDE SALEN LOS DATOS
 * ────────────────────────────────────────────────────────────────────
 * De `/canales`, que ya devuelve en cada fila el último valor y su fecha
 * (`ultimo_valor_numerico`, `ultimo_registrado_en`). No hace falta una
 * consulta por canal ni recorrer la tabla de mediciones.
 *
 * Alternativa descartada: derivar las magnitudes de `ultimas_mediciones`.
 * Ese endpoint devuelve solo las N mediciones más recientes, así que un
 * canal sin actividad reciente desaparecería del panel justo cuando más
 * interesa verlo (para notar que dejó de enviar).
 *
 * ────────────────────────────────────────────────────────────────────
 * EL "AHORA" ES COMPARTIDO
 * ────────────────────────────────────────────────────────────────────
 * Todas las tarjetas reciben el MISMO instante de referencia. Si cada una
 * calculara su propio `Date.now()`, dos tarjetas con el mismo dato podrían
 * mostrar antigüedades distintas y dar sensación de desorden.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, ListFilter } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TarjetaMagnitud } from "@/components/dashboard/tarjeta-magnitud";
import { useAhora } from "@/hooks/useAhora";
import { api } from "@/servicios/api";
import { calcularFrescura } from "@/utilidades/magnitudes-visual";

/** Fila de `/canales` con lo que necesita el panel. */
interface CanalApi {
  id: string;
  sensor_id: string;
  codigo: string;
  nombre: string;
  unidad: string | null;
  tipo_dato: string | null;
  tipo_codigo: string | null;
  dispositivo_nombre: string | null;
  ultimo_valor_numerico: number | null;
  ultimo_valor_texto: string | null;
  ultimo_valor_booleano: boolean | null;
  ultimo_registrado_en: string | null;
  cantidad_mediciones: number | null;
  activo: boolean;
}

type Filtro = "todas" | "frescas" | "antiguas";

/** Cada cuánto se recalcula la antigüedad mostrada (30 s). */
const REFRESCO_ANTIGUEDAD_MS = 30_000;
/** Cada cuánto se vuelven a pedir los valores a la API (60 s). */
const REFRESCO_DATOS_MS = 60_000;

export function PanelMagnitudes() {
  const [filtro, setFiltro] = useState<Filtro>("todas");

  /*
   * Reloj lento y compartido para la antigüedad. Es `useAhora` y no
   * `Date.now()` en el render porque la regla de pureza de React prohíbe
   * leer el reloj durante el renderizado.
   */
  const ahora = useAhora(REFRESCO_ANTIGUEDAD_MS);

  const canalesQ = useQuery({
    queryKey: ["canales-dashboard"],
    queryFn: async () => {
      /*
       * `/canales` devuelve un ARRAY DIRECTO en `datos`, no un objeto con
       * una clave `canales`. Confundirlo haría que el panel saliera vacío
       * sin dar ningún error.
       */
      const r = await api.obtener<CanalApi[]>("/canales");
      return Array.isArray(r.datos) ? r.datos : [];
    },
    refetchInterval: REFRESCO_DATOS_MS,
  });

  const canales = useMemo(() => canalesQ.data ?? [], [canalesQ.data]);

  /** Reparto por frescura, para el resumen y el filtro. */
  const conteo = useMemo(() => {
    let frescas = 0;
    let antiguas = 0;
    for (const c of canales) {
      const f = calcularFrescura(c.ultimo_registrado_en, ahora);
      if (f === "fresco" || f === "retrasado") frescas++;
      else antiguas++;
    }
    return { frescas, antiguas };
  }, [canales, ahora]);

  const visibles = useMemo(() => {
    if (filtro === "todas") return canales;
    return canales.filter((c) => {
      const f = calcularFrescura(c.ultimo_registrado_en, ahora);
      const esFresca = f === "fresco" || f === "retrasado";
      return filtro === "frescas" ? esFresca : !esFresca;
    });
  }, [canales, filtro, ahora]);

  if (canalesQ.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de los sensores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (canalesQ.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudieron cargar los sensores</AlertTitle>
        <AlertDescription>
          {(canalesQ.error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (canales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de los sensores</CardTitle>
          <CardDescription>
            Todavía no hay magnitudes registradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Crea un sensor con sus magnitudes en{" "}
            <strong>Sensores</strong> y aquí aparecerá su valor actual.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="size-4 text-muted-foreground" aria-hidden />
          Estado de los sensores
        </CardTitle>
        <CardDescription>
          {canales.length} magnitud{canales.length === 1 ? "" : "es"} ·{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            {conteo.frescas} al día
          </span>
          {conteo.antiguas > 0 ? (
            <>
              {" · "}
              <span className="text-red-600 dark:text-red-400">
                {conteo.antiguas} sin datos recientes
              </span>
            </>
          ) : null}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtro: con muchos sensores, ver solo los problemáticos ayuda. */}
        <div className="flex flex-wrap items-center gap-2">
          <ListFilter className="size-4 text-muted-foreground" aria-hidden />
          <Button
            size="sm"
            variant={filtro === "todas" ? "secondary" : "ghost"}
            onClick={() => setFiltro("todas")}
          >
            Todas ({canales.length})
          </Button>
          <Button
            size="sm"
            variant={filtro === "frescas" ? "secondary" : "ghost"}
            onClick={() => setFiltro("frescas")}
          >
            Al día ({conteo.frescas})
          </Button>
          <Button
            size="sm"
            variant={filtro === "antiguas" ? "secondary" : "ghost"}
            onClick={() => setFiltro("antiguas")}
            disabled={conteo.antiguas === 0}
          >
            Sin datos ({conteo.antiguas})
          </Button>
        </div>

        {visibles.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Ninguna magnitud en este filtro.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibles.map((c) => (
              <TarjetaMagnitud
                key={c.id}
                ahora={ahora}
                magnitud={{
                  canalId: c.id,
                  sensorId: c.sensor_id,
                  nombre: c.nombre,
                  codigo: c.codigo,
                  magnitudCodigo: c.tipo_codigo,
                  unidad: c.unidad,
                  tipoDato: c.tipo_dato,
                  valor: c.ultimo_valor_numerico,
                  valorTexto: c.ultimo_valor_texto,
                  valorBooleano: c.ultimo_valor_booleano,
                  registradoEn: c.ultimo_registrado_en,
                  dispositivoNombre: c.dispositivo_nombre,
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

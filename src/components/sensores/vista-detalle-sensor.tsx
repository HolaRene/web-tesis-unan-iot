"use client";

/**
 * Detalle de un sensor (vista) para /sensores/[id].
 *
 * Muestra la información del sensor, sus magnitudes (con un mini-gráfico de
 * la última hora cada una) y, debajo, un gráfico por magnitud NUMÉRICA con
 * selector de periodo.
 *
 * Las magnitudes que no son numéricas (booleanas, texto, JSON) NO se grafican:
 * un eje Y con "on/off" o con texto no significa nada. Se listan indicando el
 * motivo, en lugar de dejar un gráfico vacío.
 */
import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/servicios/api";
import { obtenerCanalesDeSensor } from "@/servicios/sensores.servicio";
import { useEventosMediciones } from "@/hooks/use-eventos-mediciones";
import { useSeriesPorCanalDetalle } from "@/hooks/useSeriesPorCanalDetalle";
import { useAhora } from "@/hooks/useAhora";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import { PALETA_CANALES } from "@/configuracion/graficos";
import { GraficosSensor } from "@/components/graficos/graficos-sensor";
import { MiniGrafico } from "@/components/graficos/mini-grafico";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  formatearFecha,
  haceTiempo,
  sePuedeGraficar,
  motivoNoGraficable,
} from "@/utilidades";

interface FilaDetalle {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  unidad: string | null;
  rango_min: string | null;
  rango_max: string | null;
  precision: string | null;
  fabricante: string | null;
  modelo: string | null;
  area_id: string | null;
  area_nombre: string | null;
  area_tipo: string | null;
  tipo_id?: string | null;
  dispositivo_id: string | null;
  dispositivo_nombre: string | null;
  dispositivo_estado?: string | null;
  tipo_dato?: string | null;
  tipo_nombre: string | null;
  tipo_codigo?: string | null;
  tipo_unidad?: string | null;
  ultimo_valor_numerico: number | null;
  ultimo_valor_texto?: string | null;
  ultimo_registrado_en?: string | null;
  cantidad_mediciones?: number | null;
  alerta_activa?: boolean;
}

export function VistaDetalleSensor({ id }: { id: string }) {
  // Los eventos realtime mantienen el historial y los canales del sensor vivos.
  useEventosMediciones();

  const sensorQ = useQuery({
    queryKey: ["sensor", id],
    queryFn: async (): Promise<FilaDetalle> => {
      const r = await api.obtener<FilaDetalle>(`/sensors/${id}`);
      return r.datos;
    },
    refetchInterval: POLLING_RESPALDO_MS,
  });

  // Canales (magnitudes) del sensor: alimentan la comparación del historial.
  const canalesQ = useQuery({
    queryKey: ["canales-sensor", id],
    queryFn: () => obtenerCanalesDeSensor(id),
  });

  const sensor = sensorQ.data;
  const canalesSensor = canalesQ.data ?? [];

  return (
    <div className="space-y-5">
      {sensorQ.isLoading ? (
        <Skeleton className="h-10 w-72" />
      ) : sensorQ.error ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>{(sensorQ.error as Error).message}</AlertDescription>
        </Alert>
      ) : sensor ? (
        <>
          <div>
            <p className="text-xs text-muted-foreground">Sensor</p>
            <h1 className="text-2xl font-semibold">{sensor.nombre}</h1>
            <div className="flex items-center gap-2">
              <code>{sensor.codigo}</code>
              <Badge variant={sensor.activo ? "secondary" : "outline"}>
                {sensor.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard sensor={sensor} />
            <ResumenUltimo sensor={sensor} />
          </div>

          <TarjetaMagnitudes sensorId={sensor.id} />

          {/*
            Gráficos: un chart por cada magnitud NUMÉRICA del sensor, con
            selector de periodo (última hora, 24 h, 7 días…). Las magnitudes
            booleanas, de texto o JSON no se grafican: se listan aparte con el
            motivo, porque un eje Y con "on/off" no significa nada.
          */}
          <GraficosSensor sensorId={sensor.id} canales={canalesSensor} />
        </>
      ) : null}
    </div>
  );
}

function TarjetaMagnitudes({ sensorId }: { sensorId: string }) {
  const canalesQ = useQuery({
    queryKey: ["canales-sensor", sensorId],
    queryFn: () => obtenerCanalesDeSensor(sensorId),
  });

  const canales = useMemo(() => canalesQ.data ?? [], [canalesQ.data]);

  /*
   * Mini-gráfico por canal: la última hora, agrupada por minuto.
   * Solo se piden series de los canales NUMÉRICOS. Para un canal booleano o de
   * texto el backend devolvería una serie vacía (agrupa con `avg()`), así que
   * el mini-gráfico saldría en blanco sin explicar por qué.
   */
  const numericos = useMemo(
    () => canales.filter((c) => sePuedeGraficar(c.tipo_dato)),
    [canales]
  );

  /*
   * El "ahora" se recalcula cada minuto, que es la resolución de la serie.
   *
   * Cada tarjeta dibuja los últimos 30 minutos en lugar de la hora completa:
   * con 30 puntos en vez de 60 el trazo es más legible en un gráfico pequeño,
   * y se ve mejor la tendencia reciente, que es lo que se consulta de un
   * vistazo en el listado de magnitudes.
   */
  const ahora = useAhora(60_000);
  const desdeUltimaMediaHora = useMemo(
    () => new Date(ahora.getTime() - 30 * 60_000).toISOString(),
    [ahora]
  );

  const series = useSeriesPorCanalDetalle(
    sensorId,
    numericos,
    "minuto",
    desdeUltimaMediaHora,
    ahora.toISOString()
  );

  const seriesPorCanalId = useMemo(() => {
    const mapa = new Map<string, Array<{ instante: string; media: number | null }>>();
    for (const s of series) {
      mapa.set(
        s.canal.id,
        s.cubos.map((c) => ({ instante: c.cubo, media: c.media }))
      );
    }
    return mapa;
  }, [series]);

  const colorPorCanalId = useMemo(() => {
    const mapa = new Map<string, string>();
    numericos.forEach((canal, i) => {
      mapa.set(canal.id, PALETA_CANALES[i % PALETA_CANALES.length]);
    });
    return mapa;
  }, [numericos]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Magnitudes (canales)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cada canal representa una magnitud medida por este sensor y es lo que
          recibe las mediciones y las reglas de alerta.
        </p>
      </CardHeader>
      <CardContent>
        {canalesQ.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : canalesQ.error ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar magnitudes</AlertTitle>
            <AlertDescription>{(canalesQ.error as Error).message}</AlertDescription>
          </Alert>
        ) : canales.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este sensor no tiene magnitudes registradas.
          </p>
        ) : (
          <ul className="divide-y">
            {canales.map((canal) => {
              const graficable = sePuedeGraficar(canal.tipo_dato);
              const puntos = seriesPorCanalId.get(canal.id) ?? [];

              return (
                <li key={canal.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{canal.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        <code>{canal.codigo}</code>
                        {canal.unidad ? ` · ${canal.unidad}` : ""}
                        {canal.rango_min !== null && canal.rango_max !== null
                          ? ` · rango ${canal.rango_min}…${canal.rango_max}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={canal.activo ? "secondary" : "outline"}>
                        {canal.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <Link
                        href={`/canales/${canal.id}`}
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        Ver canal
                      </Link>
                    </div>
                  </div>

                  {/*
                    Gráfico PRIMERO: los últimos 30 minutos de la magnitud.

                    Va al inicio de la tarjeta, antes del valor y del
                    contador de mediciones, porque es lo que se consulta de un
                    vistazo: la forma de la serie dice más que un número suelto.

                    Solo para magnitudes numéricas; para el resto se explica
                    por qué no hay gráfico.
                  */}
                  {graficable ? (
                    <div className="mt-2">
                      <MiniGrafico
                        datos={puntos}
                        color={colorPorCanalId.get(canal.id)}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Últimos 30 minutos
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Sin gráfico: {motivoNoGraficable(canal.tipo_dato)}
                    </p>
                  )}

                  {/*
                    Último dato de la magnitud, con su fecha.

                    El backend ya devuelve `ultimo_valor_*`, `ultimo_registrado_en`
                    y `cantidad_mediciones` en cada canal; antes no se mostraban.
                    La fecha se da en dos formatos: absoluta (para saber cuándo
                    fue exactamente) y relativa ("hace 3 h", para saber si el
                    dato está fresco de un vistazo).
                  */}
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <UltimoDatoCanal canal={canal} />

                    {canal.ultimo_registrado_en ? (
                      <span
                        className="text-xs text-muted-foreground"
                        title={formatearFecha(canal.ultimo_registrado_en)}
                      >
                        · {formatearFecha(canal.ultimo_registrado_en)} (
                        {haceTiempo(canal.ultimo_registrado_en)})
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        · Sin mediciones todavía
                      </span>
                    )}

                    {typeof canal.cantidad_mediciones === "number" ? (
                      <span className="text-xs text-muted-foreground">
                        · {canal.cantidad_mediciones} mediciones
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function InfoCard({ sensor }: { sensor: FilaDetalle }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Información</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <dl className="grid grid-cols-2 gap-2">
          <dt className="text-muted-foreground">Variable</dt>
          <dd>{sensor.tipo_nombre ?? "—"}</dd>
          <dt className="text-muted-foreground">Dispositivo</dt>
          <dd>
            {sensor.dispositivo_nombre ?? "—"}{" "}
            <Badge variant="outline">{sensor.dispositivo_estado ?? ""}</Badge>
          </dd>
          <dt className="text-muted-foreground">Área</dt>
          <dd>{sensor.area_nombre ?? "—"}</dd>
          <dt className="text-muted-foreground">Fabricante</dt>
          <dd>{sensor.fabricante ?? "—"}</dd>
          <dt className="text-muted-foreground">Precisión</dt>
          <dd>{sensor.precision ?? "—"}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}

function ResumenUltimo({ sensor }: { sensor: FilaDetalle }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Último valor</CardTitle>
      </CardHeader>
      <CardContent>
        {sensor.ultimo_valor_numerico !== null ? (
          <p className="text-3xl font-semibold">
            {sensor.ultimo_valor_numerico} {sensor.unidad}
          </p>
        ) : sensor.ultimo_valor_texto ? (
          <p className="text-2xl">{sensor.ultimo_valor_texto}</p>
        ) : (
          <p className="text-muted-foreground">—</p>
        )}
        <p className="text-muted-foreground">
          {sensor.ultimo_registrado_en
            ? formatearFecha(sensor.ultimo_registrado_en)
            : "Sin registros"}
        </p>
        <Badge variant={sensor.alerta_activa ? "destructive" : "secondary"} className="mt-2">
          {sensor.alerta_activa ? "Alerta activa" : "Sin alerta"}
        </Badge>
      </CardContent>
    </Card>
  );
}

/**
 * Último valor registrado de un canal.
 *
 * Un canal puede guardar su valor en tres columnas distintas según su tipo:
 *
 *   - `ultimo_valor_numerico` → magnitudes continuas (temperatura, voltaje…)
 *   - `ultimo_valor_texto`    → estados de texto ("ok", "error"…)
 *   - `ultimo_valor_booleano` → estados on/off
 *
 * Hay que mirar las tres: una magnitud booleana con valor `false` es un dato
 * válido, y comprobarlo con `if (valor)` lo mostraría como "sin datos".
 */
function UltimoDatoCanal({
  canal,
}: {
  canal: {
    unidad?: string | null;
    tipo_dato?: string | null;
    ultimo_valor_numerico?: number | null;
    ultimo_valor_texto?: string | null;
    ultimo_valor_booleano?: boolean | null;
  };
}) {
  const { ultimo_valor_numerico: numero, ultimo_valor_texto: texto } = canal;
  const booleano = canal.ultimo_valor_booleano;

  // Numérico
  if (numero !== null && numero !== undefined) {
    return (
      <span className="text-sm font-medium">
        {numero}
        {canal.unidad ? ` ${canal.unidad}` : ""}
      </span>
    );
  }

  // Booleano: `false` es un valor, no ausencia de dato.
  if (booleano !== null && booleano !== undefined) {
    return (
      <span className="text-sm font-medium">
        {booleano ? "Activo / On" : "Inactivo / Off"}
      </span>
    );
  }

  // Texto
  if (texto) {
    return <span className="text-sm font-medium">{texto}</span>;
  }

  return (
    <span className="text-sm text-muted-foreground">Sin valor registrado</span>
  );
}

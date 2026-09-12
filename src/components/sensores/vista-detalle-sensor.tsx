"use client";

/**
 * Detalle de un sensor (vista) para /sensores/[id].
 * Muestra: información, dispositivo, área, tipo de variable, umbral y un
 * historial bien según el tipo de dato (numérico => LineChart; booleano =>
 * lista de estados; texto => timeline textual; json => pre).
 */
import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/servicios/api";
import { obtenerCanalesDeSensor } from "@/servicios/sensores.servicio";
import { useEventosMediciones } from "@/hooks/use-eventos-mediciones";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatearFecha } from "@/utilidades";

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

  const histQ = useQuery({
    queryKey: ["sensor-hist", id],
    queryFn: async () => {
      const r = await api.obtener<{ mediciones: Array<Record<string, unknown>> }>(
        `/sensors/${id}/mediciones?limite=200`
      );
      return r.datos.mediciones;
    },
    refetchInterval: POLLING_RESPALDO_MS,
  });

  const sensor = sensorQ.data;
  const tipoDato = (sensor?.tipo_dato ?? "") as string;

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

          {tipoDato.startsWith("numer") && (
            <GraficaNumerica
              mediciones={histQ.data ?? []}
              unidad={sensor.unidad ?? ""}
              min={sensor.rango_min ? Number(sensor.rango_min) : undefined}
              max={sensor.rango_max ? Number(sensor.rango_max) : undefined}
            />
          )}
          {!tipoDato.startsWith("numer") && (
            <ListaHistorial filas={histQ.data ?? []} tipoDato={tipoDato} unidad={sensor.unidad ?? ""} />
          )}
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
        ) : (canalesQ.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este sensor no tiene magnitudes registradas.
          </p>
        ) : (
          <ul className="divide-y">
            {(canalesQ.data ?? []).map((canal) => (
              <li
                key={canal.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
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
              </li>
            ))}
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

function GraficaNumerica({
  mediciones,
  unidad,
  min,
  max,
}: {
  mediciones: Array<Record<string, unknown>>;
  unidad: string;
  min?: number;
  max?: number;
}) {
  const datos = useMemo(
    () =>
      (mediciones as unknown as Array<{ valor_numerico: number | null; registrado_en: string }>)
        .filter((m) => m.valor_numerico !== null)
        .map((m) => ({
          hora: formatearFecha(m.registrado_en),
          valor: m.valor_numerico as number,
        })),
    [mediciones]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historial numérico ({unidad})</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {datos.length === 0 ? (
          <p className="text-muted-foreground">Sin mediciones numéricas.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hora" className="text-xs" />
              <YAxis className="text-xs" domain={[min ?? "auto", max ?? "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="valor" stroke="#0891b2" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ListaHistorial({
  filas,
  tipoDato,
  unidad,
}: {
  filas: Array<Record<string, unknown>>;
  tipoDato: string;
  unidad: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Historial {tipoDato.startsWith("bool") ? "booleano" : "texto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(filas as Array<{ valor_texto?: string | null; valor_booleano?: boolean | null; registrado_en: string }>).length ===
        0 ? (
          <p className="text-muted-foreground">Sin registros.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {(filas as Array<{ valor_texto?: string | null; valor_booleano?: boolean | null; registrado_en: string }>).map(
              (m, idx) => (
                <li key={idx} className="flex gap-3 border-b py-1 last:border-0">
                  <span className="text-muted-foreground">
                    {formatearFecha(m.registrado_en)}
                  </span>{" "}
                  <span className="font-medium">
                    {((v) =>
                      typeof v === "boolean"
                        ? v
                          ? "Activo / On"
                          : "Inactivo / Off"
                        : v
                        ? String(v)
                        : "—")(m.valor_texto ?? m.valor_booleano)}
                  </span>
                  {unidad}
                </li>
              )
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

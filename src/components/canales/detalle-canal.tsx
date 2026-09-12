"use client";

/** Detalle del canal: información + historial (numérico a línea) + reglas. */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { obtenerCanalPorId, obtenerMedicionesCanal } from "@/servicios/canales.servicio";
import { obtenerReglas } from "@/servicios/reglas-alerta.servicio";
import { useEventosMediciones } from "@/hooks/use-eventos-mediciones";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import FormularioRegla from "@/components/reglas-alerta/formulario-regla";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatearHora } from "@/utilidades";

export function DetalleCanal({ id }: { id: string }) {
  // El WS añade los puntos nuevos a la serie y parchea el último valor.
  useEventosMediciones();

  const canalQ = useQuery({
    queryKey: ["canal", id],
    queryFn: () => obtenerCanalPorId(id),
    refetchInterval: POLLING_RESPALDO_MS,
  });
  const histQ = useQuery({
    queryKey: ["canal-hist", id],
    queryFn: () => obtenerMedicionesCanal(id, { limite: 200 }),
    refetchInterval: POLLING_RESPALDO_MS,
  });
  const reglasQ = useQuery({
    queryKey: ["reglas-canal", id],
    queryFn: () => obtenerReglas({ canal_id: id }),
  });

  const canal = canalQ.data;
  const tipoDato = (canal?.tipo_dato ?? "").toLowerCase();
  const numerico = tipoDato.startsWith("numer");

  const serie = useMemo(() => {
    const rows = histQ.data?.mediciones ?? [];
    return rows
      .filter((m: Record<string, unknown>) => m.valor_numerico !== null)
      .map((m: Record<string, unknown>) => ({
        hora: formatearHora(String(m.registrado_en)),
        valor: Number(m.valor_numerico),
      }));
  }, [histQ.data]);

  return (
    <div className="space-y-5">
      {canalQ.isLoading ? (
        <Skeleton className="h-10 w-72" />
      ) : canalQ.error ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar canal</AlertTitle>
          <AlertDescription>{(canalQ.error as Error).message}</AlertDescription>
        </Alert>
      ) : canal ? (
        <>
          <div>
            <p className="text-xs text-muted-foreground">Canal</p>
            <h1 className="text-2xl font-semibold">{canal.nombre}</h1>
            <code>{canal.codigo}</code>
            <Badge className="ml-2" variant={canal.activo ? "secondary" : "outline"}>
              {canal.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <Card>
            <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <p><span className="text-muted-foreground">Variable:</span> {canal.tipo_nombre ?? "—"} · {canal.tipo_dato}</p>
              <p><span className="text-muted-foreground">Dispositivo:</span> {canal.dispositivo_identificador ?? canal.dispositivo_nombre ?? "—"}</p>
              <p><span className="text-muted-foreground">Área:</span> {canal.area_nombre ?? "—"}</p>
              <p><span className="text-muted-foreground">Rango:</span> {canal.rango_min ?? "—"} a {canal.rango_max ?? "—"} {canal.unidad}</p>
            </CardContent>
          </Card>

          {numerico ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Historial ({canal.unidad})</CardTitle></CardHeader>
              <CardContent className="h-64">
                {serie.length === 0 ? <p className="text-muted-foreground">Sin mediciones.</p> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={serie}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hora" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line type="monotone" dataKey="valor" stroke="#0891b2" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Último valor</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {canal.ultimo_valor_numerico ?? canal.ultimo_valor_texto ?? "—"}
                  {canal.unidad ? ` ${canal.unidad}` : ""}
                </p>
              </CardContent>
            </Card>
          )}

          <ReglasCanal reglas={reglasQ.data ?? []} cargando={reglasQ.isLoading} />

          <FormularioRegla canal={canal} />
        </>
      ) : null}
    </div>
  );
}

/** Lista breve de reglas del canal. */
function ReglasCanal({ reglas, cargando }: { reglas: Array<{ id: string; nombre: string; operador: string; severidad: string; activa: boolean }>; cargando: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reglas de alerta</CardTitle>
      </CardHeader>
      <CardContent>
        {cargando ? <Skeleton className="h-8 w-full" /> : reglas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin reglas para este canal.</p>
        ) : (
          <ul className="space-y-2">
            {reglas.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm">
                <span>
                  <strong>{r.nombre}</strong> · {r.operador}
                </span>
                <Badge variant={r.activa ? "secondary" : "outline"}>
                  {r.severidad} {r.activa ? "" : "· inactiva"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

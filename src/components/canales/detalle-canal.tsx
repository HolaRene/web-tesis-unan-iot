"use client";

/** Detalle del canal: información + historial agregado + reglas. */
import { useQuery } from "@tanstack/react-query";
import { obtenerCanalPorId } from "@/servicios/canales.servicio";
import { obtenerReglas } from "@/servicios/reglas-alerta.servicio";
import { useEventosMediciones } from "@/hooks/use-eventos-mediciones";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import { PanelHistorial } from "@/components/graficos/panel-historial";
import FormularioRegla from "@/components/reglas-alerta/formulario-regla";
import { ListaReglasCanal } from "@/components/reglas-alerta/lista-reglas-canal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DetalleCanal({ id }: { id: string }) {
  // El WS añade los puntos nuevos a la serie y parchea el último valor.
  useEventosMediciones();

  const canalQ = useQuery({
    queryKey: ["canal", id],
    queryFn: () => obtenerCanalPorId(id),
    refetchInterval: POLLING_RESPALDO_MS,
  });
  const reglasQ = useQuery({
    queryKey: ["reglas-canal", id],
    queryFn: () => obtenerReglas({ canal_id: id }),
  });

  const canal = canalQ.data;
  const tipoDato = (canal?.tipo_dato ?? "").toLowerCase();
  const numerico = tipoDato.startsWith("numer");

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
            /*
              Historial agregado por intervalo (hora/día/semana/mes) con
              media y banda mín–máx. La agregación la hace el backend en SQL,
              así que la vista aguanta meses de datos.
            */
            <PanelHistorial
              sensorId={canal.sensor_id ?? ""}
              canalId={canal.id}
              unidad={canal.unidad ?? ""}
            />
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

          <ListaReglasCanal
            reglas={reglasQ.data ?? []}
            cargando={reglasQ.isLoading}
            unidad={canal.unidad}
            tipoDato={canal.tipo_dato}
          />

          <FormularioRegla canal={canal} />
        </>
      ) : null}
    </div>
  );
}

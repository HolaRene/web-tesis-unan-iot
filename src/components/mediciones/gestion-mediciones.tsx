"use client";

/**
 * Gestión de Mediciones (listado con filtros, registro y eliminación).
 * Usa componentes shadcn/ui para soportar correctamente el tema claro/oscuro.
 * URL backend: GET /measurements, POST /measurements, DELETE /measurements/:id
 */
import { useState } from "react";
import {
  useListarMediciones,
  useMutacionesMediciones,
} from "@/hooks/useMediciones";
import { useQuery } from "@tanstack/react-query";
import { useSesion } from "@/hooks/use-sesion";
import { listarSensores } from "@/servicios/sensores.servicio";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelesGraficosMediciones } from "@/components/mediciones/paneles-graficos-mediciones";
import { formatearFecha } from "@/utilidades";

const selectClases =
  "h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground";

export default function GestionMediciones() {
  const { usuario } = useSesion();
  const puedeEscribir = usuario?.rol === "usuario" || usuario?.rol === "admin";

  const sensoresQuery = useQuery({
    queryKey: ["sensores"],
    queryFn: listarSensores,
  });
  const sensores = sensoresQuery.data ?? [];
  const sensorPorId = new Map(sensores.map((s) => [s.id, s]));
  const labelSensor = (id: string) => {
    const s = sensorPorId.get(id);
    if (!s) return id;
    return `${s.codigo} · ${s.nombre}`;
  };

  const [filtros, setFiltros] = useState({
    sensor_id: "",
    limite: 50,
  });
  const [nueva, setNueva] = useState({
    sensor_id: "",
    valor_numerico: 0,
    calidad: "good",
  });

  const { data: mediciones, isLoading, error } = useListarMediciones({
    sensor_id: filtros.sensor_id || undefined,
    limite: filtros.limite,
  });
  const { crear, eliminar } = useMutacionesMediciones();

  function registro(event: React.FormEvent) {
    event.preventDefault();
    crear.mutate({
      sensor_id: nueva.sensor_id.trim(),
      valor_numerico: nueva.valor_numerico,
      valor_booleano: null,
      valor_texto: null,
      valor_json: null,
      calidad: nueva.calidad,
      metadatos: null,
    });
  }

  function eliminarRegistro(id: number) {
    if (window.confirm("¿Eliminar esta medición?")) eliminar.mutate(id);
  }

  function valorVisible(valor: { valor_numerico: number | null } | undefined) {
    if (valor && valor.valor_numerico !== null) return String(valor.valor_numerico);
    return "—";
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Mediciones</CardTitle>
            <p className="text-sm text-muted-foreground">
              {mediciones ? `${mediciones.length} registros` : "Cargando…"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="f-sensor" className="text-xs text-muted-foreground">
                Filtrar por sensor
              </Label>
              <Input
                id="f-sensor"
                className="h-9 w-56"
                placeholder="ID del sensor"
                value={filtros.sensor_id}
                onChange={(e) =>
                  setFiltros({ ...filtros, sensor_id: e.target.value })
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error al cargar mediciones</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : mediciones?.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay mediciones registradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sensor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Registrado</TableHead>
                  {puedeEscribir && <TableHead className="w-20 text-right"> </TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {mediciones?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {labelSensor(m.sensor_id)}
                    </TableCell>
                    <TableCell>{valorVisible(m)}</TableCell>
                    <TableCell>
                      <QualityBadge calidad={m.calidad} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatearFecha(m.registrado_en)}
                    </TableCell>
                    {puedeEscribir && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => eliminarRegistro(m.id)}
                          disabled={eliminar.isPending}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {!isLoading && !error && (
          <CardFooter className="text-sm text-muted-foreground">
            Total: {mediciones?.length || 0} mediciones.
          </CardFooter>
        )}
      </Card>

      {!isLoading && !error && (
        <PanelesGraficosMediciones mediciones={mediciones ?? []} />
      )}

      {/* Alta rápida */}
      {puedeEscribir && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrar medición</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={registro} className="flex flex-wrap items-end gap-3" noValidate>
              <div className="grid gap-1.5">
                <Label htmlFor="med-sensor">Sensor</Label>
                <select
                  id="med-sensor"
                  required
                  className="h-9 w-64 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  value={nueva.sensor_id}
                  onChange={(e) => setNueva({ ...nueva, sensor_id: e.target.value })}
                >
                  <option value="">Selecciona un sensor</option>
                  {sensores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo} · {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="med-valor">Valor numérico</Label>
                <Input
                  id="med-valor"
                  type="number"
                  step="any"
                  required
                  className="w-32"
                  value={nueva.valor_numerico}
                  onChange={(e) =>
                    setNueva({ ...nueva, valor_numerico: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="med-calidad">Calidad</Label>
                <select
                  id="med-calidad"
                  className={selectClases}
                  value={nueva.calidad}
                  onChange={(e) => setNueva({ ...nueva, calidad: e.target.value })}
                >
                  <option value="good">good</option>
                  <option value="uncertain">uncertain</option>
                  <option value="bad">bad</option>
                </select>
              </div>
              <Button type="submit" disabled={crear.isPending}>
                {crear.isPending ? "Guardando…" : "Registrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QualityBadge({ calidad }: { calidad: string }) {
  if (calidad === "good")
    return <Badge variant="secondary">good</Badge>;
  if (calidad === "uncertain")
    return <Badge variant="outline">uncertain</Badge>;
  return <Badge variant="destructive">bad</Badge>;
}

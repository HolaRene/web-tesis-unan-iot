"use client";

/**
 * Historial global de Mediciones (auditoría/historial).
 * Las mediciones provienen del backend (ingesta IoT); aquí solo se consulta.
 * Permite filtrar por sensor (id) y límite. No permite alta manual.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/servicios/api";
import { listarSensores } from "@/servicios/sensores.servicio";
import { useEventosMediciones } from "@/hooks/use-eventos-mediciones";
import type { Medicion } from "@/tipos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatearFecha } from "@/utilidades";

export function HistorialMediciones() {
  const [limite, setLimite] = useState(100);

  // Las mediciones nuevas entran solas por WS (clave ["mediciones", ...]).
  useEventosMediciones();

  const sensoresQuery = useQuery({
    queryKey: ["sensores-labels"],
    queryFn: listarSensores,
  });
  const porId = new Map(
    (sensoresQuery.data ?? []).map((s) => [s.id, s])
  );
  const labelSensor = (id: string) => {
    const s = porId.get(id);
    return s ? `${s.codigo} · ${s.nombre}` : id;
  };

  const query = useQuery({
    queryKey: ["mediciones", "historial", limite],
    queryFn: async (): Promise<Medicion[]> => {
      const r = await api.obtener<Medicion[]>(
        `/measurements?limite=${limite}`
      );
      return r.datos;
    },
  });
  const filas = query.data ?? [];

  return (
    <Card>
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Historial de mediciones</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registros llegados por integración (ingesta IoT).
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="limite">Últimas</label>
          <select
            id="limite"
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
            className="h-9 rounded-xl border bg-background px-3 text-sm"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : query.error ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar mediciones</AlertTitle>
            <AlertDescription>{(query.error as Error).message}</AlertDescription>
          </Alert>
        ) : filas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin mediciones registradas (llegan del backend por ingesta IoT).
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Sensor (ID)</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Calidad</TableHead>
                <TableHead>Registrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.id}</TableCell>
                  <TableCell className="font-medium">
                    {labelSensor(m.sensor_id)}
                  </TableCell>
                  <TableCell>
                    {m.valor_numerico ?? m.valor_texto ?? "—"}
                  </TableCell>
                  <TableCell>{m.calidad}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatearFecha(m.registrado_en)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

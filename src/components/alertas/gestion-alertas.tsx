"use client";

/**
 * Gestión de Alertas (listado, reconocer, resolver y eliminar).
 * Usa componentes shadcn/ui para soportar correctamente el tema claro/oscuro.
 * URLs del backend: GET /alerts, PATCH /alerts/:id, DELETE /alerts/:id
 */
import { useState } from "react";
import {
  useListarAlertas,
  useMutacionesAlertas,
} from "@/hooks/useAlertas";
import { useSesion } from "@/hooks/use-sesion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  textoEstado,
  varianteEstadoAlerta,
  formatearFecha,
  varianteSeveridad,
} from "@/utilidades";

const selectClases =
  "h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground";

export default function GestionAlertas() {
  const { usuario } = useSesion();
  const puedeEscribir = usuario?.rol === "usuario" || usuario?.rol === "admin";

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroSeveridad, setFiltroSeveridad] = useState("todas");

  const { data: alertas, isLoading, error } = useListarAlertas();
  const { reconocer, resolver, eliminar } = useMutacionesAlertas();

  const filtradas = (alertas ?? []).filter((a) => {
    if (filtroEstado !== "todos" && a.estado !== filtroEstado) return false;
    if (filtroSeveridad !== "todas" && a.severidad !== filtroSeveridad) {
      return false;
    }
    return true;
  });

  function confirmarYReconocer(id: string) {
    if (window.confirm("¿Marcar esta alerta como reconocida?")) {
      reconocer.mutate(id);
    }
  }
  function confirmarYResolver(id: string) {
    if (window.confirm("¿Marcar esta alerta como resuelta?")) {
      resolver.mutate(id);
    }
  }
  function confirmarYEliminar(id: string) {
    if (window.confirm("¿Eliminar esta alerta?")) eliminar.mutate(id);
  }

  return (
    <div className="space-y-4">
      {/* Filtros y cabecera */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Alertas</CardTitle>
            <p className="text-sm text-muted-foreground">
              {alertas ? `${alertas.length} alerta${alertas.length === 1 ? "" : "s"}` : "…"}
              {!!filtroEstado || !!filtroSeveridad
                ? ` · vista filtrada: ${filtradas.length}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filtrar por estado"
              className={selectClases}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="acknowledged">Reconocidas</option>
              <option value="resolved">Resueltas</option>
            </select>
            <select
              aria-label="Filtrar por severidad"
              className={selectClases}
              value={filtroSeveridad}
              onChange={(e) => setFiltroSeveridad(e.target.value)}
            >
              <option value="todas">Todas las severidades</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error al cargar alertas</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : filtradas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay alertas que coincidan con los filtros.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sensor</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Iniciada</TableHead>
                  {puedeEscribir && <TableHead className="w-40 text-right"> </TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.sensor_id ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-1 max-w-md">
                        {a.mensaje ?? "Alerta"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={varianteSeveridad(a.severidad)}>
                        {textoEstado(a.severidad)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={varianteEstadoAlerta(a.estado)}>
                        {textoEstado(a.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatearFecha(a.iniciada_en)}
                    </TableCell>
                    {puedeEscribir && (
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {a.estado === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmarYReconocer(a.id)}
                              disabled={reconocer.isPending}
                            >
                              Reconocer
                            </Button>
                          )}
                          {(a.estado === "active" || a.estado === "acknowledged") && (
                            <Button
                              size="sm"
                              onClick={() => confirmarYResolver(a.id)}
                              disabled={resolver.isPending}
                            >
                              Resolver
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => confirmarYEliminar(a.id)}
                            disabled={eliminar.isPending}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {!isLoading && !error && alertas && (
          <CardFooter className="flex flex-wrap gap-6">
            <span className="text-sm text-muted-foreground">
              Activas:{" "}
              <strong className="text-foreground">
                {alertas.filter((a) => a.estado === "active").length}
              </strong>
            </span>
            <span className="text-sm text-muted-foreground">
              Reconocidas:{" "}
              <strong className="text-foreground">
                {alertas.filter((a) => a.estado === "acknowledged").length}
              </strong>
            </span>
            <span className="text-sm text-muted-foreground">
              Resueltas:{" "}
              <strong className="text-foreground">
                {alertas.filter((a) => a.estado === "resolved").length}
              </strong>
            </span>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

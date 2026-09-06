"use client";

/**
 * Detalle de un Dispositivo: encabezado + Tabs [Sensores][Actuadores].
 * - Sensores: lista los sensores conectados a ese dispositivo.
 * - Actuadores: lista y permite crear actuadores de ese dispositivo.
 * Autenticado por JWT; crear/editar = usuario/admin.
 */
import { useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RadioTower } from "lucide-react";

import { obtenerDispositivo } from "@/servicios/dispositivos.servicio";
import { listarSensores } from "@/servicios/sensores.servicio";
import { listarActuadores, crearActuador } from "@/servicios/actuadores.servicio";
import { useSesion } from "@/hooks/use-sesion";
import type { Actuador } from "@/tipos";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DetalleDispositivo({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { usuario } = useSesion();
  const puedeEscribir = usuario?.rol === "usuario" || usuario?.rol === "admin";

  const dispQuery = useQuery({
    queryKey: ["dispositivo", id],
    queryFn: () => obtenerDispositivo(id),
    enabled: !!id,
  });

  const sensoresQ = useQuery({ queryKey: ["sensores"], queryFn: listarSensores });
  const actuadoresQ = useQuery({
    queryKey: ["actuadores"],
    queryFn: listarActuadores,
  });

  const sensoresDel = useMemo(
    () => (sensoresQ.data ?? []).filter((s) => s.dispositivo_id === id),
    [sensoresQ.data, id]
  );
  const actuadoresDel = useMemo(
    () => (actuadoresQ.data ?? []).filter((a) => a.dispositivo_id === id),
    [actuadoresQ.data, id]
  );

  const dispositivo = dispQuery.data;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dispositivos"
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Volver a dispositivos
          </Link>
          {dispositivo ? (
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
              <RadioTower className="size-5" aria-hidden />
              {dispositivo.nombre}
            </h1>
          ) : (
            <h1 className="text-2xl font-semibold">Dispositivo</h1>
          )}
          {dispositivo && (
            <p className="text-sm text-muted-foreground">
              {dispositivo.tipo} · {dispositivo.protocolo ?? "sin protocolo"} ·{" "}
              {dispositivo.direccion_ip ?? "sin IP"}
            </p>
          )}
        </div>
      </div>

      {dispQuery.isLoading ? (
        <Skeleton className="h-8 w-64" />
      ) : dispQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar dispositivo</AlertTitle>
          <AlertDescription>
            {(dispQuery.error as Error).message}
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="sensores" className="w-full">
          <TabsList className="inline-flex h-9 items-center gap-1 rounded-full p-1">
            <TabsTrigger value="sensores">Sensores ({sensoresDel.length})</TabsTrigger>
            <TabsTrigger value="actuadores">Actuadores ({actuadoresDel.length})</TabsTrigger>
          </TabsList>

          {/* ---------- Sensores del dispositivo ---------- */}
          <TabsContent value="sensores" className="pt-4">
            <Card>
              <CardContent className="pt-6">
                {sensoresQ.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full" />
                    ))}
                  </div>
                ) : sensoresDel.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Este dispositivo no tiene sensores conectados.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sensoresDel.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.nombre}</TableCell>
                          <TableCell>{s.codigo}</TableCell>
                          <TableCell>{s.unidad ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant={s.activo ? "secondary" : "outline"}>
                              {s.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------- Actuadores del dispositivo ---------- */}
          <TabsContent value="actuadores" className="pt-4">
            <ResumenActuadores
              dispositivoId={id}
              actuadores={actuadoresDel}
              cargando={actuadoresQ.isLoading}
              error={actuadoresQ.error as Error | null}
              puedeEscribir={puedeEscribir}
              onCreado={() =>
                queryClient.invalidateQueries({ queryKey: ["actuadores"] })
              }
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ResumenActuadores({
  dispositivoId,
  actuadores,
  cargando,
  error,
  puedeEscribir,
  onCreado,
}: {
  dispositivoId: string;
  actuadores: Actuador[];
  cargando: boolean;
  error: Error | null;
  puedeEscribir: boolean;
  onCreado: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg">Actuadores del dispositivo</CardTitle>
        {puedeEscribir && (
          <Button
            size="sm"
            onClick={() => {
              // manejar en un modal o simple prompt rápido. Mantenemos básico:
              const nombre = window.prompt("Nombre del actuador", "Nuevo actuador");
              const codigo = window.prompt("Código (ej: RELE-01)");
              const tipo = window.prompt("Tipo (ej: digital_out)", "digital_out");
              if (nombre && codigo && tipo) {
                void crearActuadorLocal({
                  dispositivoId,
                  nombre,
                  codigo,
                  tipo,
                  onCreado,
                });
              }
            }}
          >
            <Plus className="size-4" aria-hidden /> Nuevo actuador
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {cargando ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : actuadores.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Este dispositivo no tiene actuadores.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Activo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actuadores.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nombre}</TableCell>
                  <TableCell>{a.codigo}</TableCell>
                  <TableCell>{a.tipo}</TableCell>
                  <TableCell>{a.estado_actual ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.activo ? "secondary" : "outline"}>
                      {a.activo ? "Activo" : "Inactivo"}
                    </Badge>
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

async function crearActuadorLocal({
  dispositivoId,
  nombre,
  codigo,
  tipo,
  onCreado,
}: {
  dispositivoId: string;
  nombre: string;
  codigo: string;
  tipo: string;
  onCreado: () => void;
}) {
  try {
    await crearActuador({
      dispositivo_id: dispositivoId,
      nombre,
      codigo,
      tipo,
      activo: true,
    });
    onCreado();
  } catch (e) {
    window.alert(e instanceof Error ? e.message : "No se pudo crear el actuador");
  }
}

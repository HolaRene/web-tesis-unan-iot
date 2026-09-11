"use client";

/**
 * Detalle de un Dispositivo: encabezado + Tabs [Sensores][Actuadores].
 * - Sensores: lista los sensores conectados a ese dispositivo.
 * - Actuadores: lista y permite crear actuadores de ese dispositivo.
 * Autenticado por JWT; crear/editar = usuario/admin.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RadioTower, Loader2 } from "lucide-react";

import { obtenerDispositivo } from "@/servicios/dispositivos.servicio";
import { listarSensores } from "@/servicios/sensores.servicio";
import { listarActuadores, crearActuador } from "@/servicios/actuadores.servicio";
import { useSesion } from "@/hooks/use-sesion";
import { useEventosDispositivos } from "@/hooks/use-eventos-dispositivos";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import type { Actuador, Dispositivo } from "@/tipos";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatearFecha,
  haceTiempo,
  textoEstado,
  varianteEstadoDispositivo,
} from "@/utilidades";

export function DetalleDispositivo({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { usuario } = useSesion();
  const puedeEscribir = usuario?.rol === "usuario" || usuario?.rol === "admin";

  // Actualizaciones en vivo (estado, última conexión, IP, metadatos…).
  useEventosDispositivos();

  const dispQuery = useQuery({
    queryKey: ["dispositivo", id],
    queryFn: () => obtenerDispositivo(id),
    enabled: !!id,
    // Polling de respaldo: el WS ya mantiene esto al día; esto es por si cae.
    refetchInterval: POLLING_RESPALDO_MS,
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
              Identificador: <strong>{dispositivo.identificador ?? "—"}</strong> ·{" "}
              {dispositivo.tipo} · {dispositivo.protocolo ?? "sin protocolo"} ·{" "}
              {dispositivo.direccion_ip ?? "sin IP"}
            </p>
          )}
        </div>
      </div>

      {dispositivo && <TarjetaEstado dispositivo={dispositivo} />}

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

/**
 * Estado real del dispositivo: estado reportado, última conexión ("hace X") y
 * metadatos libres (firmware, RSSI, uptime…) que envían las integraciones.
 */
function TarjetaEstado({ dispositivo }: { dispositivo: Dispositivo }) {
  const metadatos = dispositivo.metadatos ?? {};
  const entradas = Object.entries(metadatos);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Estado y telemetría</CardTitle>
        <p className="text-sm text-muted-foreground">
          Información reportada por el equipo (heartbeat) o deducida de la
          ingesta de mediciones.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="grid gap-1">
            <dt className="text-xs text-muted-foreground">Estado</dt>
            <dd>
              <Badge variant={varianteEstadoDispositivo(dispositivo.estado)}>
                {textoEstado(dispositivo.estado)}
              </Badge>
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-xs text-muted-foreground">Última conexión</dt>
            <dd className="text-sm" title={formatearFecha(dispositivo.ultima_conexion)}>
              {dispositivo.ultima_conexion
                ? haceTiempo(dispositivo.ultima_conexion)
                : "Sin contacto"}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-xs text-muted-foreground">Dirección IP</dt>
            <dd className="text-sm">{dispositivo.direccion_ip ?? "—"}</dd>
          </div>
        </dl>

        {entradas.length > 0 && (
          <div className="grid gap-2">
            <p className="text-xs text-muted-foreground">Metadatos reportados</p>
            <div className="flex flex-wrap gap-2">
              {entradas.map(([clave, valor]) => (
                <Badge key={clave} variant="outline" className="font-normal">
                  {clave}: {String(valor)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState({
    nombre: "",
    codigo: "",
    tipo: "digital_out",
  });
  const [errorLocal, setErrorLocal] = useState<Error | null>(null);

  async function guardarActuador() {
    if (!formulario.nombre.trim() || !formulario.codigo.trim()) return;
    setGuardando(true);
    setErrorLocal(null);
    try {
      await crearActuador({
        dispositivo_id: dispositivoId,
        nombre: formulario.nombre.trim(),
        codigo: formulario.codigo.trim(),
        tipo: formulario.tipo.trim(),
        activo: true,
      });
      onCreado();
      setModalAbierto(false);
      setFormulario({ nombre: "", codigo: "", tipo: "digital_out" });
    } catch (e) {
      setErrorLocal(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg">Actuadores del dispositivo</CardTitle>
        {puedeEscribir && (
          <Button size="sm" onClick={() => setModalAbierto(true)}>
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

      {/* Diálogo para crear actuador */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo actuador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="act-nombre">Nombre</Label>
              <Input
                id="act-nombre"
                placeholder="Ej. Relé ventilación"
                value={formulario.nombre}
                onChange={(e) =>
                  setFormulario((p) => ({ ...p, nombre: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="act-codigo">Código</Label>
              <Input
                id="act-codigo"
                placeholder="Ej. RELE-Q2"
                value={formulario.codigo}
                onChange={(e) =>
                  setFormulario((p) => ({ ...p, codigo: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="act-tipo">Tipo</Label>
              <Input
                id="act-tipo"
                placeholder="digital_out, relay, buzzer…"
                value={formulario.tipo}
                onChange={(e) =>
                  setFormulario((p) => ({ ...p, tipo: e.target.value }))
                }
              />
            </div>
            {errorLocal && (
              <p className="text-sm text-destructive">{errorLocal.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={guardarActuador} disabled={guardando}>
              {guardando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Crear actuador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


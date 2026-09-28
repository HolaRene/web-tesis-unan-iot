"use client";

/**
 * Gestión de Dispositivos (CRUD).
 *
 * Endpoints reales del backend (bajo /api/v1/devices):
 *   GET  /devices            -> listar
 *   POST /devices            -> crear
 *   PATCH /devices/:id        -> actualizar
 *   DELETE /devices/:id       -> eliminar
 * Crear/editar/eliminar exige rol `usuario` o `admin` (`viewer` lee nada más).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccionesFila } from "@/components/compartidos/acciones-fila";
import { useSesion } from "@/hooks/use-sesion";
import { useEventosDispositivos } from "@/hooks/use-eventos-dispositivos";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import {
  listarDispositivos,
  crearDispositivo,
  actualizarDispositivo,
  eliminarDispositivo,
} from "@/servicios/dispositivos.servicio";
import { listarAreas } from "@/servicios/areas.servicio";
import type { Dispositivo, Area } from "@/tipos";
import {
  formatearFecha,
  haceTiempo,
  textoEstado,
  varianteEstadoDispositivo,
} from "@/utilidades";

/** Esquema local para el formulario de dispositivo. */
const esquemaFormDispositivo = z.object({
  area_id: z.string().optional().nullable(),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  tipo: z.string().trim().min(1, "El tipo es obligatorio"),
  protocolo: z.string().trim().optional(),
  direccion_ip: z.string().trim().optional().nullable(),
  fabricante: z.string().trim().optional().nullable(),
  modelo: z.string().trim().optional().nullable(),
  identificador: z.string().trim().optional().nullable(),
  estado: z.string().trim().optional(),
});
type DatosFormDispositivo = z.infer<typeof esquemaFormDispositivo>;

interface FormDialogProps {
  abierto: boolean;
  dispositivo: Dispositivo | null;
  areas: Area[];
  enviando: boolean;
  error: string | null;
  onOpenChange: (o: boolean) => void;
  onGuardar: (d: DatosFormDispositivo) => void;
}

function useCampoForm(dispositivo: Dispositivo | null) {
  return useForm<DatosFormDispositivo>({
    resolver: zodResolver(esquemaFormDispositivo),
    defaultValues: {
      area_id: dispositivo?.area_id ?? "",
      nombre: dispositivo?.nombre ?? "",
      tipo: dispositivo?.tipo ?? "",
      protocolo: dispositivo?.protocolo ?? "",
      direccion_ip: dispositivo?.direccion_ip ?? "",
      fabricante: dispositivo?.fabricante ?? "",
      modelo: dispositivo?.modelo ?? "",
      identificador: dispositivo?.identificador ?? "",
      estado: dispositivo?.estado ?? "online",
    },
  });
}

function EstadoSelect({ register }: { register: ReturnType<typeof useCampoForm>["register"] }) {
  return (
    <select className="h-9 w-full rounded-2xl border bg-background px-3 text-sm" {...register("estado")}>
      <option value="online">En línea</option>
      <option value="offline">Sin conexión</option>
      <option value="mantenimiento">Mantenimiento</option>
    </select>
  );
}

function FormularioDispositivo({
  abierto,
  dispositivo,
  areas,
  enviando,
  error,
  onOpenChange,
  onGuardar,
}: FormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useCampoForm(dispositivo);

  // Re-sincroniza TODOS los campos al abrir o al cambiar el dispositivo a editar.
  useEffect(() => {
    if (abierto) {
      reset({
        area_id: dispositivo?.area_id ?? "",
        nombre: dispositivo?.nombre ?? "",
        tipo: dispositivo?.tipo ?? "",
        protocolo: dispositivo?.protocolo ?? "",
        direccion_ip: dispositivo?.direccion_ip ?? "",
        fabricante: dispositivo?.fabricante ?? "",
        modelo: dispositivo?.modelo ?? "",
        identificador: dispositivo?.identificador ?? "",
        estado: dispositivo?.estado ?? "online",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispositivo, abierto]);

  return (
    <Dialog
      open={abierto}
      onOpenChange={(val) => {
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {dispositivo ? "Editar dispositivo" : "Nuevo dispositivo"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((datos) => onGuardar(datos))}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="disp-nombre">Nombre</Label>
            <Input
              id="disp-nombre"
              placeholder="Ej. PLC Principal"
              aria-invalid={!!errors.nombre}
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="disp-identificador">Identificador (para integración/NIR)</Label>
            <Input
              id="disp-identificador"
              placeholder="ESP32-Q2"
              {...register("identificador")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="disp-tipo">Tipo</Label>
            <Input
              id="disp-tipo"
              placeholder="open-plc, esp32, gateway, camera…"
              aria-invalid={!!errors.tipo}
              {...register("tipo")}
            />
            {errors.tipo && (
              <p className="text-sm text-destructive">{errors.tipo.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="disp-areas">Área</Label>
              <select {...register("area_id")} id="disp-areas" className="h-9 w-full rounded-2xl border bg-background px-3 text-sm">
                <option value="">Sin área</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disp-estado">Estado</Label>
              <EstadoSelect register={register} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="disp-protocolo">Protocolo</Label>
              <Input
                id="disp-protocolo"
                placeholder="modbus-tcp, mqtt…"
                {...register("protocolo")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disp-ip">Dirección IP</Label>
              <Input
                id="disp-ip"
                placeholder="192.168.1.10"
                {...register("direccion_ip")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="disp-fabricante">Fabricante</Label>
              <Input id="disp-fabricante" {...register("fabricante")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disp-modelo">Modelo</Label>
              <Input id="disp-modelo" {...register("modelo")} />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {dispositivo ? "Guardar cambios" : "Crear dispositivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Acciones({
  onEditar,
  onBorrar,
}: {
  onEditar: () => void;
  onBorrar: () => void;
}) {
  return <AccionesFila alEditar={onEditar} alEliminar={onBorrar} />;
}

export function GestionDispositivos() {
  const queryClient = useQueryClient();
  const { usuario } = useSesion();
  const puedeEscribir = usuario?.rol === "usuario" || usuario?.rol === "admin";

  // Actualizaciones en tiempo real: WS parchea la caché con setQueryData.
  useEventosDispositivos();

  const dispositivos = useQuery({
    queryKey: ["dispositivos"],
    queryFn: () => listarDispositivos(),
    // Polling de RESPALDO: con WebSocket activo ya no hace falta cada 15 s.
    // Se deja muy poco frecuente por si la conexión WS cae.
    refetchInterval: POLLING_RESPALDO_MS,
  });
  const areasQuery = useQuery({ queryKey: ["areas"], queryFn: listarAreas });

  const mut = {
    crear: useMutation({
      mutationFn: crearDispositivo,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dispositivos"] }),
    }),
    actualizar: useMutation({
      mutationFn: ({ id, datos }: { id: string; datos: Partial<Dispositivo> }) =>
        actualizarDispositivo(id, datos),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dispositivos"] }),
    }),
    eliminar: useMutation({
      mutationFn: eliminarDispositivo,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dispositivos"] }),
    }),
  };

  const [abrir, setAbrir] = useState(false);
  const [editar, setEditar] = useState<Dispositivo | null>(null);
  const [borrar, setBorrar] = useState<Dispositivo | null>(null);
  const [errorOp, setErrorOp] = useState<string | null>(null);

  const areas = areasQuery.data ?? [];

  async function guardar(datos: DatosFormDispositivo) {
    setErrorOp(null);
    const registro = {
      nombre: datos.nombre,
      tipo: datos.tipo,
      protocolo: datos.protocolo || null,
      direccion_ip: datos.direccion_ip || null,
      fabricante: datos.fabricante || null,
      modelo: datos.modelo || null,
      identificador: datos.identificador || null,
      area_id: datos.area_id || null,
      estado: datos.estado || "online",
    };
    try {
      if (editar) {
        await mut.actualizar.mutateAsync({ id: editar.id, datos: registro });
      } else {
        await mut.crear.mutateAsync(registro);
      }
      setAbrir(false);
    } catch (e) {
      setErrorOp(e instanceof Error ? e.message : "No se pudo guardar el dispositivo.");
    }
  }

  async function confirmarBorrar() {
    if (!borrar) return;
    setErrorOp(null);
    try {
      await mut.eliminar.mutateAsync(borrar.id);
      setBorrar(null);
    } catch (e) {
      setErrorOp(e instanceof Error ? e.message : "No se pudo eliminar el dispositivo.");
    }
  }

  const filas = dispositivos.data ?? [];

  return (
    <div className="space-y-4">
      <FormularioDispositivo
        key={abrir ? editar?.id ?? "nuevo" : "cerrado"}
        abierto={abrir}
        dispositivo={editar}
        areas={areas}
        enviando={mut.crear.isPending || mut.actualizar.isPending}
        error={errorOp}
        onOpenChange={(val) => {
          setAbrir(val);
          if (val) setErrorOp(null);
          if (!val) setEditar(null);
        }}
        onGuardar={guardar}
      />

      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Dispositivos</CardTitle>
            <p className="text-sm text-muted-foreground">
              {dispositivos.isLoading
                ? "Cargando…"
                : `${filas.length} dispositivo${filas.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {puedeEscribir && (
            <Button
              size="sm"
              onClick={() => {
                setEditar(null);
                setAbrir(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Nuevo dispositivo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {dispositivos.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : dispositivos.error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Error al cargar dispositivos</AlertTitle>
              <AlertDescription>
                {dispositivos.error.message}. Revisa la conexión con el backend.
              </AlertDescription>
            </Alert>
          ) : filas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay dispositivos registrados todavía.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última conexión</TableHead>
                  {puedeEscribir && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dispositivos/${d.id}`}
                        className="font-medium hover:underline"
                      >
                        {d.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>{d.tipo}</TableCell>
                    <TableCell>{d.protocolo ?? "—"}</TableCell>
                    <TableCell>{d.direccion_ip ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={varianteEstadoDispositivo(d.estado)}>
                        {textoEstado(d.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {d.ultima_conexion ? (
                        <span title={formatearFecha(d.ultima_conexion)}>
                          {haceTiempo(d.ultima_conexion)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    {puedeEscribir && (
                      <TableCell>
                        <Acciones
                          onEditar={() => {
                            setEditar(d);
                            setAbrir(true);
                          }}
                          onBorrar={() => setBorrar(d)}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {borrar && (
        <Dialog open onOpenChange={(val) => !val && setBorrar(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Eliminar dispositivo</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              ¿Seguro que deseas eliminar el dispositivo “{borrar.nombre}”? Esta
              acción no se puede deshacer.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBorrar(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmarBorrar}
                disabled={mut.eliminar.isPending}
              >
                {mut.eliminar.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-4" aria-hidden />
                )}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {errorOp && !abrir && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorOp}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

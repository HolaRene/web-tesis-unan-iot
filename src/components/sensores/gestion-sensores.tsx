"use client";

/**
 * Gestión de Sensores (CRUD).
 *
 * Endpoints del backend bajo /api/v1/sensors:
 *   GET /sensors, POST /sensors, PATCH /sensors/:id, DELETE /sensors/:id
 * Crear/editar/eliminar exige rol `usuario` o `admin` (`viewer` sólo lee).
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Pencil,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSesion } from "@/hooks/use-sesion";
import {
  listarSensores,
  crearSensor,
  actualizarSensor,
  eliminarSensor,
} from "@/servicios/sensores.servicio";
import type { Sensor } from "@/tipos";

const esquemaFormSensor = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  codigo: z.string().trim().min(1, "El código es obligatorio"),
  fabricante: z.string().trim().optional().nullable(),
  modelo: z.string().trim().optional().nullable(),
  unidad: z.string().trim().optional().nullable(),
  rango_min: z.string().trim().optional(),
  rango_max: z.string().trim().optional(),
  precision: z.string().trim().optional(),
});
type DatosFormSensor = z.infer<typeof esquemaFormSensor>;

function FormularioSensor({
  abierto,
  sensor,
  enviando,
  error,
  onOpenChange,
  onGuardar,
}: {
  abierto: boolean;
  sensor: Sensor | null;
  enviando: boolean;
  error: string | null;
  onOpenChange: (o: boolean) => void;
  onGuardar: (d: DatosFormSensor) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosFormSensor>({
    resolver: zodResolver(esquemaFormSensor),
    defaultValues: {
      nombre: sensor?.nombre ?? "",
      codigo: sensor?.codigo ?? "",
      fabricante: sensor?.fabricante ?? "",
      modelo: sensor?.modelo ?? "",
      unidad: sensor?.unidad ?? "",
      rango_min: sensor?.rango_min ?? "",
      rango_max: sensor?.rango_max ?? "",
      precision: sensor?.precision ?? "",
    },
  });

  return (
    <Dialog
      open={abierto}
      onOpenChange={(val) => onOpenChange(val)}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sensor ? "Editar sensor" : "Nuevo sensor"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((datos) => onGuardar(datos))}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sen-nombre">Nombre</Label>
              <Input
                id="sen-nombre"
                placeholder="Temp sala 1"
                aria-invalid={!!errors.nombre}
                {...register("nombre")}
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">
                  {errors.nombre.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sen-codigo">Código</Label>
              <Input
                id="sen-codigo"
                placeholder="TEMP-01"
                aria-invalid={!!errors.codigo}
                {...register("codigo")}
              />
              {errors.codigo && (
                <p className="text-sm text-destructive">
                  {errors.codigo.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="sen-fab">Fabricante</Label>
              <Input id="sen-fab" {...register("fabricante")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sen-modelo">Modelo</Label>
              <Input id="sen-modelo" {...register("modelo")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sen-unidad">Unidad</Label>
              <Input id="sen-unidad" placeholder="°C, %, ppm…" {...register("unidad")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="sen-min">Rango mín.</Label>
              <Input id="sen-min" type="number" step="any" {...register("rango_min")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sen-max">Rango máx.</Label>
              <Input id="sen-max" type="number" step="any" {...register("rango_max")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sen-prec">Precisión</Label>
              <Input id="sen-prec" type="number" step="any" {...register("precision")} />
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
              {sensor ? "Guardar cambios" : "Crear sensor"}
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Acciones">
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<button type="button" onClick={onEditar} />}>
          <Pencil className="size-4" aria-hidden />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          render={<button type="button" onClick={onBorrar} />}
        >
          <Trash2 className="size-4" aria-hidden />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GestionSensores() {
  const queryClient = useQueryClient();
  const { usuario } = useSesion();
  const puedeEscribir = usuario?.rol === "usuario" || usuario?.rol === "admin";

  const sensores = useQuery({ queryKey: ["sensores"], queryFn: listarSensores });

  const mut = {
    crear: useMutation({
      mutationFn: crearSensor,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensores"] }),
    }),
    actualizar: useMutation({
      mutationFn: ({ id, datos }: { id: string; datos: Partial<Sensor> }) =>
        actualizarSensor(id, datos),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensores"] }),
    }),
    eliminar: useMutation({
      mutationFn: eliminarSensor,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensores"] }),
    }),
  };

  const [abrir, setAbrir] = useState(false);
  const [editar, setEditar] = useState<Sensor | null>(null);
  const [borrar, setBorrar] = useState<Sensor | null>(null);
  const [errorOp, setErrorOp] = useState<string | null>(null);

  async function guardar(datos: DatosFormSensor) {
    setErrorOp(null);
    const registro = {
      nombre: datos.nombre,
      codigo: datos.codigo,
      fabricante: datos.fabricante || null,
      modelo: datos.modelo || null,
      unidad: datos.unidad || null,
      activo: true,
    };
    try {
      if (editar) {
        await mut.actualizar.mutateAsync({ id: editar.id, datos: registro });
      } else {
        await mut.crear.mutateAsync(registro);
      }
      setAbrir(false);
    } catch (e) {
      setErrorOp(e instanceof Error ? e.message : "No se pudo guardar el sensor.");
    }
  }

  async function confirmarBorrar() {
    if (!borrar) return;
    setErrorOp(null);
    try {
      await mut.eliminar.mutateAsync(borrar.id);
      setBorrar(null);
    } catch (e) {
      setErrorOp(e instanceof Error ? e.message : "No se pudo eliminar el sensor.");
    }
  }

  const filas = sensores.data ?? [];

  return (
    <div className="space-y-4">
      <FormularioSensor
        key={abrir ? editar?.id ?? "nuevo" : "cerrado"}
        abierto={abrir}
        sensor={editar}
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
            <CardTitle className="text-lg">Sensores</CardTitle>
            <p className="text-sm text-muted-foreground">
              {sensores.isLoading
                ? "Cargando…"
                : `${filas.length} sensor${filas.length === 1 ? "" : "es"}`}
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
              Nuevo sensor
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sensores.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sensores.error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Error al cargar sensores</AlertTitle>
              <AlertDescription>
                {sensores.error.message}. Revisa la conexión con el backend.
              </AlertDescription>
            </Alert>
          ) : filas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay sensores registrados todavía.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Rango</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeEscribir && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nombre}</TableCell>
                    <TableCell>{s.codigo}</TableCell>
                    <TableCell>{s.unidad ?? "—"}</TableCell>
                    <TableCell>
                      {s.rango_min ?? "—"} … {s.rango_max ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.activo ? "secondary" : "outline"}>
                        {s.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {puedeEscribir && (
                      <TableCell>
                        <Acciones
                          onEditar={() => {
                            setEditar(s);
                            setAbrir(true);
                          }}
                          onBorrar={() => setBorrar(s)}
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
              <DialogTitle>Eliminar sensor</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              ¿Seguro que deseas eliminar el sensor “{borrar.nombre}”? Esta
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

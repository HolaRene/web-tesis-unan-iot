"use client";

/**
 * Gestión de Áreas (CRUD).
 *
 * Consulta el listado de áreas con TanStack Query y permite crear, editar y
 * eliminar áreas con los endpoints reales del backend:
 *   GET /areas, POST /areas, PATCH /areas/:id, DELETE /areas/:id
 *
 * Los POST/PATCH/DELETE requieren rol `usuario` o `admin`; un `viewer` ve la
 * lista en modo lectura.
 */
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  UserRound,
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
import { esquemaArea, type DatosAreaFormulario } from "@/esquemas";
import { useSesion } from "@/hooks/use-sesion";
import {
  listarAreas,
  crearArea,
  actualizarArea,
  eliminarArea,
} from "@/servicios/areas.servicio";
import type { Area } from "@/tipos";

interface FormularioAreaProps {
  abierto: boolean;
  area: Area | null;
  enviando: boolean;
  error: string | null;
  onOpenChange: (abrir: boolean) => void;
  onGuardar: (datos: DatosAreaFormulario) => void;
}

function FormularioArea({
  abierto,
  area,
  enviando,
  error,
  onOpenChange,
  onGuardar,
}: FormularioAreaProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DatosAreaFormulario>({
    resolver: zodResolver(esquemaArea),
    defaultValues: {
      nombre: area?.nombre ?? "",
      tipo: area?.tipo ?? "",
      descripcion: area?.descripcion ?? "",
      ubicacion: area?.ubicacion ?? "",
    },
  });

  // Re-sincroniza el formulario cuando cambia el área a editar o al abrir,
  // garantizando que lleguen TODOS los datos de la fila (y no queden viejos).
  useEffect(() => {
    if (abierto) {
      reset({
        nombre: area?.nombre ?? "",
        tipo: area?.tipo ?? "",
        descripcion: area?.descripcion ?? "",
        ubicacion: area?.ubicacion ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, abierto]);

  return (
    <Dialog
      open={abierto}
      onOpenChange={(val) => {
        if (!val) reset();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{area ? "Editar área" : "Nueva área"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((datos) => {
            onGuardar(datos);
          })}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="area-nombre">Nombre</Label>
            <Input
              id="area-nombre"
              placeholder="Ej. Planta baja"
              aria-invalid={!!errors.nombre}
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="area-tipo">Tipo</Label>
            <Input
              id="area-tipo"
              placeholder="Ej. pabellón, sala, industrial"
              {...register("tipo")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="area-ubicacion">Ubicación</Label>
            <Input
              id="area-ubicacion"
              placeholder="Ej. Nivel 1"
              {...register("ubicacion")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="area-descripcion">Descripción</Label>
            <Input
              id="area-descripcion"
              placeholder="Descripción breve"
              {...register("descripcion")}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {area ? "Guardar cambios" : "Crear área"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AccionesProps {
  area: Area;
  onEditar: (area: Area) => void;
  onBorrar: (area: Area) => void;
}

function AreaAcciones({ area, onEditar, onBorrar }: AccionesProps) {
  return (
    <AccionesFila
      alEditar={() => onEditar(area)}
      alEliminar={() => onBorrar(area)}
    />
  );
}

export function GestionAreas() {
  const queryClient = useQueryClient();
  const { usuario } = useSesion();
  const puedeEscribir = usuario?.rol === "usuario" || usuario?.rol === "admin";

  const areas = useQuery({ queryKey: ["areas"], queryFn: listarAreas });

  const mutCrear = useMutation({
    mutationFn: crearArea,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["areas"] }),
  });
  const mutActualizar = useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: Partial<Area> }) =>
      actualizarArea(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["areas"] }),
  });
  const mutEliminar = useMutation({
    mutationFn: eliminarArea,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["areas"] }),
  });

  const [abrir, setAbrir] = useState(false);
  const [editar, setEditar] = useState<Area | null>(null);
  const [borrar, setBorrar] = useState<Area | null>(null);
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null);

  function abrirCrear() {
    setEditar(null);
    setErrorOperacion(null);
    setAbrir(true);
  }

  function abrirEditar(area: Area) {
    setEditar(area);
    setErrorOperacion(null);
    setAbrir(true);
  }

  async function alGuardar(datos: DatosAreaFormulario) {
    setErrorOperacion(null);
    try {
      if (editar) {
        await mutActualizar.mutateAsync({
          id: editar.id,
          datos: {
            nombre: datos.nombre,
            tipo: datos.tipo || null,
            descripcion: datos.descripcion || null,
            ubicacion: datos.ubicacion || null,
          },
        });
      } else {
        await mutCrear.mutateAsync({
          nombre: datos.nombre,
          tipo: datos.tipo || null,
          descripcion: datos.descripcion || null,
          ubicacion: datos.ubicacion || null,
          activo: true,
        });
      }
      setAbrir(false);
    } catch (e) {
      setErrorOperacion(
        e instanceof Error ? e.message : "No se pudo guardar el área."
      );
    }
  }

  async function confirmarBorrar() {
    if (!borrar) return;
    setErrorOperacion(null);
    try {
      await mutEliminar.mutateAsync(borrar.id);
      setBorrar(null);
    } catch (e) {
      setErrorOperacion(
        e instanceof Error ? e.message : "No se pudo eliminar el área."
      );
    }
  }

  const filas = areas.data ?? [];

  return (
    <div className="space-y-4">
      {/* Crear/editar modal re-evaluado en cada apertura */}
      <FormularioArea
        key={abrir ? editar?.id ?? "nuevo" : "cerrado"}
        abierto={abrir}
        area={editar}
        enviando={mutCrear.isPending || mutActualizar.isPending}
        error={errorOperacion}
        onOpenChange={(val) => {
          setAbrir(val);
          if (val) setErrorOperacion(null);
        }}
        onGuardar={alGuardar}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Áreas</CardTitle>
            <p className="text-sm text-muted-foreground">
              {areas.isLoading
                ? "Cargando áreas…"
                : `${filas.length} área${filas.length === 1 ? "" : "s"} registrada${filas.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!puedeEscribir && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                <UserRound className="size-3.5" aria-hidden />
                Solo lectura
              </span>
            )}
            {puedeEscribir && (
              <Button onClick={abrirCrear} size="sm">
                <Plus className="size-4" aria-hidden />
                Nueva área
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {areas.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, indice) => (
                <Skeleton key={indice} className="h-10 w-full" />
              ))}
            </div>
          ) : areas.error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Error al cargar áreas</AlertTitle>
              <AlertDescription>
                {areas.error.message}. Revisa la conexión con el backend.
              </AlertDescription>
            </Alert>
          ) : filas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay áreas registradas todavía.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeEscribir && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.nombre}</TableCell>
                    <TableCell>{area.tipo ?? "—"}</TableCell>
                    <TableCell>{area.ubicacion ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={area.activo ? "secondary" : "outline"}>
                        {area.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    {puedeEscribir && (
                      <TableCell>
                        <AreaAcciones
                          area={area}
                          onEditar={abrirEditar}
                          onBorrar={() => setBorrar(area)}
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

      {/* Confirmación de borrado */}
      {borrar && (
        <Dialog open onOpenChange={(val) => !val && setBorrar(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Eliminar área</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              ¿Seguro que deseas eliminar el área “{borrar.nombre}”? Esta acción
              no se puede deshacer.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBorrar(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmarBorrar}
                disabled={mutEliminar.isPending}
              >
                {mutEliminar.isPending ? (
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

      {errorOperacion && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorOperacion}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

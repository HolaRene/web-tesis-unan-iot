"use client";

/**
 * Gestión de Sensores (CRUD) con modelo multivariable.
 *
 * Un sensor puede exponer VARIAS magnitudes (canales). Ej.: un DHT22 aporta
 * temperatura y humedad relativa. El formulario permite añadir/eliminar
 * magnitudes y el backend crea un canal por cada una.
 *
 * Endpoints bajo /api/v1/sensors:
 *   GET /sensors, POST /sensors, PATCH /sensors/:id, DELETE /sensors/:id
 *   GET /sensors/:id/canales  (magnitudes del sensor)
 * Crear/editar/eliminar exige rol `usuario` o `admin` (`viewer` sólo lee).
 */
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, Loader2, Lock, Plus, Trash2, X } from "lucide-react";

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
import {
  listarSensores,
  crearSensor,
  actualizarSensor,
  eliminarSensor,
  obtenerCanalesDeSensor,
  type DatosSensor,
} from "@/servicios/sensores.servicio";
import { listarDispositivos } from "@/servicios/dispositivos.servicio";
import { listarTiposVariable } from "@/servicios/tipos-variable.servicio";
import type { MagnitudSensor, Sensor, Dispositivo, TipoVariable } from "@/tipos";

/** Fila del editor de magnitudes en el formulario. */
interface MagnitudFila {
  /** Clave local estable para React. */
  clave: string;
  tipo_variable_id: string;
  unidad: string;
  rango_min: string;
  rango_max: string;
}

const esquemaFormSensor = z.object({
  dispositivo_id: z.string().optional().nullable(),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  // El código lo genera el servidor: no se valida ni se envía.
  fabricante: z.string().trim().optional().nullable(),
  modelo: z.string().trim().optional().nullable(),
});
type DatosFormSensor = z.infer<typeof esquemaFormSensor>;

function nuevaClave(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Texto legible del tipo de variable: "Temperatura (°C, numeric)". */
function etiquetaTipo(tipo: TipoVariable | undefined): string {
  if (!tipo) return "Tipo desconocido";
  const unidad = tipo.unidad_default ? ` · ${tipo.unidad_default}` : "";
  return `${tipo.nombre} (${tipo.tipo_dato}${unidad})`;
}

function FormularioSensor({
  abierto,
  sensor,
  dispositivos,
  tipos,
  magnitudesIniciales,
  cargandoMagnitudes,
  enviando,
  error,
  onOpenChange,
  onGuardar,
}: {
  abierto: boolean;
  sensor: Sensor | null;
  dispositivos: Dispositivo[];
  tipos: TipoVariable[];
  magnitudesIniciales: MagnitudFila[];
  cargandoMagnitudes: boolean;
  enviando: boolean;
  error: string | null;
  onOpenChange: (o: boolean) => void;
  onGuardar: (datos: DatosFormSensor, magnitudes: MagnitudSensor[]) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosFormSensor>({
    resolver: zodResolver(esquemaFormSensor),
    defaultValues: {
      dispositivo_id: sensor?.dispositivo_id ?? "",
      nombre: sensor?.nombre ?? "",
      fabricante: sensor?.fabricante ?? "",
      modelo: sensor?.modelo ?? "",
    },
  });

  const [magnitudes, setMagnitudes] = useState<MagnitudFila[]>(
    magnitudesIniciales.length > 0
      ? magnitudesIniciales
      : [{ clave: nuevaClave(), tipo_variable_id: "", unidad: "", rango_min: "", rango_max: "" }]
  );

  function agregarMagnitud() {
    setMagnitudes((prev) => [
      ...prev,
      { clave: nuevaClave(), tipo_variable_id: "", unidad: "", rango_min: "", rango_max: "" },
    ]);
  }

  function quitarMagnitud(clave: string) {
    setMagnitudes((prev) => prev.filter((m) => m.clave !== clave));
  }

  function actualizarMagnitud(clave: string, campo: keyof MagnitudFila, valor: string) {
    setMagnitudes((prev) =>
      prev.map((m) => (m.clave === clave ? { ...m, [campo]: valor } : m))
    );
  }

  function enviar(datos: DatosFormSensor) {
    const canales: MagnitudSensor[] = magnitudes
      .filter((m) => m.tipo_variable_id)
      .map((m) => ({
        tipo_variable_id: m.tipo_variable_id,
        unidad: m.unidad.trim() || null,
        rango_min: m.rango_min ? Number(m.rango_min) : null,
        rango_max: m.rango_max ? Number(m.rango_max) : null,
        activo: true,
      }));
    onGuardar(datos, canales);
  }

  const tiposSeleccionables = tipos;

  return (
    <Dialog open={abierto} onOpenChange={(val) => onOpenChange(val)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{sensor ? "Editar sensor" : "Nuevo sensor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
          {/* Dispositivo */}
          <div className="grid gap-2">
            <Label htmlFor="sen-dispositivo">Dispositivo</Label>
            <select
              id="sen-dispositivo"
              className="h-9 w-full rounded-2xl border bg-background px-3 text-sm"
              {...register("dispositivo_id")}
            >
              <option value="">Sin dispositivo</option>
              {dispositivos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sen-nombre">Nombre</Label>
              <Input
                id="sen-nombre"
                placeholder="DHT22 sala 1"
                aria-invalid={!!errors.nombre}
                {...register("nombre")}
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sen-codigo">
                Código
                <Lock
                  className="ml-1.5 inline size-3 text-muted-foreground"
                  aria-hidden
                />
              </Label>
              <Input
                id="sen-codigo"
                value={sensor ? (sensor?.codigo ?? "") : ""}
                readOnly
                disabled
                placeholder="Se generará al guardar"
                className="bg-muted font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {sensor ? (
                  <>
                    Es la base del código de sus canales
                    (<code>{`${sensor?.codigo ?? ""}-...`}</code>).
                    <strong> No se puede cambiar</strong>: los equipos ya lo
                    usan para enviar mediciones.
                  </>
                ) : (
                  <>
                    Lo genera el servidor desde el <strong>nombre</strong> y las
                    magnitudes. Nunca se repite.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sen-fab">Fabricante</Label>
              <Input id="sen-fab" placeholder="Aosong" {...register("fabricante")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sen-modelo">Modelo</Label>
              <Input id="sen-modelo" placeholder="DHT22" {...register("modelo")} />
            </div>
          </div>

          {/* Editor de magnitudes (canales) */}
          <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Magnitudes del sensor</p>
                <p className="text-xs text-muted-foreground">
                  Un sensor puede medir varias magnitudes (p. ej. un DHT22:
                  temperatura y humedad). Se crea un canal por cada una.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={agregarMagnitud}>
                <Plus className="size-4" aria-hidden />
                Añadir
              </Button>
            </div>

            {cargandoMagnitudes ? (
              <Skeleton className="h-16 w-full" />
            ) : magnitudes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin magnitudes: se creará una a partir del tipo principal si lo
                indicas.
              </p>
            ) : (
              <div className="space-y-3">
                {magnitudes.map((m, indice) => (
                  <div
                    key={m.clave}
                    className="grid grid-cols-1 gap-3 rounded-xl border bg-background p-3 sm:grid-cols-[1fr_auto]"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Tipo de variable *</Label>
                        <select
                          aria-label={`Tipo de variable de la magnitud ${indice + 1}`}
                          className="h-9 w-full rounded-xl border bg-background px-3 text-sm"
                          value={m.tipo_variable_id}
                          onChange={(e) =>
                            actualizarMagnitud(m.clave, "tipo_variable_id", e.target.value)
                          }
                        >
                          <option value="">Selecciona una magnitud…</option>
                          {tiposSeleccionables.map((tv) => (
                            <option key={tv.id} value={tv.id}>
                              {etiquetaTipo(tv)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Unidad</Label>
                        <Input
                          className="h-9"
                          placeholder="°C, %, ppm…"
                          value={m.unidad}
                          onChange={(e) =>
                            actualizarMagnitud(m.clave, "unidad", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Rango mín.</Label>
                        <Input
                          className="h-9"
                          type="number"
                          step="any"
                          value={m.rango_min}
                          onChange={(e) =>
                            actualizarMagnitud(m.clave, "rango_min", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Rango máx.</Label>
                        <Input
                          className="h-9"
                          type="number"
                          step="any"
                          value={m.rango_max}
                          onChange={(e) =>
                            actualizarMagnitud(m.clave, "rango_max", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-start justify-end sm:items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Quitar magnitud ${indice + 1}`}
                        title="Quitar magnitud"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => quitarMagnitud(m.clave)}
                      >
                        <X className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  hrefDetalle,
  puedeEscribir,
  onEditar,
  onBorrar,
}: {
  hrefDetalle: string;
  puedeEscribir: boolean;
  onEditar: () => void;
  onBorrar: () => void;
}) {
  return (
    <AccionesFila
      hrefDetalle={hrefDetalle}
      // `AccionesFila` omite editar/eliminar si no recibe el manejador.
      alEditar={puedeEscribir ? onEditar : undefined}
      alEliminar={puedeEscribir ? onBorrar : undefined}
    />
  );
}

export function GestionSensores() {
  const queryClient = useQueryClient();
  const { usuario } = useSesion();
  const puedeEscribir = usuario?.rol === "usuario" || usuario?.rol === "admin";

  const sensores = useQuery({ queryKey: ["sensores"], queryFn: () => listarSensores() });
  const dispQuery = useQuery({ queryKey: ["dispositivos"], queryFn: () => listarDispositivos() });
  const tiposQuery = useQuery({ queryKey: ["tipos-variable"], queryFn: listarTiposVariable });
  const dispositivos = dispQuery.data ?? [];
  const tipos = tiposQuery.data ?? [];

  const mut = {
    crear: useMutation({
      mutationFn: crearSensor,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensores"] }),
    }),
    actualizar: useMutation({
      mutationFn: ({ id, datos }: { id: string; datos: DatosSensor }) =>
        actualizarSensor(id, datos),
      onSuccess: (_d, variables) => {
        queryClient.invalidateQueries({ queryKey: ["sensores"] });
        queryClient.invalidateQueries({ queryKey: ["canales-sensor", variables.id] });
        queryClient.invalidateQueries({ queryKey: ["canales"] });
      },
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

  // Magnitudes del sensor en edición (para precargar el formulario).
  const canalesSensor = useQuery({
    queryKey: ["canales-sensor", editar?.id],
    queryFn: () => obtenerCanalesDeSensor(editar!.id),
    enabled: abrir && !!editar?.id,
  });

  /**
   * Magnitudes con las que se abre el formulario al editar.
   *
   * Se construyen desde los CANALES, que es donde vive cada magnitud del
   * modelo multivariable. Si el sensor aún no tiene ninguno (caso antiguo o
   * recién creado a medias), se recurre a la variable principal del propio
   * sensor para no mostrar el desplegable vacío.
   */
  // Sin useMemo: React Compiler memoriza el componente, y una lista de
  // dependencias manual que no coincida exactamente le impide optimizar.
  const magnitudesIniciales: MagnitudFila[] = (() => {
    const desdeCanales = (canalesSensor.data ?? []).map((c) => ({
      clave: c.id,
      tipo_variable_id: c.tipo_variable_id ?? "",
      unidad: c.unidad ?? "",
      rango_min:
        c.rango_min !== null && c.rango_min !== undefined
          ? String(c.rango_min)
          : "",
      rango_max:
        c.rango_max !== null && c.rango_max !== undefined
          ? String(c.rango_max)
          : "",
    }));

    if (desdeCanales.length > 0) return desdeCanales;

    // Respaldo: la variable del propio sensor.
    if (editar?.tipo_variable_id) {
      return [
        {
          clave: "principal",
          tipo_variable_id: editar.tipo_variable_id,
          unidad: editar.unidad ?? "",
          rango_min: "",
          rango_max: "",
        },
      ];
    }

    return [];
  })();

  async function guardar(datos: DatosFormSensor, magnitudes: MagnitudSensor[]) {
    setErrorOp(null);
    const registro: DatosSensor = {
      dispositivo_id: datos.dispositivo_id || null,
      nombre: datos.nombre,
      fabricante: datos.fabricante || null,
      modelo: datos.modelo || null,
      activo: true,
      canales: magnitudes,
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

  /**
   * ¿Se puede montar ya el formulario?
   *
   * NO se monta hasta que los canales (las magnitudes) están cargados.
   *
   * Por qué: el formulario inicializa su estado con `useState(magnitudes)`.
   * Esa prop solo se lee en el PRIMER render. Si se montara antes de que la
   * petición llegue, el estado se congelaría con la lista vacía y las
   * variables no aparecerían al editar, aunque la respuesta llegara después.
   *
   * Montándolo cuando ya hay datos, el estado nace correcto.
   */
  const magnitudesListas = !editar || !canalesSensor.isLoading;

  return (
    <div className="space-y-4">
      {magnitudesListas ? (
        <FormularioSensor
          /*
           * La `key` incluye la carga de magnitudes: si por cualquier motivo
           * el formulario se montara antes, al llegar los datos se remonta con
           * el estado correcto en lugar de quedarse vacío.
           */
          key={
            abrir
              ? `${editar?.id ?? "nuevo"}-${canalesSensor.dataUpdatedAt}`
              : "cerrado"
          }
          abierto={abrir}
          sensor={editar}
          dispositivos={dispositivos}
          tipos={tipos}
          magnitudesIniciales={magnitudesIniciales}
          cargandoMagnitudes={!!editar && canalesSensor.isLoading}
          enviando={mut.crear.isPending || mut.actualizar.isPending}
          error={errorOp}
          onOpenChange={(val) => {
            setAbrir(val);
            if (val) setErrorOp(null);
            if (!val) setEditar(null);
          }}
          onGuardar={guardar}
        />
      ) : null}

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
              Conectar sensor nuevo
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
                  <TableHead>Tipo / modelo</TableHead>
                  <TableHead>Estado</TableHead>
                  {/* Siempre visible: incluye el enlace "Ver detalle". */}
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/sensores/${s.id}`}
                        className="hover:underline"
                      >
                        {s.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>{s.codigo}</TableCell>
                    <TableCell>
                      {[s.fabricante, s.modelo].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.activo ? "secondary" : "outline"}>
                        {s.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Acciones
                        hrefDetalle={`/sensores/${s.id}`}
                        puedeEscribir={puedeEscribir}
                        onEditar={() => {
                          setEditar(s);
                          setAbrir(true);
                        }}
                        onBorrar={() => setBorrar(s)}
                      />
                    </TableCell>
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
              ¿Seguro que deseas eliminar el sensor “{borrar.nombre}”? Se
              eliminarán también sus canales y mediciones asociadas.
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

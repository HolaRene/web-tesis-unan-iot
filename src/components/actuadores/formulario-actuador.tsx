"use client";

/**
 * Formulario de alta y edición de actuadores.
 *
 * ────────────────────────────────────────────────────────────────────
 * EL CÓDIGO NO SE ESCRIBE: LO GENERA EL SERVIDOR
 * ────────────────────────────────────────────────────────────────────
 * Se muestra en un campo BLOQUEADO con un candado, porque el usuario necesita
 * verlo (es lo que configura en Node-RED para el tema MQTT), pero no puede
 * cambiarlo.
 *
 * El código es una clave única en toda la base de datos y forma parte del
 * tema al que Node-RED publica las órdenes:
 *
 *     hospital/quirofano/cmd/BUZZER-QUIROFANO
 *
 * Si se pudiera editar, los comandos seguirían saliendo al tema antiguo y el
 * equipo dejaría de responder.
 *
 * ────────────────────────────────────────────────────────────────────
 * EL TIPO SE OFRECE COMO LISTA, PERO ADMITE TEXTO LIBRE
 * ────────────────────────────────────────────────────────────────────
 * En la base de datos `tipo` es texto libre, así que hay una lista de los
 * tipos habituales (que además determina el widget de control en el panel)
 * pero se puede escribir cualquiera. El tipo forma parte del código generado,
 * así que no puede quedar vacío.
 *
 * ────────────────────────────────────────────────────────────────────
 * CARGA ASÍNCRONA
 * ────────────────────────────────────────────────────────────────────
 * El formulario NO se monta hasta tener los dispositivos, porque inicializa
 * su estado con ellos y `useState` solo lee el valor inicial una vez.
 * Ver `docs/formularios-carga-asincrona.md`.
 */

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, Lock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Actuador, Dispositivo } from "@/tipos";
import type { DatosActuador } from "@/servicios/actuadores.servicio";

/** Tipos de actuador que la interfaz sabe representar. */
export const TIPOS_ACTUADOR = [
  { valor: "rele", etiqueta: "Relé", detalle: "dos estados, interruptor" },
  { valor: "digital_out", etiqueta: "Salida digital", detalle: "LED, piloto" },
  { valor: "buzzer", etiqueta: "Buzzer / sirena", detalle: "acción momentánea" },
  { valor: "valvula", etiqueta: "Válvula", detalle: "abrir / cerrar" },
  { valor: "motor", etiqueta: "Motor / bomba", detalle: "arrancar / parar" },
  { valor: "ventilador", etiqueta: "Ventilador", detalle: "arrancar / parar" },
  { valor: "cerradura", etiqueta: "Cerradura", detalle: "abrir / cerrar" },
] as const;

const esquema = z.object({
  dispositivo_id: z.string().min(1, "Seleccione un dispositivo"),
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "No puede superar 100 caracteres"),
  tipo: z
    .string()
    .trim()
    .min(1, "El tipo es obligatorio")
    .max(50, "No puede superar 50 caracteres"),
  estado_actual: z.string().trim().max(50).optional(),
  activo: z.boolean().optional(),
});

export type DatosFormActuador = z.infer<typeof esquema>;

/**
 * Vista previa del código que generará el servidor.
 *
 * Reproduce la MISMA regla que el backend (`codigoDeActuador`): tipo + nombre,
 * sin repetir el tipo si el nombre ya empieza por él. Es solo una ayuda
 * visual; el valor real lo decide el servidor.
 */
function previsualizarCodigo(nombre: string, tipo: string): string {
  const norm = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "")
      .toUpperCase();

  const n = norm(nombre);
  const tp = norm(tipo);

  if (!tp) return n || "ACTUADOR";
  if (n.startsWith(tp)) return n;
  if (!n) return tp;
  return `${tp}-${n}`;
}

export function FormularioActuador({
  abierto,
  actuador,
  dispositivos,
  enviando,
  error,
  onOpenChange,
  onGuardar,
}: {
  abierto: boolean;
  actuador: Actuador | null;
  dispositivos: Dispositivo[];
  enviando: boolean;
  error: string | null;
  onOpenChange: (abierto: boolean) => void;
  onGuardar: (datos: DatosActuador) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<DatosFormActuador>({
    resolver: zodResolver(esquema),
    defaultValues: {
      dispositivo_id: actuador?.dispositivo_id ?? "",
      nombre: actuador?.nombre ?? "",
      tipo: actuador?.tipo ?? "",
      estado_actual: actuador?.estado_actual ?? "",
      activo: actuador?.activo ?? true,
    },
  });

  /*
   * `useWatch` en lugar de `watch()`: devuelve el VALOR en lugar de una
   * función, así que React Compiler puede memorizar el componente. Con
   * `watch()` avisa de que la función no se puede memorizar de forma segura.
   */
  const nombre = useWatch({ control, name: "nombre" });
  const tipo = useWatch({ control, name: "tipo" });
  const dispositivoId = useWatch({ control, name: "dispositivo_id" });

  const codigoPrevisto = previsualizarCodigo(nombre ?? "", tipo ?? "");

  function enviar(datos: DatosFormActuador) {
    onGuardar({
      dispositivo_id: datos.dispositivo_id,
      nombre: datos.nombre.trim(),
      tipo: datos.tipo.trim(),
      estado_actual: datos.estado_actual?.trim() || null,
      activo: datos.activo ?? true,
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {actuador ? "Editar actuador" : "Nuevo actuador"}
          </DialogTitle>
          <DialogDescription>
            Una salida controlable de un dispositivo: un relé, una válvula, un
            buzzer…
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(enviar)} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="act-dispositivo">Dispositivo</Label>
            <Select
              value={dispositivoId || undefined}
              onValueChange={(valor) =>
                setValue("dispositivo_id", (valor as string) ?? "", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="act-dispositivo" aria-invalid={!!errors.dispositivo_id}>
                <SelectValue placeholder="Seleccione el dispositivo" />
              </SelectTrigger>
              <SelectContent>
                {dispositivos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre}
                    {d.identificador ? ` · ${d.identificador}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dispositivo_id ? (
              <p className="text-sm text-destructive">
                {errors.dispositivo_id.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="act-nombre">Nombre</Label>
              <Input
                id="act-nombre"
                placeholder="Buzzer Quirófano"
                aria-invalid={!!errors.nombre}
                {...register("nombre")}
              />
              {errors.nombre ? (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="act-tipo">Tipo</Label>
              {/*
                Lista de tipos habituales, pero el campo admite cualquier
                texto: en la base de datos `tipo` es texto libre.
              */}
              <Input
                id="act-tipo"
                list="tipos-actuador"
                placeholder="buzzer"
                aria-invalid={!!errors.tipo}
                {...register("tipo")}
              />
              <datalist id="tipos-actuador">
                {TIPOS_ACTUADOR.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.etiqueta} — {t.detalle}
                  </option>
                ))}
              </datalist>
              {errors.tipo ? (
                <p className="text-sm text-destructive">{errors.tipo.message}</p>
              ) : null}
            </div>
          </div>

          {/*
            Código: BLOQUEADO.

            Se muestra porque hay que copiarlo a Node-RED para el tema MQTT,
            pero no se puede editar: es la clave que ya está en uso.
          */}
          <div className="grid gap-2">
            <Label htmlFor="act-codigo">
              Código (tema MQTT)
              <Lock
                className="ml-1.5 inline size-3 text-muted-foreground"
                aria-hidden
              />
            </Label>
            <Input
              id="act-codigo"
              value={actuador ? actuador.codigo : codigoPrevisto}
              readOnly
              disabled
              placeholder="Se generará al guardar"
              className="bg-muted font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {actuador ? (
                <>
                  Tema de publicación:{" "}
                  <code>
                    {actuador.topico_mqtt ??
                      `hospital/quirofano/cmd/${actuador.codigo}`}
                  </code>
                  . <strong>No se puede cambiar</strong>: los comandos
                  seguirían saliendo al tema antiguo.
                </>
              ) : (
                <>
                  Lo genera el servidor a partir del <strong>tipo</strong> y el{" "}
                  <strong>nombre</strong>. Se muestra en vivo para que sepas
                  cómo quedará.
                </>
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="act-estado">Estado actual</Label>
              <Input
                id="act-estado"
                placeholder="off"
                {...register("estado_actual")}
              />
              <p className="text-xs text-muted-foreground">
                Lo normal es dejarlo vacío: lo actualiza el equipo al confirmar.
              </p>
            </div>

            <div className="flex items-start gap-2 pt-6">
              <input
                id="act-activo"
                type="checkbox"
                className="mt-1 size-4"
                {...register("activo")}
              />
              <div>
                <Label htmlFor="act-activo">Activo</Label>
                <p className="text-xs text-muted-foreground">
                  Si se desmarca, no se le pueden enviar comandos.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {actuador ? "Guardar cambios" : "Crear actuador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

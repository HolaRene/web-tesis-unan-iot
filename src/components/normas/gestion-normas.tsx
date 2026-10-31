"use client";

/**
 * Gestión de normas.
 *
 * La plataforma es genérica: un laboratorio, un invernadero o una cámara
 * frigorífica no encajan en ASHRAE 170. Aquí el administrador crea su
 * propia norma con sus reglas, sin tocar código ni reiniciar la API.
 *
 * Las de origen `sistema` (sembradas desde el repositorio) se pueden editar
 * pero NO borrar: si se borraran, el siguiente arranque las recrearía y
 * reaparecerían sin explicación.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";

import {
  actualizarPlantilla,
  crearPlantilla,
  eliminarPlantilla,
  listarPlantillas,
  type PlantillaAlerta,
} from "@/servicios/plantillas-alerta.servicio";
import { useSesion } from "@/hooks/use-sesion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormularioNorma } from "@/components/normas/formulario-norma";

export function GestionNormas() {
  const qc = useQueryClient();
  const { usuario } = useSesion();
  const esAdmin = usuario?.rol === "admin";

  const [editando, setEditando] = useState<PlantillaAlerta | null>(null);
  const [creando, setCreando] = useState(false);
  const [aBorrar, setABorrar] = useState<PlantillaAlerta | null>(null);

  const normasQ = useQuery({
    queryKey: ["plantillas-alerta"],
    queryFn: listarPlantillas,
    // Ya no son archivos del repositorio: cambian al crear o editar.
    staleTime: 60_000,
  });

  const invalidar = () =>
    qc.invalidateQueries({ queryKey: ["plantillas-alerta"] });

  const borrar = useMutation({
    mutationFn: (id: string) => eliminarPlantilla(id),
    onSuccess: async () => {
      setABorrar(null);
      await invalidar();
    },
  });

  if (normasQ.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const normas = normasQ.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Normas disponibles</h2>
          <p className="text-sm text-muted-foreground">
            Cada norma describe qué valores son aceptables en un tipo de
            recinto. Se aplican desde la vista del área.
          </p>
        </div>
        {esAdmin && !creando && !editando && (
          <Button onClick={() => setCreando(true)}>
            <Plus className="size-4" aria-hidden />
            Nueva norma
          </Button>
        )}
      </div>

      {(creando || editando) && (
        <FormularioNorma
          key={editando?.id ?? "nueva"}
          norma={editando}
          alGuardar={async (datos) => {
            if (editando) {
              await actualizarPlantilla(editando.id, datos);
            } else {
              await crearPlantilla(datos);
            }
            await invalidar();
            setCreando(false);
            setEditando(null);
          }}
          alCancelar={() => {
            setCreando(false);
            setEditando(null);
          }}
        />
      )}

      {normas.map((n) => {
        const esSistema = n.origen === "sistema";
        return (
          <Card key={n.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {n.nombre}
                <Badge variant="secondary" className="text-xs">
                  {n.reglas.length} reglas
                </Badge>
                {esSistema ? (
                  <Badge variant="outline" className="text-xs">
                    De sistema
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Propia
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <TriangleAlert className="size-3 shrink-0" aria-hidden />
                {n.norma}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{n.descripcion}</p>

              <ul className="flex flex-wrap gap-1.5">
                {n.reglas.map((r, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-normal">
                    {r.tipos_variable.join("/")} · {r.operador}
                    {r.valor_min !== null && r.valor_min !== undefined
                      ? ` ${r.valor_min}–${r.valor_max}`
                      : r.valor_referencia_numerico !== null &&
                          r.valor_referencia_numerico !== undefined
                        ? ` ${r.valor_referencia_numerico}`
                        : ""}
                  </Badge>
                ))}
              </ul>

              {esAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCreando(false);
                      setEditando(n);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Editar
                  </Button>
                  {/*
                    Las de sistema no se pueden borrar: el siguiente arranque
                    las volvería a sembrar. Se oculta el botón en lugar de
                    dejar uno que siempre falla.
                  */}
                  {!esSistema && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setABorrar(n)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Borrar
                    </Button>
                  )}
                </div>
              )}

              {aBorrar?.id === n.id && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3">
                  <p className="text-sm">
                    ¿Borrar la norma <strong>{n.nombre}</strong>? Las reglas ya
                    aplicadas a canales <strong>no</strong> se eliminan.
                  </p>
                  {borrar.error && (
                    <p className="mt-1 text-xs text-destructive">
                      {borrar.error instanceof Error
                        ? borrar.error.message
                        : "No se pudo borrar"}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={borrar.isPending}
                      onClick={() => borrar.mutate(n.id)}
                    >
                      Sí, borrar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setABorrar(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

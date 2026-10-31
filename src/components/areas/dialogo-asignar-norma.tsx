"use client";

/**
 * Asignar una norma a un área.
 *
 * ──────────────────────────────────────────────────────────────────────
 * POR QUÉ HACE FALTA
 * ──────────────────────────────────────────────────────────────────────
 * La tarjeta de cumplimiento decía «Asigna un perfil al área…» pero no
 * había ningún sitio donde hacerlo. Sin norma, el cumplimiento nunca tiene
 * contra qué comparar y todo sale «sin regla».
 *
 * ──────────────────────────────────────────────────────────────────────
 * QUÉ HACE
 * ──────────────────────────────────────────────────────────────────────
 * Copia las reglas de la norma a TODOS los canales del área, y la guarda
 * como perfil del área. Las reglas que ya existían no se duplican: se
 * informan como «repetidas».
 *
 * Antes de aplicar se muestra qué va a pasar: cuántas reglas por tipo de
 * canal. Aplicar una norma de quirófano a un área sin termómetros no debe
 * sorprender a nadie cuando no aparezca nada.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Loader2, TriangleAlert } from "lucide-react";

import {
  aplicarPlantillaAArea,
  listarPlantillas,
  type ResultadoAplicarArea,
} from "@/servicios/plantillas-alerta.servicio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  areaId: string;
  /** Norma ya asignada, si la hay. */
  perfilActual?: string | null;
  abierto: boolean;
  alCerrar: () => void;
}

export function DialogoAsignarNorma({
  areaId,
  perfilActual,
  abierto,
  alCerrar,
}: Props) {
  const qc = useQueryClient();
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoAplicarArea | null>(null);

  const plantillasQ = useQuery({
    queryKey: ["plantillas-alerta"],
    queryFn: listarPlantillas,
    // Ya no son archivos fijos: la lista cambia cuando se crea una norma.
    staleTime: 60_000,
    enabled: abierto,
  });

  const aplicar = useMutation({
    mutationFn: (plantillaId: string) =>
      aplicarPlantillaAArea(plantillaId, areaId),
    onSuccess: async (r) => {
      setResultado(r);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["area-cumplimiento", areaId] }),
        qc.invalidateQueries({ queryKey: ["reglas-canal"] }),
        qc.invalidateQueries({ queryKey: ["canales"] }),
        qc.invalidateQueries({ queryKey: ["area", areaId] }),
      ]);
    },
  });

  const plantilla = plantillasQ.data?.find((p) => p.id === seleccionada);

  function cerrar() {
    setResultado(null);
    setSeleccionada(null);
    aplicar.reset();
    alCerrar();
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && cerrar()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-4" aria-hidden />
            Aplicar norma al área
          </DialogTitle>
          <DialogDescription>
            Copia las reglas de la norma a los canales del área. Las reglas que
            ya existan no se duplican, y después se pueden editar una a una.
          </DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-3 py-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              <Check className="size-4" aria-hidden />
              Norma aplicada
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <strong>{resultado.creadas}</strong> regla(s) creada(s)
              </li>
              {resultado.repetidas > 0 && (
                <li className="text-muted-foreground">
                  {resultado.repetidas} ya existían (no se duplicaron)
                </li>
              )}
              <li className="text-muted-foreground">
                {resultado.canales} canal(es) revisado(s)
              </li>
              {resultado.omitidas.length > 0 && (
                <li className="text-muted-foreground">
                  {resultado.omitidas.length} regla(s) omitida(s) porque el
                  área no tiene esa magnitud:
                  <span className="ml-1 text-xs">
                    {[...new Set(resultado.omitidas.map((o) => o.variable))].join(
                      ", "
                    )}
                  </span>
                </li>
              )}
            </ul>
          </div>
        ) : plantillasQ.isLoading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto py-1">
            {(plantillasQ.data ?? []).map((p) => {
              const activa = seleccionada === p.id;
              const esActual = perfilActual === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSeleccionada(p.id)}
                  className={
                    "w-full rounded-xl border p-3 text-left transition-colors " +
                    (activa ? "border-primary bg-primary/5" : "hover:bg-muted/50")
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{p.nombre}</span>
                    <Badge variant="secondary" className="text-xs">
                      {p.reglas.length} reglas
                    </Badge>
                    {p.origen === "sistema" && (
                      <Badge variant="outline" className="text-xs">
                        De sistema
                      </Badge>
                    )}
                    {esActual && (
                      <Badge variant="outline" className="text-xs">
                        Actual
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.descripcion}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <TriangleAlert className="size-3 shrink-0" aria-hidden />
                    {p.norma}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {aplicar.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {aplicar.error instanceof Error
              ? aplicar.error.message
              : "No se pudo aplicar la norma"}
          </p>
        )}

        <DialogFooter>
          {resultado ? (
            <Button onClick={cerrar}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={cerrar}>
                Cancelar
              </Button>
              <Button
                disabled={!seleccionada || aplicar.isPending}
                onClick={() => seleccionada && aplicar.mutate(seleccionada)}
              >
                {aplicar.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                Aplicar {plantilla ? `«${plantilla.nombre}»` : ""}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

/**
 * Selector de plantilla de alertas por perfil de entorno.
 *
 * Muestra los perfiles disponibles (quirófano, sala limpia, centro de datos,
 * cadena de frío) con su norma de referencia y permite aplicarlos al canal.
 *
 * Al aplicar, la API crea REGLAS NORMALES: a partir de ahí se pueden editar
 * una a una sin quedar atadas a la plantilla.
 *
 * Se informa de las reglas OMITIDAS: una plantilla de quirófano aplicada a un
 * canal de presión crea solo la regla de presión, y el usuario debe saber por
 * qué no aparecen las demás.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Loader2, TriangleAlert } from "lucide-react";

import {
  aplicarPlantilla,
  listarPlantillas,
  type ResultadoAplicarPlantilla,
} from "@/servicios/plantillas-alerta.servicio";
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

export function SelectorPlantilla({ canalId }: { canalId: string }) {
  const qc = useQueryClient();
  const [resultado, setResultado] = useState<ResultadoAplicarPlantilla | null>(
    null
  );

  const plantillasQ = useQuery({
    queryKey: ["plantillas-alerta"],
    queryFn: listarPlantillas,
    // Los perfiles son archivos: cambian al desplegar, no cada minuto.
    staleTime: 5 * 60_000,
  });

  const aplicar = useMutation({
    mutationFn: (plantillaId: string) => aplicarPlantilla(plantillaId, canalId),
    onSuccess: async (r) => {
      setResultado(r);
      await qc.invalidateQueries({ queryKey: ["reglas-canal", canalId] });
    },
  });

  if (plantillasQ.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plantillas por perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const plantillas = plantillasQ.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4" aria-hidden />
          Plantillas por perfil
        </CardTitle>
        <CardDescription>
          Carga de una vez las reglas recomendadas para el entorno. Se crean
          como reglas normales y puedes ajustarlas después.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {resultado ? (
          <div className="space-y-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
              <Check className="size-4" aria-hidden />
              Se crearon {resultado.creadas} regla
              {resultado.creadas === 1 ? "" : "s"}
            </p>
            {resultado.omitidas.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {resultado.omitidas.length} omitida
                {resultado.omitidas.length === 1 ? "" : "s"} por no
                corresponder al tipo de este canal (
                {resultado.omitidas.map((o) => o.variable).join(", ")}).
              </p>
            ) : null}
          </div>
        ) : null}

        {aplicar.error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {aplicar.error instanceof Error
              ? aplicar.error.message
              : "No se pudo aplicar la plantilla"}
          </p>
        ) : null}

        <ul className="space-y-2">
          {plantillas.map((p) => {
            const enCurso = aplicar.isPending && aplicar.variables === p.id;
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{p.nombre}</span>
                    <Badge variant="secondary" className="text-xs">
                      {p.reglas.length} reglas
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.descripcion}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <TriangleAlert className="size-3 shrink-0" aria-hidden />
                    {p.norma}
                  </p>

                  {/* Valores pendientes de confirmar, si los hay. */}
                  {p.notas.some((n) => n.includes("[verificar]")) ? (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      Contiene valores marcados [verificar]: revísalos antes de
                      usarlos en un entorno real.
                    </p>
                  ) : null}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={aplicar.isPending}
                  onClick={() => aplicar.mutate(p.id)}
                >
                  {enCurso ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  Aplicar
                </Button>
              </li>
            );
          })}
        </ul>

        <p className="text-[11px] text-muted-foreground">
          Las plantillas son archivos en la API. Añadir un perfil nuevo no
          requiere cambiar código.
        </p>
      </CardContent>
    </Card>
  );
}

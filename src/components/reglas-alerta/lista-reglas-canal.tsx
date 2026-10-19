"use client";

/**
 * Lista de reglas de alerta de un canal.
 *
 * ──────────────────────────────────────────────────────────────────────
 * QUÉ CAMBIÓ
 * ──────────────────────────────────────────────────────────────────────
 * Antes cada fila mostraba `{nombre} · {operador}`, es decir:
 *
 *     Temperatura alta · >
 *     Humedad baja · <
 *     Rango seguro · entre
 *
 * El operador es el valor CRUDO de la base de datos. No incluye el umbral,
 * que es justo lo que distingue una regla de otra: dos reglas «Temperatura
 * alta», una con `>` y otra con `>=`, se veían casi iguales y ninguna decía
 * a qué valor dispara.
 *
 * Ahora cada regla muestra:
 *   - El símbolo del operador, grande y de un vistazo.
 *   - La expresión completa con el valor y la unidad (`> 30 °C`).
 *   - La frase en lenguaje natural («Se activa cuando…»).
 *   - Severidad, estado (activa/inactiva) y retardo si lo tiene.
 */
import {
  AlertTriangle,
  Info,
  Siren,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReglaAlerta } from "@/tipos";
import {
  buscarOperador,
  expresionCondicion,
  resumenCondicion,
} from "@/utilidades/reglas-alerta";
import { cn } from "@/lib/utils";

const SEVERIDAD: Record<
  string,
  { etiqueta: string; Icono: LucideIcon; clases: string }
> = {
  info: {
    etiqueta: "Informativa",
    Icono: Info,
    clases: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  warning: {
    etiqueta: "Aviso",
    Icono: AlertTriangle,
    clases:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  critical: {
    etiqueta: "Crítica",
    Icono: Siren,
    clases: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  },
};

export function ListaReglasCanal({
  reglas,
  cargando,
  unidad,
  tipoDato,
}: {
  reglas: ReglaAlerta[];
  cargando: boolean;
  unidad?: string | null;
  tipoDato?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          Reglas de alerta
          {!cargando && reglas.length > 0 ? (
            <Badge variant="secondary">{reglas.length}</Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : reglas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin reglas para este canal. Crea una debajo para empezar a recibir
            alertas.
          </p>
        ) : (
          <ul className="space-y-2">
            {reglas.map((r) => (
              <FilaRegla
                key={r.id}
                regla={r}
                unidad={unidad}
                tipoDato={tipoDato}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FilaRegla({
  regla,
  unidad,
  tipoDato,
}: {
  regla: ReglaAlerta;
  unidad?: string | null;
  tipoDato?: string | null;
}) {
  const definicion = buscarOperador(tipoDato, regla.operador);
  const sev = SEVERIDAD[regla.severidad] ?? SEVERIDAD.warning!;
  const expresion = expresionCondicion(regla, unidad);
  const resumen = resumenCondicion(regla, unidad);

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
        regla.activa ? "bg-card" : "bg-muted/30 opacity-70"
      )}
    >
      {/*
        Símbolo del operador en su propia caja: es lo primero que se mira
        al repasar varias reglas seguidas.
      */}
      <span
        aria-hidden
        title={definicion?.etiqueta}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-base font-semibold tabular-nums text-foreground"
      >
        {definicion?.simbolo ?? regla.operador}
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium">{regla.nombre}</span>

          {/* La expresión completa: es lo que faltaba antes. */}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">
            {expresion}
          </code>

          {!regla.activa ? (
            <Badge variant="outline" className="text-xs">
              Inactiva
            </Badge>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Se activa cuando el valor <strong>{resumen}</strong>
          {definicion ? ` · ${definicion.etiqueta}` : ""}
        </p>

        {/* Mensaje configurado, si lo hay. */}
        {regla.mensaje ? (
          <p className="text-xs italic text-muted-foreground">
            «{regla.mensaje}»
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant="outline" className={cn("gap-1", sev.clases)}>
          <sev.Icono className="size-3" aria-hidden />
          {sev.etiqueta}
        </Badge>
        {regla.retardo_segundos ? (
          <span className="text-[11px] text-muted-foreground">
            tras {regla.retardo_segundos}s
          </span>
        ) : null}
      </div>
    </li>
  );
}

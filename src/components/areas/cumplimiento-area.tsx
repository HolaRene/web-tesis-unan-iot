"use client";

/**
 * Estado de cumplimiento normativo de un área.
 *
 * ──────────────────────────────────────────────────────────────────────
 * QUÉ RESPONDE
 * ──────────────────────────────────────────────────────────────────────
 * «¿Se está cumpliendo la norma en este recinto ahora mismo?»
 *
 * Por cada magnitud se compara el último valor medido con la banda que fija
 * el perfil del área:
 *
 *     Temperatura   23,4 °C   [20 – 24]   ✓ Cumple
 *     Humedad       68,0 %    [20 – 60]   ✗ Fuera
 *     Presión       —         [≥ 2,5]     ○ Sin datos
 *
 * ──────────────────────────────────────────────────────────────────────
 * POR QUÉ MUESTRA LA FECHA DE LA MEDICIÓN
 * ──────────────────────────────────────────────────────────────────────
 * Un valor de hace tres días NO acredita que hoy se cumpla la norma. Se
 * muestra siempre cuándo se midió y se marca como «antiguo» si supera un
 * umbral: decir «cumple» con un dato viejo es peor que no decir nada.
 */
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleHelp,
  Clock,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  TriangleAlert,
  Unplug,
} from "lucide-react";

import { obtenerCumplimientoArea } from "@/servicios/areas.servicio";
import { ESTILO_NIVEL, estiloDeNivel } from "@/utilidades/nivel";
import { BadgeNivel } from "@/components/nivel/badge-nivel";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import { haceTiempo } from "@/utilidades/formato";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

/** A partir de aquí, un dato se considera antiguo y no acredita cumplimiento. */
const DATO_ANTIGUO_MS = 15 * 60_000;

/*
 * Aquí vivía un mapa `ESTILO` propio con «Cumple» / «Fuera de norma».
 *
 * Se eliminó al unificar en `utilidades/nivel.ts`: tener dos mapas hacía
 * que el mismo valor se viera distinto en esta tarjeta y en las demás.
 */

function esAntiguo(medidoEn: string | null): boolean {
  if (!medidoEn) return true;
  return Date.now() - new Date(medidoEn).getTime() > DATO_ANTIGUO_MS;
}

export function CumplimientoArea({ areaId }: { areaId: string }) {
  const q = useQuery({
    queryKey: ["area-cumplimiento", areaId],
    queryFn: () => obtenerCumplimientoArea(areaId),
    refetchInterval: POLLING_RESPALDO_MS,
  });

  if (q.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cumplimiento normativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (q.isError || !q.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cumplimiento normativo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No se pudo cargar el cumplimiento del área.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { perfil, magnitudes, resumen } = q.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden />
            Cumplimiento normativo
          </span>
          {perfil ? (
            <Badge variant="secondary" className="font-normal">
              {perfil.nombre}
            </Badge>
          ) : (
            <Badge variant="outline" className="font-normal">
              Sin perfil declarado
            </Badge>
          )}
        </CardTitle>
        {perfil ? (
          <p className="text-xs text-muted-foreground">{perfil.norma}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Asigna un perfil al área para comparar sus valores con la norma.
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Recuento */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className={ESTILO_NIVEL.bueno.fondo + " gap-1"}>
            <CheckCircle2 className="size-3" aria-hidden />
            {resumen.bueno ?? 0} bueno{resumen.bueno === 1 ? "" : "s"}
          </Badge>
          <Badge
            variant="outline"
            className={ESTILO_NIVEL.advertencia.fondo + " gap-1"}
          >
            <AlertTriangle className="size-3" aria-hidden />
            {resumen.advertencia ?? 0} en advertencia
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "gap-1",
              (resumen.critico ?? 0) > 0 ? ESTILO_NIVEL.critico.fondo : ""
            )}
          >
            <AlertCircle className="size-3" aria-hidden />
            {resumen.critico ?? 0} crítico{resumen.critico === 1 ? "" : "s"}
          </Badge>
          {(resumen.falla ?? 0) > 0 ? (
            <Badge variant="outline" className={ESTILO_NIVEL.falla.fondo + " gap-1"}>
              <Unplug className="size-3" aria-hidden />
              {resumen.falla} con falla de sensor
            </Badge>
          ) : null}
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" aria-hidden />
            {resumen.sin_datos} sin datos
          </Badge>
          {resumen.sin_regla > 0 ? (
            <Badge variant="outline" className="gap-1">
              <CircleHelp className="size-3" aria-hidden />
              {resumen.sin_regla} sin regla
            </Badge>
          ) : null}
        </div>

        {/* Detalle por magnitud */}
        <ul className="space-y-2">
          {magnitudes.map((m) => {
            /*
             * Se pinta el NIVEL (bueno/advertencia/crítico/falla), no el
             * estado de 2 valores anterior. El nivel lo calcula el backend
             * con las reglas: la web no lo reinterpreta.
             */
            const estilo = estiloDeNivel(m.nivel);
            const nivel = m.nivel ?? "sin_regla";
            const antigua =
              nivel !== "sin_regla" && nivel !== "sin_datos" && esAntiguo(m.medido_en);

            return (
              <li
                key={m.tipo_codigo}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2"
              >
                <estilo.Icono
                  className={cn("size-4 shrink-0", estilo.clases)}
                  aria-hidden
                />

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {m.tipo_nombre}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {m.banda
                      ? `Banda ${m.banda}${m.unidad ? ` ${m.unidad}` : ""}`
                      : "Sin banda definida para esta magnitud"}
                    {/*
                      De dónde salió la banda. Un valor puede regirse por una
                      regla propia del canal o, en su defecto, por la norma
                      del recinto: no es lo mismo y conviene poder verlo.
                    */}
                    {m.origen_reglas === "canal" ? (
                      <span className="ml-1 text-[11px] text-muted-foreground/80">
                        (reglas del canal)
                      </span>
                    ) : m.origen_reglas === "area" ? (
                      <span className="ml-1 text-[11px] text-muted-foreground/80">
                        (de la norma del área)
                      </span>
                    ) : null}
                  </span>
                </span>

                <span className="text-right">
                  <span className="block text-sm font-semibold tabular-nums">
                    {m.valor === null ? "—" : m.valor}
                    {m.valor !== null && m.unidad ? ` ${m.unidad}` : ""}
                  </span>
                  <span
                    className={cn(
                      "block text-[11px]",
                      antigua ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                    )}
                  >
                    {m.medido_en ? haceTiempo(m.medido_en) : "sin medición"}
                  </span>
                </span>

                <BadgeNivel nivel={nivel} />

                {/*
                  Un valor marcado [verificar] viene de una fuente sin
                  confirmar: se avisa para que no se cite como normativo.
                */}
                {m.requiere_verificacion ? (
                  <span className="flex w-full items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                    <TriangleAlert className="size-3 shrink-0" aria-hidden />
                    Umbral pendiente de confirmar [verificar]
                  </span>
                ) : null}

                {antigua && m.estado !== 'sin_regla' && m.valor !== null ? (
                  <span className="w-full text-[11px] text-amber-600 dark:text-amber-400">
                    Dato antiguo: no acredita el cumplimiento actual
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

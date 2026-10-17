"use client";

/**
 * Panel de control de actuadores del dashboard.
 *
 * ────────────────────────────────────────────────────────────────────
 * EL WIDGET CAMBIA SEGÚN EL TIPO
 * ────────────────────────────────────────────────────────────────────
 * Cada actuador se dibuja con el control que le corresponde:
 *
 *   - INTERRUPTOR  (relé, LED, motor) → dos estados estables.
 *   - PULSADOR     (buzzer, sirena)   → acción momentánea.
 *   - MULTI        (válvula, puerta)  → abrir / cerrar.
 *
 * El perfil se resuelve por palabra clave sobre el campo `tipo`, que es texto
 * libre en la base de datos (ver `utilidades/actuadores-visual.ts`).
 *
 * ────────────────────────────────────────────────────────────────────
 * IMPORTANTE: EL COMANDO ES ASÍNCRONO
 * ────────────────────────────────────────────────────────────────────
 * Pulsar un botón NO acciona el equipo al instante. El comando se encola en
 * la API con estado `pendiente`, y Node-RED (o el propio ESP32) lo recoge
 * después para entregarlo.
 *
 * Por eso, tras enviar, la tarjeta muestra "Enviado" y no "Encendido": dar
 * por hecho que se ejecutó sería mentir. El estado real llega cuando el equipo
 * confirma.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createElement } from "react";
import { Loader2, Power, ToggleLeft, Zap } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listarActuadores, enviarComando } from "@/servicios/actuadores.servicio";
import { useSesion } from "@/hooks/use-sesion";
import {
  estaActivo,
  perfilDeActuador,
  type PerfilActuador,
} from "@/utilidades/actuadores-visual";
import { haceTiempo } from "@/utilidades";
import type { Actuador } from "@/tipos";

/** Cada cuánto se refresca el estado (el comando lo confirma el equipo). */
const REFRESCO_MS = POLLING_RESPALDO_MS;

export function PanelActuadores() {
  const queryClient = useQueryClient();
  const { usuario } = useSesion();
  const puedeEscribir =
    usuario?.rol === "usuario" || usuario?.rol === "admin";

  const [aviso, setAviso] = useState<string | null>(null);

  const actuadoresQ = useQuery({
    queryKey: ["actuadores-dashboard"],
    queryFn: () => listarActuadores(),
    refetchInterval: REFRESCO_MS,
  });

  const mutComando = useMutation({
    mutationFn: ({
      actuadorId,
      comando,
    }: {
      actuadorId: string;
      comando: string;
    }) => enviarComando(actuadorId, { comando }),
    onSuccess: (_datos, variables) => {
      setAviso(
        `Comando «${variables.comando}» encolado. El equipo lo ejecutará en unos segundos.`
      );
      queryClient.invalidateQueries({ queryKey: ["actuadores-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["actuadores"] });
      setTimeout(() => setAviso(null), 5000);
    },
    onError: (e: Error) => setAviso(`No se pudo enviar: ${e.message}`),
  });

  const actuadores = actuadoresQ.data ?? [];

  if (actuadoresQ.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actuadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actuadoresQ.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudieron cargar los actuadores</AlertTitle>
        <AlertDescription>{(actuadoresQ.error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  if (actuadores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="size-4 text-muted-foreground" aria-hidden />
            Actuadores
          </CardTitle>
          <CardDescription>Salidas controlables del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todavía no hay actuadores. Créalos desde{" "}
            <strong>Actuadores</strong> y aparecerán aquí con su control.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activos = actuadores.filter((a) =>
    estaActivo(a.estado_actual, perfilDeActuador(a.tipo, a.codigo))
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ToggleLeft className="size-4 text-muted-foreground" aria-hidden />
          Actuadores
        </CardTitle>
        <CardDescription>
          {actuadores.length} registrado{actuadores.length === 1 ? "" : "s"}
          {activos > 0 ? ` · ${activos} activo${activos === 1 ? "" : "s"}` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {aviso ? (
          <Alert>
            <AlertDescription>{aviso}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actuadores.map((a) => (
            <TarjetaActuador
              key={a.id}
              actuador={a}
              puedeEscribir={puedeEscribir}
              enviando={mutComando.isPending}
              onComando={(comando) =>
                mutComando.mutate({ actuadorId: a.id, comando })
              }
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          El comando se encola y lo entrega Node-RED o el propio equipo. El
          estado mostrado es el último confirmado, no el que se acaba de pedir.
        </p>
      </CardContent>
    </Card>
  );
}

/** Tarjeta de un actuador, con el control propio de su tipo. */
function TarjetaActuador({
  actuador,
  puedeEscribir,
  enviando,
  onComando,
}: {
  actuador: Actuador;
  puedeEscribir: boolean;
  enviando: boolean;
  onComando: (comando: string) => void;
}) {
  const perfil = perfilDeActuador(actuador.tipo, actuador.codigo);
  const activo = estaActivo(actuador.estado_actual, perfil);
  const deshabilitado = enviando || !actuador.activo || !puedeEscribir;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        activo ? "border-emerald-500/40 bg-emerald-500/5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
              activo ? "bg-emerald-500/15" : "bg-muted"
            }`}
          >
            {createElement(perfil.icono, {
              className: `size-4 ${activo ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`,
              "aria-hidden": true,
            })}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{actuador.nombre}</p>
            <p className="truncate text-xs text-muted-foreground">
              {actuador.tipo}
              {actuador.dispositivo_nombre
                ? ` · ${actuador.dispositivo_nombre}`
                : ""}
            </p>
          </div>
        </div>

        <span className="flex shrink-0 items-center gap-1.5">
          <span
            className={`size-2 rounded-full ${
              activo ? "bg-emerald-500" : "bg-muted-foreground/40"
            }`}
            aria-hidden
          />
          <span className="text-xs text-muted-foreground">
            {actuador.estado_actual ?? "sin estado"}
          </span>
        </span>
      </div>

      {/* El control cambia según la forma del actuador. */}
      <div className="mt-4">
        <ControlesActuador
          perfil={perfil}
          activo={activo}
          deshabilitado={deshabilitado}
          ocupado={enviando}
          onComando={onComando}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {actuador.ultima_orden_en
            ? `Última orden ${haceTiempo(actuador.ultima_orden_en)}`
            : "Sin órdenes registradas"}
        </span>
        {!actuador.activo ? <Badge variant="outline">Desactivado</Badge> : null}
      </div>
    </div>
  );
}

/** Renderiza el control adecuado según la forma del actuador. */
function ControlesActuador({
  perfil,
  activo,
  deshabilitado,
  ocupado,
  onComando,
}: {
  perfil: PerfilActuador;
  activo: boolean;
  deshabilitado: boolean;
  ocupado: boolean;
  onComando: (comando: string) => void;
}) {
  if (!perfil.forma || perfil.forma === "solo-lectura") {
    return (
      <p className="text-xs text-muted-foreground">
        Este actuador es de solo lectura.
      </p>
    );
  }

  const spinner = ocupado ? (
    <Loader2 className="size-3.5 animate-spin" aria-hidden />
  ) : null;

  // ── Pulsador: acción momentánea, se muestra el botón de accionar ──
  if (perfil.forma === "pulsador") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={deshabilitado}
          onClick={() => onComando(perfil.comandoOn)}
        >
          {spinner ?? <Zap className="size-3.5" aria-hidden />}
          {perfil.etiquetaOn}
        </Button>
        {activo ? (
          <Button
            size="sm"
            variant="outline"
            disabled={deshabilitado}
            onClick={() => onComando(perfil.comandoOff)}
          >
            {perfil.etiquetaOff}
          </Button>
        ) : null}
      </div>
    );
  }

  // ── Multi: varios estados posibles ──
  if (perfil.forma === "multi") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activo ? "outline" : "default"}
          disabled={deshabilitado || activo}
          onClick={() => onComando(perfil.comandoOn)}
        >
          {activo ? null : spinner}
          {perfil.etiquetaOn}
        </Button>
        <Button
          size="sm"
          variant={activo ? "default" : "outline"}
          disabled={deshabilitado || !activo}
          onClick={() => onComando(perfil.comandoOff)}
        >
          {activo ? spinner : null}
          {perfil.etiquetaOff}
        </Button>
      </div>
    );
  }

  /*
   * ── Interruptor: dos estados estables ──
   *
   * Se muestra un único botón que alterna. Enviar el comando contrario al
   * estado actual es más claro que dos botones, donde uno siempre está
   * deshabilitado.
   */
  return (
    <Button
      size="sm"
      variant={activo ? "outline" : "default"}
      disabled={deshabilitado}
      onClick={() => onComando(activo ? perfil.comandoOff : perfil.comandoOn)}
    >
      {spinner ?? <Power className="size-3.5" aria-hidden />}
      {activo ? perfil.etiquetaOff : perfil.etiquetaOn}
    </Button>
  );
}

"use client";

/**
 * Gestión de Actuadores (/actuadores).
 *
 * ────────────────────────────────────────────────────────────────────
 * QUÉ HACE ENVIAR UN COMANDO (y qué NO hace)
 * ────────────────────────────────────────────────────────────────────
 * Pulsar un botón NO enciende nada de inmediato. El comando se ENCOLA en la
 * base de datos con estado `pendiente`, y el recorrido hasta el equipo es:
 *
 *     web ──► API (pendiente) ──► Node-RED ──► MQTT ──► ESP32 / PLC
 *                    │
 *                    └── confirma 'enviado' y 'ejecutado'
 *
 * Por eso la tabla muestra el ESTADO de cada comando: uno recién enviado
 * aparece como "Pendiente" hasta que Node-RED lo entrega. Ver "Pendiente"
 * durante unos segundos es normal; quedarse ahí significa que Node-RED no
 * está recogiendo comandos.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
  Pencil,
  Plus,
  Power,
  RadioTower,
  ToggleRight,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormularioActuador } from "@/components/actuadores/formulario-actuador";

import {
  listarActuadores,
  enviarComando,
  listarComandosDeActuador,
  crearActuador,
  actualizarActuador,
  eliminarActuador,
  type DatosActuador,
} from "@/servicios/actuadores.servicio";
import { listarDispositivos } from "@/servicios/dispositivos.servicio";
import { useSesion } from "@/hooks/use-sesion";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import { formatearFecha, haceTiempo } from "@/utilidades";
import type { Actuador, ComandoActuador, EstadoComando } from "@/tipos";

export function GestionActuadores() {
  const queryClient = useQueryClient();
  const { usuario } = useSesion();
  const puedeEscribir = usuario?.rol === "usuario" || usuario?.rol === "admin";

  const actuadoresQ = useQuery({
    queryKey: ["actuadores"],
    queryFn: () => listarActuadores(),
    // El estado puede cambiar por la confirmación de Node-RED, así que se
    // refresca solo (el WebSocket no cubre los comandos todavía).
    refetchInterval: POLLING_RESPALDO_MS,
  });

  const actuadores = useMemo(() => actuadoresQ.data ?? [], [actuadoresQ.data]);

  /*
   * Dispositivos para el desplegable del formulario.
   *
   * El formulario NO se monta hasta que esta consulta termina: inicializa su
   * estado con los dispositivos, y `useState` solo lee el valor inicial en el
   * primer render. Montarlo antes dejaba el desplegable vacío para siempre.
   * Ver `docs/formularios-carga-asincrona.md`.
   */
  const dispositivosQ = useQuery({
    queryKey: ["dispositivos"],
    queryFn: () => listarDispositivos(),
  });

  const [seleccionado, setSeleccionado] = useState<Actuador | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Estado del formulario de alta y edición.
  const [formAbierto, setFormAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Actuador | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<Actuador | null>(null);

  function abrirCrear() {
    setEnEdicion(null);
    setErrorForm(null);
    setFormAbierto(true);
  }

  function abrirEditar(a: Actuador) {
    setEnEdicion(a);
    setErrorForm(null);
    setFormAbierto(true);
  }

  const mutGuardar = useMutation({
    mutationFn: (datos: DatosActuador) =>
      enEdicion
        ? actualizarActuador(enEdicion.id, datos)
        : crearActuador(datos),
    onSuccess: (guardado) => {
      setAviso(
        enEdicion
          ? `Actuador «${guardado.nombre}» actualizado.`
          : `Actuador «${guardado.nombre}» creado con el código ${guardado.codigo}.`
      );
      setFormAbierto(false);
      setEnEdicion(null);
      queryClient.invalidateQueries({ queryKey: ["actuadores"] });
      setTimeout(() => setAviso(null), 6000);
    },
    onError: (e: Error) => setErrorForm(e.message),
  });

  const mutEliminar = useMutation({
    mutationFn: (id: string) => eliminarActuador(id),
    onSuccess: () => {
      setBorrando(null);
      queryClient.invalidateQueries({ queryKey: ["actuadores"] });
    },
    onError: (e: Error) => setAviso(`No se pudo eliminar: ${e.message}`),
  });

  const mutEnviar = useMutation({
    mutationFn: ({
      actuadorId,
      comando,
    }: {
      actuadorId: string;
      comando: string;
    }) => enviarComando(actuadorId, { comando }),
    onSuccess: (_, variables) => {
      setAviso(
        `Comando «${variables.comando}» encolado. Node-RED lo entregará en unos segundos.`
      );
      // Refrescar el historial y el estado del actuador.
      queryClient.invalidateQueries({ queryKey: ["comandos", variables.actuadorId] });
      queryClient.invalidateQueries({ queryKey: ["actuadores"] });
      setTimeout(() => setAviso(null), 6000);
    },
  });

  if (actuadoresQ.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (actuadoresQ.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar actuadores</AlertTitle>
        <AlertDescription>{(actuadoresQ.error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Actuadores</h1>
          <p className="text-sm text-muted-foreground">
            Salidas controlables (relés, válvulas, motores). Al enviar un comando,
            la orden se encola y Node-RED la entrega al equipo.
          </p>
        </div>

        {puedeEscribir ? (
          <Button onClick={abrirCrear}>
            <Plus className="size-4" aria-hidden />
            Nuevo actuador
          </Button>
        ) : null}
      </div>

      {aviso ? (
        <Alert>
          <AlertTitle>Comando enviado</AlertTitle>
          <AlertDescription>{aviso}</AlertDescription>
        </Alert>
      ) : null}

      {actuadores.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <ToggleRight
              className="mx-auto mb-3 size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="font-medium">Todavía no hay actuadores</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea uno indicando el dispositivo al que pertenece. Después podrás
              enviarle comandos desde aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {actuadores.map((a) => (
            <TarjetaActuador
              key={a.id}
              actuador={a}
              puedeEscribir={puedeEscribir}
              enviando={mutEnviar.isPending}
              onComando={(comando) =>
                mutEnviar.mutate({ actuadorId: a.id, comando })
              }
              onVerHistorial={() => setSeleccionado(a)}
              onEditar={() => abrirEditar(a)}
              onEliminar={() => setBorrando(a)}
            />
          ))}
        </div>
      )}

      {/*
        El formulario solo se monta cuando los dispositivos están cargados.
        Montarlo antes dejaría el desplegable vacío: su estado inicial se
        congela en el primer render.
      */}
      {dispositivosQ.isLoading ? null : (
        <FormularioActuador
          key={enEdicion?.id ?? "nuevo"}
          abierto={formAbierto}
          actuador={enEdicion}
          dispositivos={dispositivosQ.data ?? []}
          enviando={mutGuardar.isPending}
          error={errorForm}
          onOpenChange={(val) => {
            setFormAbierto(val);
            if (!val) {
              setEnEdicion(null);
              setErrorForm(null);
            }
          }}
          onGuardar={(datos) => mutGuardar.mutate(datos)}
        />
      )}

      {/* Confirmación de borrado */}
      {borrando ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              ¿Eliminar «{borrando.nombre}»?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Se eliminará el actuador y su código{" "}
              <code>{borrando.codigo}</code>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={mutEliminar.isPending}
                onClick={() => mutEliminar.mutate(borrando.id)}
              >
                {mutEliminar.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-4" aria-hidden />
                )}
                Eliminar
              </Button>
              <Button variant="ghost" onClick={() => setBorrando(null)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {seleccionado ? (
        <HistorialComandos
          actuador={seleccionado}
          onCerrar={() => setSeleccionado(null)}
        />
      ) : null}
    </div>
  );
}

/** Tarjeta de un actuador con sus botones de comando. */
function TarjetaActuador({
  actuador,
  puedeEscribir,
  enviando,
  onComando,
  onVerHistorial,
  onEditar,
  onEliminar,
}: {
  actuador: Actuador;
  puedeEscribir: boolean;
  enviando: boolean;
  onComando: (comando: string) => void;
  onVerHistorial: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const estado = (actuador.estado_actual ?? "").toLowerCase();
  const encendido = estado === "on" || estado === "abierto" || estado === "activo";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{actuador.nombre}</CardTitle>
            <p className="text-xs text-muted-foreground">
              <code>{actuador.codigo}</code>
              {actuador.tipo ? ` · ${actuador.tipo}` : ""}
              {actuador.dispositivo_nombre
                ? ` · ${actuador.dispositivo_nombre}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={encendido ? "secondary" : "outline"}>
              {actuador.estado_actual ?? "sin estado"}
            </Badge>
            {!actuador.activo ? (
              <Badge variant="outline">Desactivado</Badge>
            ) : null}
            {puedeEscribir ? (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Editar actuador"
                  title="Editar"
                  onClick={onEditar}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar actuador"
                  title="Eliminar"
                  onClick={onEliminar}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Botones de comando */}
        {puedeEscribir ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={enviando || !actuador.activo}
              onClick={() => onComando("ON")}
            >
              {enviando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Power className="size-4" aria-hidden />
              )}
              Encender
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={enviando || !actuador.activo}
              onClick={() => onComando("OFF")}
            >
              Apagar
            </Button>
            <Button size="sm" variant="ghost" onClick={onVerHistorial}>
              Ver comandos
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Tu rol permite ver, pero no enviar comandos.
            </p>
            <Button size="sm" variant="ghost" onClick={onVerHistorial}>
              Ver comandos
            </Button>
          </div>
        )}

        {/*
          Recordatorio explícito de que el comando es asíncrono: pulsar el
          botón no enciende el equipo al instante.
        */}
        <p className="text-xs text-muted-foreground">
          El comando se encola y Node-RED lo entrega al equipo por MQTT.
        </p>
      </CardContent>
    </Card>
  );
}

/** Historial de comandos de un actuador, con su estado de entrega. */
function HistorialComandos({
  actuador,
  onCerrar,
}: {
  actuador: Actuador;
  onCerrar: () => void;
}) {
  const comandosQ = useQuery({
    queryKey: ["comandos", actuador.id],
    queryFn: () => listarComandosDeActuador(actuador.id, 20),
    // Mientras haya comandos sin confirmar, se refresca para ver cuándo
    // Node-RED los marca como enviados o ejecutados.
    refetchInterval: POLLING_RESPALDO_MS,
  });

  const comandos = comandosQ.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              Comandos de {actuador.nombre}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              <RadioTower className="mr-1 inline size-3" aria-hidden />
              Los estados los actualiza Node-RED al entregar la orden.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {comandosQ.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : comandos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este actuador no ha recibido comandos todavía.
          </p>
        ) : (
          <ul className="divide-y">
            {comandos.map((c) => (
              <FilaComando key={c.id} comando={c} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Una fila del historial, con el ciclo de vida del comando. */
function FilaComando({ comando }: { comando: ComandoActuador }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {comando.comando}
          {comando.valor ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {JSON.stringify(comando.valor)}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatearFecha(comando.creado_en)}
          {comando.enviado_en
            ? ` · entregado ${haceTiempo(comando.enviado_en)}`
            : ""}
          {comando.ejecutado_en
            ? ` · ejecutado ${haceTiempo(comando.ejecutado_en)}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {comando.estado === "pendiente" ? (
          <AlertCircle className="size-3 text-muted-foreground" aria-hidden />
        ) : null}
        <Badge variant={varianteEstadoComando(comando.estado)}>
          {comando.estado}
        </Badge>
      </div>
    </li>
  );
}

/**
 * Color del badge según el estado del comando.
 *
 * `enviado` se marca como "secondary" (no destructivo) porque aún no se sabe
 * si el equipo lo aplicó; `ejecutado` confirma que sí.
 */
function varianteEstadoComando(
  estado: EstadoComando
): "default" | "secondary" | "destructive" | "outline" {
  switch (estado) {
    case "ejecutado":
      return "secondary";
    case "fallido":
      return "destructive";
    case "pendiente":
      return "outline";
    default:
      return "default";
  }
}

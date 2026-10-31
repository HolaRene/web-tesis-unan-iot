"use client";

/**
 * Formulario dinámico para crear reglas de alerta.
 *
 * Se adapta al tipo de dato del canal (numeric / boolean / text); json no
 * admite reglas genéricas.
 *
 * ──────────────────────────────────────────────────────────────────────
 * POR QUÉ SE REESCRIBIÓ LA PARTE DE CONDICIONES
 * ──────────────────────────────────────────────────────────────────────
 * Antes había un `<select>` nativo con un ternario anidado que convertía
 * `>` en «mayor que», `>=` en «mayor o igual»… Siete ramas en una sola línea,
 * imposibles de mantener, y el usuario solo veía texto suelto.
 *
 * Ahora cada operador es un objeto con SÍMBOLO (`>`), ETIQUETA («Mayor que»)
 * y DESCRIPCIÓN («Avisa cuando supere el valor»). Con eso se puede:
 *
 *   - Pintar un selector visual con botones en lugar de un desplegable.
 *   - Mostrar el símbolo grande, que es como se leen las condiciones.
 *   - Explicar qué hace cada opción sin adivinarlo.
 *   - Construir una vista previa de la regla en lenguaje natural.
 */
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Info,
  Siren,
  type LucideIcon,
} from "lucide-react";

import { crearReglaAlerta } from "@/servicios/reglas-alerta.servicio";
import type { Canal } from "@/tipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  operadoresDe,
  resumenCondicion,
  type DefinicionOperador,
} from "@/utilidades/reglas-alerta";
import { VistaPreviaNivel } from "@/components/reglas-alerta/vista-previa-nivel";

// ─────────────────────────────────────────────────────────────────────
// Severidades
// ─────────────────────────────────────────────────────────────────────

type Severidad = "info" | "warning" | "critical";

const SEVERIDADES: {
  valor: Severidad;
  etiqueta: string;
  detalle: string;
  Icono: LucideIcon;
  /** Clases del estado seleccionado. */
  activa: string;
}[] = [
  {
    valor: "info",
    etiqueta: "Informativa",
    detalle: "Solo registra el aviso",
    Icono: Info,
    activa: "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    valor: "warning",
    etiqueta: "Aviso",
    detalle: "Requiere atención pronto",
    Icono: AlertTriangle,
    activa:
      "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    valor: "critical",
    etiqueta: "Crítica",
    detalle: "Actúa de inmediato",
    Icono: Siren,
    activa: "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────────────────────────────

/**
 * Selector visual de condición.
 *
 * Botones en rejilla en lugar de un desplegable: se ven TODAS las opciones
 * a la vez, con su símbolo, y se elige en un clic. Con un `<select>` había
 * que abrirlo para saber qué se podía elegir.
 */
function SelectorCondicion({
  operadores,
  valor,
  onCambiar,
}: {
  operadores: DefinicionOperador[];
  valor: string;
  onCambiar: (v: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Condición de la regla"
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      {operadores.map((op) => {
        const activo = op.valor === valor;
        return (
          <button
            key={op.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onCambiar(op.valor)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
              "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activo
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card"
            )}
          >
            {/*
              El símbolo se pinta grande y en su propia caja: es lo que se
              lee de un vistazo al repasar las reglas de un canal.
            */}
            <span
              aria-hidden
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg text-base font-semibold tabular-nums",
                activo
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {op.simbolo}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-tight">
                {op.etiqueta}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                {op.descripcion}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Vista previa de la regla en lenguaje natural.
 *
 * Sirve para detectar el error más común al configurar umbrales: confundir
 * el sentido de la comparación. «Mayor que 30» y «Menor que 30» son una
 * letra de diferencia y disparan en situaciones opuestas.
 *
 * Construye un objeto con la MISMA forma que una regla guardada y delega en
 * `resumenCondicion`. Así el formulario y la lista no pueden decir cosas
 * distintas: una sola función decide cómo se lee una regla.
 */
function VistaPrevia({
  nombre,
  definicion,
  unidad,
  refNum,
  vmin,
  vmax,
  refText,
  severidad,
}: {
  nombre: string;
  definicion: DefinicionOperador | undefined;
  unidad: string;
  refNum: string;
  vmin: string;
  vmax: string;
  refText: string;
  severidad: Severidad;
}) {
  const sev = SEVERIDADES.find((s) => s.valor === severidad)!;
  const aNumero = (v: string) => (v.trim() === "" ? null : Number(v));

  const resumen = resumenCondicion(
    {
      operador: definicion?.valor ?? "",
      valor_referencia_numerico: aNumero(refNum),
      valor_min: aNumero(vmin),
      valor_max: aNumero(vmax),
      valor_referencia_texto: refText.trim() || null,
    },
    unidad
  );

  return (
    <div className="rounded-xl border border-dashed bg-muted/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Resumen de la regla
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed">
        <span className="font-medium">{nombre.trim() || "Sin nombre"}</span>
        <span className="text-muted-foreground">se activará cuando el valor</span>
        <span className="font-medium">{resumen}</span>
        <span className="text-muted-foreground">·</span>
        <Badge variant="outline" className={cn("gap-1", sev.activa)}>
          <sev.Icono className="size-3" aria-hidden />
          {sev.etiqueta}
        </Badge>
      </p>
      {definicion ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex size-5 items-center justify-center rounded bg-muted font-semibold tabular-nums">
            {definicion.simbolo}
          </span>
          {definicion.etiqueta} — {definicion.descripcion}
        </p>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Formulario
// ─────────────────────────────────────────────────────────────────────

export default function FormularioRegla({ canal }: { canal: Canal }) {
  const tipoDato = (canal.tipo_dato ?? "text").toLowerCase();
  const esNum = tipoDato.startsWith("numer");
  const esText = tipoDato === "text";

  const operadores = operadoresDe(tipoDato);

  const [operador, setOperador] = useState<string>(operadores[0]?.valor ?? "");
  const [nombre, setNombre] = useState("");
  const [refNum, setRefNum] = useState("");
  const [vmin, setVmin] = useState("");
  const [vmax, setVmax] = useState("");
  const [refText, setRefText] = useState("");
  const [severidad, setSeveridad] = useState<Severidad>("warning");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);

  const usaRango = esNum && (operador === "entre" || operador === "fuera_de_rango");
  const definicion = operadores.find((o) => o.valor === operador);

  /*
   * Validación local antes de enviar.
   *
   * El backend rechaza referencias vacías, pero un mensaje genérico de
   * validación no dice qué campo falta. Aquí se comprueba lo justo para dar
   * un aviso concreto.
   */
  const faltaReferencia = esNum
    ? usaRango
      ? vmin.trim() === "" || vmax.trim() === ""
      : refNum.trim() === ""
    : esText
      ? refText.trim() === ""
      : false;

  const rangoInvalido =
    usaRango &&
    vmin.trim() !== "" &&
    vmax.trim() !== "" &&
    Number(vmin) > Number(vmax);

  const puedeGuardar =
    nombre.trim() !== "" && !faltaReferencia && !rangoInvalido;

  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () =>
      crearReglaAlerta({
        canal_id: canal.id,
        nombre: nombre.trim(),
        severidad,
        mensaje: mensaje.trim() || null,
        operador,
        valor_referencia_numerico:
          esNum && !usaRango ? Number(refNum) : null,
        valor_min: esNum && usaRango ? Number(vmin) : null,
        valor_max: esNum && usaRango ? Number(vmax) : null,
        valor_referencia_texto: esText ? refText.trim() || null : null,
        activa: true,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reglas-canal", canal.id] });
      setNombre("");
      setRefNum("");
      setVmin("");
      setVmax("");
      setRefText("");
      setMensaje("");
      setOperador(operadores[0]?.valor ?? "");
      setError(null);
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "No se pudo crear la regla"),
  });

  if (operadores.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Este tipo de dato no admite reglas por umbral.
      </p>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Nueva regla de alerta</h3>
        <p className="text-sm text-muted-foreground">
          Se aplicará a <strong>{canal.nombre}</strong>
          {canal.unidad ? ` (${canal.unidad})` : ""}.
        </p>
      </div>

      {/* ── Nombre ── */}
      <div className="grid gap-2">
        <Label htmlFor="reg-nombre">Nombre de la regla</Label>
        <Input
          id="reg-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Temperatura alta"
        />
      </div>

      {/* ── Condición ── */}
      <div className="grid gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label>¿Cuándo debe avisar?</Label>
          {definicion ? (
            <span className="text-xs text-muted-foreground">
              {definicion.descripcion}
            </span>
          ) : null}
        </div>
        <SelectorCondicion
          operadores={operadores}
          valor={operador}
          onCambiar={setOperador}
        />
      </div>

      {/* ── Valor de referencia ── */}
      {esNum &&
        (usaRango ? (
          <div className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="reg-min">
                Límite inferior
                {canal.unidad ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({canal.unidad})
                  </span>
                ) : null}
              </Label>
              <Input
                id="reg-min"
                type="number"
                inputMode="decimal"
                value={vmin}
                onChange={(e) => setVmin(e.target.value)}
                aria-invalid={rangoInvalido}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-max">
                Límite superior
                {canal.unidad ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({canal.unidad})
                  </span>
                ) : null}
              </Label>
              <Input
                id="reg-max"
                type="number"
                inputMode="decimal"
                value={vmax}
                onChange={(e) => setVmax(e.target.value)}
                aria-invalid={rangoInvalido}
              />
            </div>
            {rangoInvalido ? (
              <p className="text-sm text-destructive sm:col-span-2">
                El límite inferior no puede ser mayor que el superior.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="reg-ref">
              Valor de referencia
              {canal.unidad ? (
                <span className="ml-1 font-normal text-muted-foreground">
                  ({canal.unidad})
                </span>
              ) : null}
            </Label>
            <Input
              id="reg-ref"
              type="number"
              inputMode="decimal"
              value={refNum}
              onChange={(e) => setRefNum(e.target.value)}
              placeholder={operador === ">" || operador === ">=" ? "30" : "18"}
            />
          </div>
        ))}

      {esText && (
        <div className="grid gap-2">
          <Label htmlFor="reg-texto">Texto de referencia</Label>
          <Input
            id="reg-texto"
            value={refText}
            onChange={(e) => setRefText(e.target.value)}
            placeholder="error"
          />
        </div>
      )}

      {/* ── Severidad ── */}
      <div className="grid gap-2">
        <Label>Severidad</Label>
        <div
          role="radiogroup"
          aria-label="Severidad de la alerta"
          className="grid gap-2 sm:grid-cols-3"
        >
          {SEVERIDADES.map((s) => {
            const activa = s.valor === severidad;
            return (
              <button
                key={s.valor}
                type="button"
                role="radio"
                aria-checked={activa}
                onClick={() => setSeveridad(s.valor)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors",
                  "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activa ? s.activa : "border-border bg-card text-muted-foreground"
                )}
              >
                <s.Icono className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">
                    {s.etiqueta}
                  </span>
                  <span className="block text-xs leading-snug opacity-80">
                    {s.detalle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mensaje ── */}
      <div className="grid gap-2">
        <Label htmlFor="reg-msg">Mensaje de la alerta (opcional)</Label>
        <Input
          id="reg-msg"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="La temperatura del quirófano está fuera del rango seguro"
        />
        <p className="text-xs text-muted-foreground">
          Si se deja vacío se usará un texto generado a partir de la condición.
        </p>
      </div>

      {/* ── Vista previa ── */}
      <VistaPrevia
        nombre={nombre}
        definicion={definicion}
        unidad={canal.unidad ?? ""}
        refNum={refNum}
        vmin={vmin}
        vmax={vmax}
        refText={refText}
        severidad={severidad}
      />

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!puedeGuardar || mut.isPending}
          onClick={() => mut.mutate()}
        >
          {mut.isPending ? "Guardando…" : "Crear regla"}
        </Button>
        {/*
          Vista previa del nivel con el último valor del canal.
          Consulta al backend: NO se recalcula aquí la clasificación.
        */}
        <VistaPreviaNivel
          valor={canal.ultimo_valor_numerico ?? null}
          unidad={canal.unidad}
          reglas={[
            {
              variable: canal.codigo,
              tipos_variable: [canal.tipo_codigo ?? "TEMPERATURA"],
              nombre: nombre.trim() || "Regla en edición",
              operador,
              valor_referencia_numerico:
                esNum && !usaRango ? Number(refNum) || null : null,
              valor_min: esNum && usaRango ? Number(vmin) || null : null,
              valor_max: esNum && usaRango ? Number(vmax) || null : null,
              severidad,
              mensaje: mensaje.trim() || null,
            },
          ]}
        />
        {faltaReferencia ? (
          <span className="text-xs text-muted-foreground">
            Indica el valor de referencia para continuar.
          </span>
        ) : null}
      </div>
    </div>
  );
}

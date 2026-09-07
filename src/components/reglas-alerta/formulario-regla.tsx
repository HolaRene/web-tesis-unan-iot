"use client";

/**
 * Formulario dinámico para crear reglas de alerta según el tipo de dato
 * del canal (numeric / boolean / text). json no soporta reglas genéricas.
 */
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { crearReglaAlerta } from "@/servicios/reglas-alerta.servicio";
import type { Canal } from "@/tipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectCls =
  "h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground";

const OPERADORES_NUMERIC = [">", ">=", "<", "<=", "=", "entre", "fuera_de_rango"];
const OPERADORES_BOOLEAN = ["es_true", "es_false"];
const OPERADORES_TEXT = ["igual_a", "diferente_de", "contiene"];

export default function FormularioRegla({ canal }: { canal: Canal }) {
  const tipoDato = (canal.tipo_dato ?? "text").toLowerCase();
  const propReglas = tipoDato.startsWith("numer")
    ? OPERADORES_NUMERIC
    : tipoDato === "boolean"
      ? OPERADORES_BOOLEAN
      : tipoDato === "text"
        ? OPERADORES_TEXT
        : [];

  const [operador, setOperador] = useState(propReglas[0] ?? "");
  const [nombre, setNombre] = useState("");
  const [refNum, setRefNum] = useState("");
  const [vmin, setVmin] = useState("");
  const [vmax, setVmax] = useState("");
  const [refText, setRefText] = useState("");
  const [severidad, setSeveridad] = useState<"info" | "warning" | "critical">("warning");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);

  const esNum = tipoDato.startsWith("numer");
  const usaRango = esNum && (operador === "entre" || operador === "fuera_de_rango");
  const esText = tipoDato === "text";

  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => {
      const base = {
        nombre: nombre.trim(),
        severidad,
        mensaje: mensaje.trim() || null,
        operador,
        valor_referencia_numerico: esNum && !usaRango ? Number(refNum) || null : null,
        valor_min: esNum && usaRango ? Number(vmin) || null : null,
        valor_max: esNum && usaRango ? Number(vmax) || null : null,
        valor_referencia_texto: esText ? refText.trim() || null : null,
        activa: true,
      };
      return crearReglaAlerta({ canal_id: canal.id, ...base });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reglas-canal", canal.id] });
      setNombre(""); setRefNum(""); setVmin(""); setVmax(""); setRefText(""); setMensaje("");
      setOperador(propReglas[0] ?? "");
    },
    onError: (e) => setError(e instanceof Error ? e.message : "No se pudo crear la regla"),
  });

  if (propReglas.length === 0) {
    return <p className="text-sm text-muted-foreground">Este tipo de dato no admite reglas.</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <Label>Nueva regla</Label>
      <div className="grid gap-2">
        <Label htmlFor="reg-nombre">Nombre</Label>
        <Input id="reg-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
          placeholder="Temperatura alta" />
      </div>

      {esNum && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="reg-cond">Condición (operador)</Label>
            <select id="reg-cond" className={selectCls} value={operador}
              onChange={(e) => setOperador(e.target.value)}>
              {OPERADORES_NUMERIC.map((op) => (
                <option key={op} value={op}>{op === ">" ? "mayor que" : op === ">=" ? "mayor o igual" : op === "<" ? "menor que" : op === "<=" ? "menor o igual" : op === "=" ? "igual" : op === "entre" ? "entre" : "fuera de rango"}</option>
              ))}
            </select>
          </div>
          {usaRango ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label>Valor mínimo</Label>
                <Input type="number" value={vmin} onChange={(e) => setVmin(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Valor máximo</Label>
                <Input type="number" value={vmax} onChange={(e) => setVmax(e.target.value)} /></div>
            </div>
          ) : (
            <div className="grid gap-2 flex-wrap items-center">
              <Label htmlFor="reg-ref">Valor de referencia ({canal.unidad ?? ""})</Label>
              <Input id="reg-ref" type="number" value={refNum}
                onChange={(e) => setRefNum(e.target.value)} />
            </div>
          )}
        </>
      )}

      {tipoDato === "text" && (
        <>
          <div className="grid gap-2">
            <Label>Textos: condición</Label>
            <select className={selectCls} value={operador}
              onChange={(e) => setOperador(e.target.value)}>
              {OPERADORES_TEXT.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Texto de referencia</Label>
            <Input value={refText} onChange={(e) => setRefText(e.target.value)}
              placeholder="error" />
          </div>
        </>
      )}

      {tipoDato === "boolean" && (
        <div className="grid gap-2">
          <div className="grid gap-2">
            <Label>Condición (booleano)</Label>
            <select className={selectCls} value={operador}
              onChange={(e) => setOperador(e.target.value)}>
              {OPERADORES_BOOLEAN.map((op) => (
                <option key={op} value={op}>{op === "es_true" ? "El valor es verdadero" : "El valor es falso"}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="reg-sev">Severidad</Label>
        <select id="reg-sev" className={selectCls} value={severidad}
          onChange={(e) => setSeveridad(e.target.value as "info" | "warning" | "critical")}>
          <option value="info">info</option>
          <option value="warning">warning (aviso)</option>
          <option value="critical">critical (crítico)</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="reg-msg">Mensaje (opcional)</Label>
        <Input id="reg-msg" value={mensaje} onChange={(e) => setMensaje(e.target.value)}
          placeholder="Condición incumplida" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="button" disabled={!nombre.trim() || mut.isPending}
        onClick={() => mut.mutate()}>
        {mut.isPending ? "Guardando…" : "Crear regla"}
      </Button>
    </div>
  );
}

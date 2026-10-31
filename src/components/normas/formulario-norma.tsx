"use client";

/**
 * Formulario de norma.
 *
 * Permite crear («Invernadero», «Cámara fría») o editar una existente.
 *
 * La validación del cliente NO sustituye a la del servidor: replica las
 * mismas reglas para avisar antes de enviar, pero la API vuelve a validar
 * con zod. Un cliente manipulado no debe poder meter una banda invertida.
 */
import { useState } from "react";
import { Plus, X } from "lucide-react";

import type {
  DatosNorma,
  PlantillaAlerta,
  ReglaPlantilla,
} from "@/servicios/plantillas-alerta.servicio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  /** Norma a editar; `null` para crear una nueva. */
  norma: PlantillaAlerta | null;
  alGuardar: (datos: Omit<DatosNorma, "id">) => Promise<void>;
  alCancelar: () => void;
}

const REGLA_VACIA: ReglaPlantilla = {
  variable: "",
  tipos_variable: ["TEMPERATURA"],
  nombre: "",
  operador: "fuera_de_rango",
  valor_min: null,
  valor_max: null,
  severidad: "warning",
  mensaje: null,
};

/** Convierte un texto a número, o `null` si está vacío. */
function aNumero(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Valida la norma antes de enviarla.
 *
 * Devuelve el primer problema encontrado, o `null` si está bien.
 */
function validar(id: string, nombre: string, norma: string, reglas: ReglaPlantilla[]) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    return "El identificador solo admite minúsculas, números y guiones.";
  }
  if (!nombre.trim()) return "El nombre es obligatorio.";
  if (!norma.trim()) return "La norma de referencia es obligatoria.";
  if (reglas.length === 0) return "Añade al menos una regla.";
  if (reglas.some((r) => !r.tipos_variable.length)) {
    return "Cada regla debe indicar al menos un tipo de variable.";
  }
  for (const r of reglas) {
    if (r.operador === "fuera_de_rango" || r.operador === "entre") {
      if (
        r.valor_min === null ||
        r.valor_min === undefined ||
        r.valor_max === null ||
        r.valor_max === undefined
      ) {
        return `La regla «${r.nombre || r.variable}» necesita mínimo y máximo.`;
      }
      /*
       * Una banda invertida (60–40) nunca se dispara con `entre` y siempre
       * con `fuera_de_rango`. Es un error silencioso que la API ya rechaza;
       * aquí se avisa antes.
       */
      if (r.valor_min >= r.valor_max) {
        return `En «${r.nombre || r.variable}», el mínimo debe ser menor que el máximo.`;
      }
    } else if (r.valor_referencia_numerico === null || r.valor_referencia_numerico === undefined) {
      return `La regla «${r.nombre || r.variable}» necesita un valor de referencia.`;
    }
  }
  return null;
}

export function FormularioNorma({ norma, alGuardar, alCancelar }: Props) {
  const [id, setId] = useState(norma?.id ?? "");
  const [nombre, setNombre] = useState(norma?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(norma?.descripcion ?? "");
  const [referencia, setReferencia] = useState(norma?.norma ?? "");
  const [reglas, setReglas] = useState<ReglaPlantilla[]>(
    norma?.reglas ?? [REGLA_VACIA]
  );

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const esNueva = norma === null;

  function actualizarRegla(i: number, cambios: Partial<ReglaPlantilla>) {
    setReglas((prev) =>
      prev.map((r, j) => (j === i ? { ...r, ...cambios } : r))
    );
  }

  async function enviar() {
    const problema = validar(id, nombre, referencia, reglas);
    if (problema) {
      setError(problema);
      return;
    }

    setError(null);
    setGuardando(true);
    try {
      await alGuardar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        norma: referencia.trim(),
        notas: norma?.notas ?? [],
        reglas,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la norma");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5">
      <h3 className="text-base font-semibold">
        {esNueva ? "Nueva norma" : `Editar «${norma.nombre}»`}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="norma-id">Identificador</Label>
          <Input
            id="norma-id"
            value={id}
            onChange={(e) => setId(e.target.value.toLowerCase())}
            placeholder="camara-fria-almacen"
            // Un id existente no se puede cambiar: otras áreas lo referencian.
            disabled={!esNueva}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Solo minúsculas, números y guiones. No se puede cambiar después.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="norma-nombre">Nombre</Label>
          <Input
            id="norma-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Cámara fría de almacén"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="norma-ref">Norma de referencia</Label>
          <Input
            id="norma-ref"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Reglamento sanitario aplicable / norma interna"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="norma-desc">Descripción</Label>
          <Input
            id="norma-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Para qué sirve esta norma"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Reglas</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReglas((r) => [...r, { ...REGLA_VACIA }])}
          >
            <Plus className="size-3.5" aria-hidden />
            Añadir regla
          </Button>
        </div>

        {reglas.map((r, i) => (
          <div key={i} className="space-y-2 rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                Regla {i + 1}
              </Badge>
              {reglas.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setReglas((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  <X className="size-3.5" aria-hidden />
                  Quitar
                </Button>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={r.nombre}
                onChange={(e) => actualizarRegla(i, { nombre: e.target.value })}
                placeholder="Nombre de la regla"
              />
              <Input
                value={r.tipos_variable.join(",")}
                onChange={(e) =>
                  actualizarRegla(i, {
                    tipos_variable: e.target.value
                      .split(",")
                      .map((t) => t.trim().toUpperCase())
                      .filter(Boolean),
                  })
                }
                placeholder="TEMPERATURA"
                className="font-mono text-sm"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              <select
                value={r.operador}
                onChange={(e) => actualizarRegla(i, { operador: e.target.value })}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="fuera_de_rango">Fuera de rango</option>
                <option value=">">Mayor que</option>
                <option value="<">Menor que</option>
                <option value=">=">Mayor o igual</option>
                <option value="<=">Menor o igual</option>
              </select>

              {r.operador === "fuera_de_rango" ? (
                <>
                  <Input
                    value={r.valor_min ?? ""}
                    onChange={(e) =>
                      actualizarRegla(i, { valor_min: aNumero(e.target.value) })
                    }
                    placeholder="Mínimo"
                    inputMode="decimal"
                  />
                  <Input
                    value={r.valor_max ?? ""}
                    onChange={(e) =>
                      actualizarRegla(i, { valor_max: aNumero(e.target.value) })
                    }
                    placeholder="Máximo"
                    inputMode="decimal"
                  />
                </>
              ) : (
                <Input
                  value={r.valor_referencia_numerico ?? ""}
                  onChange={(e) =>
                    actualizarRegla(i, {
                      valor_referencia_numerico: aNumero(e.target.value),
                    })
                  }
                  placeholder="Valor"
                  inputMode="decimal"
                />
              )}

              <select
                value={r.severidad}
                onChange={(e) =>
                  actualizarRegla(i, {
                    severidad: e.target.value as ReglaPlantilla["severidad"],
                  })
                }
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="warning">Advertencia</option>
                <option value="critical">Crítica</option>
                <option value="info">Informativa</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={alCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button onClick={() => void enviar()} disabled={guardando}>
          {guardando ? "Guardando…" : esNueva ? "Crear norma" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

"use client";

/**
 * Vista previa del nivel: «Con el último valor (23,4 °C): Bueno».
 *
 * ──────────────────────────────────────────────────────────────────────
 * POR QUÉ CONSULTA AL BACKEND
 * ──────────────────────────────────────────────────────────────────────
 * La tentación es calcular el nivel aquí con un `if`. Sería un error: habría
 * dos implementaciones de la clasificación (la del servidor y la del
 * navegador) y podrían discrepar. El usuario vería «Advertencia» en el
 * formulario y «Bueno» en el panel, sin saber a quién creer.
 *
 * Se llama a `POST /plantillas-alerta/evaluar`, que usa exactamente la misma
 * función que el panel y las alertas.
 *
 * ──────────────────────────────────────────────────────────────────────
 * POR QUÉ CON *DEBOUNCE*
 * ──────────────────────────────────────────────────────────────────────
 * Mientras se escribe un umbral (2 → 25 → 25.5) cada tecla sería una
 * petición. Se espera a que el usuario deje de escribir.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { evaluarNivel, type ReglaPlantilla } from "@/servicios/plantillas-alerta.servicio";
import { BadgeNivel } from "@/components/nivel/badge-nivel";
import type { NivelMedicion } from "@/tipos";

interface Props {
  /** Valor actual del canal sobre el que se prueba la regla. */
  valor: number | null;
  unidad?: string | null;
  /** Reglas que ya tiene el canal más la que se está editando. */
  reglas: ReglaPlantilla[];
}

/** Espera antes de consultar, para no pedir en cada tecla. */
const DEBOUNCE_MS = 400;

export function VistaPreviaNivel({ valor, unidad, reglas }: Props) {
  // Las reglas se estabilizan tras el debounce; el objeto llega nuevo en
  // cada render y no sirve como clave de caché.
  const [reglasEstables, setReglasEstables] = useState(reglas);

  useEffect(() => {
    const t = setTimeout(() => setReglasEstables(reglas), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [reglas]);

  const q = useQuery({
    queryKey: ["evaluar-nivel", valor, JSON.stringify(reglasEstables)],
    queryFn: () => evaluarNivel(valor, reglasEstables),
    // La clasificación es determinista para los mismos datos: no hace falta
    // refrescarla. Cambiar reglas o valor cambia la clave.
    staleTime: Infinity,
    enabled: valor !== null && reglasEstables.length > 0,
  });

  if (valor === null) {
    return (
      <section className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        Vista previa: este canal todavía no tiene mediciones, así que no se
        puede calcular el nivel con el valor actual.
      </section>
    );
  }

  return (
    <section className="space-y-1 rounded-xl border bg-muted/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          Con el último valor ({valor}
          {unidad ? ` ${unidad}` : ""}):
        </span>
        {q.isFetching ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            calculando…
          </span>
        ) : q.data ? (
          <BadgeNivel nivel={q.data as NivelMedicion} tamano="md" />
        ) : q.isError ? (
          <span className="text-xs text-destructive">
            no se pudo calcular
          </span>
        ) : null}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Calculado por el servidor con las reglas del canal. Es el mismo
        criterio que usa el panel y el motor de alertas.
      </p>
    </section>
  );
}

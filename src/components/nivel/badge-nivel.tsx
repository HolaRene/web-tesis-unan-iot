"use client";

/**
 * Badge de nivel de medición.
 *
 * SIEMPRE icono + texto, nunca solo color: el color por sí solo no comunica
 * a un usuario daltónico ni se lee bien desde una pantalla de pared.
 *
 * Todos los sitios que muestran el nivel usan este componente, para que el
 * mismo valor tenga el mismo aspecto en toda la aplicación.
 */
import { createElement } from "react";

import { estiloDeNivel } from "@/utilidades/nivel";
import { cn } from "@/lib/utils";
import type { NivelMedicion } from "@/tipos";

interface Props {
  nivel: NivelMedicion | string | null | undefined;
  /** `sm` para tablas y tarjetas, `md` para bloques destacados. */
  tamano?: "sm" | "md";
  /** Oculta el texto (solo icono). Evitarlo: rompe la accesibilidad. */
  soloIcono?: boolean;
  className?: string;
}

export function BadgeNivel({
  nivel,
  tamano = "sm",
  soloIcono = false,
  className,
}: Props) {
  const estilo = estiloDeNivel(nivel);
  const esPequeno = tamano === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        esPequeno ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        estilo.fondo,
        className
      )}
      // El lector de pantalla anuncia el nivel completo aunque se muestre
      // abreviado visualmente.
      title={estilo.etiqueta}
    >
      {createElement(estilo.Icono, {
        className: esPequeno ? "size-3 shrink-0" : "size-3.5 shrink-0",
        "aria-hidden": true,
      })}
      {soloIcono ? (
        <span className="sr-only">{estilo.etiqueta}</span>
      ) : (
        estilo.etiqueta
      )}
    </span>
  );
}

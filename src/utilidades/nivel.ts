/**
 * Presentación del NIVEL de medición.
 *
 * ──────────────────────────────────────────────────────────────────────
 * POR QUÉ UN SOLO SITIO
 * ──────────────────────────────────────────────────────────────────────
 * El nivel aparece en el cumplimiento del área, en las tarjetas del
 * dashboard, en las tarjetas y el detalle de canal, en la tabla de
 * mediciones y en la vista previa del formulario de reglas.
 *
 * Si cada componente eligiera su color y su texto, el mismo valor podría
 * salir verde en un sitio y ámbar en otro. Aquí se decide una vez.
 *
 * ──────────────────────────────────────────────────────────────────────
 * ACCESIBILIDAD: NUNCA SOLO COLOR
 * ──────────────────────────────────────────────────────────────────────
 * Cada nivel lleva icono + texto además del color:
 *
 *   - Hay usuarios daltónicos (rojo y verde son el par más común).
 *   - El panel puede estar en una pantalla de pared, vista de lejos.
 *   - En una captura impresa el color puede perderse.
 *
 * Un color solo no comunica; un icono con su etiqueta, sí.
 */
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Clock,
  Unplug,
  type LucideIcon,
} from "lucide-react";

import type { NivelMedicion } from "@/tipos";

export interface EstiloNivel {
  /** Texto visible (siempre se muestra junto al icono). */
  etiqueta: string;
  /** Icono de Lucide. */
  Icono: LucideIcon;
  /** Clases de color para texto e icono. */
  clases: string;
  /** Clases de fondo y borde, para tarjetas y badges. */
  fondo: string;
}

export const ESTILO_NIVEL: Record<NivelMedicion, EstiloNivel> = {
  bueno: {
    etiqueta: "Bueno",
    Icono: CheckCircle2,
    clases: "text-emerald-600 dark:text-emerald-400",
    fondo:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  advertencia: {
    etiqueta: "Advertencia",
    Icono: AlertTriangle,
    clases: "text-amber-600 dark:text-amber-400",
    fondo:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  critico: {
    etiqueta: "Crítico",
    Icono: AlertCircle,
    clases: "text-red-600 dark:text-red-400",
    fondo: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  falla: {
    etiqueta: "Falla de sensor",
    Icono: Unplug,
    clases: "text-slate-600 dark:text-slate-300",
    fondo:
      "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  sin_datos: {
    etiqueta: "Sin datos",
    Icono: Clock,
    clases: "text-muted-foreground",
    fondo: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
  },
  sin_regla: {
    etiqueta: "Sin regla",
    Icono: CircleHelp,
    clases: "text-muted-foreground",
    fondo: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
  },
};

/**
 * Devuelve el estilo de un nivel, con un respaldo por si llegara un valor
 * desconocido desde una API más nueva que la web.
 */
export function estiloDeNivel(nivel: string | null | undefined): EstiloNivel {
  if (nivel && nivel in ESTILO_NIVEL) {
    return ESTILO_NIVEL[nivel as NivelMedicion];
  }
  return ESTILO_NIVEL.sin_regla;
}

/**
 * Orden de urgencia, para ordenar listas (lo más grave primero).
 *
 * `falla` va por delante de `critico`: un sensor averiado invalida
 * cualquier lectura, mientras que un valor crítico al menos es real.
 */
export const ORDEN_NIVEL: Record<NivelMedicion, number> = {
  falla: 0,
  critico: 1,
  advertencia: 2,
  sin_datos: 3,
  sin_regla: 4,
  bueno: 5,
};

/** Solo los niveles que indican un problema, para filtros y recuentos. */
export function esNivelProblematico(nivel: NivelMedicion | undefined): boolean {
  return nivel === "falla" || nivel === "critico" || nivel === "advertencia";
}

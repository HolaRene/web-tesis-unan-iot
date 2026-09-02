/**
 * Utilidades para mapear estados y severidades de dispositivos/alertas
 * a variantes visuales de Badge (shadcn/ui).
 *
 * Convención de colores semánticos:
 *  - normal  -> variante secundaria (segundo)
 *  - advertencia -> outline / warning
 *  - critico -> destructive
 *  - offline -> outline
 * Se evita el uso excesivo de color; sólo lo mínimo para comunicar estado.
 */
import type { EstadoAlerta } from "@/tipos";

/** Contenido textual normalizado para estados de dispositivo/sensor. */
export const TEXTO_ESTADO: Record<string, string> = {
  online: "En línea",
  offline: "Sin conexión",
  activo: "Activo",
  inactivo: "Inactivo",
  active: "Activa",
  acknowledged: "Reconocida",
  resolved: "Resuelta",
  mantenimiento: "Mantenimiento",
  error: "Error",
  normal: "Normal",
  warning: "Advertencia",
  critico: "Crítico",
};

/** Traduce un estado crudo de la API a texto legible en español. */
export function textoEstado(estado?: string | null): string {
  if (!estado) return "—";
  return TEXTO_ESTADO[estado.toLowerCase()] ?? estado;
}

/** Variantes disponibles en el componente Badge de shadcn. */
export type VarianteBadge =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost";

/**
 * Clasifica la severidad de una alerta en una variante de Badge.
 */
export function varianteSeveridad(severidad?: string | null): VarianteBadge {
  switch (severidad?.toLowerCase()) {
    case "crítico":
    case "critico":
    case "critical":
      return "destructive";
    case "advertencia":
    case "warning":
    case "alto":
      return "outline";
    default:
      return "secondary";
  }
}

/**
 * Clasifica el estado de una alerta en una variante de Badge.
 */
export function varianteEstadoAlerta(estado: EstadoAlerta | string): VarianteBadge {
  switch (estado) {
    case "active":
      return "destructive";
    case "acknowledged":
      return "outline";
    case "resolved":
      return "secondary";
    default:
      return "outline";
  }
}

/**
 * Clasifica el estado de un dispositivo/sensor (online/activo...) en una Badge.
 */
export function varianteEstadoDispositivo(estado?: string | null): VarianteBadge {
  switch (estado?.toLowerCase()) {
    case "online":
    case "activo":
    case "active":
      return "secondary";
    case "offline":
    case "inactivo":
      return "outline";
    case "advertencia":
    case "warning":
      return "outline";
    case "crítico":
    case "critico":
    case "critical":
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

"use client";

/**
 * Indicador visual del estado de una cámara.
 *
 * Reutiliza el componente Badge de shadcn/ui. Mapea los 5 estados del
 * backend a un color y un texto legibles.
 */
import { Badge } from "@/components/ui/badge";
import type { EstadoCamara } from "@/tipos";

/** Configuración visual por estado. */
const CONFIG: Record<
  EstadoCamara,
  { texto: string; variante: "default" | "secondary" | "destructive" | "outline" }
> = {
  conectada: { texto: "Conectada", variante: "default" },
  activa: { texto: "Activa", variante: "secondary" },
  inactiva: { texto: "Inactiva", variante: "outline" },
  desconectada: { texto: "Desconectada", variante: "outline" },
  error: { texto: "Error", variante: "destructive" },
};

export function EstadoCamaraBadge({ estado }: { estado: EstadoCamara }) {
  const cfg = CONFIG[estado] ?? {
    texto: estado,
    variante: "outline" as const,
  };

  return <Badge variant={cfg.variante}>{cfg.texto}</Badge>;
}

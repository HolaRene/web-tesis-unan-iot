"use client";

/**
 * Indicador visual del estado de una cámara.
 *
 * ⚠️ ACTUALMENTE NO SE USA EN NINGUNA PANTALLA.
 *
 * Se retiró de la tarjeta y del detalle porque `camaras.estado` no se
 * actualiza automáticamente: nadie lo escribe al conectar o desconectar el
 * stream, así que el indicador se quedaba fijo en «Desconectada» aunque el
 * vídeo funcionara. Un dato obsoleto en pantalla es peor que no mostrarlo.
 *
 * El estado real de conexión lo informa el reproductor WebRTC, que sí sabe
 * lo que está pasando porque sale de la negociación con MediaMTX.
 *
 * El componente se conserva para cuando exista un proceso de monitorización
 * que mantenga la columna `estado` al día; entonces basta con volver a
 * montarlo en `camara-card.tsx` y `detalle-camara.tsx`.
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

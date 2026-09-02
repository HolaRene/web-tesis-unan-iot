"use client";

/**
 * Reproductor de cámara IP.
 *
 * Componente PREPARADO para reproducir streams con protocolo HLS (.m3u8) o
 * WebRTC una vez que el backend entregue URLs válidas. No se conecta RTSP
 * directamente al navegador; siempre se requiere un origen HLS/WebRTC.
 *
 * Actualmente, ante la ausencia de un stream real, muestra un estado
 * "sin señal" informativo.
 */
import { useEffect, useRef, useState } from "react";
import { VideoOff, Wifi, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface ReproductorCamaraProps {
  nombre: string;
  /** URL de la cámara. */
  url?: string | null;
  /** Protocolo esperado: 'hls' | 'webrtc'. */
  protocolo?: string | null;
  estado?: string | null;
}

export function ReproductorCamara({
  nombre,
  url,
  protocolo,
  estado,
}: ReproductorCamaraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: cuando `url` sea una ruta HLS (.m3u8), instanciar hls.js:
    //   import Hls from "hls.js";
    //   if (Hls.isSupported() && videoRef.current) { ... }
    // Si `protocolo` es 'webrtc', integrar un cliente RTCPeerConnection.
    // Por ahora el componente está preparado pero inactivo y muestra "sin señal".
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derivación de mensaje en montaje
    setError(url ? null : "Sin stream disponible para esta cámara.");
  }, [url]);

  const origen = protocolo?.toUpperCase() ?? "—";

  return (
    <figure className="overflow-hidden rounded-2xl border bg-muted/40">
      {/* Área del video real (se completará con HLS/WebRTC). */}
      <div className="aspect-video w-full">
        <video
          ref={videoRef}
          className="hidden h-full w-full object-cover"
          controls
          playsInline
        />
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <VideoOff className="size-8" aria-hidden />
            <p className="text-sm font-medium">{error ?? "Sin señal"}</p>
            {url && (
              <p className="max-w-full truncate px-8 text-xs">{url}</p>
            )}
          </div>
        </div>
      </div>

      <figcaption className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 overflow-hidden">
          <Wifi className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-sm font-medium">{nombre}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Radio className="size-3" aria-hidden />
            {origen}
          </Badge>
          <Badge variant="secondary">{estado ?? "Preparado"}</Badge>
        </div>
      </figcaption>
    </figure>
  );
}

import type { Metadata } from "next";
import { Info } from "lucide-react";
import { GestionCamaras } from "@/components/camaras/gestion-camaras";

export const metadata: Metadata = {
  title: "Cámaras",
  description: "Gestión y visualización de cámaras IP.",
};

export default function PaginaCamaras() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Cámaras IP administradas por la plataforma. El vídeo se sirve por{" "}
          <strong>MediaMTX</strong> (RTSP → WebRTC) y{" "}
          <strong>no pasa por la API</strong>. Aquí solo se guarda la
          configuración y el estado.
        </p>
      </div>
      <GestionCamaras />
    </div>
  );
}

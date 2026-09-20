"use client";

/**
 * Gestión (listado) de cámaras IP.
 *
 * Solo consume la API de administración. El vídeo NO se gestiona aquí:
 * la grilla muestra un hueco de preview y el reproductor real vive en el
 * detalle (/camaras/[id]).
 */
import { Camera } from "lucide-react";
import { useCamaras } from "@/hooks/useCamaras";
import { CamaraGrid } from "@/components/camaras/camara-grid";

export function GestionCamaras() {
  const { data: camaras, isLoading, error } = useCamaras();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="size-5 text-muted-foreground" aria-hidden />
          <h1 className="text-xl font-semibold">Cámaras IP</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {camaras ? `${camaras.length} registrada(s)` : ""}
        </p>
      </div>

      <CamaraGrid
        camaras={camaras}
        cargando={isLoading}
        error={(error as Error) ?? null}
      />
    </div>
  );
}

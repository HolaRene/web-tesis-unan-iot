"use client";

/**
 * Grilla de cámaras.
 *
 * Maneja explícitamente los cuatro escenarios pedidos:
 *   - cargando (skeletons)
 *   - error de carga
 *   - lista vacía (con invitación a crear la primera)
 *   - una o varias cámaras
 */
import { Camera } from "lucide-react";

import { CamaraCard } from "@/components/camaras/camara-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Camara } from "@/tipos";

interface CamaraGridProps {
  camaras?: Camara[];
  cargando: boolean;
  error: Error | null;
  /** Acciones de administración; opcionales para poder reutilizar la grilla. */
  onEditar?: (camara: Camara) => void;
  onEliminar?: (camara: Camara) => void;
}

export function CamaraGrid({
  camaras,
  cargando,
  error,
  onEditar,
  onEliminar,
}: CamaraGridProps) {
  if (cargando) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudieron cargar las cámaras</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!camaras || camaras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
        <Camera className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">Sin cámaras registradas</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Añade una cámara IP para empezar. Solo necesitas sus datos de
          configuración; el vídeo lo servirá MediaMTX.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {camaras.map((camara) => (
        <CamaraCard
          key={camara.id}
          camara={camara}
          onEditar={onEditar}
          onEliminar={onEliminar}
        />
      ))}
    </div>
  );
}

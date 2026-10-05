"use client";

/**
 * Tarjeta resumen de una cámara para la vista de grilla.
 *
 * Muestra: nombre, área, estado, IP, última conexión y un hueco de
 * preview. NO muestra credenciales ni URL RTSP: el modelo no las tiene.
 */
import Link from "next/link";
import { Camera, Pencil, Trash2, MapPin, Network, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoCamaraBadge } from "@/components/camaras/estado-camara";
import { formatearFecha } from "@/utilidades";
import type { Camara } from "@/tipos";

interface CamaraCardProps {
  camara: Camara;
  /**
   * Acciones de administración. Son opcionales: el detalle reutiliza esta
   * tarjeta sin botones de editar/borrar.
   */
  onEditar?: (camara: Camara) => void;
  onEliminar?: (camara: Camara) => void;
}

export function CamaraCard({ camara, onEditar, onEliminar }: CamaraCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Hueco de preview: se sustituye por el reproductor en el detalle. */}
      <div className="flex aspect-video items-center justify-center bg-muted">
        <Camera className="size-8 text-muted-foreground" aria-hidden />
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{camara.nombre}</p>
            <code className="text-xs text-muted-foreground">
              {camara.ruta_webrtc ?? "sin ruta WebRTC"}
            </code>
          </div>
          <EstadoCamaraBadge estado={camara.estado} />
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5" aria-hidden />
            {camara.area_nombre ?? "Sin área"}
          </p>
          <p className="flex items-center gap-2">
            <Network className="size-3.5" aria-hidden />
            {camara.direccion_ip ?? "Sin IP"}
            {camara.direccion_ip ? `:${camara.puerto_rtsp}` : ""}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-3.5" aria-hidden />
            {camara.ultima_conexion
              ? formatearFecha(camara.ultima_conexion)
              : "Sin conexiones registradas"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            render={<Link href={`/camaras/${camara.id}`} />}
          >
            Ver detalle
          </Button>
          {onEditar ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditar(camara)}
              aria-label={`Editar ${camara.nombre}`}
              title="Editar"
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          ) : null}
          {onEliminar ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEliminar(camara)}
              aria-label={`Eliminar ${camara.nombre}`}
              title="Eliminar"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

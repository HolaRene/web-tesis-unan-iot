"use client";

/**
 * Detalle de una cámara IP.
 *
 * Composición:
 *   - Cabecera con nombre y estado.
 *   - Reproductor WebRTC (CamaraPlayer) que recibe la URL ya resuelta.
 *   - Ficha técnica.
 *
 * El reproductor NO conoce la API: aquí se traduce `ruta_webrtc` a la URL
 * de MediaMTX mediante la capa de configuración de vídeo.
 */
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { useCamara, useActualizarEstadoCamara } from "@/hooks/useCamaras";
import { CamaraPlayer } from "@/components/camaras/camara-player";
import { CamaraDetalles } from "@/components/camaras/camara-detalles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { tieneStreamConfigurado, urlWhep } from "@/configuracion/video";


export function DetalleCamara({ id }: { id: string }) {
  const { data: camara, isLoading, error } = useCamara(id);
  const cambiarEstado = useActualizarEstadoCamara();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !camara) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Cámara no disponible</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message ?? "No se encontró la cámara solicitada."}
        </AlertDescription>
      </Alert>
    );
  }

  // La URL de MediaMTX se deriva de la configuración centralizada.
  const urlWebRTC = tieneStreamConfigurado(camara.ruta_webrtc)
    ? urlWhep(camara.ruta_webrtc as string)
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            render={<Link href="/camaras" />}
          >
            <ArrowLeft className="mr-2 size-3.5" aria-hidden />
            Volver a cámaras
          </Button>
          <h1 className="text-2xl font-semibold">{camara.nombre}</h1>
          {camara.descripcion && (
            <p className="text-sm text-muted-foreground">{camara.descripcion}</p>
          )}
        </div>

        {/*
          El estado de la cámara YA NO SE MUESTRA.

          Motivo: no se mantiene actualizado. La columna `camaras.estado` solo
          cambia si algo la escribe (PATCH /cameras/:id/estado), y nada la
          actualiza automáticamente al conectar o desconectar el stream. El
          resultado era un indicador permanente en «Desconectada» aunque el
          vídeo funcionara.

          Un dato que se queda obsoleto es peor que no mostrarlo: induce a
          error. El reproductor ya informa del estado real de la conexión
          («Conectando», «Sin stream», «Error»), y ese sí es fiable porque
          sale de la propia negociación WebRTC.

          Si más adelante un proceso de monitorización mantiene el campo al
          día, se puede volver a mostrar.
        */}
      </div>

      {cambiarEstado.isError && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cambiar el estado</AlertTitle>
          <AlertDescription>
            {(cambiarEstado.error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {!camara.activa && (
        <Alert>
          <AlertTitle>Cámara marcada como inactiva</AlertTitle>
          <AlertDescription>
            La cámara está registrada pero deshabilitada. Actívala para
            supervisarla.
          </AlertDescription>
        </Alert>
      )}

      {/* Reproductor WebRTC: desacoplado de la API.
          La `key` remonta el componente al cambiar de cámara, de modo que
          su estado interno se reinicia sin efectos de sincronización. */}
      <CamaraPlayer
        key={camara.id}
        nombre={camara.nombre}
        urlWebRTC={urlWebRTC}
      />

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <MapPin className="size-3.5" aria-hidden />
          {camara.area_nombre ?? "Sin área"}
        </span>
        {/*
          Nota: aquí había un SEGUNDO indicador de estado, que mostraba
          «Conectada» o «Sin conexión activa» según el estado del badge.

          Producía dos etiquetas distintas para el mismo dato en la misma
          pantalla («Desconectada» arriba, «Sin conexión activa» abajo), y
          además confundía «Error» con «sin conexión», que no son lo mismo:
          una cámara puede estar conectada y devolver error de vídeo.

          El estado se muestra una sola vez, en el badge de la cabecera.
        */}
      </div>

      <CamaraDetalles camara={camara} />
    </div>
  );
}

"use client";

/**
 * Preview de vídeo para la tarjeta del listado.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ NO REPRODUCE SIEMPRE
 * ────────────────────────────────────────────────────────────────────
 * Cada reproductor abre su PROPIA conexión WebRTC contra MediaMTX. Con 8
 * cámaras en pantalla serían 8 conexiones simultáneas: ancho de banda,
 * CPU y carga en MediaMTX sin que nadie esté mirando.
 *
 * Por eso el vídeo solo se conecta **cuando el ratón entra en la tarjeta**,
 * y se desconecta al salir. Así:
 *
 *   - Se ven las cámaras que estás mirando.
 *   - No se consume nada por las que están fuera de vista.
 *
 * En pantallas táctiles no hay «hover», así que se reproduce al tocar.
 */
import { useState } from "react";
import { Camera, Play } from "lucide-react";

import { CamaraPlayer } from "@/components/camaras/camara-player";
import { tieneStreamConfigurado, urlWhep } from "@/configuracion/video";

interface PreviewCamaraProps {
  nombre: string;
  rutaWebrtc?: string | null;
  /**
   * Si es `false`, muestra el hueco con el icono y no conecta nunca.
   * Lo usa la grilla cuando el usuario decide no ver previews.
   */
  habilitado?: boolean;
}

export function PreviewCamara({
  nombre,
  rutaWebrtc,
  habilitado = true,
}: PreviewCamaraProps) {
  const [activo, setActivo] = useState(false);
  const hayStream = tieneStreamConfigurado(rutaWebrtc);

  // Sin ruta WebRTC no tiene sentido conectar: se muestra el hueco.
  if (!hayStream || !habilitado) {
    return (
      <div className="flex aspect-video items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Camera className="size-8" aria-hidden />
          <p className="text-xs">
            {habilitado ? "Sin ruta WebRTC" : "Preview desactivado"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative"
      /*
       * El ratón entra o sale. `onFocus`/`onBlur` cubren el caso de navegar
       * con el teclado, que si no dejaría el preview inaccesible.
       */
      onMouseEnter={() => setActivo(true)}
      onMouseLeave={() => setActivo(false)}
      onFocus={() => setActivo(true)}
      onBlur={() => setActivo(false)}
    >
      {activo ? (
        /*
         * `key` con la ruta: si la tarjeta cambia de cámara, el reproductor
         * se remonta y limpia la conexión anterior en lugar de reutilizarla.
         */
        <CamaraPlayer
          key={rutaWebrtc}
          nombre={nombre}
          urlWebRTC={urlWhep(rutaWebrtc as string)}
          className="rounded-none border-0"
        />
      ) : (
        /*
         * Hueco en reposo. Se mantiene el mismo `aspect-video` que el
         * reproductor para que la tarjeta NO cambie de alto al pasar el
         * ratón: si no, la grilla daría un salto muy molesto.
         */
        <div className="flex aspect-video w-full items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Play className="size-7" aria-hidden />
            <p className="text-xs">Pasa el ratón para ver</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Logo de la plataforma ControlaIoT.
 *
 * Componente único y reutilizable para no repetir el <Image> en cada sitio
 * (cabecera pública, barra lateral, login, registro…).
 *
 * NOTA SOBRE LA IMAGEN
 * --------------------
 * `ControlaIOT.png` mide 2000x2000 con el logo centrado y márgenes
 * transparentes alrededor. Al ser cuadrada, se renderiza dentro de un
 * contenedor cuadrado para que el logo quede centrado y proporcionado.
 *
 * La imagen tiene fondo TRANSPARENTE, así que funciona igual en tema claro
 * y oscuro sin necesidad de dos versiones.
 */
import Image from "next/image";
import { infoSitio } from "@/configuracion/sitio";

interface LogoProps {
  /** Alto en píxeles del contenedor. El ancho es el mismo (es cuadrado). */
  tamano?: number;
  /** Mostrar el nombre junto al logo. */
  conNombre?: boolean;
  /** Clases extra para el contenedor. */
  className?: string;
  /** Si es true, se prioriza la carga (para la cabecera). */
  prioridad?: boolean;
}

export function Logo({
  tamano = 36,
  conNombre = false,
  className,
  prioridad = false,
}: LogoProps) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      {/*
        El contenedor es CUADRADO (tamano x tamano) porque la imagen lo es.
        Con `object-contain` el logo nunca se deforma.
      */}
      <Image
        src={infoSitio.logo}
        alt={infoSitio.nombre}
        width={tamano}
        height={tamano}
        priority={prioridad}
        className="shrink-0 object-contain"
        style={{ width: tamano, height: tamano }}
      />
      {conNombre && (
        <span className="text-sm font-semibold tracking-tight">
          {infoSitio.nombre}
        </span>
      )}
    </span>
  );
}

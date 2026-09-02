/**
 * Layout del grupo de autenticación.
 * Envuelve las rutas de acceso (/iniciar-sesion) con una disposición
 * centrada de pantalla completa, sin barra lateral.
 */
import type { ReactNode } from "react";

export default function LayoutAutenticacion({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {children}
    </div>
  );
}

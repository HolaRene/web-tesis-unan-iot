"use client";

/**
 * Guard de rutas del panel autenticado.
 *
 * Componente cliente que envuelve el layout del panel:
 * - Mientras se restaura la sesión desde localStorage muestra un indicador.
 * - Si no hay sesión activa, redirige a /iniciar-sesion con un redirect.
 * - Si hay sesión, renderiza el contenido del panel.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useSesion } from "@/hooks/use-sesion";

export function RequerirSesion({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { cargando, usuario } = useSesion();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace("/iniciar-sesion");
    }
  }, [cargando, usuario, router]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando..." />
      </div>
    );
  }

  if (!usuario) {
    // Evita mostrar contenido del panel mientras se redirige.
    return null;
  }

  return <>{children}</>;
}

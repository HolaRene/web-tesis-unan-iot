import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BadgeCheck } from "lucide-react";

import { FormularioIniciarSesion } from "@/components/autenticacion/formulario-iniciar-sesion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { infoSitio } from "@/configuracion/sitio";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Acceso al panel de MonitorIT.",
};

interface PropsIniciarSesion {
  searchParams?: Promise<{ registrado?: string }>;
}

export default async function PaginaIniciarSesion({
  searchParams,
}: PropsIniciarSesion) {
  const params = await searchParams;
  const cuentaCreada = params?.registrado === "cuenta-creada";

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <Activity className="size-6 text-primary" aria-hidden />
          <span className="text-lg font-semibold">{infoSitio.nombre}</span>
        </div>
      </div>

      {cuentaCreada && (
        <Alert>
          <BadgeCheck className="size-4" aria-hidden />
          <AlertTitle>Cuenta creada</AlertTitle>
          <AlertDescription>
            Tu cuenta se creó correctamente. Inicia sesión para continuar.
          </AlertDescription>
        </Alert>
      )}

      <FormularioIniciarSesion />

      <p className="text-center text-sm">
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="text-primary underline underline-offset-4"
        >
          Regístrate
        </Link>
      </p>

      <p className="text-center text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Volver a la página de inicio
        </Link>
      </p>
    </div>
  );
}

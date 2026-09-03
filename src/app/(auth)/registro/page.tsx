import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";

import { FormularioRegistrar } from "@/components/autenticacion/formulario-registrar";
import { infoSitio } from "@/configuracion/sitio";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea tu cuenta en MonitorIT.",
};

export default function PaginaRegistro() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <Activity className="size-6 text-primary" aria-hidden />
          <span className="text-lg font-semibold">{infoSitio.nombre}</span>
        </div>
      </div>

      <FormularioRegistrar />

      <p className="text-center text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Volver a la página de inicio
        </Link>
      </p>
    </div>
  );
}

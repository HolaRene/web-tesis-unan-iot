import type { Metadata } from "next";
import Link from "next/link";


import { FormularioRegistrar } from "@/components/autenticacion/formulario-registrar";
import { Logo } from "@/components/layout/logo";
import { infoSitio } from "@/configuracion/sitio";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea tu cuenta en ControlaIoT.",
};

export default function PaginaRegistro() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Logo de la plataforma, centrado sobre el formulario. */}
        <Logo tamano={72} prioridad />
        <span className="text-lg font-semibold">{infoSitio.nombre}</span>
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

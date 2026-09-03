import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { GestionSensores } from "@/components/sensores/gestion-sensores";

export const metadata: Metadata = {
  title: "Sensores",
  description: "Gestión de sensores y variables medidas.",
};

export default function PaginaSensores() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Sensores registrados en la plataforma. Rol <strong>viewer</strong>{" "}
          sólo consulta; <strong>usuario</strong> y <strong>admin</strong> pueden
          crear, editar y eliminar sensores.
        </p>
      </div>
      <GestionSensores />
    </div>
  );
}

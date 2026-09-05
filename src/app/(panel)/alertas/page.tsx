import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import GestionAlertas from "@/components/alertas/gestion-alertas";

export const metadata: Metadata = {
  title: "Alertas",
  description: "Gestión de alertas del sistema.",
};

export default function PaginaAlertas() {
  return (
   <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Mediciones registrados en la plataforma. Rol <strong>viewer</strong>{" "}
          sólo consulta; <strong>usuario</strong> y <strong>admin</strong> pueden
          crear, editar y eliminar.
        </p>
      </div>
      <GestionAlertas />
    </div>
  );
}

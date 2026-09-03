import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { GestionAreas } from "@/components/areas/gestion-areas";

export const metadata: Metadata = {
  title: "Áreas",
  description: "Gestión de áreas de la instalación.",
};

export default function PaginaAreas() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Sección de áreas con datos del backend. Un usuario con rol{" "}
          <strong>viewer</strong> sólo puede consultarlas; los roles{" "}
          <strong>usuario</strong> y <strong>admin</strong> pueden crear, editar
          y eliminar áreas.
        </p>
      </div>
      <GestionAreas />
    </div>
  );
}

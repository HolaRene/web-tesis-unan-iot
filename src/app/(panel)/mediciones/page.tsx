import type { Metadata } from "next";
import { HistorialMediciones } from "@/components/mediciones/historial-mediciones";

export const metadata: Metadata = {
  title: "Mediciones",
  description: "Historial global de mediciones (auditoría y análisis).",
};

export default function PaginaMediciones() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mediciones</h1>
        <p className="text-sm text-muted-foreground">
          Historial de mediciones registradas por la integración (ingesta IoT).
        </p>
      </div>
      <HistorialMediciones />
    </div>
  );
}

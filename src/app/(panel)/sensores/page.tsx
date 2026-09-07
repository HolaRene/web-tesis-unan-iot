import type { Metadata } from "next";
import { MosaicoSensores } from "@/components/sensores/mosaico-sensores";
import { GestionSensores } from "@/components/sensores/gestion-sensores";

export const metadata: Metadata = {
  title: "Sensores",
  description: "Supervisión de sensores y últimas mediciones registradas.",
};

export default function PaginaSensores() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sensores</h1>
        <p className="text-sm text-muted-foreground">
          Supervisión de sensores y últimas mediciones registradas.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Estado actual</h2>
        <MosaicoSensores />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Gestión (alta / edición)</h2>
        <GestionSensores />
      </section>
    </div>
  );
}

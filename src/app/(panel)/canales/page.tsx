import type { Metadata } from "next";
import { VistaCanales } from "@/components/canales/vista-canales";

export const metadata: Metadata = {
  title: "Canales",
  description: "Magnitudes concretas de los sensores (modelo multivariable).",
};

export default function PaginaCanales() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Canales</h1>
        <p className="text-sm text-muted-foreground">
          Magnitudes concretas que entregan los sensores físicos.
        </p>
      </div>
      <VistaCanales />
    </div>
  );
}

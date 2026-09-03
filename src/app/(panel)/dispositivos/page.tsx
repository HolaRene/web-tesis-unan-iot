import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { GestionDispositivos } from "@/components/dispositivos/gestion-dispositivos";

export const metadata: Metadata = {
  title: "Dispositivos",
  description: "Gestión de dispositivos IoT e industriales.",
};

export default function PaginaDispositivos() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Dispositivos conectados (OpenPLC, ESP32, gateways, cámaras IP, etc.).
          Rol <strong>viewer</strong> sólo consulta; <strong>usuario</strong> y{" "}
          <strong>admin</strong> pueden crear, editar y eliminar.
        </p>
      </div>
      <GestionDispositivos />
    </div>
  );
}

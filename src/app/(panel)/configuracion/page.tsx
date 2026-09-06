import type { Metadata } from "next";
import GestionClavesApi from "@/components/configuracion/gestion-claves-api";

export const metadata: Metadata = {
  title: "Configuración",
  description: "Ajustes e integraciones de la plataforma: API Keys y preferencias.",
};

export default function PaginaConfiguracion() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Integraciones por API Key y ajustes de la plataforma.
        </p>
      </div>

      {/* Gestión de API Keys para integrar Node-RED / scripts / gateways */}
      <GestionClavesApi />

      {/* Futuros ajustes (panel informativo) */}
      <section className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Próximas opciones de configuración</p>
        <ul className="mt-1 list-inside list-disc">
          <li>Administración de usuarios y roles (admin / usuario / viewer).</li>
          <li>Tipos de variable y preferencias de alertas.</li>
        </ul>
      </section>
    </div>
  );
}

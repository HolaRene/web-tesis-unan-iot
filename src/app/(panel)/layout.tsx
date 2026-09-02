/**
 * Layout del panel autenticado.
 *
 * Composición (server) de los proveedores y componentes de estructura cliente:
 * - RequerirSesion protege todas las rutas del panel.
 * - QueryProvider habilita TanStack Query para el consumo de datos de la API.
 * - SidebarProvider + Sidebar construyen el frame (barra lateral + cabecera).
 */
import type { ReactNode } from "react";
import { RequerirSesion } from "@/components/autenticacion/requerir-sesion";
import { QueryProvider } from "@/components/proveedores/query-proveedor";
import { BarraLateralPanel } from "@/components/layout/barra-lateral-panel";
import { CabeceraPanel } from "@/components/layout/cabecera-panel";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function LayoutPanel({ children }: { children: ReactNode }) {
  return (
    <RequerirSesion>
      <QueryProvider>
        <SidebarProvider>
          <BarraLateralPanel />
          <SidebarInset>
            <CabeceraPanel />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </QueryProvider>
    </RequerirSesion>
  );
}

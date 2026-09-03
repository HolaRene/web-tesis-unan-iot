import type { Metadata } from "next";
import { PanelDashboard } from "@/components/dashboard/panel-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Resumen general del estado del sistema.",
};

export default function PaginaDashboard() {
  return <PanelDashboard />;
}

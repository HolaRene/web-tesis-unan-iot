import type { Metadata } from "next";
import { GestionActuadores } from "@/components/actuadores/gestion-actuadores";

export const metadata: Metadata = {
  title: "Actuadores",
  description: "Salidas controlables y envío de comandos a los equipos.",
};

export default function PaginaActuadores() {
  return <GestionActuadores />;
}

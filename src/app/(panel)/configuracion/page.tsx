import type { Metadata } from "next";
import { PaginaEnConstruccion } from "@/components/compartidos/pagina-en-construccion";

export const metadata: Metadata = {
  title: "Configuración",
  description: "Ajustes generales del sistema.",
};

export default function PaginaConfiguracion() {
  return (
    <PaginaEnConstruccion
      titulo="Configuración"
      descripcion="Ajustes de la plataforma: usuarios, roles, tema y preferencias."
      pendientes={[
        "Administración de usuarios (admin / operador / viewer).",
        "Tipos de variable dinámicos.",
        "Umbrales y preferencias de alertas.",
      ]}
    />
  );
}

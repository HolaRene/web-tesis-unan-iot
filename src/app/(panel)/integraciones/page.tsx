import type { Metadata } from "next";
import { PaginaEnConstruccion } from "@/components/compartidos/pagina-en-construccion";

export const metadata: Metadata = {
  title: "Integraciones",
  description: "Integraciones con plataformas externas.",
};

export default function PaginaIntegraciones() {
  return (
    <PaginaEnConstruccion
      titulo="Integraciones"
      descripcion="Gestión de integraciones: plataforma, tipo, dispositivo relacionado y estado."
      pendientes={[
        "ThingsBoard Cloud como primera integración externa de demostración.",
        "Tabla de integraciones y estado.",
        "Configuración de integraciones.",
      ]}
    />
  );
}

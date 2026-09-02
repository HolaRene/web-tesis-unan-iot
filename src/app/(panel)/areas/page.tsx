import type { Metadata } from "next";
import { PaginaEnConstruccion } from "@/components/compartidos/pagina-en-construccion";

export const metadata: Metadata = {
  title: "Áreas",
  description: "Gestión de áreas de la instalación.",
};

export default function PaginaAreas() {
  return (
    <PaginaEnConstruccion
      titulo="Áreas"
      descripcion="Listado de áreas con tipo, ubicación, estado y número de dispositivos."
      pendientes={[
        "Tabla con listado de áreas.",
        "Detalle de área y sus dispositivos asociados.",
        "Creación, edición y eliminación de áreas.",
      ]}
    />
  );
}

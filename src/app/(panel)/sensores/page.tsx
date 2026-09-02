import type { Metadata } from "next";
import { PaginaEnConstruccion } from "@/components/compartidos/pagina-en-construccion";

export const metadata: Metadata = {
  title: "Sensores",
  description: "Gestión de sensores y variables medidas.",
};

export default function PaginaSensores() {
  return (
    <PaginaEnConstruccion
      titulo="Sensores"
      descripcion="Listado de sensores: nombre, código, dispositivo, tipo de variable, unidad, estado y última medición."
      pendientes={[
        "Tabla de sensores.",
        "Tipos de variable dinámicos (sin asumir magnitudes fijas).",
        "CRUD de sensores.",
      ]}
    />
  );
}

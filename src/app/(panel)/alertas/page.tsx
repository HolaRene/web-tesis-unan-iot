import type { Metadata } from "next";
import { PaginaEnConstruccion } from "@/components/compartidos/pagina-en-construccion";

export const metadata: Metadata = {
  title: "Alertas",
  description: "Gestión de alertas del sistema.",
};

export default function PaginaAlertas() {
  return (
    <PaginaEnConstruccion
      titulo="Alertas"
      descripcion="Listado de alertas con tipo, severidad, sensor, mensaje y estados."
      pendientes={[
        "Tabla de alertas con Badge para severidad y estado.",
        "Reconocer y resolver alertas.",
        "Historial de alertas finalizadas.",
      ]}
    />
  );
}

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
        "Tabla de integraciones con estado y última sincronización.",
        "Configuración de credenciales de cada plataforma externa.",
        "Prueba de conexión desde la propia interfaz.",
      ]}
    />
  );
}

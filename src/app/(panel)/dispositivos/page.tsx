import type { Metadata } from "next";
import { PaginaEnConstruccion } from "@/components/compartidos/pagina-en-construccion";

export const metadata: Metadata = {
  title: "Dispositivos",
  description: "Gestión de dispositivos IoT e industriales.",
};

export default function PaginaDispositivos() {
  return (
    <PaginaEnConstruccion
      titulo="Dispositivos"
      descripcion="Listado de dispositivos: nombre, tipo, protocolo, IP, estado, último contacto y área."
      pendientes={[
        "Tabla de dispositivos.",
        "Representación de OpenPLC, ESP32, PLC físico, cámaras IP y gateways.",
        "CRUD de dispositivos.",
      ]}
    />
  );
}

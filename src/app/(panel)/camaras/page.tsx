import type { Metadata } from "next";
import { PaginaEnConstruccion } from "@/components/compartidos/pagina-en-construccion";

export const metadata: Metadata = {
  title: "Cámaras",
  description: "Gestión y visualización de cámaras IP.",
};

export default function PaginaCamaras() {
  return (
    <PaginaEnConstruccion
      titulo="Cámaras IP"
      descripcion="Preparación de vista de cámaras: nombre, área, estado, protocolo y stream."
      pendientes={[
        "Reproductor HLS/WebRTC (componente reproductor-camara).",
        "Listado de cámaras con estado.",
        "Asociación de cámaras a áreas y dispositivos.",
      ]}
    />
  );
}

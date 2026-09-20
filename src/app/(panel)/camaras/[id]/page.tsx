import type { Metadata } from "next";
import { DetalleCamara } from "@/components/camaras/detalle-camara";

export const metadata: Metadata = {
  title: "Detalle de la cámara",
  description: "Información técnica y reproductor WebRTC de una cámara IP.",
};

export default async function PaginaDetalleCamara({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetalleCamara id={id} />;
}

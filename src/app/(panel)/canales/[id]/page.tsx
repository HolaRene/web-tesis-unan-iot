import type { Metadata } from "next";
import { DetalleCanal } from "@/components/canales/detalle-canal";

export const metadata: Metadata = {
  title: "Detalle de Canal",
  description: "Magnitud, historial y reglas de alerta de un canal.",
};

export default async function PaginaDetalleCanal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetalleCanal id={id} />;
}

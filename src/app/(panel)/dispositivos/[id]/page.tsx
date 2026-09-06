import type { Metadata } from "next";
import { DetalleDispositivo } from "@/components/dispositivos/detalle-dispositivo";

export const metadata: Metadata = {
  title: "Detalle de Dispositivo",
  description: "Sensores y actuadores de un dispositivo.",
};

export default async function PaginaDetalleDispositivo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetalleDispositivo id={id} />;
}

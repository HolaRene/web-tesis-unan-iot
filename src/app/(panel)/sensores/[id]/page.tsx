import type { Metadata } from "next";
import { VistaDetalleSensor } from "@/components/sensores/vista-detalle-sensor";

export const metadata: Metadata = {
  title: "Detalle del sensor",
  description: "Historial e información de un sensor.",
};

export default async function PaginaDetalleSensor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VistaDetalleSensor id={id} />;
}

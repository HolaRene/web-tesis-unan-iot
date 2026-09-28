import type { Metadata } from "next";
import { VistaDetalleArea } from "@/components/areas/vista-detalle-area";

interface PaginaAreaDetalleProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PaginaAreaDetalleProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Área ${id}`, description: "Detalle del área." };
}

export default async function PaginaAreaDetalle({
  params,
}: PaginaAreaDetalleProps) {
  const { id } = await params;
  return <VistaDetalleArea id={id} />;
}

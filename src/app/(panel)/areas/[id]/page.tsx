import type { Metadata } from "next";
import { PaginaEnConstruccion } from "@/components/compartidos/pagina-en-construccion";

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

  return (
    <PaginaEnConstruccion
      titulo={`Detalle del área`}
      descripcion={`Información detallada del área con id «${id}»: dispositivos, sensores, mediciones, gráficas, alertas y cámaras asociadas.`}
      pendientes={[
        "Ficha de información del área.",
        "Listado de dispositivos y sensores del área.",
        "Últimas mediciones y gráficas.",
        "Alertas y cámaras asociadas.",
      ]}
    />
  );
}

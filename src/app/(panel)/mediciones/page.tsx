import type { Metadata } from "next";
import { PaginaEnConstruccion } from "@/components/compartidos/pagina-en-construccion";

export const metadata: Metadata = {
  title: "Mediciones",
  description: "Consulta y análisis de mediciones históricas.",
};

export default function PaginaMediciones() {
  return (
    <PaginaEnConstruccion
      titulo="Mediciones"
      descripcion="Consulta de mediciones con filtros por área, dispositivo, sensor, tipo de variable y rango de fechas."
      pendientes={[
        "Filtros combinados (área, dispositivo, sensor, variable, fechas).",
        "Tabla de mediciones.",
        "Gráfica histórica, mínimo, máximo, promedio y última lectura (Recharts).",
      ]}
    />
  );
}

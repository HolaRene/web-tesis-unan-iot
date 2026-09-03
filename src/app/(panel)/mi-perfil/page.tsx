import type { Metadata } from "next";
import { VistaPerfil } from "@/components/perfil/vista-perfil";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Consulta y edita los datos de tu cuenta.",
};

export default function PaginaMiPerfil() {
  return <VistaPerfil />;
}

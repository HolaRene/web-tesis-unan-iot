/**
 * Layout de la sección pública (/acerca, /tecnologias).
 * Añade la cabecera y el pie públicos compartidos.
 *
 * La landing raíz (/) vive en app/page.tsx y también renderiza la cabecera y
 * pie públicos para mantener una experiencia coherente.
 */
import type { ReactNode } from "react";
import { CabeceraPublica } from "@/components/layout/cabecera-publica";
import { PiePublico } from "@/components/layout/pie-publico";

export default function LayoutPublico({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <CabeceraPublica />
      <main className="flex-1">{children}</main>
      <PiePublico />
    </div>
  );
}

/**
 * Pie de página de la sección pública.
 * Muestra el nombre del proyecto, tecnologías principales y ámbito académico.
 */
import { Activity } from "lucide-react";

import { infoSitio } from "@/configuracion/sitio";

const tecnologiasPrincipales = [
  "Next.js",
  "TypeScript",
  "Node.js",
  "Express",
  "PostgreSQL",
];

export function PiePublico() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary" aria-hidden />
            <span className="font-semibold">{infoSitio.nombre}</span>
          </div>
          <p className="text-sm text-muted-foreground">{infoSitio.eslogan}</p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Tecnologías</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {tecnologiasPrincipales.map((tecno) => (
              <li key={tecno}>{tecno}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground">Proyecto académico</h3>
          <p>
            Plataforma genérica de monitorización e integración IoT/industrial.
          </p>
          <p>Primer caso de estudio: monitorización ambiental hospitalaria.</p>
        </div>
      </div>

      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {infoSitio.nombre}. Proyecto tecnológico
          académico.
        </p>
      </div>
    </footer>
  );
}

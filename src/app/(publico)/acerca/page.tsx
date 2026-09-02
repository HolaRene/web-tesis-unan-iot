import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { infoSitio } from "@/configuracion/sitio";

export const metadata: Metadata = {
  title: "Acerca del proyecto",
  description: "Información sobre la plataforma MonitorIT y su caso de estudio.",
};

export default function PaginaAcerca() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Acerca del proyecto
        </h1>
        <p className="text-muted-foreground">{infoSitio.descripcion}</p>
      </header>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Primer caso de estudio</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            El primer caso de estudio es la monitorización ambiental en un
            entorno hospitalario. Sin embargo, la arquitectura se ha diseñado de
            forma genérica para poder reutilizarse en industria, agricultura,
            edificios inteligentes, laboratorios o centros de datos.
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            La plataforma centraliza datos provenientes de sensores, PLC,
            dispositivos IoT y otras fuentes, permitiendo una supervisión local
            y remota, con alertas, históricos y videovigilancia IP.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Enfoque académico</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Este proyecto corresponde a un trabajo tecnológico académico. Todo
            el código, nombres de variables, comentarios e interfaz están en
            español, salvo términos técnicos donde el inglés es el estándar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

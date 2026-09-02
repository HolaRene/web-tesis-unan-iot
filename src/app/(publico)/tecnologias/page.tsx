import type { Metadata } from "next";
import {
  Table2,
  Type,
  Server,
  Database,
  Cable,
  Wifi,
  Workflow,
  Cloud,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Tecnologías",
  description: "Stack tecnológico de la plataforma MonitorIT.",
};

const tecnologias = [
  { nombre: "Next.js", detalle: "Framework de interfaz (React).", icono: Table2 },
  { nombre: "TypeScript", detalle: "Tipado estático en todo el stack.", icono: Type },
  { nombre: "Node.js", detalle: "Runtime del backend.", icono: Server },
  { nombre: "Express", detalle: "API REST del backend.", icono: Server },
  { nombre: "PostgreSQL", detalle: "Base de datos relacional.", icono: Database },
  { nombre: "OpenPLC", detalle: "Automatización industrial.", icono: Cable },
  { nombre: "Modbus TCP", detalle: "Protocolo industrial.", icono: Cable },
  { nombre: "MQTT", detalle: "Protocolo IoT.", icono: Wifi },
  { nombre: "Node-RED", detalle: "Middleware de integración.", icono: Workflow },
  { nombre: "ThingsBoard", detalle: "Interoperabilidad cloud.", icono: Cloud },
];

export default function PaginaTecnologias() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Tecnologías</h1>
        <p className="text-muted-foreground">
          Stack orientado a IoT e industria empleado por la plataforma.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tecnologias.map((tecnologia) => (
          <Card key={tecnologia.nombre}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <tecnologia.icono className="size-5 text-primary" aria-hidden />
                {tecnologia.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {tecnologia.detalle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

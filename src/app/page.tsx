import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowRight,
  Building2,
  Camera,
  Cloud,
  Cpu,
  Database,
  Factory,
  Flower2,
  Globe,
  LineChart,
  Radio,
  Server,
  Workflow,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CabeceraPublica } from "@/components/layout/cabecera-publica";
import { PiePublico } from "@/components/layout/pie-publico";
import { infoSitio } from "@/configuracion/sitio";

export const metadata: Metadata = {
  title: "Monitorización inteligente para entornos conectados",
  description: infoSitio.descripcion,
};

const caracteristicas = [
  {
    titulo: "Monitorización en tiempo real",
    descripcion: "Consulta el estado de sensores y dispositivos al instante.",
    Icono: Activity,
  },
  {
    titulo: "Históricos y gráficas",
    descripcion: "Visualiza tendencias y analiza el comportamiento de las variables.",
    Icono: LineChart,
  },
  {
    titulo: "Alertas",
    descripcion: "Configura umbrales y recibe notificaciones ante desviaciones.",
    Icono: AlertTriangle,
  },
  {
    titulo: "Integración IoT",
    descripcion: "Conecta nodos MQTT y dispositivos embebidos como ESP32.",
    Icono: Radio,
  },
  {
    titulo: "PLC y protocolos industriales",
    descripcion: "Soporta OpenPLC, Modbus TCP y otros protocolos de planta.",
    Icono: Factory,
  },
  {
    titulo: "Videovigilancia IP",
    descripcion: "Preparado para cámaras IP con streams HLS o WebRTC.",
    Icono: Camera,
  },
  {
    titulo: "Interoperabilidad cloud",
    descripcion: "Publica datos a plataformas externas como ThingsBoard Cloud.",
    Icono: Cloud,
  },
];

const pasosArquitectura = [
  { nombre: "Sensores / OpenPLC / ESP32", Icono: Cpu },
  { nombre: "Node-RED", Icono: Workflow },
  { nombre: "API REST", Icono: Server },
  { nombre: "PostgreSQL", Icono: Database },
  { nombre: "Plataforma web", Icono: Globe },
];

const ambitos = [
  { texto: "Industria", Icono: Factory },
  { texto: "Agricultura", Icono: Flower2 },
  { texto: "Edificios inteligentes", Icono: Building2 },
  { texto: "Laboratorios", Icono: Archive },
  { texto: "Centros de datos", Icono: Server },
  { texto: "Otros entornos IoT", Icono: Radio },
];

const chipsTecnologicos = [
  "Next.js",
  "TypeScript",
  "Node.js",
  "Express",
  "PostgreSQL",
  "OpenPLC",
  "Modbus TCP",
  "MQTT",
  "Node-RED",
  "ThingsBoard",
];

export default function PaginaInicio() {
  return (
    <div className="flex min-h-screen flex-col">
      <CabeceraPublica />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-muted/60 to-background">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Monitorización inteligente para entornos conectados
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                La plataforma centraliza datos provenientes de sensores, PLC,
                dispositivos IoT y otras fuentes, permitiendo supervisión local
                y remota de forma unificada.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/iniciar-sesion" className={buttonVariants()}>
                  Ver plataforma
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/#arquitectura"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Conocer arquitectura
                </Link>
              </div>
            </div>
            <div className="mx-auto max-w-md">
              <div className="rounded-3xl border bg-background p-8 text-center shadow-sm">
                <Activity className="mx-auto mb-3 size-10 text-primary" />
                <h2 className="text-xl font-semibold">{infoSitio.nombre}</h2>
                <p className="mt-1 text-muted-foreground">{infoSitio.eslogan}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Características */}
        <section id="caracteristicas" className="scroll-mt-20 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-semibold tracking-tight">
                Características
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Un ecosistema completo para monitorizar entornos físicos.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {caracteristicas.map((item) => (
                <Card key={item.titulo}>
                  <CardHeader>
                    <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <item.Icono className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="text-lg">{item.titulo}</CardTitle>
                    <CardDescription>{item.descripcion}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Arquitectura */}
        <section
          id="arquitectura"
          className="scroll-mt-20 bg-muted/40 py-16 lg:py-24"
        >
          <div className="mx-auto max-w-3xl space-y-10 px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight">
              Arquitectura del sistema
            </h2>
            <div className="flex flex-col items-center gap-1">
              {pasosArquitectura.map((paso, indice) => (
                <div key={paso.nombre} className="flex flex-col items-center">
                  <div className="flex items-center gap-3 rounded-2xl border bg-background px-5 py-3 shadow-sm">
                    <paso.Icono className="size-5 text-primary" aria-hidden />
                    <span className="font-medium">{paso.nombre}</span>
                  </div>
                  {indice < pasosArquitectura.length - 1 && (
                    <ArrowDown
                      className="my-1 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              El flujo parte de los sensores y controladores hasta la plataforma
              web. Como integración adicional se prevé la publicación hacia
              ThingsBoard Cloud (demostración de interoperabilidad).
            </p>
          </div>
        </section>

        {/* Tecnologías */}
        <section id="tecnologias" className="scroll-mt-20 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-semibold tracking-tight">
                Tecnologías
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {chipsTecnologicos.map((tecnologia) => (
                <span
                  key={tecnologia}
                  className="rounded-full border bg-background px-3.5 py-1.5 text-sm font-medium"
                >
                  {tecnologia}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Aplicación */}
        <section className="border-t bg-muted/40 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-semibold tracking-tight">
              Aplicación en distintos entornos
            </h2>
            <p className="mx-auto max-w-3xl text-center text-muted-foreground">
              El primer caso de estudio es la monitorización ambiental
              hospitalaria, pero la arquitectura es genérica y puede adaptarse
              a múltiples entornos:
            </p>
            <div className="grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-3">
              {ambitos.map((ambito) => (
                <Card key={ambito.texto}>
                  <CardHeader className="items-center text-center">
                    <ambito.Icono
                      className="mx-auto size-6 text-primary"
                      aria-hidden
                    />
                    <CardTitle className="text-lg">{ambito.texto}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PiePublico />
    </div>
  );
}

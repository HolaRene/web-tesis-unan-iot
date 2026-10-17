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
  Check,
  Cpu,
  Database,
  Factory,
  Flower2,
  Gauge,
  Globe,
  LineChart,
  Lock,

  Server,
  SlidersHorizontal,
  Workflow,
  Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CabeceraPublica } from "@/components/layout/cabecera-publica";
import { PiePublico } from "@/components/layout/pie-publico";
import { infoSitio } from "@/configuracion/sitio";

export const metadata: Metadata = {
  title: "Monitorización inteligente para entornos conectados",
  description: infoSitio.descripcion,
};

/**
 * Cifras del sistema.
 *
 * ⚠️ Todas están CONTADAS en el código, no estimadas:
 *   - 16 magnitudes → catálogo `tipos_variable`
 *   - 4 protocolos  → PROTOCOLOS_ACTUADOR en `direccionamiento.ts`
 *   - 8 eventos     → TipoEventoTiempoReal en `realtime/eventos.ts`
 *   - 5 escalas     → INTERVALOS_AGREGACION en `measurement.types.ts`
 *
 * Si se añade un protocolo o un evento nuevo hay que actualizarlas: una cifra
 * inflada en la portada es lo primero que se cae.
 */
const metricas = [
  { valor: "16", etiqueta: "magnitudes monitorizables", Icono: Gauge },
  { valor: "4", etiqueta: "protocolos de accionamiento", Icono: Zap },
  { valor: "8", etiqueta: "eventos en tiempo real", Icono: Activity },
  { valor: "5", etiqueta: "escalas de agregación", Icono: LineChart },
];

const caracteristicas = [
  {
    titulo: "Tiempo real por WebSocket",
    descripcion:
      "Los datos llegan al navegador empujados por el servidor, sin recargar. Ocho tipos de evento cubren dispositivos, mediciones, canales y alertas.",
    Icono: Activity,
  },
  {
    titulo: "Históricos y gráficas",
    descripcion:
      "Agregación en la base de datos por minuto, hora, día, semana o mes, con media ponderada y bandas de mínimo y máximo.",
    Icono: LineChart,
  },
  {
    titulo: "Alertas por umbral",
    descripcion:
      "Reglas asociadas a cada magnitud, con severidad, reconocimiento y resolución. El ciclo completo queda registrado.",
    Icono: AlertTriangle,
  },
  {
    titulo: "Control de actuadores",
    descripcion:
      "Acciona relés, válvulas o motores desde la web. El comando se encola y se confirma cuando el equipo lo ejecuta de verdad.",
    Icono: Zap,
  },
  {
    titulo: "Modbus con direccionamiento",
    descripcion:
      "Cada actuador guarda su dirección física (coil o registro, y unidad). Un PLC no entiende nombres: entiende «en la dirección 100, pon un 1».",
    Icono: Factory,
  },
  {
    titulo: "Sensores industriales 4–20 mA",
    descripcion:
      "Lazo de corriente con detección de fallo: una lectura por debajo de 4 mA solo puede ser una avería, nunca una medida baja real.",
    Icono: Cpu,
  },
  {
    titulo: "Videovigilancia IP",
    descripcion:
      "Cámaras RTSP reproducidas por WebRTC, con reproductor propio, vista previa y pantalla completa. El vídeo no pasa por la API.",
    Icono: Camera,
  },
  {
    titulo: "Multiempresa y roles",
    descripcion:
      "Cada cuenta ve solo sus recursos. El administrador supervisa todo; usuario y visualizador trabajan sobre lo suyo.",
    Icono: Lock,
  },
  {
    titulo: "Datos coherentes por diseño",
    descripcion:
      "Los identificadores y códigos los genera el servidor: no se pueden duplicar, ni escribir mal, ni romper el histórico al cambiarlos.",
    Icono: Database,
  },
];

const pasosArquitectura = [
  {
    nombre: "Sensores y actuadores",
    detalle: "4–20 mA · Modbus · GPIO · MQTT",
    Icono: Cpu,
  },
  {
    nombre: "Integración",
    detalle: "Node-RED traduce entre protocolos",
    Icono: Workflow,
  },
  {
    nombre: "API REST",
    detalle: "Valida, aplica reglas y persiste",
    Icono: Server,
  },
  {
    nombre: "PostgreSQL",
    detalle: "Fuente de verdad del histórico",
    Icono: Database,
  },
  {
    nombre: "WebSocket",
    detalle: "Emite los cambios tras confirmarlos",
    Icono: Activity,
  },
  {
    nombre: "Plataforma web",
    detalle: "Panel, gráficas y control",
    Icono: Globe,
  },
];

/**
 * Caso de uso hospitalario.
 *
 * El proyecto nace de este escenario, así que se explica con las normas que
 * lo condicionan: no es decoración, determina qué sensores sirven.
 */
const requisitosHospitalarios = [
  {
    titulo: "Señal estándar industrial",
    detalle:
      "Lazo de corriente 4–20 mA, inmune al ruido electromagnético y a las caídas de tensión por longitud de cable.",
  },
  {
    titulo: "Detección de fallo",
    detalle:
      "Una corriente por debajo de 4 mA delata rotura de cable o sensor averiado, nunca una medida válida.",
  },
  {
    titulo: "Hermeticidad y resistencia química",
    detalle:
      "Carcasa IP65 o superior, apta para limpieza con agentes desinfectantes.",
  },
  {
    titulo: "Compatibilidad con OpenPLC",
    detalle:
      "Integración mediante módulos de entrada analógica o comunicación Modbus TCP/RTU, sin adaptadores propietarios.",
  },
];

const ambitos = [
  { texto: "Hospitales", Icono: Building2 },
  { texto: "Industria", Icono: Factory },
  { texto: "Agricultura", Icono: Flower2 },
  { texto: "Edificios inteligentes", Icono: SlidersHorizontal },
  { texto: "Laboratorios", Icono: Archive },
  { texto: "Centros de datos", Icono: Server },
];

const chipsTecnologicos = [
  "Next.js",
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
  "Express 5",
  "PostgreSQL",
  "WebSocket",
  "OpenPLC",
  "Modbus TCP/RTU",
  "MQTT",
  "Node-RED",
  "MediaMTX",
  "WebRTC",
  "Zod",
  "TanStack Query",
];

export default function PaginaInicio() {
  return (
    <div className="flex min-h-screen flex-col">
      <CabeceraPublica />
      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-gradient-to-b from-muted/60 to-background">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
            <div className="space-y-6">
              <Badge variant="secondary" className="gap-1.5">
                <span
                  className="size-1.5 rounded-full bg-emerald-500"
                  aria-hidden
                />
                Plataforma operativa
              </Badge>

              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Del sensor al panel de control, sin cabos sueltos
              </h1>

              <p className="max-w-xl text-lg text-muted-foreground">
                {infoSitio.nombre} centraliza datos de PLC, sensores
                industriales, dispositivos IoT y cámaras IP en una sola
                plataforma. Supervisa, consulta el histórico y acciona equipos
                desde el navegador.
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

              {/* Métricas reales del sistema */}
              <dl className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
                {metricas.map((m) => (
                  <div key={m.etiqueta}>
                    <dd>
                      <span className="flex items-center gap-1.5 text-2xl font-semibold">
                        <m.Icono className="size-4 text-primary" aria-hidden />
                        {m.valor}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {m.etiqueta}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/*
              Tarjeta lateral: en lugar de un adorno, muestra la CADENA DE
              DATOS real, que es lo que distingue a la plataforma.
            */}
            <div className="mx-auto w-full max-w-md">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    Un dato, de punta a punta
                  </CardTitle>
                  <CardDescription>
                    Lo que ocurre desde que un sensor mide hasta que lo ves.
                  </CardDescription>
                </CardHeader>
                <div className="space-y-3 px-6 pb-6">
                  {[
                    "El sensor entrega 4–20 mA al PLC",
                    "El PLC expone el valor por Modbus",
                    "Node-RED lo traduce a la API",
                    "PostgreSQL confirma la escritura",
                    "El WebSocket avisa al navegador",
                  ].map((paso, i) => (
                    <div key={paso} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {paso}
                      </span>
                    </div>
                  ))}
                  <p className="border-t pt-3 text-xs text-muted-foreground">
                    El evento se emite <strong>después</strong> de confirmar el
                    dato: nunca se muestra algo que no está guardado.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Características ── */}
        <section id="caracteristicas" className="scroll-mt-20 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-semibold tracking-tight">
                Qué hace la plataforma
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Funcionalidades implementadas y verificadas, no una lista de
                intenciones.
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

        {/* ── Arquitectura ── */}
        <section
          id="arquitectura"
          className="scroll-mt-20 bg-muted/40 py-16 lg:py-24"
        >
          <div className="mx-auto max-w-3xl space-y-10 px-4 text-center sm:px-6 lg:px-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">
                Arquitectura del sistema
              </h2>
              <p className="text-muted-foreground">
                Cada capa tiene una responsabilidad y no invade la de al lado.
              </p>
            </div>

            <div className="flex flex-col items-center gap-1">
              {pasosArquitectura.map((paso, indice) => (
                <div key={paso.nombre} className="flex flex-col items-center">
                  <div className="flex items-center gap-3 rounded-2xl border bg-background px-5 py-3 shadow-sm">
                    <paso.Icono
                      className="size-5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="text-left">
                      <span className="block font-medium">{paso.nombre}</span>
                      <span className="block text-xs text-muted-foreground">
                        {paso.detalle}
                      </span>
                    </span>
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
              El vídeo de las cámaras sigue un camino aparte: de la cámara a
              MediaMTX y de ahí al navegador por WebRTC.{" "}
              <strong className="text-foreground">No pasa por la API</strong>,
              que solo administra sus metadatos.
            </p>
          </div>
        </section>

        {/* ── Caso de uso hospitalario ── */}
        <section id="hospitalario" className="scroll-mt-20 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-3 text-center">
              <Badge variant="outline">Caso de estudio</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">
                Monitorización ambiental hospitalaria
              </h2>
              <p className="mx-auto max-w-3xl text-muted-foreground">
                El escenario que originó el proyecto. Las normas del entorno
                sanitario no son decoración: determinan qué sensores sirven y
                cómo hay que conectarlos.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {requisitosHospitalarios.map((r) => (
                <Card key={r.titulo}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Check className="size-4 shrink-0 text-emerald-600" aria-hidden />
                      {r.titulo}
                    </CardTitle>
                    <CardDescription>{r.detalle}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <p className="mx-auto max-w-3xl text-center text-sm text-muted-foreground">
              Requisitos derivados de las normas{" "}
              <strong className="text-foreground">ASHRAE 170</strong>{" "}
              (ventilación en instalaciones sanitarias) e{" "}
              <strong className="text-foreground">ISO 14644</strong> (salas
              limpias), y de los umbrales{" "}
              <strong className="text-foreground">NAMUR NE 43</strong> para la
              detección de fallo en lazos de corriente.
            </p>
          </div>
        </section>

        {/* ── Tecnologías ── */}
        <section
          id="tecnologias"
          className="scroll-mt-20 bg-muted/40 py-16 lg:py-24"
        >
          <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-semibold tracking-tight">
                Tecnologías
              </h2>
              <p className="text-muted-foreground">
                Todas en uso en la versión actual.
              </p>
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

        {/* ── Ámbitos ── */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-semibold tracking-tight">
                Aplicable a otros entornos
              </h2>
              <p className="mx-auto max-w-3xl text-muted-foreground">
                La arquitectura es genérica. El hospital es el primer caso, no
                el único: cualquier entorno con magnitudes físicas y equipos
                que accionar encaja en el mismo modelo.
              </p>
            </div>
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

        {/* ── Llamada final ── */}
        <section className="border-t bg-muted/40 py-16 lg:py-20">
          <div className="mx-auto max-w-2xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight">
              Pruébalo con tus propios equipos
            </h2>
            <p className="text-muted-foreground">
              Crea una cuenta, registra un dispositivo y envía tu primera
              medición. La plataforma genera sola los identificadores que
              necesitarás configurar en el equipo.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/registro" className={buttonVariants()}>
                Crear cuenta
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/iniciar-sesion"
                className={buttonVariants({ variant: "outline" })}
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PiePublico />
    </div>
  );
}

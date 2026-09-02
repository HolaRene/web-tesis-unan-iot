import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  MapPin,
  RadioTower,
  Activity as ActivityIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { GraficaActividad } from "@/components/dashboard/grafica-actividad";
import {
  alertasRecientesMock,
  dispositivosRecientesMock,
  resumenMock,
  serieActividadMock,
  ultimasMedicionesMock,
  formatearFecha,
  formatearValor,
  textoEstado,
  varianteEstadoDispositivo,
  varianteSeveridad,
} from "@/utilidades";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Resumen general del estado del sistema.",
};

const metricas = [
  { etiqueta: "Áreas", valor: resumenMock.areas, icono: MapPin },
  { etiqueta: "Dispositivos conectados", valor: resumenMock.dispositivos, icono: RadioTower },
  { etiqueta: "Sensores activos", valor: resumenMock.sensores, icono: ActivityIcon },
  { etiqueta: "Alertas activas", valor: resumenMock.alertasActivas, icono: AlertTriangle },
];

export default function PaginaDashboard() {
  return (
    <div className="space-y-6">
      {/* Nota clara de que el contenido es de demostración */}
      <div className="flex items-center gap-2 rounded-2xl border border-dashed bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <Cpu className="size-4 shrink-0" aria-hidden />
        <p>
          Panel con <strong>datos de demostración</strong> (mock). Al conectar
          la API REST estos valores cargarán desde el backend.
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricas.map((metrica) => (
          <Card key={metrica.etiqueta}>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardDescription>{metrica.etiqueta}</CardDescription>
              <metrica.icono className="size-5 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrica.valor}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Estado general y gráfica */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Actividad de mediciones</CardTitle>
              <CardDescription>
                Últimas lecturas registradas por los sensores.
              </CardDescription>
            </div>
            <Badge variant="secondary">Normal</Badge>
          </CardHeader>
          <CardContent>
            <GraficaActividad datos={serieActividadMock} />
          </CardContent>
        </Card>

        {/* Últimas mediciones */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas mediciones</CardTitle>
            <CardDescription>Registros más recientes recibidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sensor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultimasMedicionesMock.map((medicion) => (
                  <TableRow key={medicion.id}>
                    <TableCell className="font-medium">
                      {medicion.sensor_id}
                    </TableCell>
                    <TableCell>{formatearValor(medicion.valor_numerico)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatearFecha(medicion.registrado_en)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Dispositivos recientes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Dispositivos recientes</CardTitle>
              <CardDescription>Dispositivos registrados en la plataforma.</CardDescription>
            </div>
            <CardAction>
              <Link href="/dispositivos" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
                Ver todos <ArrowRight className="size-3.5" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {dispositivosRecientesMock.map((dispositivo) => (
                <li
                  key={dispositivo.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{dispositivo.nombre}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {formatearFecha(dispositivo.ultimaConexion)}
                    </p>
                  </div>
                  <Badge variant={varianteEstadoDispositivo(dispositivo.estado)}>
                    {textoEstado(dispositivo.estado)}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Alertas recientes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Alertas recientes</CardTitle>
              <CardDescription>Resumen de alertas activas del sistema.</CardDescription>
            </div>
            <CardAction>
              <Link href="/alertas" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
                Ver todas <ArrowRight className="size-3.5" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {alertasRecientesMock.map((alerta) => (
                <li
                  key={alerta.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {alerta.mensaje ?? "Alerta"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatearFecha(alerta.iniciada_en)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={varianteSeveridad(alerta.severidad)}>
                      {textoEstado(alerta.severidad)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

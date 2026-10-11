"use client";

/**
 * Contenido del dashboard principal.
 *
 * Consume datos reales de la API REST mediante {useResumenDashboard}
 * (TanStack Query). Si alguna petición falla se muestra el error, y si la API
 * no devuelve datos se muestra un "estado vacío".
 */
import Link from "next/link";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowRight,
  MapPin,
  RadioTower,
  Loader2,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelMagnitudes } from "@/components/dashboard/panel-magnitudes";
import { PanelActividad } from "@/components/dashboard/panel-actividad";
import { PanelActuadores } from "@/components/dashboard/panel-actuadores";
import { useResumenDashboard } from "@/hooks/use-resumen-dashboard";
import {
  formatearFecha,
  formatearValor,
  textoEstado,
  varianteEstadoDispositivo,
  varianteSeveridad,
} from "@/utilidades";
import { cn } from "@/lib/utils";

export function PanelDashboard() {
  const resumen = useResumenDashboard();

  const metricas = [
    {
      etiqueta: "Áreas",
      valor: resumen.totalAreas,
      icono: MapPin,
      href: "/areas",
    },
    {
      etiqueta: "Dispositivos conectados",
      valor: resumen.dispositivosConectados,
      icono: RadioTower,
      href: "/dispositivos",
    },
    {
      etiqueta: "Sensores activos",
      valor: resumen.sensoresActivos,
      icono: ActivityIcon,
      href: "/sensores",
    },
    {
      etiqueta: "Alertas activas",
      valor: resumen.alertasActivas,
      icono: AlertTriangle,
      href: "/alertas",
    },
  ];

  if (resumen.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar el dashboard</AlertTitle>
        <AlertDescription>
          {resumen.error}. Revisa que el backend esté activo y que tengas sesión
          iniciada.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nota: si no hay datos, muestra estado vacío */}
      {!resumen.cargando &&
        resumen.totalDispositivos === 0 &&
        resumen.totalAreas === 0 &&
        resumen.sensoresActivos === 0 &&
        resumen.alertasActivas === 0 && (
          <Alert>
            <AlertTitle>Sin datos todavía</AlertTitle>
            <AlertDescription>
              El dashboard se muestra con los datos registrados. Cuando la API
              tenga áreas, dispositivos o sensores con mediciones, aparecerán
              aquí.
            </AlertDescription>
          </Alert>
        )}

      {/* Tarjetas de resumen */}
      {resumen.cargando ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, indice) => (
            <Skeleton key={indice} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricas.map((metrica) => (
            <Card key={metrica.etiqueta}>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardDescription>{metrica.etiqueta}</CardDescription>
                <metrica.icono
                  className="size-5 text-muted-foreground"
                  aria-hidden
                />
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-3xl font-semibold">{metrica.valor}</p>
                <Link
                  href={metrica.href}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Ver <ArrowRight className="size-3" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/*
        Estado actual de los sensores: una tarjeta por magnitud, con icono
        según el tipo, semáforo de frescura y mini-gráfico de la última hora.
        Va justo debajo de las métricas porque es lo que se consulta primero.
      */}
      <PanelMagnitudes />

      {/* Control de actuadores: el widget depende del tipo de cada uno. */}
      <PanelActuadores />

      {!resumen.cargando && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {/*
              Actividad real, agregada en SQL. Antes se calculaba con las 10
              ultimas mediciones del resumen y solia dibujar una sola barra.
            */}
            <div className="lg:col-span-2">
              <PanelActividad />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Últimas mediciones</CardTitle>
                <CardDescription>Registros más recientes.</CardDescription>
              </CardHeader>
              <CardContent>
                {resumen.ultimasMediciones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay mediciones.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sensor</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumen.ultimasMediciones.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">
                            {renderSensorDeMedicion(m)}
                          </TableCell>
                          <TableCell>
                            {formatearValor(m.valor_numerico)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatearFecha(m.registrado_en)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Dispositivos recientes</CardTitle>
                  <CardDescription>Por última conexión.</CardDescription>
                </div>
                <CardAction>
                  <Link
                    href="/dispositivos"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "gap-1.5"
                    )}
                  >
                    Ver todos <ArrowRight className="size-3.5" />
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent>
                {resumen.dispositivosRecientes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay dispositivos.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {resumen.dispositivosRecientes.map((disp) => (
                      <li
                        key={disp.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{disp.nombre}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {disp.ultima_conexion
                              ? formatearFecha(disp.ultima_conexion)
                              : "Sin contacto"}
                          </p>
                        </div>
                        <Badge variant={varianteEstadoDispositivo(disp.estado)}>
                          {textoEstado(disp.estado)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Alertas recientes</CardTitle>
                  <CardDescription>Últimas alertas generadas.</CardDescription>
                </div>
                <CardAction>
                  <Link
                    href="/alertas"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "gap-1.5"
                    )}
                  >
                    Ver todas <ArrowRight className="size-3.5" />
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent>
                {resumen.alertasRecientes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay alertas.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {resumen.alertasRecientes.map((alerta) => (
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
                        <Badge variant={varianteSeveridad(alerta.severidad)}>
                          {textoEstado(alerta.severidad)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {resumen.cargando && (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Cargando datos del sistema…
        </div>
      )}
    </div>
  );
}

/** Muestra el sensor legible (código · nombre) en lugar de solo el UUID interno. */
function renderSensorDeMedicion(m: {
  sensor_codigo?: string | null;
  sensor_nombre?: string | null;
  sensor_id?: string;
}) {
  if (m.sensor_codigo && m.sensor_nombre) return `${m.sensor_codigo} · ${m.sensor_nombre}`;
  if (m.sensor_codigo) return m.sensor_codigo;
  if (m.sensor_nombre) return m.sensor_nombre;
  if (m.sensor_id) return m.sensor_id;
  return "Sensor";
}


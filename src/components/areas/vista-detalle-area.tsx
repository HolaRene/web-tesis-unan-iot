"use client";

/**
 * Detalle de un ÁREA (/areas/[id]).
 *
 * ────────────────────────────────────────────────────────────────────
 * JERARQUÍA DE DATOS (importante)
 * ────────────────────────────────────────────────────────────────────
 * Solo `dispositivos` y `camaras` tienen `area_id`. Los sensores, canales y
 * actuadores NO cuelgan del área: cuelgan de un DISPOSITIVO, que es quien
 * pertenece al área.
 *
 *     area
 *      ├── dispositivos ── sensores ── canales ── mediciones
 *      │                └─ actuadores
 *      └── camaras
 *
 * Por eso todo se obtiene filtrando por `area_id` y dejando que el backend
 * resuelva la herencia en SQL (devuelve `area_id` en cada fila).
 *
 * ────────────────────────────────────────────────────────────────────
 * AISLAMIENTO POR PROPIETARIO
 * ────────────────────────────────────────────────────────────────────
 * Todos los endpoints aplican el filtro de visibilidad del usuario, así que
 * esta vista no necesita comprobarlo: si el área no es visible, la propia API
 * responde con un error de permisos.
 */
import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Camera,
  Cpu,
  MapPin,
  Radio,
  ToggleRight,
} from "lucide-react";

import { CumplimientoArea } from "@/components/areas/cumplimiento-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GraficosArea } from "@/components/areas/graficos-area";

import { obtenerArea } from "@/servicios/areas.servicio";
import { listarDispositivos } from "@/servicios/dispositivos.servicio";
import { listarSensores } from "@/servicios/sensores.servicio";
import { listarAlertas } from "@/servicios/alertas.servicio";
import { listarCamaras } from "@/servicios/camaras.servicio";
import { listarActuadoresDeArea } from "@/servicios/actuadores.servicio";
import { useEventosDispositivos } from "@/hooks/use-eventos-dispositivos";
import { POLLING_RESPALDO_MS } from "@/configuracion/realtime";
import {
  formatearFecha,
  haceTiempo,
  varianteEstadoDispositivo,
  varianteSeveridad,
  sePuedeGraficar,
  etiquetaTipoDato,
  motivoNoGraficable,
} from "@/utilidades";
import type { Sensor } from "@/tipos";

export function VistaDetalleArea({ id }: { id: string }) {
  // Los eventos realtime mantienen el estado de los dispositivos al día.
  useEventosDispositivos();

  const areaQ = useQuery({
    queryKey: ["area", id],
    queryFn: () => obtenerArea(id),
  });

  const dispositivosQ = useQuery({
    queryKey: ["dispositivos", "area", id],
    queryFn: () => listarDispositivos({ area_id: id }),
    refetchInterval: POLLING_RESPALDO_MS,
  });

  const sensoresQ = useQuery({
    queryKey: ["sensores", "area", id],
    queryFn: () => listarSensores({ area_id: id }),
    refetchInterval: POLLING_RESPALDO_MS,
  });

  const camarasQ = useQuery({
    queryKey: ["camaras", "area", id],
    queryFn: () => listarCamaras({ area_id: id }),
  });

  const actuadoresQ = useQuery({
    queryKey: ["actuadores", "area", id],
    queryFn: () => listarActuadoresDeArea(id),
  });

  /*
   * Las alertas no tienen filtro por área en la API, así que se piden todas y
   * se cruzan con los sensores del área. El volumen de alertas es bajo, por lo
   * que hacerlo en memoria es razonable.
   */
  const alertasQ = useQuery({
    queryKey: ["alertas"],
    queryFn: () => listarAlertas(),
    refetchInterval: POLLING_RESPALDO_MS,
  });

  const area = areaQ.data;
  const dispositivos = useMemo(
    () => dispositivosQ.data ?? [],
    [dispositivosQ.data]
  );
  const sensores = useMemo(() => sensoresQ.data ?? [], [sensoresQ.data]);
  const camaras = useMemo(() => camarasQ.data ?? [], [camarasQ.data]);
  const actuadores = useMemo(() => actuadoresQ.data ?? [], [actuadoresQ.data]);

  /** Alertas de los sensores de esta área que siguen activas. */
  const alertasDelArea = useMemo(() => {
    const idsSensores = new Set(sensores.map((s) => s.id));
    return (alertasQ.data ?? []).filter(
      (a) => a.sensor_id && idsSensores.has(a.sensor_id)
    );
  }, [alertasQ.data, sensores]);

  const alertasActivas = alertasDelArea.filter((a) => a.estado === "active");
  const dispositivosOnline = dispositivos.filter(
    (d) => d.estado === "online"
  ).length;

  if (areaQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (areaQ.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar el área</AlertTitle>
        <AlertDescription>{(areaQ.error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  if (!area) return null;

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/areas"
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Volver a áreas
          </Link>
          <h1 className="text-2xl font-semibold">{area.nombre}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {area.tipo ? (
              <Badge variant="outline" className="gap-1">
                <MapPin className="size-3" aria-hidden />
                {area.tipo}
              </Badge>
            ) : null}
            <Badge variant={area.activo ? "secondary" : "outline"}>
              {area.activo ? "Activa" : "Inactiva"}
            </Badge>
          </div>
          {area.descripcion ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {area.descripcion}
            </p>
          ) : null}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaResumen
          icono={<Cpu className="size-4" aria-hidden />}
          titulo="Dispositivos"
          valor={dispositivos.length}
          detalle={`${dispositivosOnline} en línea`}
        />
        <TarjetaResumen
          icono={<Radio className="size-4" aria-hidden />}
          titulo="Sensores"
          valor={sensores.length}
          detalle={`${sensores.filter((s) => sePuedeGraficar(s.tipo_dato)).length} con gráfico`}
        />
        <TarjetaResumen
          icono={<AlertTriangle className="size-4" aria-hidden />}
          titulo="Alertas activas"
          valor={alertasActivas.length}
          detalle={`${alertasDelArea.length} en total`}
          alerta={alertasActivas.length > 0}
        />
        <TarjetaResumen
          icono={<Camera className="size-4" aria-hidden />}
          titulo="Cámaras"
          valor={camaras.length}
          detalle={`${actuadores.length} actuadores`}
        />
      </div>

      {/*
        Cumplimiento normativo: compara el último valor de cada magnitud con
        la banda del perfil declarado en el área. Es lo que responde «¿se está
        aplicando la norma aquí?».
      */}
      <CumplimientoArea areaId={id} />

      {/* Dispositivos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispositivos del área</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sensores y actuadores cuelgan de estos dispositivos.
          </p>
        </CardHeader>
        <CardContent>
          {dispositivosQ.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : dispositivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta área no tiene dispositivos asignados.
            </p>
          ) : (
            <ul className="divide-y">
              {dispositivos.map((d) => {
                const sensoresDeEste = sensores.filter(
                  (s) => s.dispositivo_id === d.id
                );
                return (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/dispositivos/${d.id}`}
                        className="font-medium hover:underline"
                      >
                        {d.nombre}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        <code>{d.identificador}</code>
                        {d.tipo ? ` · ${d.tipo}` : ""}
                        {d.direccion_ip ? ` · ${d.direccion_ip}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {sensoresDeEste.length}{" "}
                        {sensoresDeEste.length === 1 ? "sensor" : "sensores"}
                      </span>
                      <Badge variant={varianteEstadoDispositivo(d.estado)}>
                        {d.estado ?? "—"}
                      </Badge>
                      {d.ultima_conexion ? (
                        <span className="text-xs text-muted-foreground">
                          {haceTiempo(d.ultima_conexion)}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Sensores, agrupados por dispositivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sensores y magnitudes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cada sensor puede medir varias magnitudes. Solo las numéricas se
            representan en los gráficos.
          </p>
        </CardHeader>
        <CardContent>
          {sensoresQ.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : sensores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta área no tiene sensores.
            </p>
          ) : (
            <ul className="divide-y">
              {sensores.map((s) => (
                <FilaSensor key={s.id} sensor={s} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Gráficos: uno por magnitud del área */}
      <GraficosArea areaId={id} sensores={sensores} />

      {/* Actuadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ToggleRight className="size-4 text-muted-foreground" aria-hidden />
            Actuadores
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Salidas controlables (relés, válvulas, motores) de los dispositivos
            del área.
          </p>
        </CardHeader>
        <CardContent>
          {actuadoresQ.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : actuadores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta área no tiene actuadores. Cuando crees uno en alguno de sus
              dispositivos, aparecerá aquí.
            </p>
          ) : (
            <ul className="divide-y">
              {actuadores.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      <code>{a.codigo}</code>
                      {a.tipo ? ` · ${a.tipo}` : ""}
                      {a.dispositivo_nombre ? ` · ${a.dispositivo_nombre}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.activo ? "secondary" : "outline"}>
                      {a.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    {a.estado_actual ? (
                      <Badge variant="outline">{a.estado_actual}</Badge>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas del área</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimas alertas generadas por los sensores de esta área.
          </p>
        </CardHeader>
        <CardContent>
          {alertasQ.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : alertasDelArea.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay alertas registradas para esta área.
            </p>
          ) : (
            <ul className="divide-y">
              {alertasDelArea.slice(0, 10).map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{a.mensaje}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.iniciada_en ? formatearFecha(a.iniciada_en) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={varianteSeveridad(a.severidad)}>
                      {a.severidad}
                    </Badge>
                    <Badge variant={a.estado === "active" ? "destructive" : "outline"}>
                      {a.estado === "active" ? "Activa" : a.estado}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Tarjeta de resumen con icono, valor y detalle. */
function TarjetaResumen({
  icono,
  titulo,
  valor,
  detalle,
  alerta = false,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: number;
  detalle: string;
  alerta?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-4">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            alerta
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {icono}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{titulo}</p>
          <p className="text-xl font-semibold leading-tight">{valor}</p>
          <p className="truncate text-xs text-muted-foreground">{detalle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Una fila de la lista de sensores, indicando si su magnitud se grafica. */
function FilaSensor({ sensor }: { sensor: Sensor }) {
  const graficable = sePuedeGraficar(sensor.tipo_dato);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/sensores/${sensor.id}`}
            className="font-medium hover:underline"
          >
            {sensor.nombre}
          </Link>
          <p className="text-xs text-muted-foreground">
            <code>{sensor.codigo}</code>
            {sensor.tipo_nombre ? ` · ${sensor.tipo_nombre}` : ""}
            {sensor.unidad ? ` · ${sensor.unidad}` : ""}
            {sensor.dispositivo_nombre ? ` · ${sensor.dispositivo_nombre}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{etiquetaTipoDato(sensor.tipo_dato)}</Badge>
          <Badge variant={sensor.activo ? "secondary" : "outline"}>
            {sensor.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      {!graficable ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Sin gráfico: {motivoNoGraficable(sensor.tipo_dato)}
        </p>
      ) : null}

      {sensor.ultimo_registrado_en ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Último dato: {formatearFecha(sensor.ultimo_registrado_en)}
        </p>
      ) : null}
    </li>
  );
}

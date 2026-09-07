"use client";

/**
 * Tarjeta genérica de Sensor para la vista /sensores.
 * Muestra dato amigable (nombre/código), valor actual, y nombre de variables,
 * dispositivo y área. Recibe la fila enriquecida del backend (GET /sensors).
 */
import Link from "next/link";
import { Activity, Pin, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatearFecha } from "@/utilidades";

export interface FilaSensorTarjeta {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  unidad: string | null;
  tipo_dato?: string | null;
  tipo_nombre?: string | null;
  tipo_unidad?: string | null;
  area_nombre?: string | null;
  dispositivo_nombre?: string | null;
  dispositivo_identificador?: string | null;
  dispositivo_estado?: string | null;
  ultimo_valor_numerico: number | null;
  ultimo_valor_texto: string | null;
  ultimo_registrado_en: string | null;
  cantidad_mediciones?: number | null;
  alerta_activa?: boolean;
}

export default function TarjetaSensor({ sensor }: { sensor: FilaSensorTarjeta }) {
  const hayDatoNumerico =
    sensor.ultimo_valor_numerico !== null && sensor.ultimo_valor_numerico !== undefined;
  const hayDatoTexto = Boolean(sensor.ultimo_valor_texto);

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="font-semibold leading-tight">{sensor.nombre}</p>
          <code className="text-xs text-muted-foreground">{sensor.codigo}</code>
        </div>

        <div className="rounded-xl bg-muted/60 px-3 py-2">
          {hayDatoNumerico ? (
            <p className="text-2xl font-semibold">
              {sensor.ultimo_valor_numerico as number}
              {sensor.unidad ? ` ${sensor.unidad}` : ""}
            </p>
          ) : hayDatoTexto ? (
            <p className="text-lg font-medium">{sensor.ultimo_valor_texto}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin medición</p>
          )}
          <p className="text-xs text-muted-foreground">
            {sensor.ultimo_registrado_en
              ? formatearFecha(sensor.ultimo_registrado_en)
              : "—"}
          </p>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Activity className="size-3.5" aria-hidden />
            Variable: {sensor.tipo_nombre ?? "—"}
            {sensor.tipo_dato ? (
              <span className="text-xs">· {sensor.tipo_dato} {sensor.tipo_unidad ? `· ${sensor.tipo_unidad}` : ""}</span>
            ) : null}
          </p>
          <p className="flex items-center gap-2">
            <Radio className="size-3.5" aria-hidden />
            Dispositivo:
            {sensor.dispositivo_nombre ?? "—"}
            {sensor.dispositivo_identificador ? ` (${sensor.dispositivo_identificador})` : ""}
          </p>
          <p className="flex items-center gap-2">
            <Pin className="size-3.5" aria-hidden />
            Área: {sensor.area_nombre ?? "—"}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Badge variant={sensor.alerta_activa ? "destructive" : "secondary"}>
              {sensor.alerta_activa ? "Alerta" : sensor.activo ? "Activo" : "Inactivo"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {sensor.cantidad_mediciones != null
                ? `${sensor.cantidad_mediciones} med.`
                : ""}
            </span>
          </div>
          <Link
            href={`/sensores/${sensor.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Conectar / Ver
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

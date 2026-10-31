"use client";

/** Tarjeta genérica de un Canal (magnitud de un sensor físico). */
import Link from "next/link";
import { Activity, Radio, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Canal } from "@/tipos";
import { formatearFecha } from "@/utilidades";
import { BadgeNivel } from "@/components/nivel/badge-nivel";

export function TarjetaCanal({ canal }: { canal: Canal }) {
  const valor =
    canal.ultimo_valor_numerico !== null && canal.ultimo_valor_numerico !== undefined
      ? canal.ultimo_valor_numerico
      : canal.ultimo_valor_texto;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{canal.nombre}</p>
            <code className="text-xs text-muted-foreground">{canal.codigo}</code>
          </div>
          <Badge variant={canal.activo ? "secondary" : "outline"}>
            {canal.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        <div className="rounded-xl bg-muted/60 px-3 py-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-lg font-semibold">
              {typeof valor === "number" ? `${valor} ${canal.unidad ?? ""}` : valor ?? "—"}
            </span>
            {/* Nivel según las reglas del canal; lo calcula el backend. */}
            <BadgeNivel nivel={canal.ultimo_nivel} />
          </div>
          {canal.cantidad_mediciones != null && (
            <span className="text-xs text-muted-foreground">
              {canal.cantidad_mediciones} mediciones
            </span>
          )}
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Activity className="size-3.5" aria-hidden />
            Variable: {canal.tipo_nombre ?? "—"} · {canal.tipo_dato ?? ""}
          </p>
          <p className="flex items-center gap-2">
            <Radio className="size-3.5" aria-hidden />
            Dispositivo: {canal.dispositivo_nombre ?? "—"}
            {canal.dispositivo_identificador ? ` (${canal.dispositivo_identificador})` : ""}
          </p>
          <p className="flex items-center gap-2">
            <Link2 className="size-3.5" aria-hidden />
            Área: {canal.area_nombre ?? "—"}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{canal.ultimo_registrado_en ? formatearFecha(canal.ultimo_registrado_en) : "Sin mediciones"}</span>
          <Link className="font-medium text-primary hover:underline" href={`/canales/${canal.id}`}>
            Ver detalle
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * Ficha técnica de una cámara.
 *
 * Muestra la información técnica y los metadatos. NUNCA muestra
 * credenciales (el modelo no las almacena).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatearFecha } from "@/utilidades";
import type { Camara } from "@/tipos";

/** Fila etiqueta/valor de la ficha. */
function Fila({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{etiqueta}</span>
      <span className="text-sm font-medium">{valor}</span>
    </div>
  );
}

export function CamaraDetalles({ camara }: { camara: Camara }) {
  const metadatos = Object.entries(camara.metadatos ?? {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Información técnica</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Fila etiqueta="Área" valor={camara.area_nombre ?? "—"} />
        <Fila
          etiqueta="Dispositivo"
          valor={
            camara.dispositivo_identificador ??
            camara.dispositivo_nombre ??
            "—"
          }
        />
        <Fila etiqueta="Dirección IP" valor={camara.direccion_ip ?? "—"} />
        <Fila etiqueta="Puerto RTSP" valor={camara.puerto_rtsp} />
        <Fila etiqueta="Protocolo" valor={camara.protocolo} />
        <Fila
          etiqueta="Ruta del stream"
          valor={<code className="text-xs">{camara.ruta_stream}</code>}
        />
        <Fila
          etiqueta="Ruta WebRTC"
          valor={
            camara.ruta_webrtc ? (
              <code className="text-xs">{camara.ruta_webrtc}</code>
            ) : (
              <span className="text-muted-foreground">Sin configurar</span>
            )
          }
        />
        <Fila
          etiqueta="Grabación"
          valor={
            <Badge variant={camara.grabacion_habilitada ? "secondary" : "outline"}>
              {camara.grabacion_habilitada ? "Habilitada" : "Deshabilitada"}
            </Badge>
          }
        />
        <Fila
          etiqueta="Última conexión"
          valor={
            camara.ultima_conexion
              ? formatearFecha(camara.ultima_conexion)
              : "Sin conexiones registradas"
          }
        />
        <Fila etiqueta="Creada" valor={formatearFecha(camara.creado_en)} />
        <Fila
          etiqueta="Actualizada"
          valor={formatearFecha(camara.actualizado_en)}
        />

        {metadatos.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Metadatos</p>
            <div className="flex flex-wrap gap-2">
              {metadatos.map(([clave, valor]) => (
                <Badge key={clave} variant="outline" className="font-normal">
                  {clave}: {String(valor)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

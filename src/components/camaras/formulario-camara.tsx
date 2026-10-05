"use client";

/**
 * Formulario de alta y edición de una cámara IP.
 *
 * ────────────────────────────────────────────────────────────────────
 * DOS COSAS QUE SE GUARDAN EN SITIOS DISTINTOS
 * ────────────────────────────────────────────────────────────────────
 * Este formulario maneja información de dos naturalezas:
 *
 *   1. Lo que se guarda en la BASE DE DATOS (vía la API):
 *      nombre, IP, puerto, PATH del stream, ruta WebRTC, área…
 *
 *   2. Lo que NUNCA se guarda: usuario y contraseña de la cámara.
 *      Solo sirven para construir la URL completa que se pega en MediaMTX.
 *
 * Por eso hay una sección claramente separada: las credenciales son una
 * ayuda de configuración, no un dato de la plataforma.
 *
 * ────────────────────────────────────────────────────────────────────
 * CÁMARAS MULTI-CANAL (HikVision de 2 canales y similares)
 * ────────────────────────────────────────────────────────────────────
 * Cada canal de una cámara es un stream RTSP independiente, así que se
 * registra como una cámara distinta en la plataforma:
 *
 *   "Quirófano 1 - Canal 1"  →  /Streaming/Channels/101
 *   "Quirófano 1 - Canal 2"  →  /Streaming/Channels/201
 *
 * El selector de canal rellena la ruta automáticamente, así no hay que
 * recordar la numeración de cada marca.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Copy, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  crearCamara,
  actualizarCamara,
  type DatosCamara,
} from "@/servicios/camaras.servicio";
import { listarAreas } from "@/servicios/areas.servicio";
import type { Camara } from "@/tipos";
import {
  FABRICANTES,
  canalesDe,
  sugerirRutaWebrtc,
  urlRtspCompleta,
} from "@/configuracion/camaras";

interface FormularioCamaraProps {
  /** Cámara a editar. Si no se indica, el formulario crea una nueva. */
  camara?: Camara | null;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
}

export function FormularioCamara({
  camara,
  onCerrar,
  onGuardado,
}: FormularioCamaraProps) {
  const queryClient = useQueryClient();
  const esEdicion = Boolean(camara);

  // ── Datos que SÍ se guardan ──────────────────────────────────
  const [nombre, setNombre] = useState(camara?.nombre || "");
  const [descripcion, setDescripcion] = useState(camara?.descripcion || "");
  const [fabricanteId, setFabricanteId] = useState("hikvision");
  const [canalNumero, setCanalNumero] = useState("1");
  const [direccionIp, setDireccionIp] = useState(camara?.direccion_ip || "");
  const [puertoRtsp, setPuertoRtsp] = useState(
    String(camara?.puerto_rtsp ?? 554)
  );
  const [rutaStream, setRutaStream] = useState(camara?.ruta_stream || "");
  const [rutaWebrtc, setRutaWebrtc] = useState(camara?.ruta_webrtc || "");
  const [areaId, setAreaId] = useState(camara?.area_id || "");
  const [activa, setActiva] = useState(camara?.activa ?? true);

  // ── Credenciales: NO se guardan, solo construyen la URL de MediaMTX ──
  const [usuario, setUsuario] = useState("admin");
  const [password, setPassword] = useState("");
  const [copiado, setCopiado] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const areasQ = useQuery({
    queryKey: ["areas"],
    queryFn: () => listarAreas(),
  });

  const canales = useMemo(() => canalesDe(fabricanteId), [fabricanteId]);
  const fabricante = FABRICANTES.find((f) => f.id === fabricanteId);

  /** La URL completa de MediaMTX (con credenciales), solo para copiar. */
  const urlCompleta = useMemo(
    () =>
      urlRtspCompleta({
        direccionIp: direccionIp.trim(),
        puerto: Number(puertoRtsp) || 554,
        rutaStream: rutaStream.trim(),
        usuario: usuario.trim(),
        password,
      }),
    [direccionIp, puertoRtsp, rutaStream, usuario, password]
  );

  const mutGuardar = useMutation({
    mutationFn: (datos: DatosCamara) =>
      esEdicion
        ? actualizarCamara(camara!.id, datos)
        : crearCamara(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camaras"] });
      onGuardado(
        esEdicion ? "Cámara actualizada correctamente" : "Cámara creada correctamente"
      );
      onCerrar();
    },
    onError: (e: Error) => setError(e.message),
  });

  /** Al elegir marca + canal, rellena la ruta y sugiere nombre y ruta WebRTC. */
  function aplicarCanal(fabricanteElegido: string, numeroCanal: string) {
    const canal = canalesDe(fabricanteElegido).find(
      (c) => String(c.numero) === numeroCanal
    );
    if (!canal) return;

    setRutaStream(canal.rutaStream);

    // Solo se sugiere si el usuario no ha escrito nada todavía: no se debe
    // pisar lo que ya haya puesto a mano.
    if (!nombre.trim() && fabricante) {
      setNombre(`${fabricante.nombre} ${canal.sufijo}`.trim());
    }
    if (!rutaWebrtc.trim()) {
      setRutaWebrtc(sugerirRutaWebrtc(nombre || "camara", canal.sufijo));
    }
  }

  function alGuardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!rutaStream.trim()) {
      setError("La ruta del stream es obligatoria");
      return;
    }
    /*
     * Comprobación previa: la API ya rechaza `://` y `@`, pero avisar aquí
     * evita un viaje al servidor y explica el motivo en el momento.
     */
    if (rutaStream.includes("://") || rutaStream.includes("@")) {
      setError(
        "La ruta del stream debe ser solo el PATH (p. ej. /Streaming/Channels/101). " +
          "No incluyas «rtsp://», el usuario ni la contraseña: eso va en MediaMTX."
      );
      return;
    }

    mutGuardar.mutate({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      area_id: areaId || null,
      direccion_ip: direccionIp.trim() || null,
      puerto_rtsp: Number(puertoRtsp) || 554,
      ruta_stream: rutaStream.trim(),
      ruta_webrtc: rutaWebrtc.trim() || null,
      activa,
    });
  }

  async function copiarUrl() {
    if (!urlCompleta) return;
    await navigator.clipboard.writeText(urlCompleta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {esEdicion ? `Editar «${camara?.nombre}»` : "Nueva cámara IP"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={alGuardar} className="space-y-5">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {/* ─────────── Identificación ─────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cam-nombre">Nombre</Label>
              <Input
                id="cam-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Quirófano 1 - Canal 1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cam-area">Área</Label>
              <Select
                value={areaId || "ninguna"}
                onValueChange={(v) => setAreaId(!v || v === "ninguna" ? "" : v)}
              >
                <SelectTrigger id="cam-area">
                  <SelectValue placeholder="Sin área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguna">Sin área</SelectItem>
                  {(areasQ.data ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ─────────── Fabricante y canal ─────────── */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium">
              Asistente de ruta RTSP
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cam-fabricante">Fabricante</Label>
                <Select
                  value={fabricanteId}
                  onValueChange={(v) => {
                    if (!v) return;
                    setFabricanteId(v);
                    setCanalNumero("1");
                    aplicarCanal(v, "1");
                  }}
                >
                  <SelectTrigger id="cam-fabricante">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FABRICANTES.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cam-canal">Canal</Label>
                <Select
                  value={canalNumero}
                  onValueChange={(v) => {
                    if (!v) return;
                    setCanalNumero(v);
                    aplicarCanal(fabricanteId, v);
                  }}
                  disabled={canales.length <= 1}
                >
                  <SelectTrigger id="cam-canal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {canales.map((c) => (
                      <SelectItem key={c.numero} value={String(c.numero)}>
                        {c.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {fabricante?.nota ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {fabricante.nota}
              </p>
            ) : null}

            {/*
              Multi-canal: se recuerda que cada canal es una cámara aparte.
              Es la duda más habitual al configurar un NVR o una cámara de
              dos canales.
            */}
            {canales.length > 1 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Cada canal se registra como una <strong>cámara distinta</strong>.
                Para los dos canales, crea una cámara por canal con su ruta.
              </p>
            ) : null}
          </div>

          {/* ─────────── Conexión ─────────── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cam-ip">Dirección IP</Label>
              <Input
                id="cam-ip"
                value={direccionIp}
                onChange={(e) => setDireccionIp(e.target.value)}
                placeholder="192.168.1.64"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cam-puerto">Puerto RTSP</Label>
              <Input
                id="cam-puerto"
                type="number"
                value={puertoRtsp}
                onChange={(e) => setPuertoRtsp(e.target.value)}
                placeholder="554"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cam-ruta">Ruta del stream (PATH)</Label>
              <Input
                id="cam-ruta"
                value={rutaStream}
                onChange={(e) => setRutaStream(e.target.value)}
                placeholder="/Streaming/Channels/101"
              />
              <p className="text-xs text-muted-foreground">
                Solo la ruta. Sin «rtsp://», sin usuario y sin contraseña.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cam-webrtc">Ruta WebRTC (MediaMTX)</Label>
              <Input
                id="cam-webrtc"
                value={rutaWebrtc}
                onChange={(e) => setRutaWebrtc(e.target.value)}
                placeholder="/quirofano-1-canal-1"
                onBlur={() => {
                  if (!rutaWebrtc.trim()) {
                    setRutaWebrtc(
                      sugerirRutaWebrtc(nombre || "camara", `Canal ${canalNumero}`)
                    );
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Nombre del stream en MediaMTX. Debe ser único.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cam-desc">Descripción</Label>
            <Input
              id="cam-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Cámara del quirófano 1"
            />
          </div>

          {/*
            ─────────── Credenciales (NO se guardan) ───────────
            Se separan visualmente para dejar claro que no viajan a la API.
          */}
          <div className="rounded-xl border border-dashed p-4">
            <div className="mb-3 flex items-center gap-2">
              <p className="text-sm font-medium">Credenciales RTSP</p>
              <Badge variant="outline">no se guardan</Badge>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Solo se usan para construir la URL que pegarás en{" "}
              <strong>MediaMTX</strong>. No se envían a la plataforma ni se
              almacenan en la base de datos.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cam-usuario">Usuario</Label>
                <Input
                  id="cam-usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cam-password">Contraseña</Label>
                <Input
                  id="cam-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {urlCompleta ? (
              <div className="mt-3 space-y-1.5">
                <Label>URL para MediaMTX</Label>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 py-1.5 text-xs">
                    {urlCompleta}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copiarUrl}
                  >
                    <Copy className="size-3.5" aria-hidden />
                    {copiado ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Rellena la IP y la ruta para ver la URL.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="cam-activa"
              type="checkbox"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="cam-activa" className="font-normal">
              Cámara activa
            </Label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={mutGuardar.isPending}>
              {mutGuardar.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              {esEdicion ? "Guardar cambios" : "Crear cámara"}
            </Button>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

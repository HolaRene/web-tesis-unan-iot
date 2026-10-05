"use client";

/**
 * Reproductor WebRTC de una cámara (MediaMTX).
 *
 * RESPONSABILIDADES (y límites):
 *   - Recibir la cámara y la URL WebRTC ya resuelta.
 *   - Negociar con MediaMTX vía WHEP (RTCPeerConnection).
 *   - Mostrar: cargando / reproduciendo / sin stream / error.
 *   - Permitir reconexión manual y limpiar recursos al desmontar.
 *
 * NO contiene lógica de API: no conoce TanStack Query ni los endpoints de
 * cámaras. Es un componente puro de vídeo, de modo que se puede reutilizar
 * y probar de forma aislada.
 *
 * SEGURIDAD: nunca construye una URL RTSP ni maneja credenciales. Solo usa
 * la URL pública de MediaMTX que recibe por props.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Video,
  VideoOff,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Maximize,
  Minimize,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ESPERA_REINTENTO_MANUAL_MS,
  TIEMPO_NEGOCIACION_WEBRTC_MS,
} from "@/configuracion/video";

/** Estado interno del reproductor. */
type EstadoPlayer =
  | "sin-configurar"
  | "cargando"
  | "reproduciendo"
  | "detenido"
  | "sin-stream"
  | "error";

interface CamaraPlayerProps {
  /** Nombre de la cámara (para accesibilidad y mensajes). */
  nombre: string;
  /**
   * URL del endpoint WHEP de MediaMTX. Si es `null`/`undefined`, el
   * reproductor muestra "Stream no disponible" sin intentar conectar.
   */
  urlWebRTC?: string | null;
  /** Clase CSS opcional para el contenedor. */
  className?: string;
}

export function CamaraPlayer({
  nombre,
  urlWebRTC,
  className,
}: CamaraPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /**
   * Ref del contenedor (no del <video>): en Safari, pedir pantalla completa
   * sobre el elemento de vídeo falla; hay que pedirla sobre su contenedor.
   */
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  // Referencias a recursos WebRTC para poder limpiarlos al desmontar.
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [estado, setEstado] = useState<EstadoPlayer>(
    urlWebRTC ? "detenido" : "sin-configurar"
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  /** Si el reproductor está ocupando toda la pantalla. */
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  /** Libera por completo la conexión WebRTC. */
  const limpiar = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((s) => s.track?.stop());
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  /**
   * Negocia la recepción del stream con MediaMTX mediante WHEP
   * (WebRTC-HTTP Egress Protocol): se envía una oferta SDP por POST y se
   * recibe la respuesta. Todo el WebRTC del navegador vive aquí.
   */
  const conectar = useCallback(async () => {
    if (!urlWebRTC) {
      setEstado("sin-configurar");
      return;
    }

    limpiar();
    setMensaje(null);
    setEstado("cargando");

    try {
      const pc = new RTCPeerConnection({
        // MediaMTX suele desplegarse en la misma red; no se asume STUN externo.
        iceServers: [],
      });
      pcRef.current = pc;

      // El stream se recibe: se declara intención de recibir vídeo y audio.
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      pc.ontrack = (evento) => {
        const [stream] = evento.streams;
        if (stream && videoRef.current) {
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {
            /* el navegador puede requerir interacción; se ignora */
          });
          setEstado("reproduciendo");
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setEstado("error");
          setMensaje("Se perdió la conexión con el servidor de vídeo.");
        } else if (pc.connectionState === "disconnected") {
          setEstado("detenido");
        }
      };

      // Corte de seguridad: si la negociación no termina, no dejamos la UI
      // en "cargando" indefinidamente.
      timeoutRef.current = setTimeout(() => {
        setEstado((previo) => (previo === "cargando" ? "sin-stream" : previo));
      }, TIEMPO_NEGOCIACION_WEBRTC_MS);

      // 1) Oferta SDP.
      const oferta = await pc.createOffer();
      await pc.setLocalDescription(oferta);

      // 2) Intercambio con MediaMTX.
      const respuesta = await fetch(urlWebRTC, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: oferta.sdp,
      });

      if (!respuesta.ok) {
        throw new Error(`El servidor de vídeo respondió ${respuesta.status}`);
      }

      const sdpRespuesta = await respuesta.text();
      await pc.setRemoteDescription({ type: "answer", sdp: sdpRespuesta });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch {
      limpiar();
      // Mensaje amable: no se exponen detalles técnicos crudos al usuario.
      setEstado("sin-stream");
      setMensaje("El stream no está disponible todavía.");
    }
  }, [urlWebRTC, limpiar]);

  // Limpieza garantizada al desmontar o al cambiar la URL.
  //
  // Para reiniciar el estado cuando cambia la cámara, el llamador debe
  // remontar el componente con una `key` distinta (p. ej. `key={camara.id}`).
  // Así se evita sincronizar estado con un efecto.
  useEffect(() => {
    return () => limpiar();
  }, [limpiar]);

  /**
   * Sincroniza el estado con los cambios de pantalla completa.
   *
   * Es imprescindible escuchar el evento en lugar de alternar un booleano:
   * el usuario puede salir con Esc o con el gesto del sistema, y entonces
   * el botón se quedaría mostrando el icono equivocado.
   */
  useEffect(() => {
    const alCambiar = () => {
      setPantallaCompleta(
        document.fullscreenElement === contenedorRef.current
      );
    };
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);

  /**
   * Entra o sale de pantalla completa.
   *
   * Se pide sobre el CONTENEDOR, no sobre el `<video>`:
   *   - Safari de iOS no permite pantalla completa en un <video> que recibe
   *     un MediaStream (solo en vídeos con archivo).
   *   - Al pedirla en el contenedor, también se ven los controles y la
   *     etiqueta "En directo".
   */
  const alternarPantallaCompleta = useCallback(async () => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await contenedor.requestFullscreen();
    } catch {
      /*
       * Algunos navegadores (o contextos sin permisos, como un iframe sin
       * `allowfullscreen`) rechazan la petición. No es un fallo grave: el
       * vídeo sigue viéndose en su tamaño normal.
       */
      setMensaje("Este navegador no permite pantalla completa aquí.");
    }
  }, []);

  /** Reintento manual con una pequeña espera para evitar bucles. */
  const reintentar = useCallback(() => {
    setEstado("cargando");
    setTimeout(() => void conectar(), ESPERA_REINTENTO_MANUAL_MS);
  }, [conectar]);

  const enMarcha = estado === "cargando" || estado === "reproduciendo";

  return (
    <div
      ref={contenedorRef}
      className={`relative overflow-hidden rounded-2xl border bg-black ${className ?? ""}`}
    >
      {/* El vídeo siempre está montado para poder recibir el stream. */}
      <video
        ref={videoRef}
        aria-label={`Vídeo de ${nombre}`}
        className="aspect-video w-full bg-black object-contain"
        playsInline
        muted
        autoPlay
      />

      {/* Capa de estado superpuesta. */}
      {!enMarcha && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
          {estado === "sin-configurar" ? (
            <>
              <VideoOff className="size-10 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium text-white">
                Stream no disponible
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Esta cámara todavía no tiene una ruta WebRTC configurada.
                Cuando conectes la cámara a MediaMTX, el vídeo aparecerá aquí.
              </p>
            </>
          ) : estado === "error" ? (
            <>
              <AlertTriangle
                className="size-10 text-destructive"
                aria-hidden
              />
              <p className="text-sm font-medium text-white">
                No se pudo reproducir
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {mensaje ?? "Ocurrió un problema con el stream."}
              </p>
              <Button size="sm" variant="secondary" onClick={reintentar}>
                <RefreshCw className="mr-2 size-3.5" aria-hidden />
                Reintentar
              </Button>
            </>
          ) : (
            <>
              <VideoOff className="size-10 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium text-white">
                Stream no disponible
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {mensaje ??
                  "No se detecta señal en esta cámara. Comprueba que MediaMTX está recibiendo el stream RTSP."}
              </p>
              <Button size="sm" variant="secondary" onClick={reintentar}>
                <RefreshCw className="mr-2 size-3.5" aria-hidden />
                Reconectar
              </Button>
            </>
          )}
        </div>
      )}

      {estado === "cargando" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
          <Loader2 className="size-8 animate-spin text-white" aria-hidden />
          <p className="text-sm text-white">Conectando con el stream…</p>
        </div>
      )}

      {/* Controles cuando hay reproducción. */}
      {estado === "reproduciendo" && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white">
            <Video className="size-3.5" aria-hidden />
            En directo
          </span>
          {/*
            Pantalla completa. El botón solo aparece con el vídeo en marcha:
            ampliar un stream que no funciona no aporta nada.
          */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void alternarPantallaCompleta()}
            aria-label={
              pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"
            }
            title={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {pantallaCompleta ? (
              <Minimize className="size-3.5" aria-hidden />
            ) : (
              <Maximize className="size-3.5" aria-hidden />
            )}
          </Button>
        </div>
      )}

      {/* Botón para iniciar cuando hay ruta pero aún no se intentó. */}
      {estado === "detenido" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
          <Video className="size-10 text-white/70" aria-hidden />
          <p className="text-sm text-white">Stream listo para conectar</p>
          <Button size="sm" onClick={() => void conectar()}>
            Reproducir
          </Button>
        </div>
      )}
    </div>
  );
}

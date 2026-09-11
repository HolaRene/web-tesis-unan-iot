"use client";

/**
 * Hook de conexión al canal realtime (WebSocket).
 *
 * Responsabilidades:
 *  - Abrir el WS autenticado con el JWT de la sesión.
 *  - Reconectar automáticamente con backoff fijo si se cae.
 *  - Al (re)conectar, invalidar una vez las queries para recuperar lo perdido.
 *  - Entregar cada evento de dominio al manejador que se le pase.
 *
 * NO conoce el dominio: solo transporte. La lógica de qué hacer con cada
 * evento vive en los hooks específicos (p. ej. `useEventosDispositivos`).
 */
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { urlWebSocket, RECONEXION_MS } from "@/configuracion/realtime";
import type { EventoTiempoReal } from "@/tipos";
import { useSesion } from "@/hooks/use-sesion";

export type EstadoRealtime = "conectando" | "conectado" | "desconectado";

interface OpcionesRealtime {
  /** Manejador de eventos de dominio recibidos. */
  alEvento?: (evento: EventoTiempoReal) => void;
  /**
   * Queries a invalidar UNA vez al (re)conectar, para recuperar los cambios
   * ocurridos mientras el WS estaba caído. Ej.: `[["dispositivos"]]`.
   */
  invalidarAlReconectar?: string[][];
}

/** Valor por defecto estable (evita referencias nuevas en cada render). */
const SIN_INVALIDACIONES: string[][] = [];

export function useRealtime({
  alEvento,
  invalidarAlReconectar = SIN_INVALIDACIONES,
}: OpcionesRealtime = {}) {
  const { token, esDemo } = useSesion();
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<EstadoRealtime>("desconectado");

  // Se guardan en refs para que la conexión no se reinicie en cada render.
  // La escritura va en un efecto (no durante el render, como exige React).
  const alEventoRef = useRef(alEvento);
  const invalidarRef = useRef(invalidarAlReconectar);
  useEffect(() => {
    alEventoRef.current = alEvento;
    invalidarRef.current = invalidarAlReconectar;
  }, [alEvento, invalidarAlReconectar]);

  useEffect(() => {
    // En modo demo no hay backend real al que conectarse.
    if (!token || esDemo) return;

    let socket: WebSocket | null = null;
    let reintento: ReturnType<typeof setTimeout> | null = null;
    let cerradoPorLimpieza = false;

    function conectar(inicial: boolean) {
      if (cerradoPorLimpieza) return;
      setEstado("conectando");
      socket = new WebSocket(urlWebSocket(token as string));

      socket.onopen = () => {
        setEstado("conectado");
        // Al reconectar (no en la primera conexión) se invalidan las queries
        // indicadas para no perder los cambios ocurridos sin WS.
        if (!inicial) {
          for (const clave of invalidarRef.current) {
            queryClient.invalidateQueries({ queryKey: clave });
          }
        }
      };

      socket.onmessage = (mensaje) => {
        try {
          const evento = JSON.parse(mensaje.data) as EventoTiempoReal;
          if (evento.tipo === "conectado" || evento.tipo === "pong") return;
          alEventoRef.current?.(evento);
        } catch {
          // Mensaje no JSON: se ignora.
        }
      };

      socket.onclose = () => {
        setEstado("desconectado");
        if (cerradoPorLimpieza) return;
        reintento = setTimeout(() => conectar(false), RECONEXION_MS);
      };

      socket.onerror = () => {
        // `onclose` se encarga de la reconexión.
        socket?.close();
      };
    }

    conectar(true);

    return () => {
      cerradoPorLimpieza = true;
      if (reintento) clearTimeout(reintento);
      socket?.close();
    };
  }, [token, esDemo, queryClient]);

  return { estado, conectado: estado === "conectado" };
}

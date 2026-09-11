"use client";

/**
 * Hook que aplica los eventos realtime de DISPOSITIVOS a la caché de
 * TanStack Query, sin refrescar toda la lista.
 *
 * - Lista `["dispositivos"]`: se parchea el elemento con `setQueryData`.
 * - Detalle `["dispositivo", id]`: se parchea el registro concreto.
 *
 * Así la lista `/dispositivos` y el detalle `/dispositivos/[id]` se actualizan
 * al instante (p. ej. online → offline) sin esperar al polling.
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/use-realtime";
import type {
  Dispositivo,
  EventoTiempoReal,
  PayloadDispositivoActualizado,
  PayloadDispositivoOffline,
  PayloadDispositivoOnline,
} from "@/tipos";

/** Campos que un evento de dispositivo puede escribir en la caché. */
type ParcheDispositivo = Partial<
  Pick<Dispositivo, "estado" | "ultima_conexion" | "direccion_ip" | "metadatos">
>;

/** Queries a invalidar una vez al reconectar (referencia estable). */
const INVALIDAR_AL_RECONECTAR: string[][] = [["dispositivos"]];

export function useEventosDispositivos() {
  const queryClient = useQueryClient();

  const alEvento = useCallback(
    (evento: EventoTiempoReal) => {
      /** Aplica un parche a la lista y al detalle del dispositivo. */
      const aplicarParche = (id: string, parche: ParcheDispositivo) => {
        // Lista: se reemplaza solo el elemento afectado (sin refetch).
        queryClient.setQueryData<Dispositivo[]>(["dispositivos"], (actuales) => {
          if (!actuales) return actuales;
          return actuales.map((d) => (d.id === id ? { ...d, ...parche } : d));
        });

        // Detalle: si está en caché, se actualiza igual.
        queryClient.setQueryData<Dispositivo>(["dispositivo", id], (actual) =>
          actual ? { ...actual, ...parche } : actual
        );
      };

      switch (evento.tipo) {
        case "dispositivo:online": {
          const datos = evento.datos as PayloadDispositivoOnline;
          aplicarParche(datos.dispositivo_id, {
            estado: "online",
            ultima_conexion: datos.ultima_conexion,
          });
          break;
        }
        case "dispositivo:offline": {
          const datos = evento.datos as PayloadDispositivoOffline;
          aplicarParche(datos.dispositivo_id, {
            estado: "offline",
            ultima_conexion: datos.ultima_conexion,
          });
          break;
        }
        case "dispositivo:actualizado": {
          const datos = evento.datos as PayloadDispositivoActualizado;
          aplicarParche(datos.dispositivo_id, {
            estado: datos.estado,
            ultima_conexion: datos.ultima_conexion,
            direccion_ip: datos.direccion_ip,
            metadatos: datos.metadatos,
          });
          break;
        }
        default:
          // Mediciones/canales/alertas: segunda entrega.
          break;
      }
    },
    [queryClient]
  );

  // Al reconectar, se recargan los dispositivos una vez para recuperar lo
  // ocurrido mientras no había conexión.
  return useRealtime({
    alEvento,
    invalidarAlReconectar: INVALIDAR_AL_RECONECTAR,
  });
}

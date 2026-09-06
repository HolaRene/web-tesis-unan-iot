"use client";

/**
 * Hook de resumen para el dashboard principal.
 *
 * Usa el endpoint dirigido del backend:
 *   GET /api/v1/dashboard/resumen
 * (una sola petición con totales y últimas mediciones/alertas/dispositivos,
 * en vez de consultar 5 recursos por separado).
 *
 * Las últimas mediciones llegan con `sensor_codigo` y `sensor_nombre`
 * gracias al JOIN que hace el backend; así el panel sabe qué sensor (código)
 * corresponde a cada medición (id + sensor_id).
 */
import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Alerta, Area, Dispositivo, Sensor } from "@/tipos";
import { obtenerResumenDashboard } from "@/servicios/dashboard.servicio";

/** Punto de una serie temporal para el gráfico de actividad. */
export interface PuntoActividad {
  etiqueta: string;
  valor: number;
}

export interface ResumenDashboard {
  areas: Area[];
  dispositivos: Dispositivo[];
  sensores: Sensor[];
  alertas: Alerta[];
  mediciones: ReturnType<typeof _medicionVacia>[];
  totalAreas: number;
  totalDispositivos: number;
  dispositivosConectados: number;
  sensoresActivos: number;
  alertasActivas: number;
  ultimasMediciones: ReturnType<typeof _medicionVacia>[];
  dispositivosRecientes: Dispositivo[];
  alertasRecientes: Alerta[];
  actividad: PuntoActividad[];
  cargando: boolean;
  error: string | null;
}

// helper tipográfico pequeño para mantener compatibilidad con la vista previa.
function _medicionVacia() {
  return {
    id: 0,
    sensor_id: "",
    sensor_codigo: null,
    sensor_nombre: null,
    valor_numerico: null,
    valor_texto: null,
    calidad: "good",
    registrado_en: "",
    metadatos: null as Record<string, unknown> | null,
  };
}

function formatearGrupo(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  return `${hh}:00`;
}

export function useResumenDashboard(): ResumenDashboard {
  const consulta = useQuery({
    queryKey: ["dashboard", "resumen"],
    queryFn: obtenerResumenDashboard,
  });

  const cargando = consulta.isLoading;
  const error = consulta.error ?? null;

  const datos = useMemo<ResumenDashboard>(() => {
    const d = consulta.data;
    const totales = d?.totales;
    const areas: Area[] = []; // la vista actual puede derivarlo de totalizadores, no repite arrays pesados.
    const dispositivos = d?.dispositivos_recientes ?? [];
    const alertas = d?.ultimas_alertas as unknown as Alerta[];
    const mediciones = (d?.ultimas_mediciones ??
      []) as ResumenDashboard["mediciones"];

    // Actividad por hora sobre las últimas mediciones recibidas.
    const porHora: Record<string, number> = {};
    for (const m of mediciones) {
      const grupo = String(m.registrado_en);
      const gg = formatearGrupo(grupo);
      porHora[gg] = (porHora[gg] ?? 0) + 1;
    }
    const actividad: PuntoActividad[] = Object.entries(porHora)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-12)
      .map(([etiqueta, valor]) => ({ etiqueta, valor }));

    return {
      areas,
      dispositivos,
      sensores: [],
      alertas,
      mediciones,
      totalAreas: totales?.areas ?? 0,
      totalDispositivos: totales?.dispositivos ?? 0,
      dispositivosConectados:
        dispositivos.filter((x: Dispositivo) =>
          ["online", "activo"].includes(x.estado?.toLowerCase())
        ).length || 0,
      sensoresActivos: totales?.sensores ?? 0,
      alertasActivas: totales?.alertas_activas ?? 0,
      ultimasMediciones: mediciones,
      dispositivosRecientes: dispositivos,
      alertasRecientes: alertas ?? [],
      actividad:
        actividad.length > 0
          ? actividad
          : [{ etiqueta: "Sin datos", valor: 0 }],
      cargando,
      error: error ? (error instanceof Error ? error.message : String(error)) : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta.data, cargando, error]);

  return { ...datos, cargando, error: datos.error };
}

export type NodoReact = ReactNode;

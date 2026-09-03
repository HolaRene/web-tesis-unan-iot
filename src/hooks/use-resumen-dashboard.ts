"use client";

/**
 * Hook de resumen para el dashboard principal.
 *
 * Consulta varios endpoints existentes de la API REST (no hay endpoint de
 * "resumen" en el backend) y agrega métricas en el cliente:
 *   GET /areas, GET /devices, GET /sensors,
 *   GET /alerts, GET /measurements (recientes)
 */
import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Alerta, Area, Dispositivo, Medicion, Sensor } from "@/tipos";
import { listarAreas } from "@/servicios/areas.servicio";
import { listarDispositivos } from "@/servicios/dispositivos.servicio";
import { listarSensores } from "@/servicios/sensores.servicio";
import { listarAlertas } from "@/servicios/alertas.servicio";
import { listarMediciones } from "@/servicios/mediciones.servicio";

/** Punto de una serie de actividad (número de mediciones por hora). */
export interface PuntoActividad {
  etiqueta: string;
  valor: number;
}

export interface ResumenDashboard {
  areas: Area[];
  dispositivos: Dispositivo[];
  sensores: Sensor[];
  alertas: Alerta[];
  mediciones: Medicion[];
  totalAreas: number;
  totalDispositivos: number;
  dispositivosConectados: number;
  sensoresActivos: number;
  alertasActivas: number;
  ultimasMediciones: Medicion[];
  dispositivosRecientes: Dispositivo[];
  alertasRecientes: Alerta[];
  actividad: PuntoActividad[];
  cargando: boolean;
  error: string | null;
}

export interface EstadoCarga {
  cargando: boolean;
  error: Error | null;
}

/** Devuelve el día/hora "yyyy-mm-dd HH:00" para agrupar.
 * Como solo mostramos hora, se usa hora local.
 */
function formatearGrupo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  return `${hh}:00`;
}

export function useResumenDashboard(): ResumenDashboard {
  const areasQ = useQuery({ queryKey: ["areas"], queryFn: listarAreas });
  const dispositivosQ = useQuery({
    queryKey: ["dispositivos"],
    queryFn: listarDispositivos,
  });
  const sensoresQ = useQuery({ queryKey: ["sensores"], queryFn: listarSensores });
  const alertasQ = useQuery({ queryKey: ["alertas"], queryFn: listarAlertas });
  const medicionesQ = useQuery({
    queryKey: ["mediciones", "recientes"],
    queryFn: () => listarMediciones({ limite: 50 }),
  });

  const cargando =
    areasQ.isLoading ||
    dispositivosQ.isLoading ||
    sensoresQ.isLoading ||
    alertasQ.isLoading ||
    medicionesQ.isLoading;

  const error =
    (areasQ.error ??
      dispositivosQ.error ??
      sensoresQ.error ??
      alertasQ.error ??
      medicionesQ.error) ??
    null;

  const datos = useMemo<ResumenDashboard>(() => {
    const areas = areasQ.data ?? [];
    const dispositivos = dispositivosQ.data ?? [];
    const sensores = sensoresQ.data ?? [];
    const alertas = alertasQ.data ?? [];
    const mediciones = medicionesQ.data ?? [];

    const conectados = dispositivos.filter((d) =>
      ["online", "activo"].includes(d.estado?.toLowerCase())
    ).length;
    const activos = sensores.filter((s) => s.activo).length;
    const activas = alertas.filter(
      (a) => a.estado?.toLowerCase() === "active"
    ).length;

    // Ultimas mediciones ordenadas por registro (desc) ya las trae la API.
    const ultimasMediciones = mediciones.slice(0, 5);

    // Dispositivos más recientes por última conexión (primero con conex).
    const dispositivosRecientes = [...dispositivos]
      .sort((a, b) => {
        const tA = a.ultima_conexion ? new Date(a.ultima_conexion).getTime() : 0;
        const tB = b.ultima_conexion ? new Date(b.ultima_conexion).getTime() : 0;
        return tB - tA;
      })
      .slice(0, 5);

    const alertasRecientes = [...alertas].slice(0, 5);

    // Serie de actividad: cuenta mediciones por hora (últimas 24 h visibles no
    // son necesarias; se agrupa por hora sin importar el día en la demo real).
    const porHora: Record<string, number> = {};
    for (const m of mediciones) {
      const grupo = formatearGrupo(m.registrado_en);
      porHora[grupo] = (porHora[grupo] ?? 0) + 1;
    }
    const actividad: PuntoActividad[] = Object.entries(porHora)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-12)
      .map(([etiqueta, valor]) => ({ etiqueta, valor }));

    return {
      areas,
      dispositivos,
      sensores,
      alertas,
      mediciones,
      totalAreas: areas.length,
      totalDispositivos: dispositivos.length,
      dispositivosConectados: conectados,
      sensoresActivos: activos,
      alertasActivas: activas,
      ultimasMediciones,
      dispositivosRecientes,
      alertasRecientes,
      actividad:
        actividad.length > 0
          ? actividad
          : [{ etiqueta: "Sin datos", valor: 0 }],
      cargando,
      error: errorInstance(error),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    areasQ.data,
    dispositivosQ.data,
    sensoresQ.data,
    alertasQ.data,
    medicionesQ.data,
  ]);

  return {
    ...datos,
    cargando,
    error: error ? error.message : null,
  };
}

function errorInstance(error: unknown): string | null {
  return error instanceof Error ? error.message : error ? String(error) : null;
}

/** guard de tipo para children lazy no aprovechado */
export type NodoReact = ReactNode;

"use client";

/**
 * Vista mosaico de TODOS los sensores (genérico).
 * Consume GET /api/v1/sensors (respuesta enriquecida) y dibuja una grilla
 * de TarjetaSensor. Conserva la gestión (CRUD) en un componente aparte o en
 * la misma página si así se usa.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/servicios/api";
import TarjetaSensor, {
  type FilaSensorTarjeta,
} from "@/components/sensores/tarjeta-sensor";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MosaicoSensores() {
  const [area, setArea] = useState("");
  const [dispositivo, setDispositivo] = useState("");
  const [tipo, setTipo] = useState("");
  const [buscar, setBuscar] = useState("");

  // Opciones para filtros (áreas / dispositivos / tipos)
  const opciones = useQuery({
    queryKey: ["filtros-sensores"],
    queryFn: async () => {
      const [areas, disp, tipos] = await Promise.all([
        api.obtener<Array<{ id: string; nombre: string }>>("/areas"),
        api.obtener<Array<{ id: string; nombre: string }>>("/devices"),
        api.obtener<Array<{ id: string; nombre: string }>>("/variable-types"),
      ]);
      return { areas: areas.datos, dispositivos: disp.datos, tipos: tipos.datos };
    },
  });

  const query = useQuery({
    queryKey: ["sensores", "mosaico", { area, dispositivo, tipo, buscar }],
    queryFn: async (): Promise<FilaSensorTarjeta[]> => {
      const p = new URLSearchParams();
      if (area) p.set("area_id", area);
      if (dispositivo) p.set("dispositivo_id", dispositivo);
      if (tipo) p.set("tipo_variable_id", tipo);
      if (buscar) p.set("buscar", buscar);
      const qs = p.toString() ? `?${p.toString()}` : "";
      const r = await api.obtener<FilaSensorTarjeta[]>(`/sensors${qs}`);
      return r.datos;
    },
    refetchInterval: 15_000,
  });
  const { data, isLoading, error } = query;
  const op = opciones.data ?? { areas: [], dispositivos: [], tipos: [] };

  const selectCls =
    "h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground";

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <select
          aria-label="Área"
          className={selectCls}
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="">Área: todas</option>
          {op.areas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
        <select
          aria-label="Dispositivo"
          className={selectCls}
          value={dispositivo}
          onChange={(e) => setDispositivo(e.target.value)}
        >
          <option value="">Dispositivo: todos</option>
          {op.dispositivos.map((d) => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        <select
          aria-label="Tipo de variable"
          className={selectCls}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Variable: todas</option>
          {op.tipos.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        <input
          aria-label="Buscar sensor"
          className="h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          placeholder="Buscar (nombre/código)"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar sensores</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : !data || data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay sensores registrados.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((sensor) => (
            <TarjetaSensor sensor={sensor} key={sensor.id} />
          ))}
        </div>
      )}
    </div>
  );
}

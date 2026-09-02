"use client";

/**
 * Gráfica de actividad para el dashboard (Recharts).
 * Componente cliente; recibe la serie de puntos a graficar.
 */
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface GraficaActividadProps {
  datos: { hora: string; valor: number }[];
  unidad?: string;
}

export function GraficaActividad({ datos, unidad }: GraficaActividadProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={datos}
          margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="hora" className="text-xs" />
          <YAxis width={40} className="text-xs" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const valor = Number(payload[0]?.value);
              return (
                <div className="rounded-xl border bg-popover px-3 py-2 text-sm shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
                  <p className="font-medium">Hora: {label}</p>
                  <p className="text-muted-foreground">
                    {Number.isFinite(valor) ? valor : "—"}
                    {unidad ? ` ${unidad}` : ""}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

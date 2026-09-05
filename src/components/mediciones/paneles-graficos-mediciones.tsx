"use client";

/**
 * Paneles de gráficas para Mediciones (Recharts).
 *
 * Muestra análisis sobre la lista de mediciones obtenida del backend:
 *  - Serie de valores numéricos a lo largo del tiempo.
 *  - Distribución por sensor.
 *  - Distribución por calidad.
 */
import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { Medicion } from "@/tipos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearHora } from "@/utilidades";

const COLORES = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function PanelesGraficosMediciones({ mediciones }: { mediciones: Medicion[] }) {
  const serie = useMemo(() => {
    return mediciones
      .filter((m) => m.valor_numerico !== null)
      .slice()
      .sort((a, b) => (a.registrado_en < b.registrado_en ? -1 : 1))
      .map((m) => ({
        hora: formatearHora(m.registrado_en),
        valor: m.valor_numerico as number,
      }));
  }, [mediciones]);

  const porSensor = useMemo(() => {
    const conteo: Record<string, number> = {};
    for (const m of mediciones) {
      const clave = m.sensor_id || "sin sensor";
      conteo[clave] = (conteo[clave] ?? 0) + 1;
    }
    return Object.entries(conteo)
      .slice(0, 8)
      .map(([nombre, valor]) => ({ nombre, valor }));
  }, [mediciones]);

  const porCalidad = useMemo(() => {
    const conteo: Record<string, number> = {};
    for (const m of mediciones) {
      const clave = m.calidad || "unknown";
      conteo[clave] = (conteo[clave] ?? 0) + 1;
    }
    return Object.entries(conteo).map(([name, value]) => ({ name, value }));
  }, [mediciones]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Valores a lo largo del tiempo</CardTitle>
          <CardDescription>
            Mediciones numéricas ordenadas cronológicamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {serie.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay valores numéricos para graficar.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 4, right: 12, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hora" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    background: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  name="Valor"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mediciones por sensor</CardTitle>
          <CardDescription>Distribución de registros por sensor.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {porSensor.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porSensor} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="nombre" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    background: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Bar dataKey="valor" name="Cantidad" radius={[6, 6, 0, 0]}>
                  {porSensor.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Calidad de los datos</CardTitle>
          <CardDescription>Distribución por calidad registrada.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {porCalidad.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porCalidad}
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label
                >
                  {porCalidad.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    background: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

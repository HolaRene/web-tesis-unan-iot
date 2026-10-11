"use client";

/**
 * Gráfica de actividad para el dashboard (Recharts).
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ BARRAS Y NO LÍNEA
 * ────────────────────────────────────────────────────────────────────
 * La actividad es un RECUENTO por intervalo, no una magnitud continua. Una
 * línea entre dos horas sugiere valores intermedios que no existen, y con
 * cubos vacíos intercalados la línea los "atraviesa" y disimula el parón.
 *
 * Con barras, un hueco se ve como un hueco: la ausencia de barra ES el dato.
 *
 * ────────────────────────────────────────────────────────────────────
 * LAS BARRAS VACÍAS SE DIBUJAN DISTINTO
 * ────────────────────────────────────────────────────────────────────
 * Un intervalo sin mediciones se pinta con una barra mínima y translúcida, en
 * lugar de desaparecer. Así el eje mantiene su continuidad y se distingue
 * "esta hora no hubo datos" de "el gráfico termina aquí".
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface GraficaActividadProps {
  datos: Array<{ hora: string; valor: number; vacio?: boolean }>;
  /** Texto de la unidad ("mediciones"). */
  unidad?: string;
}

export function GraficaActividad({
  datos,
  unidad = "mediciones",
}: GraficaActividadProps) {
  /*
   * Altura mínima para las barras vacías. Sin ella, un valor 0 no dibujaría
   * nada y el hueco sería indistinguible de un fallo de renderizado.
   */
  const ALTO_MINIMO = 2;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-muted"
          />
          <XAxis
            dataKey="hora"
            className="text-xs"
            /*
             * Con 24 cubos las etiquetas se solaparían. Se muestran todas
             * solo si caben; si no, Recharts salta algunas.
             */
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis width={45} className="text-xs" allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "currentColor", opacity: 0.06 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const valor = Number(payload[0]?.value);
              const esVacio = !Number.isFinite(valor) || valor === 0;

              return (
                <div className="rounded-xl border bg-popover px-3 py-2 text-sm shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
                  <p className="font-medium">{label}</p>
                  {esVacio ? (
                    <p className="text-muted-foreground">Sin mediciones</p>
                  ) : (
                    <p className="text-muted-foreground">
                      {valor.toLocaleString("es-ES")} {unidad}
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Bar dataKey="valor" radius={[3, 3, 0, 0]} maxBarSize={32}>
            {datos.map((d, i) => (
              <Cell
                key={`${d.hora}-${i}`}
                /*
                 * Cubos vacíos: barra mínima y apagada. El resto, color de
                 * gráfico normal. Se aplica `className` para que herede los
                 * colores del tema (claro/oscuro) en lugar de un hex fijo.
                 */
                className={
                  d.vacio || d.valor === 0
                    ? "fill-muted-foreground/25"
                    : "fill-[var(--chart-2)]"
                }
                {...(d.vacio || d.valor === 0
                  ? { height: ALTO_MINIMO }
                  : {})}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

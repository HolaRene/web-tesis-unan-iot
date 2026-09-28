"use client";

/**
 * Mini-gráfico (sparkline) de una magnitud.
 *
 * Se coloca dentro de la tarjeta de cada canal para dar un vistazo rápido sin
 * ocupar espacio: solo la línea, sin ejes ni rejilla.
 *
 * ────────────────────────────────────────────────────────────────────
 * DECISIONES
 * ────────────────────────────────────────────────────────────────────
 * - **Sin ejes ni tooltip**: en 40 px de alto no caben y no aportan. El
 *   detalle está en el gráfico grande de más abajo.
 * - **Color por canal**: el mismo que usa la comparación, para que el ojo
 *   asocie tarjeta y gráfico.
 * - **Puntos nulos**: se dibujan como huecos (`connectNulls={false}`), para
 *   distinguir "sin datos" de "valor cero".
 * - Solo se usa con magnitudes numéricas: la decisión la toma quien lo
 *   renderiza, mediante `sePuedeGraficar`.
 */
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

interface MiniGraficoProps {
  /** Puntos ya preparados (instante + media). Los nulos son huecos. */
  datos: Array<{ instante: string; media: number | null }>;
  /** Color de la línea. */
  color?: string;
  /** Alto del gráfico en píxeles. */
  alto?: number;
}

export function MiniGrafico({
  datos,
  color = "var(--chart-1)",
  alto = 40,
}: MiniGraficoProps) {
  // Sin al menos dos puntos no hay línea que dibujar.
  if (datos.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded border border-dashed text-xs text-muted-foreground"
        style={{ height: alto }}
      >
        Sin datos suficientes
      </div>
    );
  }

  /*
   * El eje Y se oculta, pero se declara con `domain` calculado para que la
   * línea aproveche todo el alto. Sin esto, Recharts arranca el dominio en
   * cero y una serie como 24–26 °C se vería como una línea plana arriba.
   */
  const valores = datos
    .map((d) => d.media)
    .filter((v): v is number => v !== null);

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  // Un pequeño margen evita que la línea toque los bordes.
  const margen = (max - min) * 0.15 || 1;

  return (
    <div style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <YAxis hide domain={[min - margen, max + margen]} />
          <Line
            type="monotone"
            dataKey="media"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

import { GestionNormas } from "@/components/normas/gestion-normas";

/**
 * Normas de referencia.
 *
 * Las oficiales (ASHRAE 170, ISO 14644…) vienen sembradas desde el
 * repositorio; aquí se pueden crear normas propias para entornos que no
 * encajan en ninguna.
 */
export default function PaginaNormas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Normas</h1>
        <p className="text-sm text-muted-foreground">
          Definen qué valores son aceptables en cada tipo de recinto. Se
          aplican a un área desde su vista de detalle.
        </p>
      </div>
      <GestionNormas />
    </div>
  );
}

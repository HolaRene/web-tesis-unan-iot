/**
 * Marco reutilizable para páginas del panel que aún están en fases básicas.
 * Muestra el título, una descripción y un estado "en construcción" legible.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PaginaEnConstruccionProps {
  titulo: string;
  descripcion: string;
  /** Lista de funcionalidades que próximamente tendrá la sección. */
  pendientes?: string[];
}

export function PaginaEnConstruccion({
  titulo,
  descripcion,
  pendientes = [],
}: PaginaEnConstruccionProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">{titulo}</CardTitle>
            <CardDescription>{descripcion}</CardDescription>
          </div>
          <CardAction>
            <Construction className="size-6 text-muted-foreground" aria-hidden />
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta sección está en construcción. Se integrará con el backend REST
            a través de los servicios de{" "}
            <code className="rounded bg-muted px-1">/api/v1</code> en los
            próximos entregables.
          </p>
        </CardContent>
      </Card>

      {pendientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades planificadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {pendientes.map((pendiente) => (
                <li key={pendiente}>{pendiente}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

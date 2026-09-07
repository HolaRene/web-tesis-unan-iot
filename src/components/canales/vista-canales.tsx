"use client";

/** Vista en grilla de TODOS los canales. */
import { useQuery } from "@tanstack/react-query";
import { obtenerCanales } from "@/servicios/canales.servicio";
import { TarjetaCanal } from "@/components/canales/tarjeta-canal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function VistaCanales() {
  const { data: canales, isLoading, error } = useQuery({
    queryKey: ["canales", "grilla"],
    queryFn: () => obtenerCanales(),
  });

  return (
    <div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar canales</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : !canales || canales.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin canales.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canales.map((c) => (
            <TarjetaCanal key={c.id} canal={c} />
          ))}
        </div>
      )}
    </div>
  );
}

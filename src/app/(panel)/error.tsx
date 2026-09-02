"use client";

/**
 * Límite de error para las rutas del panel.
 */
import { AlertCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ErrorPanel({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center text-center">
          <AlertCircle className="size-8 text-destructive" aria-hidden />
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>
            Ocurrió un error inesperado al cargar esta sección del panel.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => reset()} variant="outline">
            <RotateCcw className="size-4" aria-hidden />
            Reintentar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

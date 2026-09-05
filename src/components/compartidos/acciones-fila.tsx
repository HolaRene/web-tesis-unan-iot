"use client";

/**
 * Botones de acciones para filas de tablas (editar / eliminar).
 *
 * Se usan directamente (sin menú desplegable) para que siempre sean visibles
 * y evitar fallos de posicionamiento de menús emergentes en celdas de tabla.
 */
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccionesFila({
  alEditar,
  alEliminar,
  etiquetaEditar = "Editar",
  etiquetaEliminar = "Eliminar",
}: {
  alEditar: () => void;
  alEliminar: () => void;
  etiquetaEditar?: string;
  etiquetaEliminar?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={etiquetaEditar}
        title={etiquetaEditar}
        onClick={alEditar}
      >
        <Pencil className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={etiquetaEliminar}
        title={etiquetaEliminar}
        className="text-destructive hover:bg-destructive/10"
        onClick={alEliminar}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

"use client";

/**
 * Botones de acciones para filas de tablas (ver detalle / editar / eliminar).
 *
 * Se usan directamente (sin menú desplegable) para que siempre sean visibles
 * y evitar fallos de posicionamiento de menús emergentes en celdas de tabla.
 *
 * `hrefDetalle` es opcional: cuando se indica, se añade un enlace a la ficha
 * del registro. Se usa un `<Link>` y no un botón con `onClick` para que
 * funcione el clic con rueda, "abrir en pestaña nueva" y el menú contextual.
 */
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccionesFila({
  hrefDetalle,
  alEditar,
  alEliminar,
  etiquetaDetalle = "Ver detalle",
  etiquetaEditar = "Editar",
  etiquetaEliminar = "Eliminar",
}: {
  /** Ruta a la ficha del registro. Si se omite, no se muestra el botón. */
  hrefDetalle?: string;
  alEditar?: () => void;
  alEliminar?: () => void;
  etiquetaDetalle?: string;
  etiquetaEditar?: string;
  etiquetaEliminar?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {hrefDetalle ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={etiquetaDetalle}
          title={etiquetaDetalle}
          render={<Link href={hrefDetalle} />}
        >
          <Eye className="size-4" aria-hidden />
        </Button>
      ) : null}
      {alEditar ? (
        <Button
        variant="ghost"
        size="icon-sm"
        aria-label={etiquetaEditar}
        title={etiquetaEditar}
        onClick={alEditar}
      >
        <Pencil className="size-4" aria-hidden />
      </Button>
      ) : null}
      {alEliminar ? (
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
      ) : null}
    </div>
  );
}

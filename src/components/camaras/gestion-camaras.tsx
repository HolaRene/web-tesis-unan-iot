"use client";

/**
 * Gestión de cámaras IP: listado + alta, edición y borrado.
 *
 * Solo consume la API de administración. El vídeo NO se gestiona aquí: la
 * grilla muestra un hueco de preview y el reproductor real vive en el
 * detalle (/camaras/[id]).
 *
 * ────────────────────────────────────────────────────────────────────
 * CÁMARAS MULTI-CANAL
 * ────────────────────────────────────────────────────────────────────
 * Una cámara con varios canales (HikVision de 2, un NVR de 8) se registra
 * como VARIAS cámaras, una por canal: cada canal es un stream RTSP distinto.
 * El formulario ayuda a generar la ruta correcta de cada uno.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCamaras } from "@/hooks/useCamaras";
import { CamaraGrid } from "@/components/camaras/camara-grid";
import { FormularioCamara } from "@/components/camaras/formulario-camara";
import { eliminarCamara } from "@/servicios/camaras.servicio";
import type { Camara } from "@/tipos";

export function GestionCamaras() {
  const queryClient = useQueryClient();
  const { data: camaras, isLoading, error } = useCamaras();

  /** Cámara en edición. `undefined` = formulario cerrado. */
  const [editando, setEditando] = useState<Camara | null | undefined>(undefined);
  const [borrando, setBorrando] = useState<Camara | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);

  const formularioAbierto = editando !== undefined;

  const mutBorrar = useMutation({
    mutationFn: (id: string) => eliminarCamara(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camaras"] });
      setBorrando(null);
      setErrorBorrado(null);
      setAviso("Cámara eliminada");
      setTimeout(() => setAviso(null), 4000);
    },
    onError: (e: Error) => setErrorBorrado(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="size-5 text-muted-foreground" aria-hidden />
          <h1 className="text-xl font-semibold">Cámaras IP</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {camaras ? `${camaras.length} registrada(s)` : ""}
          </p>
          <Button size="sm" onClick={() => setEditando(null)}>
            <Plus className="size-4" aria-hidden />
            Nueva cámara
          </Button>
        </div>
      </div>

      {aviso ? (
        <Alert>
          <AlertTitle>Listo</AlertTitle>
          <AlertDescription>{aviso}</AlertDescription>
        </Alert>
      ) : null}

      {formularioAbierto ? (
        <FormularioCamara
          camara={editando}
          onCerrar={() => setEditando(undefined)}
          onGuardado={(mensaje) => {
            setAviso(mensaje);
            setTimeout(() => setAviso(null), 4000);
          }}
        />
      ) : null}

      <CamaraGrid
        camaras={camaras}
        cargando={isLoading}
        error={(error as Error) ?? null}
        onEditar={(camara) => setEditando(camara)}
        onEliminar={(camara) => setBorrando(camara)}
      />

      {/* Confirmación de borrado: nunca se borra sin preguntar. */}
      <Dialog
        open={Boolean(borrando)}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setBorrando(null);
            setErrorBorrado(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cámara</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar «{borrando?.nombre}»? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {errorBorrado ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo eliminar</AlertTitle>
              <AlertDescription>{errorBorrado}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBorrando(null);
                setErrorBorrado(null);
              }}
            >
              <X className="size-4" aria-hidden />
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={mutBorrar.isPending}
              onClick={() => borrando && mutBorrar.mutate(borrando.id)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

/**
 * Gestión de API Keys del usuario (Configuración).
 *
 * Permite listar, crear (mostrando la clave completa UNA sola vez) y revocar
 * API Keys usadas por integraciones (Node-RED, scripts, gateways).
 * Endpoint: GET/POST/DELETE /api/v1/claves-api
 */
import { useState } from "react";
import { Copy, Check, KeyRound, Plus, ShieldX, Loader2 } from "lucide-react";
import { useListarClavesApi, useMutacionesClavesApi } from "@/hooks/useClavesApi";
import { PERMISOS_CLAVE_API, type PermisoClaveApi } from "@/tipos";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatearFecha } from "@/utilidades";

const NOMBRES_PERMISOS: Record<PermisoClaveApi, string> = {
  "mediciones:crear": "Registrar mediciones",
  "comandos:enviar": "Enviar comandos a actuadores",
  "estado:actualizar": "Actualizar estado",
};

export default function GestionClavesApi() {
  const { data: claves, isLoading, error } = useListarClavesApi();
  const { crear, revocar } = useMutacionesClavesApi();

  // Formulario de creación
  const [nombre, setNombre] = useState("");
  const [activos, setActivos] = useState<Record<string, boolean>>({
    "mediciones:crear": true,
  });
  const [claveReciente, setClaveReciente] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function alternarPermiso(permiso: PermisoClaveApi) {
    setActivos((prev) => ({ ...prev, [permiso]: !prev[permiso] }));
  }

  async function alCrear(event: React.FormEvent) {
    event.preventDefault();
    const permisos = PERMISOS_CLAVE_API.reduce<Record<string, boolean>>(
      (acc, permiso) => {
        acc[permiso] = !!activos[permiso];
        return acc;
      },
      {}
    );

    const resultado = await crear.mutateAsync({ nombre, permisos });
    if (resultado?.claveCompleta) {
      setClaveReciente(resultado.claveCompleta);
      setCopiado(false);
    }
    setNombre("");
  }

  async function copiar() {
    if (!claveReciente) return;
    await navigator.clipboard.writeText(claveReciente);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function alRevocar(id: string) {
    if (window.confirm("¿Revocar (desactivar) esta API Key?")) {
      void revocar.mutateAsync(id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <Alert className="border-blue-200 text-blue-800 dark:border-blue-800 dark:text-blue-200">
        <AlertTitle>Integracion por API Key (Node-RED, scripts, gateways)</AlertTitle>
        <AlertDescription>
          Estas claves son para máquina a máquina. La clavo completa solo se
          muestra una vez al crearla. Guárdala de forma segura.
        </AlertDescription>
      </Alert>

      {/* Crear clave */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="size-4" aria-hidden /> Nueva API Key
          </CardTitle>
          <CardDescription>
            Nombra la clave y elige qué permisos tendrá la integración.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={alCrear} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="clave-nombre">Nombre</Label>
              <Input
                id="clave-nombre"
                required
                placeholder="Ej: Node-RED producción"
                className="max-w-md"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Permisos</p>
              {PERMISOS_CLAVE_API.map((permiso) => (
                <label
                  key={permiso}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Checkbox
                    checked={!!activos[permiso]}
                    onCheckedChange={() => alternarPermiso(permiso)}
                  />
                  {NOMBRES_PERMISOS[permiso]}
                </label>
              ))}
            </div>

            <Button type="submit" disabled={crear.isPending || !nombre.trim()}>
              {crear.isPending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden /> Generando…
                </>
              ) : (
                <>
                  <KeyRound className="size-4" aria-hidden /> Generar API Key
                </>
              )}
            </Button>
          </form>

          {/* Clave completa reciente (una sola vez) */}
          {claveReciente && (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <p className="mb-2 text-sm font-semibold">
                Tu nueva API Key (no volverá a mostrarse):
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-card px-3 py-2 font-mono text-sm shadow-sm">
                  {claveReciente}
                </code>
                <Button type="button" size="sm" variant="outline" onClick={copiar}>
                  {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copiado ? "Copiada" : "Copiar"}
                </Button>
              </div>
            </div>
          )}

          {crear.error && (
            <p className="mt-2 text-sm text-destructive">
              {(crear.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Listado de claves */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tus API Keys</CardTitle>
          <CardDescription>
            Lista de claves registradas. Revoca una para desactivarla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error al cargar las claves</AlertTitle>
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          ) : claves?.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no tienes API Keys creadas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Prefijo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Creada el</TableHead>
                  <TableHead className="w-20 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claves?.map((clave) => (
                  <TableRow key={clave.id}>
                    <TableCell className="font-medium">{clave.nombre}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {clave.prefijo}…
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={clave.activa ? "secondary" : "destructive"}>
                        {clave.activa ? "Activa" : "Revocada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {clave.ultimo_uso ? formatearFecha(clave.ultimo_uso) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatearFecha(clave.creado_en)}
                    </TableCell>
                    <TableCell className="text-right">
                      {clave.activa && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => alRevocar(clave.id)}
                          disabled={revocar.isPending}
                        >
                          <ShieldX className="size-4" aria-hidden /> Revocar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

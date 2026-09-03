"use client";

/**
 * Vista completa del perfil del usuario autenticado.
 *
 * Muestra una tarjeta con los datos del perfil (obtenidos del backend vía
 * /users/perfil) y un formulario (React Hook Form + Zod) para editar nombre y
 * email mediante PATCH /users/:id.
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Loader2, Save, User as UserIcon, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { esquemaPerfil, type DatosPerfilFormulario } from "@/esquemas";
import { useSesion } from "@/hooks/use-sesion";
import { formatearFecha } from "@/utilidades";

const etiquetaRol: Record<string, string> = {
  admin: "Administrador",
  operador: "Operador",
  viewer: "Solo lectura",
};

export function VistaPerfil() {
  const { usuario, perfil, cargando, esDemo, actualizarPerfil, refrescarPerfil } =
    useSesion();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DatosPerfilFormulario>({
    resolver: zodResolver(esquemaPerfil),
    defaultValues: { nombre: "", email: "" },
  });

  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cuando el perfil llega/cambia, sincronizamos el formulario.
  useEffect(() => {
    if (perfil) {
      setValue("nombre", perfil.nombre);
      setValue("email", perfil.email);
    }
  }, [perfil, setValue]);

  async function alGuardar(datos: DatosPerfilFormulario) {
    setError(null);
    setGuardado(false);
    try {
      await actualizarPerfil(datos);
      setGuardado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el perfil.");
    }
  }

  async function alRecargar() {
    setError(null);
    try {
      await refrescarPerfil();
    } catch {
      setError("No se pudo recargar el perfil desde el servidor.");
    }
  }

  if (cargando) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 lg:col-span-1" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
    );
  }

  const datos = perfil;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Tarjeta de datos del perfil */}
      <Card className="lg:row-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5 text-primary" aria-hidden />
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {(datos?.nombre?.[0] ?? usuario?.email?.[0] ?? "U").toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">
                {datos?.nombre ?? usuario?.email ?? "Usuario"}
              </p>
              <p className="text-sm text-muted-foreground">
                {usuario?.email}
              </p>
            </div>
          </div>

          <Separator />

          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Rol</dt>
              <dd>
                <Badge variant="secondary">
                  {perfil ? etiquetaRol[perfil.rol] ?? perfil.rol : "—"}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Estado</dt>
              <dd>
                <Badge variant={datos?.activo === false ? "outline" : "secondary"}>
                  {datos?.activo === false ? "Desactivado" : "Activo"}
                </Badge>
              </dd>
            </div>
            {datos && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Miembro desde</dt>
                <dd>{formatearFecha(datos.creado_en)}</dd>
              </div>
            )}
          </dl>

          {esDemo && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Sesión de demostración: los cambios no se guardan en la base de
              datos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edición */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5 text-primary" aria-hidden />
            Editar perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!datos && !usuario ? (
            <p className="text-sm text-muted-foreground">
              No hay una sesión activa.
            </p>
          ) : (
            <form onSubmit={handleSubmit(alGuardar)} className="space-y-4" noValidate>
              <div className="grid gap-2">
                <Label htmlFor="perfil-nombre">Nombre completo</Label>
                <Input
                  id="perfil-nombre"
                  placeholder="Nombre del usuario"
                  aria-invalid={!!errors.nombre}
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p className="text-sm text-destructive">
                    {errors.nombre.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="perfil-email">Correo electrónico</Label>
                <Input
                  id="perfil-email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {guardado && (
                <Alert>
                  <BadgeCheck className="size-4" aria-hidden />
                  <AlertTitle>Perfil actualizado</AlertTitle>
                  <AlertDescription>
                    Tus datos se guardaron correctamente.
                  </AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSubmitting || cargando}>
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-4" aria-hidden />
                  )}
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (perfil) reset({ nombre: perfil.nombre, email: perfil.email });
                  }}
                >
                  Revertir
                </Button>
                <Button type="button" variant="ghost" onClick={alRecargar}>
                  Recargar desde el servidor
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

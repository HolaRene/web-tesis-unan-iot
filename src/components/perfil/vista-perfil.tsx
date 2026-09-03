"use client";

/**
 * Vista completa del perfil del usuario autenticado.
 *
 * Muestra una tarjeta con los datos del perfil (obtenidos del backend vía
 * /users/perfil) y un formulario (React Hook Form + Zod) para editar nombre,
 * email y, opcionalmente, cambiar la contraseña.
 *
 * La actualización se envía a PATCH /users/perfil (endpoint propio). Si se
 * cambia el email o la contraseña se pide cerrar sesión y volver a iniciarla,
 * porque el token JWT lleva el email antiguo.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  BadgeCheck,
  KeyRound,
  Loader2,
  Mail,
  Save,
  User as UserIcon,
} from "lucide-react";

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
  usuario: "Usuario",
  viewer: "Solo lectura",
};

export function VistaPerfil() {
  const router = useRouter();
  const { usuario, perfil, cargando, esDemo, actualizarPerfil, refrescarPerfil } =
    useSesion();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<DatosPerfilFormulario>({
    resolver: zodResolver(esquemaPerfil),
    defaultValues: {
      nombre: "",
      email: "",
      passwordActual: "",
      password: "",
      confirmarPassword: "",
    },
  });

  const [guardado, setGuardado] = useState(false);
  const [notaRelogin, setNotaRelogin] = useState<string | null>(null);
  const [error, setErrorGeneral] = useState<string | null>(null);

  // Cuando llega el perfil, sincroniza el formulario.
  useEffect(() => {
    if (perfil) {
      setValue("nombre", perfil.nombre);
      setValue("email", perfil.email);
    }
  }, [perfil, setValue]);

  async function alGuardar(datos: DatosPerfilFormulario) {
    setErrorGeneral(null);
    setGuardado(false);
    setNotaRelogin(null);

    const emailFijo = perfil?.email ?? usuario?.email ?? datos.email.trim();
    const cambiaPassword = Boolean(datos.password);

    // Para cambiar la contraseña hace falta la contraseña actual.
    if (cambiaPassword && !datos.passwordActual) {
      setError("passwordActual", {
        type: "manual",
        message: "Ingresa tu contraseña actual para cambiar la contraseña.",
      });
      return;
    }

    try {
      await actualizarPerfil({
        nombre: datos.nombre.trim(),
        // El email no se modifica; queda fijo al registrarse (sólo un admin
        // podría cambiarlo desde la gestión de usuarios).
        email: emailFijo,
        passwordActual: datos.passwordActual?.trim() || undefined,
        password: datos.password?.trim() || undefined,
      });
      setGuardado(true);
      setValue("passwordActual", "");
      setValue("password", "");
      setValue("confirmarPassword", "");
      clearErrors();

      if (cambiaPassword) {
        setNotaRelogin(
          "Contraseña actualizada. Vuelve a iniciar sesión la próxima vez con la nueva contraseña."
        );
      }
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : "No se pudo guardar el perfil.");
    }
  }

  async function alRecargar() {
    setErrorGeneral(null);
    try {
      await refrescarPerfil();
    } catch {
      setErrorGeneral("No se pudo recargar el perfil desde el servidor.");
    }
  }

  if (cargando) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 lg:col-span-1" />
        <Skeleton className="h-72 lg:col-span-2" />
      </div>
    );
  }

  const datos = perfil;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Tarjeta de datos */}
      <Card>
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
              <p className="text-sm text-muted-foreground">{datos?.email ?? usuario?.email}</p>
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

      {/* Formulario */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5 text-primary" aria-hidden />
            Editar perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="perfil-email">Correo electrónico</Label>
              <Input
                id="perfil-email"
                type="email"
                placeholder="usuario@ejemplo.com"
                readOnly
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <p className="text-xs text-muted-foreground">
                El correo queda fijo al registrarte. Para cambiarlo debe hacerlo
                un administrador desde la gestión de usuarios.
              </p>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="perfil-passactual">Contraseña actual</Label>
              <Input
                id="perfil-passactual"
                type="password"
                autoComplete="current-password"
                {...register("passwordActual")}
              />
              {errors.passwordActual && (
                <p className="text-sm text-destructive">
                  {errors.passwordActual.message}
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="size-4" aria-hidden />
                Cambiar contraseña (opcional)
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="perfil-password">Nueva contraseña</Label>
                  <Input
                    id="perfil-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="perfil-confirmar">Confirmar contraseña</Label>
                  <Input
                    id="perfil-confirmar"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmarPassword}
                    {...register("confirmarPassword")}
                  />
                  {errors.confirmarPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmarPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {guardado && !notaRelogin && (
              <Alert>
                <BadgeCheck className="size-4" aria-hidden />
                <AlertTitle>Perfil actualizado</AlertTitle>
                <AlertDescription>
                  Tus datos se guardaron correctamente.
                </AlertDescription>
              </Alert>
            )}
            {notaRelogin && (
              <Alert>
                <BadgeCheck className="size-4" aria-hidden />
                <AlertTitle>Cambio de credenciales</AlertTitle>
                <AlertDescription>{notaRelogin}</AlertDescription>
                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/iniciar-sesion")}
                  >
                    Ir a iniciar sesión
                  </Button>
                </div>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting}>
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
                onClick={() => reset()}
              >
                Revertir
              </Button>
              <Button type="button" variant="ghost" onClick={alRecargar}>
                Recargar desde el servidor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

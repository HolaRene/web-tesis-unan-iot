"use client";

/**
 * Formulario de registro de usuario.
 *
 * Valida el alta (React Hook Form + Zod) y envía los datos al backend mediante
 * POST /users/registro. Al registrarse correctamente muestra un mensaje de
 * éxito y redirige a /iniciar-sesion para que el usuario inicie sesión.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  esquemaRegistro,
  type DatosRegistroFormulario,
} from "@/esquemas";
import { registrarUsuario } from "@/servicios/autenticacion.servicio";

export function FormularioRegistrar() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosRegistroFormulario>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      confirmarPassword: "",
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [registrado, setRegistrado] = useState(false);

  async function alRegistrar(datos: DatosRegistroFormulario) {
    setError(null);
    setRegistrado(false);
    try {
      // Se envía sólo lo que espera el backend (sin confirmarPassword).
      await registrarUsuario({
        nombre: datos.nombre.trim(),
        email: datos.email.trim(),
        password: datos.password,
      });
      setRegistrado(true);
      // Muestra la URL de éxito en el navegador tras un corto intervalo.
      setTimeout(() => {
        router.push("/iniciar-sesion?registrado=cuenta-creada");
      }, 1200);
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : "No se pudo registrar el usuario.";
      setError(mensaje);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>
          Regístrate para acceder al panel de MonitorIT
        </CardDescription>
      </CardHeader>

      <CardContent>
        {registrado && (
          <Alert>
            <CheckCircle2 className="size-4" aria-hidden />
            <AlertTitle>Cuenta creada</AlertTitle>
            <AlertDescription>
              Registro exitoso. Serás redirigido para iniciar sesión…
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(alRegistrar)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="registro-nombre">Nombre completo</Label>
            <Input
              id="registro-nombre"
              placeholder="Nombre y apellidos"
              autoComplete="name"
              aria-invalid={!!errors.nombre}
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="registro-email">Correo electrónico</Label>
            <Input
              id="registro-email"
              type="email"
              placeholder="usuario@ejemplo.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="registro-password">Contraseña</Label>
            <Input
              id="registro-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="registro-confirmar">Confirmar contraseña</Label>
            <Input
              id="registro-confirmar"
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

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || registrado}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <UserPlus className="size-4" aria-hidden />
            )}
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm">
        <span className="text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/iniciar-sesion"
            className="text-primary underline underline-offset-4"
          >
            Inicia sesión
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}

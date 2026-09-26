"use client";

/**
 * Formulario de inicio de sesión.
 * Usa React Hook Form + Zod. Envía credenciales al servicio de autenticación
 * (backend real /users/login, con modo demo como alternativa de desarrollo).
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";

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
import { esquemaLogin, type DatosLogin } from "@/esquemas";
import { useSesion } from "@/hooks/use-sesion";
import { MODO_DEMO } from "@/servicios";

export function FormularioIniciarSesion() {
  const router = useRouter();
  const { iniciarSesion } = useSesion();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DatosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: "", password: "" },
  });

  async function alEnviar(datos: DatosLogin) {
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(datos);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : "No se pudo iniciar sesión.";
      setError(mensaje);
    } finally {
      setEnviando(false);
    }
  }

  function usarCredencialesDemo() {
    // Rellena el formulario con las credenciales del modo demo (desarrollo).
    setValue("email", MODO_DEMO.email);
    setValue("password", MODO_DEMO.password);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Accede al panel de ControlaIoT
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(alEnviar)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
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
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <LogIn className="size-4" aria-hidden />
            )}
            {enviando ? "Iniciando sesión..." : "Ingresar"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-xs text-muted-foreground">
        <p>
          Modo demo (sin backend): usa{" "}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={usarCredencialesDemo}
          >
            autocompletar
          </Button>{" "}
          con <code>demo@monitorit.local</code> / <code>demo1234</code>.
        </p>
        <LinkInicio />
      </CardFooter>
    </Card>
  );
}

function LinkInicio() {
  return (
    <span>
      ¿Volver a la web pública?{" "}
      <Link href="/" className="text-primary underline underline-offset-4">
        Ir al inicio
      </Link>
    </span>
  );
}

/**
 * Esquemas Zod para los formularios de autenticación.
 *
 * Las reglas coinciden con las validaciones del backend
 * (véase api/src/modules/users/user.schema.ts).
 */
import { z } from "zod";

/** Roles válidos dentro del sistema. */
export const rolUsuarioSchema = z.enum(["viewer", "usuario", "admin"]);

/** Esquema del formulario de inicio de sesión. */
export const esquemaLogin = z.object({
  email: z.string().trim().email("Introduce un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

/** Tipo inferido del esquema de login. */
export type DatosLogin = z.infer<typeof esquemaLogin>;

/** Esquema del formulario de registro de usuario. */
export const esquemaRegistro = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede superar 100 caracteres"),
    email: z.string().trim().email("El email no es válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña no puede superar 72 caracteres"),
    confirmarPassword: z.string(),
    rol: rolUsuarioSchema.optional(),
  })
  .refine((datos) => datos.password === datos.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

/** Tipo inferido del esquema de registro. */
export type DatosRegistroFormulario = z.infer<typeof esquemaRegistro>;

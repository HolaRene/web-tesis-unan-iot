/**
 * Esquema Zod para el formulario de edición del perfil de usuario.
 *
 * Reglas alineadas con el backend (api/src/modules/users/user.schema.ts):
 * => nombre entre 2 y 100 caracteres; email con formato válido.
 * => Password opcional (sólo si se quiere cambiar); contraseña actual exigida
 *    cuando hay cambios de credenciales (validada también en el componente).
 */
import { z } from "zod";

/** Esquema para editar los datos básicos y (opcionalmente) la contraseña. */
export const esquemaPerfil = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede superar 100 caracteres"),
    email: z.string().trim().email("El email no es válido"),
    passwordActual: z.string().optional(),
    password: z.string().optional(),
    confirmarPassword: z.string().optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.password && datos.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La contraseña debe tener al menos 8 caracteres",
        path: ["password"],
      });
    }
    if (datos.password && datos.confirmarPassword !== datos.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las contraseñas no coinciden",
        path: ["confirmarPassword"],
      });
    }
    if (!datos.password && datos.confirmarPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escribe una contraseña nueva para confirmarla",
        path: ["confirmarPassword"],
      });
    }
  });

/** Tipo inferido del formulario de perfil. */
export type DatosPerfilFormulario = z.infer<typeof esquemaPerfil>;

/** Formato de entrada para el servicio de perfil. */
export interface DatosPerfilParaEnvio {
  nombre: string;
  email: string;
  passwordActual?: string;
  password?: string;
}

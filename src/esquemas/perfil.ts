/**
 * Esquema Zod para el formulario de edición del perfil de usuario.
 *
 * Reglas alineadas con el backend (api/src/modules/users/user.schema.ts):
 * => nombre entre 2 y 100 caracteres; email con formato válido.
 */
import { z } from "zod";

/** Esquema para editar los datos básicos del perfil (nombre y email). */
export const esquemaPerfil = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  email: z.string().trim().email("El email no es válido"),
});

/** Tipo inferido del formulario de perfil. */
export type DatosPerfilFormulario = z.infer<typeof esquemaPerfil>;

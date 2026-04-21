const { z } = require("zod");

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo es requerido")
    .email("Formato de email inválido")
    .max(255, "El email es demasiado largo"),
  password: z
    .string()
    .trim()
    .min(1, "La contraseña es requerida")
    .max(70, "La contraseña es demasiado larga"),
});

// const firstLoginChangePasswordSchema = z
//     .object({
//         newPassword: z
//             .string()
//             .min(8, "La contraseña debe tener al menos 8 caracteres")
//             .max(70, "La contraseña debe tener como máximo 70 caracteres"),
//         confirmPassword: z
//             .string()
//             .min(1, "La confirmación de contraseña es requerida"),
//     })
//     .refine((data) => data.newPassword === data.confirmPassword, {
//         message: "Las contraseñas no coinciden",
//         path: ["confirmPassword"],
//     });

const twoFactorTokenSchema = z.object({
  token: z
    .string()
    .regex(/^\d{6}$/, "El token debe ser un código de 6 dígitos"),
});

const disableTwoFactorSchema = z.object({
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .max(70, "La contraseña es demasiado larga"),
});

module.exports = {
  loginSchema,
  // firstLoginChangePasswordSchema,
  twoFactorTokenSchema,
  disableTwoFactorSchema,
};

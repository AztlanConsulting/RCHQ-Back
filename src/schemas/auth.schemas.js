const { z } = require("zod");

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;

const passwordPolicySchema = z
    .string()
    .min(
        PASSWORD_MIN_LENGTH,
        `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    )
    .max(
        PASSWORD_MAX_LENGTH,
        `La contraseña debe tener como máximo ${PASSWORD_MAX_LENGTH} caracteres`,
    )
    .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número");

const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "El correo es requerido")
        .email("Formato de correo inválido")
        .max(255, "El correo es demasiado largo"),
    password: z
        .string()
        .trim()
        .min(1, "La contraseña es requerida")
        .max(64, "La contraseña es demasiado larga"),
});

const firstLoginChangePasswordSchema = z
    .object({
        newPassword: passwordPolicySchema,
        confirmPassword: z
            .string()
            .min(1, "La confirmación de contraseña es requerida"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .trim()
            .min(1, "La contraseña actual es requerida")
            .max(64, "La contraseña actual es demasiado larga"),
        newPassword: passwordPolicySchema,
        confirmPassword: z
            .string()
            .min(1, "La confirmación de contraseña es requerida"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

const twoFactorTokenSchema = z.object({
    token: z
        .string()
        .regex(/^\d{6}$/, "El token debe ser un código de 6 dígitos"),
});

const disableTwoFactorSchema = z.object({
    password: z
        .string()
        .min(1, "La contraseña es requerida")
        .max(64, "La contraseña es demasiado larga"),
});

module.exports = {
    loginSchema,
    firstLoginChangePasswordSchema,
    changePasswordSchema,
    twoFactorTokenSchema,
    disableTwoFactorSchema,
};

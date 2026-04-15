const { z } = require("zod");

const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email format")
        .max(255, "Email is too long"),
    password: z
        .string()
        .min(1, "Password is required")
        .max(70, "Password is too long"),
});

const firstLoginChangePasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(70, "Password must be at most 70 characters long"),
        confirmPassword: z
            .string()
            .min(1, "confirmPassword is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

const twoFactorTokenSchema = z.object({
    token: z
        .string()
        .regex(/^\d{6}$/, "token must be a 6-digit code"),
});

const disableTwoFactorSchema = z.object({
    password: z
        .string()
        .min(1, "Password is required")
        .max(70, "Password is too long"),
});

module.exports = {
    loginSchema,
    firstLoginChangePasswordSchema,
    twoFactorTokenSchema,
    disableTwoFactorSchema,
};
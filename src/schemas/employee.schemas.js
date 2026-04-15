const { z } = require("zod");

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const NSS_REGEX = /^\d{11}$/;
const CLABE_REGEX = /^\d{18}$/;

const employeeCreateSchema = z.object({
  house_id: z
    .string()
    .uuid("El house_id debe ser un UUID válido"),

  role_id: z
    .string()
    .uuid("El role_id debe ser un UUID válido"),

  name: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(50, "El nombre es demasiado largo"),

  surname: z
    .string()
    .trim()
    .min(2, "El apellido es obligatorio")
    .max(50, "El apellido es demasiado largo"),

  email: z
    .string()
    .trim()
    .email("Formato de correo inválido")
    .max(60, "El correo es demasiado largo"),

  curp: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CURP_REGEX, "CURP inválido"),

  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(RFC_REGEX, "RFC inválido")
    .nullable()
    .optional(),

  nss: z
    .string()
    .trim()
    .regex(NSS_REGEX, "NSS inválido (debe tener 11 dígitos)")
    .nullable()
    .optional(),

  bank_account: z
    .string()
    .trim()
    .regex(CLABE_REGEX, "Cuenta bancaria inválida (CLABE de 18 dígitos)")
    .nullable()
    .optional(),

  birth_date: z
    .string()
    .nullable()
    .optional(),
});

module.exports = {
  employeeCreateSchema,
};
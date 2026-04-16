const { z } = require("zod");

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const ONLY_NUMBERS_REGEX = /^\d+$/;
const NAMES_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._/-]+$/;

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
    .max(50, "El nombre es demasiado largo")
    .regex(NAMES_REGEX, "No se permiten caracteres especiales, números o emojis en el nombre"),

  surname: z
    .string()
    .trim()
    .min(2, "El apellido es obligatorio")
    .max(50, "El apellido es demasiado largo")
    .regex(NAMES_REGEX, "No se permiten caracteres especiales, números o emojis en el apellido"),

  email: z
    .string()
    .trim()
    .email("Formato de correo inválido")
    .max(60, "El correo es demasiado largo"),

  curp: z
    .string()
    .trim()
    .length(18, "El CURP debe tener exactamente 18 dígitos")
    .toUpperCase()
    .regex(CURP_REGEX, "Formato del CURP inválido"),

  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .length(13, "El RFC debe tener exactamente 13 dígitos")
    .regex(RFC_REGEX, "Formato del RFC inválido")
    .nullable()
    .optional(),

  nss: z
    .string()
    .trim()
    .length(11, "El NSS debe tener exactamente 11 dígitos")
    .regex(ONLY_NUMBERS_REGEX, "El NSS solo debe contener números")
    .nullable()
    .optional(),

  bank_account: z
    .string()
    .trim()
    .length(18, "La CLABE debe tener exactamente 18 dígitos")
    .regex(ONLY_NUMBERS_REGEX, "La cuenta CLABE solo debe contener números")
    .nullable()
    .optional(),

  birth_date: z
    .string()
    .regex(DATE_REGEX, "Formato de fecha inválido (YYYY-MM-DD)")
    .refine((date) => !isNaN(Date.parse(date)), {
        message: "Fecha inválida",
    })
    .nullable()
    .optional(),

  picture: z
    .string()
    .trim()
    .regex(SAFE_FILENAME_REGEX, "El nombre contiene caracteres no permitidos")
    .regex(/\.(jpg|jpeg|png|webp)$/i, "Formato de imagen no válido")
    .max(150, "El nombre de la imagen es demasiado largo")
    .nullable()
    .optional(),
});

module.exports = {
  employeeCreateSchema,
};
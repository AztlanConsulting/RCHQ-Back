const { z } = require("zod");

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const ONLY_NUMBERS_REGEX = /^\d+$/;
const NAMES_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._/-]+$/;

const emptyToNull = (val) => (val === "" ? null : val);

const employeeCreateSchema = z.object({
    roleId: z.string().uuid("El roleId debe ser un UUID válido"),

  name: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(50, "El nombre es demasiado largo")
    .regex(
      NAMES_REGEX,
      "No se permiten caracteres especiales, números o emojis en el nombre",
    ),

  surname: z
    .string()
    .trim()
    .min(2, "El apellido es obligatorio")
    .max(50, "El apellido es demasiado largo")
    .regex(
      NAMES_REGEX,
      "No se permiten caracteres especiales, números o emojis en el apellido",
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
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
    .transform(emptyToNull)
    .nullable()
    .refine((val) => val === null || val.length === 13, {
      message: "El RFC debe tener exactamente 13 dígitos",
    })
    .refine((val) => val === null || RFC_REGEX.test(val), {
      message: "Formato del RFC inválido",
    })
    .optional(),

  nss: z
    .string()
    .trim()
    .transform(emptyToNull)
    .nullable()
    .refine((val) => val === null || val.length === 11, {
      message: "El NSS debe tener exactamente 11 dígitos",
    })
    .refine((val) => val === null || ONLY_NUMBERS_REGEX.test(val), {
      message: "El NSS solo debe contener números",
    })
    .optional(),

    bankAccount: z
        .string()
        .trim()
        .transform(emptyToNull)
        .nullable()
        .refine((val) => val === null || val.length === 18, {
            message: "La CLABE debe tener exactamente 18 dígitos",
        })
        .refine((val) => val === null || ONLY_NUMBERS_REGEX.test(val), {
            message: "La cuenta CLABE solo debe contener números",
        })
        .optional(),

    birthDate: z
        .string()
        .trim()
        .transform(emptyToNull)
        .nullable()
        .refine((val) => val === null || DATE_REGEX.test(val), {
            message: "Formato de fecha inválido (YYYY-MM-DD)",
        })
        .refine(
            (val) => {
                if (val === null) return true;

        const birthDate = new Date(val);

        if (isNaN(birthDate.getTime())) return false;

        const year = birthDate.getFullYear();
        const currentYear = new Date().getFullYear();

        if (year < 1900 || year > currentYear) return false;

        let age = currentYear - year;

        const monthDiff = new Date().getMonth() - birthDate.getMonth();
        const dayDiff = new Date().getDate() - birthDate.getDate();

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          age--;
        }

        return age >= 18;
      },
      {
        message:
          "El empleado debe ser mayor de 18 años y la fecha debe ser posterior a 1900",
      },
    )
    .optional(),

  picture: z
    .string()
    .trim()
    .transform(emptyToNull)
    .nullable()
    .refine((val) => val === null || SAFE_FILENAME_REGEX.test(val), {
      message: "El nombre contiene caracteres no permitidos",
    })
    .refine((val) => val === null || /\.(jpg|jpeg|png|webp)$/i.test(val), {
      message: "Formato de imagen no válido",
    })
    .refine((val) => val === null || val.length <= 150, {
      message: "El nombre de la imagen es demasiado largo",
    })
    .optional(),
});

module.exports = {
  employeeCreateSchema,
};

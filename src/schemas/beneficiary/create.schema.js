const { z } = require("zod");

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const NAMES_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const emptyToNull = (val) => (val === "" ? null : val);

const beneficiaryCreateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "El nombre es obligatorio")
        .max(50, "El nombre es demasiado largo")
        .regex(
            NAMES_REGEX,
            "No se permiten caracteres especiales, números o emojis en el nombre",
        ),

    maternal_surname: z
        .string()
        .trim()
        .min(2, "El apellido materno es obligatorio")
        .max(50, "El apellido materno es demasiado largo")
        .regex(
            NAMES_REGEX,
            "No se permiten caracteres especiales, números o emojis en el apellido materno",
        ),

    paternal_surname: z
        .string()
        .trim()
        .min(2, "El apellido paterno es obligatorio")
        .max(50, "El apellido paterno es demasiado largo")
        .regex(
            NAMES_REGEX,
            "No se permiten caracteres especiales, números o emojis en el apellido paterno",
        ),

    preferred_name: z
        .string()
        .trim()
        .min(1, "El nombre preferido es obligatorio")
        .max(50, "El nombre preferido es demasiado largo")
        .regex(
            NAMES_REGEX,
            "No se permiten caracteres especiales, números o emojis en el nombre preferido",
        ),

    birth_date: z
        .string()
        .trim()
        .regex(DATE_REGEX, "Formato de fecha inválido (YYYY-MM-DD)")
        .refine((val) => !Number.isNaN(new Date(val).getTime()), {
            message: "Fecha de nacimiento inválida",
        }),

    age_entered_house: z.coerce
        .number({ error: "La edad al entrar en la casa es obligatoria" })
        .int("La edad al entrar en la casa debe ser un número entero")
        .min(0, "La edad al entrar en la casa no puede ser negativa")
        .max(25, "La edad al entrar en la casa no es válida"),

    blood_type: z.enum(BLOOD_TYPES, {
        errorMap: () => ({
            message:
                "El tipo de sangre debe ser O-, O+, A-, A+, B-, B+, AB- o AB+",
        }),
    }),

    curp: z.preprocess(
        (val) => emptyToNull(val === undefined ? "" : val),
        z
            .string()
            .nullable()
            .refine((val) => val === null || val.length === 18, {
                message: "El CURP debe tener exactamente 18 caracteres",
            })
            .refine((val) => val === null || CURP_REGEX.test(val.toUpperCase()), {
                message: "Formato del CURP inválido",
            })
            .transform((val) => (val === null ? null : val.toUpperCase())),
    ),
});

module.exports = {
    beneficiaryCreateSchema,
};

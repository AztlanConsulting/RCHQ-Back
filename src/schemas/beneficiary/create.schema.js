const { z } = require("zod");

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const NAMES_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const emptyToNull = (val) => (val === "" || val == null ? null : val);

const nameField = (label, maxLen = 50) =>
    z
        .string()
        .trim()
        .min(2, `${label} es obligatorio`)
        .max(maxLen, `${label} es demasiado largo`)
        .regex(
            NAMES_REGEX,
            `No se permiten caracteres especiales, números o emojis en ${label.toLowerCase()}`,
        );

const beneficiaryCreateSchema = z.object({
    name: nameField("El nombre"),

    maternal_surname: nameField("El apellido materno"),

    paternal_surname: nameField("El apellido paterno"),

    preferred_name: nameField("El nombre preferido"),

    birth_date: z
        .string()
        .trim()
        .regex(DATE_REGEX, "Formato de fecha inválido (YYYY-MM-DD)")
        .refine((val) => !Number.isNaN(new Date(val).getTime()), {
            message: "Fecha de nacimiento inválida",
        })
        .refine((val) => {
            const birthDate = new Date(val);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return birthDate <= today;
        }, {
            message: "La fecha de nacimiento no puede ser futura",
        }),

    age_entered_house: z.coerce
        .number({
            required_error: "La edad al entrar en la casa es obligatoria",
            invalid_type_error: "La edad al entrar en la casa es obligatoria",
        })
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

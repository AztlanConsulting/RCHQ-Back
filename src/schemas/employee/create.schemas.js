const { z } = require("zod");

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const ONLY_NUMBERS_REGEX = /^\d+$/;
const NAMES_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._/-]+$/;

const emptyToNull = (val) => (val === "" ? null : val);
const parseDateOnly = (value) => {
    if (!DATE_REGEX.test(value)) return null;

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
};

const getTodayUtc = () => {
    const now = new Date();

    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
};

const subtractUtcYears = (date, years) => {
    const result = new Date(date);
    result.setUTCFullYear(result.getUTCFullYear() - years);
    return result;
};

const getAge = (birthDate, today) => {
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();
    const dayDiff = today.getUTCDate() - birthDate.getUTCDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }

    return age;
};

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

                const birthDate = parseDateOnly(val);

                if (!birthDate) return false;
                if (birthDate.getUTCFullYear() < 1900) return false;

                return getAge(birthDate, getTodayUtc()) >= 18;
            },
            {
                message:
                    "El empleado debe ser mayor de 18 años y la fecha debe ser posterior a 1900",
            },
        )
        .optional(),

    startDate: z
        .string({
            required_error: "La antigüedad es obligatoria",
            invalid_type_error: "La antigüedad es obligatoria",
        })
        .trim()
        .min(1, "La antigüedad es obligatoria")
        .refine((val) => DATE_REGEX.test(val), {
            message: "Formato de fecha inválido (YYYY-MM-DD)",
        })
        .refine((val) => parseDateOnly(val) !== null, {
            message: "La fecha de antigüedad no es válida",
        })
        .refine(
            (val) => {
                const startDate = parseDateOnly(val);

                if (!startDate) return false;

                return startDate <= getTodayUtc();
            },
            {
                message: "La antigüedad no puede estar en el futuro",
            },
        )
        .refine(
            (val) => {
                const startDate = parseDateOnly(val);

                if (!startDate) return false;

                return startDate >= subtractUtcYears(getTodayUtc(), 100);
            },
            {
                message: "La antigüedad no puede ser mayor a 100 años",
            },
        ),

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

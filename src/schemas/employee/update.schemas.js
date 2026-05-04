const { z } = require("zod");

const CURP_REGEX         = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX          = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const ONLY_NUMBERS_REGEX = /^\d+$/;
const NAMES_REGEX        = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const DATE_REGEX         = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX         = /^\d{2}:\d{2}$/;

const emptyToNull = (val) => (val === "" ? null : val);

// ── Información básica (nombre, CURP, RFC, NSS, cuenta, nacimiento) ───────────
const employeeBasicUpdateSchema = z
  .object({
    name: z.string().trim().min(2, "El nombre es obligatorio")
      .max(50, "El nombre es demasiado largo")
      .regex(NAMES_REGEX, "No se permiten caracteres especiales en el nombre")
      .optional(),

    surname: z.string().trim().min(2, "El apellido es obligatorio")
      .max(50, "El apellido es demasiado largo")
      .regex(NAMES_REGEX, "No se permiten caracteres especiales en el apellido")
      .optional(),

    curp: z.string().trim().length(18, "El CURP debe tener exactamente 18 caracteres")
      .toUpperCase()
      .regex(CURP_REGEX, "Formato del CURP inválido")
      .optional(),

    rfc: z.string().trim().transform(emptyToNull).nullable()
      .refine((val) => val === null || val.length === 13, { message: "El RFC debe tener exactamente 13 dígitos" })
      .refine((val) => val === null || RFC_REGEX.test(val), { message: "Formato del RFC inválido" })
      .optional(),

    nss: z.string().trim().transform(emptyToNull).nullable()
      .refine((val) => val === null || val.length === 11, { message: "El NSS debe tener exactamente 11 dígitos" })
      .refine((val) => val === null || ONLY_NUMBERS_REGEX.test(val), { message: "El NSS solo debe contener números" })
      .optional(),

    bankAccount: z.string().trim().transform(emptyToNull).nullable()
      .refine((val) => val === null || val.length === 18, { message: "La CLABE debe tener exactamente 18 dígitos" })
      .refine((val) => val === null || ONLY_NUMBERS_REGEX.test(val), { message: "La cuenta CLABE solo debe contener números" })
      .optional(),

    birthDate: z.string().trim().transform(emptyToNull).nullable()
      .refine((val) => val === null || DATE_REGEX.test(val), { message: "Formato de fecha inválido (YYYY-MM-DD)" })
      .refine((val) => {
        if (val === null) return true;
        const d = new Date(val);
        if (isNaN(d.getTime())) return false;
        const year = d.getFullYear();
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) return false;
        let age = currentYear - year;
        const monthDiff = new Date().getMonth() - d.getMonth();
        const dayDiff   = new Date().getDate()  - d.getDate();
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
        return age >= 18;
      }, { message: "El empleado debe ser mayor de 18 años y la fecha debe ser posterior a 1900" })
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((v) => v !== null && v !== undefined),
    { message: "Debe enviarse al menos un campo para actualizar" }
  );

// ── Información de contacto (email, teléfono, dirección) ─────────────────────
const employeeContactUpdateSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Formato de correo inválido")
      .max(60, "El correo es demasiado largo")
      .optional(),

    phoneNumber: z.string().trim().max(20).transform(emptyToNull).nullable().optional(),

    street:     z.string().trim().max(200).transform(emptyToNull).nullable().optional(),
    municipio:  z.string().trim().max(120).transform(emptyToNull).nullable().optional(),
    city:       z.string().trim().max(100).transform(emptyToNull).nullable().optional(),
    postalCode: z.string().trim().max(10).transform(emptyToNull).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((v) => v !== null && v !== undefined),
    { message: "Debe enviarse al menos un campo para actualizar" }
  );

// ── Información administrativa (casa, rol, tipo, salario, horarios) ───────────
const workdayUpdateSchema = z
  .object({
    workdayId: z.string().uuid("El workdayId debe ser un UUID válido"),
    start:     z.string().regex(TIME_REGEX, "Formato HH:MM requerido para el inicio"),
    end:       z.string().regex(TIME_REGEX, "Formato HH:MM requerido para el fin"),
  })
  .refine(({ start, end }) => start < end, {
    message: "La hora de inicio debe ser anterior a la hora de fin",
  });

const employeeAdminUpdateSchema = z
  .object({
    houseId: z.string().uuid("El houseId debe ser un UUID válido").optional(),
    roleId:  z.string().uuid("El roleId debe ser un UUID válido").optional(),

    type: z.string().trim().max(20).transform(emptyToNull).nullable().optional(),

    salary: z.number().positive("El salario debe ser un valor positivo")
      .max(1_000_000, "El salario excede el límite permitido")
      .optional(),

    workdays: z.array(workdayUpdateSchema).min(1, "Debe incluir al menos un día").optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((v) => v !== null && v !== undefined),
    { message: "Debe enviarse al menos un campo para actualizar" }
  );

module.exports = {
  employeeBasicUpdateSchema,
  employeeContactUpdateSchema,
  employeeAdminUpdateSchema,
};
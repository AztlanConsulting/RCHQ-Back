const { z } = require("zod");

const CURP_REGEX         = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const RFC_REGEX          = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const ONLY_NUMBERS_REGEX = /^\d+$/;
const NAMES_REGEX        = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const EMAIL_SAFE_REGEX   = /^[A-Za-z0-9._@-]+$/;
const CURP_ALLOWED_REGEX = /^[A-Z0-9]*$/;
const RFC_ALLOWED_REGEX  = /^[A-ZÑ&0-9]*$/;
const ADDRESS_REGEX      = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.\-\s]*$/;
const DATE_REGEX         = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX         = /^\d{2}:\d{2}$/;
const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALARY_REGEX       = /^\d+(\.\d{1,2})?$/;

const emptyToNull = (val) => (val === "" ? null : val);

const CONTRACT_TYPE_BY_NORMALIZED = {
  nomina: "Nomina",
  asalariado: "Asalariado",
  honorarios: "Honorarios",
  voluntariado: "Voluntariado",
};

const normalizeEmployeeContractType = (val) => {
  if (val === null || val === undefined) return val;
  const s = String(val).trim();
  if (s === "") return val;
  const key = s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return CONTRACT_TYPE_BY_NORMALIZED[key] ?? s;
};

const employeeBasicUpdateSchema = z
  .object({
    name: z.string().trim()
      .max(50, "El nombre es demasiado largo")
      .refine((val) => val === "" || val.length >= 2, {
        message: "El nombre debe tener al menos 2 caracteres",
      })
      .refine((val) => val === "" || NAMES_REGEX.test(val), {
        message: "No se permiten caracteres especiales en el nombre",
      })
      .optional(),

    surname: z.string().trim()
      .max(50, "El apellido es demasiado largo")
      .refine((val) => val === "" || val.length >= 2, {
        message: "El apellido debe tener al menos 2 caracteres",
      })
      .refine((val) => val === "" || NAMES_REGEX.test(val), {
        message: "No se permiten caracteres especiales en el apellido",
      })
      .optional(),

    curp: z.string().trim()
      .toUpperCase()
      .refine((val) => val === "" || val.length === 18, {
        message: "El CURP debe tener exactamente 18 caracteres",
      })
      .refine((val) => val === "" || CURP_ALLOWED_REGEX.test(val), {
        message: "El CURP solo puede contener letras y números",
      })
      .refine((val) => val === "" || CURP_REGEX.test(val), {
        message: "Formato del CURP inválido",
      })
      .optional(),

    rfc: z.string().trim().transform(emptyToNull).nullable()
      .refine((val) => val === null || RFC_ALLOWED_REGEX.test(val), {
        message: "El RFC solo puede contener letras, números y &",
      })
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
  .strict();

const employeeContactUpdateSchema = z
  .object({
    email: z.string().trim().toLowerCase()
      .max(60, "El correo es demasiado largo")
      .regex(EMAIL_SAFE_REGEX, "El correo contiene caracteres no permitidos")
      .refine((val) => val === "" || SIMPLE_EMAIL_REGEX.test(val), {
        message: "Formato de correo inválido",
      })
      .optional(),

    phoneNumber: z.string().trim().max(10, "El número de teléfono no puede exceder 10 dígitos").transform(emptyToNull).nullable()
      .refine((val) => val === null || val.length === 10, {
        message: "El número de teléfono debe tener exactamente 10 dígitos"
      })
      .optional(),

    street: z.string().trim()
      .max(70, "La calle y número no pueden exceder 70 caracteres")
      .refine((val) => val === "" || ADDRESS_REGEX.test(val), {
        message: "La calle y número contienen caracteres no permitidos",
      })
      .transform(emptyToNull)
      .nullable()
      .optional(),
    municipio: z.string().trim()
      .max(70, "El municipio no puede exceder 70 caracteres")
      .refine((val) => val === "" || ADDRESS_REGEX.test(val), {
        message: "El municipio contiene caracteres no permitidos",
      })
      .transform(emptyToNull)
      .nullable()
      .optional(),
    city: z.string().trim()
      .max(70, "La ciudad no puede exceder 70 caracteres")
      .refine((val) => val === "" || ADDRESS_REGEX.test(val), {
        message: "La ciudad contiene caracteres no permitidos",
      })
      .transform(emptyToNull)
      .nullable()
      .optional(),
    postalCode: z.string().trim()
      .max(5, "El código postal no puede exceder 5 dígitos")
      .transform(emptyToNull)
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Debe enviarse al menos un campo para actualizar" }
  );

const workdayUpdateSchema = z
  .object({
    workdayId: z.string().uuid("El workdayId debe ser un UUID válido"),
    start:     z.string().regex(TIME_REGEX, "Formato HH:MM requerido para el inicio"),
    end:       z.string().regex(TIME_REGEX, "Formato HH:MM requerido para el fin"),
    allDay:    z.boolean().optional(),
  })
  .refine(({ start, end, allDay }) => allDay || start !== end, {
    message: "La hora de inicio y fin no pueden ser iguales",
  });

const employeeAdminUpdateSchema = z
  .object({
    houseId: z.string().uuid("El houseId debe ser un UUID válido").optional(),
    roleId:  z.string().uuid("El roleId debe ser un UUID válido").optional(),

    type: z.preprocess(
      (val) =>
        val === null || val === undefined || val === ""
          ? val
          : normalizeEmployeeContractType(val),
      z.enum(["Nomina", "Asalariado", "Honorarios", "Voluntariado"], {
        errorMap: () => ({ message: "Tipo de contrato inválido" }),
      }).nullable().optional()
    ),
    frequencyOfPaymentId: z.string().uuid().nullable().optional(),

    salary: z.preprocess(
      (val) => val === null || val === undefined ? val : String(val),
      z.string()
        .regex(SALARY_REGEX, "El salario debe ser un número válido con hasta 2 decimales")
        .refine((val) => Number(val) >= 0, { message: "El salario no puede ser negativo" })
        .refine((val) => Number(val) <= 1_000_000, { message: "El salario excede el límite permitido" })
        .optional()
    ),

    workdays: z.array(workdayUpdateSchema).min(1, "Debe incluir al menos un día").optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((v) => v !== null && v !== undefined),
    { message: "Debe enviarse al menos un campo para actualizar" }
  )
  .refine(
    (data) => {
      if (data.salary === undefined || data.salary === null) return true;
      const salary = Number(data.salary);
      if (data.type === "Voluntariado") return salary >= 0;
      return salary > 0;
    },
    { message: "El salario debe ser mayor a 0 para este tipo de contrato", path: ["salary"] }
  );

module.exports = {
  employeeBasicUpdateSchema,
  employeeContactUpdateSchema,
  employeeAdminUpdateSchema,
};

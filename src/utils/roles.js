const ROLES = Object.freeze({
    COORDINATOR: "Coordinador",
    ADMIN: "Administrador",
    MAINTENANCE: "Mantenimiento",
    LAUNDRY: "Lavandería",
    NNA_CARE_RESPONSIBLE: "Cuidador",
    PSYCHOLOGIST_FEMALE: "Psicóloga",
    PSYCHOLOGIST_MALE: "Psicólogo",
    SOCIAL_WORKER: "Trabajador Social",
    OPERATIONS_COORDINATOR: "Coordinador Operativo",
    ADMINISTRATIVE_COORDINATOR: "Coordinador Administrativo",
    PROGRAM_COORDINATOR: "Coordinador de Programa",
    OPERATIONS_DIRECTOR: "Dirección Operativa",
    ADMINISTRATIVE_DIRECTOR: "Dirección Administrativa",
    PROGRAM_DIRECTOR: "Dirección de Programa",
    FUNDRAISING: "Procuración de Fondos",
    NURSE: "Enfermera",
    THERAPIST: "Terapeuta",
    EXECUTIVE_ASSISTANT: "Asistente de Dirección",
    FINANCE_ASSISTANT: "Asistente de Finanzas",
    CLEANING_ASSISTANT: "Auxiliar de Limpieza",
    LAUNDRY_ASSISTANT: "Auxiliar de Lavandería",
    DRIVER: "Chofer",
    COOK: "Cocinera",
    OPERATIONS_ASSISTANT: "Asistente Operativo",
    ADMINISTRATIVE_ASSISTANT: "Asistente Administrativo",
    INTENDANCE: "Intendencia",
    PRESIDENT: "Presidente",
    VICE_PRESIDENT: "Vicepresidente",
    TREASURER: "Tesorero",
    VOCAL: "Vocal",
    SUPPLIER: "Proveedor",
});

const allRoles = Object.values(ROLES);

const DOCUMENT_VIEWER_ROLES = Object.freeze([
    ROLES.PSYCHOLOGIST_FEMALE,
    ROLES.PSYCHOLOGIST_MALE,
    ROLES.SOCIAL_WORKER,
    ROLES.NURSE,
    ROLES.THERAPIST,
    ROLES.NNA_CARE_RESPONSIBLE,
    ROLES.EXECUTIVE_ASSISTANT,
    ROLES.FINANCE_ASSISTANT,
]);

module.exports = {
    ROLES,
    DOCUMENT_VIEWER_ROLES,
    allRoles,
};

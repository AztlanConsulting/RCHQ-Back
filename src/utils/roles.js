const ROLES = Object.freeze({
    COORDINATOR: "Coordinador",
    ADMIN: "Admin",
    MAINTENANCE: "Mantenimiento",
    LAUNDRY: "Lavandería",
    NNA_CARE_RESPONSIBLE: "Responsable del cuidado de NNA",
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
});

const allRoles = Object.values(ROLES);

module.exports = {
    ROLES,
    allRoles,
};

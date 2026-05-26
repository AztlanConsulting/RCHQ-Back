// src/utils/responses.js
/*
    This file contains the response messages for the application. It is used to standardize the responses across the application.
    To use this file, simply import it and use the messages as needed. For example:
    const responses = require("../utils/responses");
    res.json({ message: responses.profile.found });

    If you want to add more responses follow the next format:
    const responses = {
        nameOfTheAreaForYourResponse: {
            nameOfTheResponse: 'RESPONSE_MESSAGE',
        },
    };
*/
const RESPONSES = {
    PROFILE: {
        FOUND: "PROFILE_FOUND",
        NOT_FOUND: "PROFILE_NOT_FOUND",
    },
    DOCUMENTS: {
        NOT_FOUND: "Documento no encontrado",
        OK: "Documento obtenido",
        DELETED: "Documento borrado",
        EMPTY: "No hay documentos",
        NOT_ALLOW: "Tipo de documento invalido",
        UPLOADED: "Se subió correctamente",
        ALREADY_EXISTS: "El documento ya existe",
    },
    USER: {
        NOT_FOUND: "Usuario no encontrado",
        NOT_ACCESS: "Acceso bloqueado",
    },
    VACATION: {
        PAST_REQUEST_NOT_ALLOWED:
            "No se pueden pedir vacaciones en el pasado ni para el mismo día",
        PAST_REGISTER_NOT_ALLOWED:
            "No se pueden registrar vacaciones en fechas pasadas",
        REMAINING_VACATIONS_FOUND:
            "Las vacaciones restantes fueron encontradas",
        NULL_DATES:
            "Dentro del rango seleccionado no hay ningún día hábil de vacaciones",
        OUT_OF_RANGE:
            "No se pueden solicitar vacaciones fuera del periodo actual de trabajo",
        WITHOUT_DATES: "Se necesitan tener registrados los días de trabajo",
        INSUFFICIENT_DATES:
            "No se tienen suficientes días disponibles para solicitar las vacaciones",
        ALREADY_REQUEST:
            "Ya hay una solicitud de vacaciones cubriendo los días solicitados",
        REQUESTED: "Se solicitaron las vacaciones de forma correcta",
        REGISTERED: "Vacaciones registradas correctamente",
        WITHOUT_START_DATE: "El empleado no tiene una fecha de inicio asociada",
        INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
        EMPLOYEE_OUT_OF_SCOPE: "EMPLOYEE_OUT_OF_SCOPE",
        APPROVED: "VACATION_APPROVED",
        REJECTED: "VACATION_REJECTED",
        REQUEST_NOT_FOUND: "VACATION_REQUEST_NOT_FOUND",
        REQUEST_ALREADY_REVIEWED: "VACATION_REQUEST_ALREADY_REVIEWED",
        APPROVED_OVERLAP: "VACATION_APPROVED_OVERLAP",
        VALIDATION_ERROR: "VACATION_VALIDATION_ERROR",
        REQUESTS_FOUND: "VACATION_REQUESTS_FOUND",
        UPDATED: "VACATION_UPDATED",
        REQUEST_NOT_MODIFIABLE: "VACATION_REQUEST_NOT_MODIFIABLE",
        SELF_REQUEST_NOT_MODIFIABLE: "VACATION_SELF_REQUEST_NOT_MODIFIABLE",
        REQUEST_ALREADY_STARTED: "VACATION_REQUEST_ALREADY_STARTED",
        DELETED: "VACATION_DELETED",
    },
    DATES: {
        BAD_DATES:
            "No se puede tener una fecha de inicio posterior a la de finalización",
        WRONG_FORMAT:
            "Las fechas son requeridas y tienen que estar en formato YYYY-MM-DD",
    },
    EVENTS: {
        NOT_FOUND: "No hubo eventos encontrados",
        FOUND: "EVENTS_FOUND_CORRECTLY",
        CREATED: "EVENT_CREATED",
        DELETED: "EVENT_DELETED",
        OVERLAP: "EVENT_OVERLAP",
        INVALID_DATES: "EVENT_INVALID_DATES",
        MISSING_FIELDS: "EVENT_MISSING_FIELDS",
        VALIDATION_ERROR: "EVENT_VALIDATION_ERROR",
        UPDATED: "EVENT_UPDATED",
    },
    ABSENCE: {
        BAD_REQUEST: "ABSENCE_BAD_REQUEST",
        NOT_FOUND: "ABSENCE_NOT_FOUND",
        ADD_FORM_FOUND: "ABSENCE_ADD_FORM_FOUND",
        EMPLOYEES_NOT_FOUND: "ABSENCE_EMPLOYEES_NOT_FOUND",
        TYPES_NOT_FOUND: "ABSENCE_TYPES_NOT_FOUND",
        CREATED: "ABSENCE_CREATED",
        LIMIT_REACHED: "ABSENCE_LIMIT_REACHED",
        UPDATED: "ABSENCE_UPDATED",
        DELETED: "ABSENCE_DELETED",
        VALIDATION_ERROR: "ABSENCE_VALIDATION_ERROR",
        INVALID_TYPE: "ABSENCE_INVALID_TYPE",
        OUT_OF_SCOPE: "ABSENCE_OUT_OF_SCOPE",
        INSUFFICIENT_PERMISSIONS: "ABSENCE_INSUFFICIENT_PERMISSIONS",
        NULL_DATES: "NO_USEFUL_DAYS",
        WITHOUT_DATES: "ABSENCE_WITHOUT_DATES",
    },
    EMPLOYEE: {
        BAD_REQUEST: "BAD_REQUEST",
        NOT_FOUND: "EMPLOYEE_NOT_FOUND",
        NOT_PROVIDED: "EMPLOYEE_NOT_PROVIDED",
        FOUND: "EMPLOYEE_DATA_FOUND",
        UPDATED: "EMPLOYEE_UPDATED",
        VALIDATION_ERROR: "EMPLOYEE_VALIDATION_ERROR",
        ALREADY_INACTIVE: "EMPLOYEE_ALREADY_INACTIVE",
        DEACTIVATED: "EMPLOYEE_DEACTIVATED",
        DEACTIVATION_FAILED: "EMPLOYEE_DEACTIVATION_FAILED",
        CANNOT_DEACTIVATE_SELF: "CANNOT_DEACTIVATE_SELF",
        ALREADY_BLACKLISTED: "ALREADY_BLACKLISTED",
    },
    BLACKLIST: {
        ADDED: "BLACKLIST_ADDED",
        INSERT_FAILED: "BLACKLIST_INSERT_FAILED",
        LOG_FAILED: "BLACKLIST_LOG_FAILED",
        ALREADY_EXISTS: "BLACKLIST_ALREADY_EXISTS",
        FETCHED: "BLACKLIST_FETCHED",
        NOT_FOUND: "BLACKLIST_NOT_FOUND",
        INVALID_PAGINATION: "BLACKLIST_INVALID_PAGINATION",
        INTERNAL_ERROR: "BLACKLIST_INTERNAL_ERROR",
        REMOVED: "BLACKLIST_REMOVED",
        NOT_IN_BLACKLIST: "NOT_IN_BLACKLIST",
    },
    LOGS: {
        NOT_PROVIDED: "LOGS_NOT_PROVIDED",
        FOUND: "LOGS_FOUND",
        INVALID_PAGINATION: "LOGS_INVALID_PAGINATION",
        PDF_CREATED: "LOGS_PDF_CREATED",
        ACTIONS_FOUND: "LOG_ACTIONS_FOUND",
    },
};

module.exports = RESPONSES;

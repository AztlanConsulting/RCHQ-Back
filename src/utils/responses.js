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
    EMPLOYEE: {
        BAD_REQUEST: "BAD_REQUEST",
        NOT_FOUND: "EMPLOYEE_NOT_FOUND",
        FOUND: "EMPLOYEE_DATA_FOUND",
    },
    VACATION: {
        PAST_REQUEST_NOT_ALLOWED: 'THE_START_OF_THE_VACATION_IS_SET_IN_THE_PAST',
        REMAINING_VACATIONS_FOUND: 'THE_REMAINING_VACATIONS_WERE_FOUND_CORRECTLY',
        NULL_DATES: 'THERE_ARE_NO_VALID_VACATION_DAYS_INSIDE_THE_RANGE',
        BAD_DATES: 'START_DATE_AFTER_THE_END_DATE',
        OUT_OF_RANGE: 'DATES_OUTSIDE_RANGE',
        WITHOUT_DATES: 'THE_EMPLOYEE_DOES_NOT_HAVE_ITS_WORKING_DAYS_REGISTERED',
        INSUFFICIENT_DATES: 'THERE_ARE_NOT_ENOUGH_REMAINING_DAYS',
        ALREADY_REQUEST: 'THERE_IS_ALREADY_A_REQUEST_BETWEEN_THOSE_DAYS',
        REQUESTED: 'REQUESTED_CORRECTLY',
        WORK_DAYS_FOUND: 'WORK_DAYS_FOUND',
        WORK_DAYS_NOT_FOUND: 'WORK_DAYS_NOT_FOUND',
        WITHOUT_START_DATE: ''
    },
};

module.exports = RESPONSES;

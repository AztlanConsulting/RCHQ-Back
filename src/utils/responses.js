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
    DELETE: "Documento borrado",
    EMPTY: "No hay documentos",
    NOT_ALLOW: "Tipo de documento invalido",
    UPLOAD: "Se subió correctamente",
    ALREADY_EXIST: "El documento ya existe",
  },
  USER: {
    NOT_FOUND: "Usuario no encontrado",
    NOT_ACCESS: "Acceso bloqueado",
  },
  vacation: {
    badDates: 'START_DATE_AFTER_THE_END_DATE',
    invalidDates: 'INVALID_VACATION_DATES',
    withoutDates: 'THE_EMPLOYEE_DOES_NOT_HAVE_ITS_WORKING_DAYS_REGISTERED',
    insufficientDays: 'THERE_ARE_NOT_ENOUGH_REMAINING_DAYS',
    alreadyRequest: 'THERE_IS_ALREADY_A_REQUEST_BETWEEN_THOSE_DAYS',
    requested: 'REQUESTED_CORRECTLY',
    registered: 'REGISTERED_CORRECTLY',
    workDaysFound: 'WORK_DAYS_FOUND',
    workDaysNotFound: 'WORK_DAYS_NOT_FOUND',

    userNotAuthenticated: 'USER_NOT_AUTHENTICATED',
    insufficientPermissions: 'INSUFFICIENT_PERMISSIONS',
    employeeNotFound: 'EMPLOYEE_NOT_FOUND',
    employeeOutOfScope: 'EMPLOYEE_OUT_OF_SCOPE',
    pastDateNotAllowed: 'PAST_DATE_NOT_ALLOWED',
    noWorkDaysInRange: 'NO_WORK_DAYS_IN_RANGE',
  },
};

module.exports = RESPONSES;

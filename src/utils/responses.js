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
      PAST_REQUEST_NOT_ALLOWED: "No se pueden pedir vacaciones en el pasado ni para el mismo día",
      PAST_REGISTER_NOT_ALLOWED: "No se pueden registrar vacaciones en fechas pasadas",
      REMAINING_VACATIONS_FOUND: "Las vacaciones restantes fueron encontradas",
      NULL_DATES: "Dentro del rango seleccionado no hay ningún día hábil de vacaciones",
      OUT_OF_RANGE: "No se pueden solicitar vacaciones fuera del periodo actual de trabajo",
      WITHOUT_DATES: "Se ocupan tener registrados los días de trabajo",
      INSUFFICIENT_DATES: "No se tienen suficientes días disponibles para solicitar las vacaciones",
      ALREADY_REQUEST: "Ya hay una solicitud de vacaciones cubriendo los días solicitados",
      REQUESTED: "Se solicitaron las vacaciones de forma correcta",
      REGISTERED: "Vacaciones registradas correctamente",
      WITHOUT_START_DATE: "El empleado no tiene una fecha de inicio asociada",
      INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
      EMPLOYEE_OUT_OF_SCOPE: "EMPLOYEE_OUT_OF_SCOPE",
  },
  DATES: {
      BAD_DATES: "No se puede tener una fecha de inicio posterior a la de finalización",
      WRONG_FORMAT: "Las fechas son requeridas y tienen que estar en formato YYYY-MM-DD",
  },
  EVENTS: {
      FOUND: 'EVENTS_FOUND_CORRECTLY'
  },
  EMPLOYEE: {
    BAD_REQUEST: "Faltan datos requeridos o tienen un formato incorrecto",
    NOT_FOUND: "Empleado no encontrado",
    FOUND: "Empleado encontrado",
    UPDATED: "Empleado actualizado correctamente",
    VALIDATION_ERROR: "Error de validación al actualizar el empleado",
  },
  ABSENCE:{
    FOUND: "Ausencias encontradas correctamente",
    BAD_REQUEST: "Faltan datos requeridos o tienen un formato incorrecto",
    NOT_FOUND: "No se encontraron ausencias",
  },
  HOUSE:{
    FOUND: "Casas encontradas correctamente",
     NOT_FOUND: "No se encontraron casas",
  },
};

module.exports = RESPONSES;

// utils/responseCodes.js

const RESPONSE = {
  PROFILE: {
    NOT_FOUND: "Perfil no encontrado",
  },
  DOCUMENTS: {
    NOT_FOUND: "Documento no encontrado",
    OK: "Documento obtenido",
    EMPTY: "No hay documentos",
    NOT_ALLOW: "Tipo de documento invalido",
    UPLOAD: "Se subió correctamente",
  },
  USER: {
    NOT_FOUND: "Usuario no encontrado",
    NOT_ACCESS: "Acceso bloqueado",
  },
};

module.exports = { RESPONSE };

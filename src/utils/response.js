// utils/responseCodes.js

const RESPONSE = {
  PROFILE: {
    NOT_FOUND: "Perfil no encontrado",
  },
  DOCUMENTS: {
    NOT_FOUND: "Documento no encontrado",
    OK: "Documento obtenido",
    DELETE: "Documento borrado",
    EMPTY: "No hay documentos",
    NOT_ALLOW: "Tipo de documento invalido",
    UPLOAD: "Se subió correctamente",
    ALREADY_EXIST:"El documento ya existe",
  },
  USER: {
    NOT_FOUND: "Usuario no encontrado",
    NOT_ACCESS: "Acceso bloqueado",
  },
};

module.exports = { RESPONSE };

const { getBlacklist } = require("../../service/blacklist/get.service");
const RESPONSES = require("../../utils/responses");

exports.getBlacklist = async (req, res) => {
    try {
        const result = await getBlacklist(req.query);

        switch (result.code) {
            case RESPONSES.BLACKLIST.FETCHED:
                return res.status(200).json({
                    success: true,
                    message: "Lista negra obtenida correctamente",
                    ...result.data,
                });

            case RESPONSES.BLACKLIST.NOT_FOUND:
                return res.status(404).json({
                    success: false,
                    message: "No se encontraron empleados en la lista negra con los filtros aplicados",
                });

            case RESPONSES.BLACKLIST.INVALID_PAGINATION:
                return res.status(400).json({
                    success: false,
                    message: "Parámetros de consulta inválidos",
                    errors: result.error,
                });

            default:
                return res.status(500).json({
                    success: false,
                    message: "Error interno del servidor",
                });
        }
    } catch (error) {
        console.error("Error en getBlacklist controller:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
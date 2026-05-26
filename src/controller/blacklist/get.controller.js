const { getBlacklist } = require("../../service/blacklist/get.service");
const RESPONSES = require("../../utils/responses");

exports.getBlacklist = async (req, res) => {
    try {
        const result = await getBlacklist({
            ...req.query,
            role: req.user.role,
            houseId: req.user.houseId
        });

        switch (result.code) {
            case RESPONSES.BLACKLIST.FETCHED:
                return res.status(200).json({
                    success: true,
                    message:
                        result.data?.employees?.length > 0
                            ? "Lista negra obtenida correctamente"
                            : "No hay personas en la lista negra con los filtros aplicados",
                    ...result.data,
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

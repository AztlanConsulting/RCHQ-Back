const { getAbsenceTypes } = require("../../service/absence/get.service");
const RESPONSES = require("../../utils/responses");

exports.getAbsenceTypes = async (req, res) => {
    try {
        const result = await getAbsenceTypes();

        if (result.code === RESPONSES.EVENTS.NOT_FOUND) {
            return res.status(204).json({
                success: false,
                message: "Error al buscar los tipos de ausencia o no hubo",
            });
        }

        if (result.code === RESPONSES.EVENTS.FOUND) {
            return res.status(200).json({
                success: true,
                data: {
                    absenceTypes: result.data.absenceTypes,
                },
            });
        }

        return res.status(500).json({
            success: false,
            message: "Respuesta inesperada al obtener tipos de ausencia",
        });
    } catch (err) {
        console.error("getAbsenceTypes error:", err);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

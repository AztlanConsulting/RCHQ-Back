const {
    getLogsByHouse,
    getLogsPdfByHouse,
} = require("../../service/logs/get.service");
const RESPONSES = require("../../utils/responses");

exports.getLogsByHouse = async (req, res) => {
    try {
        const houseId = req.resolvedRequester?.houseId || req.user?.houseId;
        const { page, limit } = req.query;

        const result = await getLogsByHouse(houseId, page, limit);

        if (result.code === RESPONSES.LOGS.NOT_PROVIDED) {
            return res.status(400).json({
                success: false,
                message: "No se pudo identificar la casa del coordinador",
            });
        }

        if (result.code === RESPONSES.LOGS.INVALID_PAGINATION) {
            return res.status(422).json({
                success: false,
                message: "Parámetros inválidos",
            });
        }

        if (result.code === RESPONSES.LOGS.FOUND) {
            return res.status(200).json({
                success: true,
                data: result.data.logs,
                totalPages: result.data.totalPages,
                currentPage: result.data.currentPage,
                totalRecords: result.data.totalRecords,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Respuesta inesperada al obtener logs",
        });
    } catch (error) {
        console.error("getLogsByHouse error:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

exports.getLogsPdfByHouse = async (req, res) => {
    try {
        const houseId = req.resolvedRequester?.houseId || req.user?.houseId;
        const { month, year } = req.query;
        const result = await getLogsPdfByHouse(houseId, month, year);

        if (result.code === RESPONSES.LOGS.NOT_PROVIDED) {
            return res.status(400).json({
                success: false,
                message: "No se pudo identificar la casa del coordinador",
            });
        }

        if (result.code === RESPONSES.LOGS.INVALID_REPORT_DATE) {
            return res.status(422).json({
                success: false,
                message: "Fecha inválida",
            });
        }

        if (result.code === RESPONSES.LOGS.FOUND) {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${result.data.fileName}"`,
            );

            return res.status(200).send(result.data.pdfBuffer);
        }

        return res.status(500).json({
            success: false,
            message: "Respuesta inesperada al generar el PDF de logs",
        });
    } catch (error) {
        console.error("getLogsPdfByHouse error:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

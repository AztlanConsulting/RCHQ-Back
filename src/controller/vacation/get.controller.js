const { getRemainingVacations,
    getPendingVacationRequests,
    getReviewedVacationRequests,
} = require("../../service/vacation/get.service");
const RESPONSES = require("../../utils/responses");

exports.getRemainingVacations = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const result = await getRemainingVacations(employeeId);

        if (result.code === RESPONSES.VACATION.WITHOUT_START_DATE) {
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor. Por favor intente más tarde.",
            });
        }

        if (result.code === RESPONSES.VACATION.REMAINING_VACATIONS_FOUND) {
            return res.status(200).json({
                success: true,
                data: {
                    remainingVacations: result.data.remainingDays,
                    startDate: result.data.startDate,
                    endDate: result.data.endDate,
                }
            });
        }
    } catch {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
}

exports.getPendingVacationRequests = async (req, res) => {
    try {
        const result = await getPendingVacationRequests({
            actorEmployeeId: req.user.id,
            query: req.query,
        });

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (result.code === RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS) {
            return res.status(403).json({
                success: false,
                message: "No se tienen permisos",
            });
        }

        if (result.code === RESPONSES.VACATION.REQUESTS_FOUND) {
            return res.status(200).json({
                success: true,
                data: result.data.requests,
                pagination: result.data.pagination,
            });
        }

        if (result.code === RESPONSES.VACATION.VALIDATION_ERROR) {
            return res.status(422).json({
                success: false,
                message: "Datos inválidos",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    } catch (error) {
        console.error("getPendingVacationRequests error:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

exports.getReviewedVacationRequests = async (req, res) => {
    try {
        const result = await getReviewedVacationRequests({
            actorEmployeeId: req.user.id,
            query: req.query,
        });

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (result.code === RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS) {
            return res.status(403).json({
                success: false,
                message: "No se tienen permisos",
            });
        }

        if (result.code === RESPONSES.VACATION.REQUESTS_FOUND) {
            return res.status(200).json({
                success: true,
                data: result.data.requests,
                pagination: result.data.pagination,
            });
        }

        if (result.code === RESPONSES.VACATION.VALIDATION_ERROR) {
            return res.status(422).json({
                success: false,
                message: "Datos inválidos",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    } catch (error) {
        console.error("getReviewedVacationRequests error:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

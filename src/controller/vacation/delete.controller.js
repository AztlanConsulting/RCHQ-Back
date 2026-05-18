const {
    deleteVacationRequest,
} = require("../../service/vacation/delete.service");
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");


exports.deleteVacationRequest = async (req, res) => {
    try {
        const actorEmployeeId = req.user.id;
        const { vacationRequestId } = req.params;
        const ipAddress = getClientIp(req);

        const result = await deleteVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
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
                message: "No tienes permisos para remover vacaciones",
            });
        }

        if (result.code === RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        if (result.code === RESPONSES.VACATION.REQUEST_NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Solicitud de vacaciones no encontrada",
            });
        }

        if (result.code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (result.code === RESPONSES.VACATION.VALIDATION_ERROR) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos",
            });
        }

        if (result.code === RESPONSES.VACATION.DELETED) {
            return res.status(200).json({
                success: true,
                message: "Vacaciones removidas correctamente",
                data: {
                    vacationRequest: result.data.vacationRequest,
                },
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

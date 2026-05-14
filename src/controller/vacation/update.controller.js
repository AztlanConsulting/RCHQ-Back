const {
    approveVacationRequest,
    rejectVacationRequest,
} = require("../../service/vacation/update.service");
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

exports.approveVacationRequest = async (req, res) => {
    try {
        const actorEmployeeId = req.user.id;
        const { vacationRequestId } = req.params;
        const ipAddress = getClientIp(req);

        const result = await approveVacationRequest({
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
                message: "No tienes permisos para aprobar solicitudes de vacaciones",
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

        if (result.code === RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED) {
            return res.status(406).json({
                success: false,
                message: "La solicitud ya fue revisada",
            });
        }

        if (result.code === RESPONSES.VACATION.OUT_OF_RANGE) {
            return res.status(406).json({
                success: false,
                message: "No se pueden aprobar vacaciones fuera del periodo actual de trabajo",
            });
        }

        if (result.code === RESPONSES.VACATION.WITHOUT_DATES) {
            return res.status(406).json({
                success: false,
                message: "Se ocupan tener registrados los días de trabajo",
            });
        }

        if (result.code === RESPONSES.VACATION.NULL_DATES) {
            return res.status(406).json({
                success: false,
                message: "Dentro del rango seleccionado no hay ningún día hábil de vacaciones",
            });
        }

        if (result.code === RESPONSES.VACATION.APPROVED_OVERLAP) {
            return res.status(406).json({
                success: false,
                message: "La solicitud se traslapa con vacaciones aprobadas",
            });
        }

        if (result.code === RESPONSES.VACATION.INSUFFICIENT_DATES) {
            return res.status(406).json({
                success: false,
                message: "El empleado no tiene días de vacaciones suficientes",
            });
        }

        if (result.code === RESPONSES.VACATION.APPROVED) {
            return res.status(200).json({
                success: true,
                message: "Solicitud aprobada correctamente",
                data: {
                    vacationRequest: result.data.vacationRequest,
                },
            });
        }

        if (result.code === RESPONSES.VACATION.WITHOUT_START_DATE) {
            return res.status(406).json({
                success: false,
                message: "El empleado no tiene una fecha de inicio asociada",
            });
        }

        if (result.code === RESPONSES.VACATION.VALIDATION_ERROR) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos",
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

exports.rejectVacationRequest = async (req, res) => {
    try {
        const actorEmployeeId = req.user.id;
        const { vacationRequestId } = req.params;
        const { feedback } = req.body || {};
        const ipAddress = getClientIp(req);

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            feedback,
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
                message: "No tienes permisos para rechazar solicitudes de vacaciones",
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

        if (result.code === RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED) {
            return res.status(406).json({
                success: false,
                message: "La solicitud ya fue revisada",
            });
        }

        if (result.code === RESPONSES.VACATION.VALIDATION_ERROR) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos",
            });
        }

        if (result.code === RESPONSES.VACATION.REJECTED) {
            return res.status(200).json({
                success: true,
                message: "Solicitud rechazada correctamente",
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

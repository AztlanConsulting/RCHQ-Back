const { requestVacation, registerEmployeeVacation } = require("../../service/vacation/create.service")
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

exports.requestVacation = async (req, res) => {
    try {
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        const requesterHouseId = req.resolvedRequester?.houseId;

        const clientIp = getClientIp(req);

        const employeeId = req.user.id;
        const result = await requestVacation(employeeId, startDate, endDate, clientIp, requesterHouseId);

        if (result.code == RESPONSES.DATES.WRONG_FORMAT) {
            return res.status(400).json({
                success: false,
                message: "Las fechas son requeridas y tienen que estar en formato YYYY-MM-DD"
            });
        }

        if (result.code == RESPONSES.VACATION.PAST_REQUEST_NOT_ALLOWED) {
            return res.status(406).json({
                success: false,
                message: "No se pueden pedir vacaciones en el pasado ni para el mismo día"
            });
        }

        if (result.code == RESPONSES.VACATION.NULL_DATES) {
            return res.status(406).json({
                success: false,
                message: "Dentro del rango seleccionado no hay ningún día hábil de vacaciones"
            });
        }

        if (result.code == RESPONSES.VACATION.ALREADY_REQUEST) {
            return res.status(406).json({
                success: false,
                message: "Ya hay una solicitud de vacaciones cubriendo los días solicitados"
            });
        }

        if (result.code == RESPONSES.VACATION.OUT_OF_RANGE) {
            return res.status(406).json({
                success: false,
                message: "No se pueden solicitar vacaciones fuera del periodo actual de trabajo"
            });
        }

        if (result.code == RESPONSES.DATES.BAD_DATES) {
            return res.status(406).json({
                success: false,
                message: "No se puede tener una fecha de inicio posterior a la de finalización"
            });
        }

        if (result.code == RESPONSES.VACATION.INSUFFICIENT_DATES) {
            return res.status(406).json({
                success: false,
                message: "No se tienen suficientes días disponibles para solicitar las vacaciones"
            });
        }

        if (result.code == RESPONSES.VACATION.WITHOUT_DATES) {
            return res.status(406).json({
                success: false,
                message: "Se necesitan tener registrados los días de trabajo"
            });
        }

        if (result.code == RESPONSES.VACATION.REQUESTED) {
            return res.status(201).json({
                success: true,
                message: "Se solicitaron las vacaciones de forma correcta"
            });
        }

        console.error("sepa la wea po causa wn");

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });

    } catch(error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
}

exports.registerEmployeeVacation = async (req, res) => {
    try {
        const targetEmployeeId = req.params.employeeId;
        const actorEmployeeId = req.user.id;
        const { startDate, endDate } = req.body;
        const requesterHouseId = req.resolvedRequester?.houseId;
        const ipAddress = getClientIp(req);

        const result = await registerEmployeeVacation({
            actorEmployeeId,
            targetEmployeeId,
            rawStartDate: startDate,
            rawEndDate: endDate,
            ipAddress,
            requesterHouseId,
        });

        if (result.code === RESPONSES.DATES.WRONG_FORMAT) {
            return res.status(400).json({
                success: false,
                message: "Las fechas son requeridas y tienen que estar en formato YYYY-MM-DD",
            });
        }

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (result.code === RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para registrar vacaciones de otros empleados",
            });
        }

        if (result.code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (result.code === RESPONSES.VACATION.PAST_REGISTER_NOT_ALLOWED) {
            return res.status(406).json({
                success: false,
                message: "No se pueden registrar vacaciones en fechas pasadas",
            });
        }

        if (result.code === RESPONSES.DATES.BAD_DATES) {
            return res.status(406).json({
                success: false,
                message: "No se puede tener una fecha de inicio posterior a la de finalización",
            });
        }

        if (result.code === RESPONSES.VACATION.WITHOUT_DATES) {
            return res.status(406).json({
                success: false,
                message: "Se necesitan tener registrados los días de trabajo",
            });
        }

        if (result.code === RESPONSES.VACATION.NULL_DATES) {
            return res.status(406).json({
                success: false,
                message: "Dentro del rango seleccionado no hay ningún día hábil de vacaciones",
            });
        }

        if (result.code === RESPONSES.VACATION.ALREADY_REQUEST) {
            return res.status(406).json({
                success: false,
                message: "Ya hay una solicitud de vacaciones cubriendo los días solicitados",
            });
        }

        if (result.code === RESPONSES.VACATION.OUT_OF_RANGE) {
            return res.status(406).json({
                success: false,
                message: "No se pueden registrar vacaciones fuera del periodo actual de trabajo",
            });
        }

        if (result.code === RESPONSES.VACATION.INSUFFICIENT_DATES) {
            return res.status(406).json({
                success: false,
                message: "No se tienen suficientes días disponibles para registrar las vacaciones",
            });
        }

        if (result.code === RESPONSES.VACATION.REGISTERED) {
            return res.status(201).json({
                success: true,
                message: "Vacaciones registradas correctamente",
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
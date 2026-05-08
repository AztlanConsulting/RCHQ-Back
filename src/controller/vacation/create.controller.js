const { 
    getRemainingVacations, 
    requestVacation
} = require("../../service/vacation/create.service")
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

exports.getRemainingVacations = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const result = await getRemainingVacations(employeeId);

        if (result.code === RESPONSES.VACATION.WITHOUT_START_DATE) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
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
            message: "Internal Server Error",
        });
    }
}

exports.requestVacation = async (req, res) => {
    try {
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;

        const clientIp = getClientIp(req);

        const employeeId = req.user.id;
        const result = await requestVacation(employeeId, startDate, endDate, clientIp);

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
                message: "Se ocupan tener registrados los días de trabajo"
            });
        }

        if (result.code == RESPONSES.VACATION.REQUESTED) {
            return res.status(201).json({
                success: true,
                message: "Se solicitaron las vacaciones de forma correcta"
            });
        }

    } catch {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
}
const { 
    getRemainingVacations, 
    requestVacation,
    registerEmployeeVacation,
} = require("../../service/vacation/add.service")
const responses = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

function parseDateToUTC(dateString) {
    const dateElements = dateString.split("-");
    return new Date(Date.UTC(
        Number(dateElements[0]),
        Number(dateElements[1]) - 1,
        Number(dateElements[2])
    ));
}

exports.getRemainingVacations = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const result = await getRemainingVacations(employeeId);

        if (result.code === responses.vacation.workDaysNotFound) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }

        if (result.code === responses.vacation.workDaysFound) {
            return res.status(200).json({
                success: true,
                data: {
                    remainingVacations: result.data.remainingDays
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
    //try {
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;

        const startDateElements = startDate.split("-");
        const endDateElements = endDate.split("-");

        const parsedStartDate = new Date(Date.UTC(startDateElements[0], startDateElements[1]-1, startDateElements[2]));
        const parsedEndDate = new Date(Date.UTC(endDateElements[0], endDateElements[1]-1, endDateElements[2]));

        const employeeId = req.user.id;
        const result = await requestVacation(employeeId, parsedStartDate, parsedEndDate, req);

        if (result.code == responses.vacation.alreadyRequest) {
            return res.status(406).json({
                success: false,
                message: "Ya hay una solicitud de vacaciones cubriendo los días solicitados"
            });
        }

        if (result.code == responses.vacation.badDates) {
            return res.status(406).json({
                success: false,
                message: "No se puede tener una fecha de inicio posterior a la de finalización"
            });
        }

        if (result.code == responses.vacation.insufficientDays) {
            return res.status(406).json({
                success: false,
                message: "No se tienen suficientes días disponibles para solicitar las vacaciones"
            });
        }

        if (result.code == responses.vacation.withoutDates) {
            return res.status(406).json({
                success: false,
                message: "Se ocupan tener registrados los días de trabajo"
            });
        }

        if (result.code == responses.vacation.requested) {
            return res.status(201).json({
                success: true,
                message: "Se solicitaron las vacaciones de forma correcta"
            });
        }

    /*} catch {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }*/
}

exports.registerEmployeeVacation = async (req, res) => {
    try {
        const targetEmployeeId = req.params.employeeId;
        const actorEmployeeId = req.user.id;

        const { startDate, endDate } = req.body;

        const parsedStartDate = parseDateToUTC(startDate);
        const parsedEndDate = parseDateToUTC(endDate);

        const ipAddress = getClientIp(req);

        const result = await registerEmployeeVacation({
            actorEmployeeId,
            targetEmployeeId,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            ipAddress,
        });

        if (result.code === responses.vacation.userNotAuthenticated) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (result.code === responses.vacation.insufficientPermissions) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para registrar vacaciones de otros empleados",
            });
        }

        if (result.code === responses.vacation.employeeNotFound) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (result.code === responses.vacation.employeeOutOfScope) {
            return res.status(403).json({
                success: false,
                message: "No puedes registrar vacaciones para empleados fuera de tu casa hogar",
            });
        }

        if (result.code === responses.vacation.invalidDates) {
            return res.status(400).json({
                success: false,
                message: "Las fechas son inválidas",
            });
        }

        if (result.code === responses.vacation.pastDateNotAllowed) {
            return res.status(406).json({
                success: false,
                message: "No se pueden registrar vacaciones en fechas pasadas",
            });
        }

        if (result.code === responses.vacation.badDates) {
            return res.status(406).json({
                success: false,
                message: "La fecha final no puede ser anterior a la fecha inicial",
            });
        }

        if (result.code === responses.vacation.withoutDates) {
            return res.status(406).json({
                success: false,
                message: "El empleado debe tener días de trabajo registrados",
            });
        }

        if (result.code === responses.vacation.noWorkDaysInRange) {
            return res.status(406).json({
                success: false,
                message: "El rango seleccionado no contiene días laborales del empleado",
            });
        }

        if (result.code === responses.vacation.alreadyRequest) {
            return res.status(406).json({
                success: false,
                message: "Ya existe una solicitud de vacaciones dentro del rango solicitado",
            });
        }

        if (result.code === responses.vacation.insufficientDays) {
            return res.status(406).json({
                success: false,
                message: "El empleado no tiene días de vacaciones suficientes",
            });
        }

        if (result.code === responses.vacation.registered) {
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
            message: "Internal Server Error",
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
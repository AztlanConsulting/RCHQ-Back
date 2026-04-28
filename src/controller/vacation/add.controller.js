const { 
    getRemainingVacations, 
    requestVacation
} = require("../../service/vacation/add.service")
const responses = require("../../utils/responses");

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
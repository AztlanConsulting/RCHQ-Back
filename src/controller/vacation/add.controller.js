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
    try {
        const { employeeId, startDate, endDate } = req.body;
        const result = await requestVacation(employeeId, startDate, endDate, req);

        if (result.code == responses.vacation.alreadyRequest {
            
        })

    } catch {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
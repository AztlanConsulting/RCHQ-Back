const { getRemainingVacations } = require("../../service/vacation/get.service");
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
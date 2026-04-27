const { getRemainingVacations } = require("../../service/vacation/add.service")

exports.getRemainingVacations = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const remainingVacations = await getRemainingVacations(employeeId);
        return res.status(200).json({
            success: true,
            data: {
                remainingVacations
            }
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
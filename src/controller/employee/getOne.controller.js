const { getWorkDays } = require("../../service/employee/getOne.service");

exports.getWorkDays = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const workDays = await getWorkDays(employeeId);
        return res.status(200).json({
            success: true,
            data: {
                workDays
            }
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
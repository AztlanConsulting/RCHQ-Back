const personnelService = require("../service/personnel.service");

exports.getEmployeeDetail = async (req, res) => {
    try {
        const result = await personnelService.getEmployeeDetail(req);
        return res.status(result.status).json(result.body);
    } catch (err) {
        console.error("Employee detail error:", err);
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        });
    }
}

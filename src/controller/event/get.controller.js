const { getEventsInRange } = require("../../service/event/get.service")

exports.getEventsInRange = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const rawStartDate = req.params.startDate;
        const startDateElements = rawStartDate.split("-");
        const rawEndDate = req.params.endDate;
        const endDateElements = rawEndDate.split("-");

        const startDate = new Date(Date.UTC(startDateElements[0], startDateElements[1]-1, startDateElements[2]));
        const endDate = new Date(Date.UTC(endDateElements[0], endDateElements[1]-1, endDateElements[2]));

        const events = await getEventsInRange(employeeId, startDate, endDate);
        return res.status(200).json({
            success: true,
            data: {
                events
            }
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
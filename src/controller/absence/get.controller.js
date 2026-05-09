const RESPONSES = require("../../utils/responses");
const { getAllAbsences } = require("../../services/absence/get.service");


exports.getAllAbsences = async (req, res) => {
    const {page, limit} = req.query;

    try {
        const result = await getAllAbsences(page, limit);
        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        console.log("Error obteniendo las ausencias: ", error);
        return res.status(500).json({
            success: false,
            message: RESPONSES.INTERNAL_SERVER_ERROR,
        });
    }
}
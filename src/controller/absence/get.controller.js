const RESPONSES = require("../../utils/responses");
const { getAllAbsences } = require("../../services/absence/get.service");


exports.getAllAbsences = async (req, res) => {
    const {page, limit} = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    try {
        const result = await getAllAbsences(parsedPage, parsedLimit);
        
        if(result.type === RESPONSES.ABSENCE.BAD_REQUEST){
            return res.status(400).json({
                success: false,
                message: RESPONSES.ABSENCE.BAD_REQUEST,
            });
        }
        if(result.type === RESPONSES.ABSENCE.FOUND){
            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
    } catch (error) {
        console.log("Error obteniendo las ausencias: ", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
}
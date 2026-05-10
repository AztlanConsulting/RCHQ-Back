const RESPONSES = require("../../utils/responses");
const { getAllAbsences } = require("../../model/absence/get.model");

exports.getAllAbsences = async (page, limit) => {
    if(!page || !limit){
        return {
            success: false,
            type: RESPONSES.ABSENCE.BAD_REQUEST,
        };
    }
    if(isNaN(page) || isNaN(limit) || page < 1 || limit < 1){
        return {
            success: false,
            type: RESPONSES.ABSENCE.BAD_REQUEST,
        };
    }

    try {
        const result = await getAllAbsences(page, limit);
        if(result.length === 0){
            return {
                success: false,
                type: RESPONSES.ABSENCE.NOT_FOUND,
            };
        }
        return {
            success: true,
            type: RESPONSES.ABSENCE.FOUND,
            data: result.data,
            pagination: result.pagination,
        };
    }catch (error) {
        console.log("Error obteniendo las ausencias: ", error);
        return {
            success: false,
            type: "Error interno del servidor",
        };
    }
    
}
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

    const parsedLimit = Math.min(parseInt(limit), 100);

    try {
        const result = await getAllAbsences(page, parsedLimit);

        if (!result || result.success === false) {
            throw new Error("Error en modelo de ausencias");
        }

        if(!result.data || result.data.length === 0){
            return {
                success: true,
                type: RESPONSES.ABSENCE.FOUND,
                data: [],
                pagination: result.pagination,
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
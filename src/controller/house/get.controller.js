const { getHouseNameForEmployee } = require("../../service/house/get.service");
const RESPONSES = require("../../utils/responses");

exports.getHouseName = async (req, res) => {
    try {
        const employeeId = req.user?.id;

        const result = await getHouseNameForEmployee(employeeId);

        if (result.code === RESPONSES.EMPLOYEE.NOT_PROVIDED) {
            return res.status(400).json({
                success: false,
                message: "Identificador de empleado no disponible en la sesión",
            });
        }

        if (result.code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (result.code === RESPONSES.EMPLOYEE.FOUND) {
            return res.status(200).json({
                success: true,
                data: {
                    houseName: result.data.houseName,
                },
            });
        }

        return res.status(500).json({
            success: false,
            message: "Respuesta inesperada al obtener el nombre de la casa",
        });
    } catch (err) {
        console.error("getHouseName error:", err);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

const { getEmployees } = require("../../service/employee/get.service");

exports.getAll = async (req, res) => {
    try {
        const { houseId } = req.user;

        if (!houseId) {
            return res.status(403).json({
                success: false,
                message:
                    "Acceso denegado: El usuario no está asociado a ninguna casa.",
            });
        }

        const { active, page, limit, search } = req.query;

        const result = await getEmployees(houseId, active, page, limit, search);

        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error("Error obteniendo a los empleados: ", error);

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};

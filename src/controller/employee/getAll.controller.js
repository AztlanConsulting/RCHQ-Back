const {
    getEmployeesService,
} = require("../../service/employee/getAll.service");

const getAll = async (req, res) => {
    try {
        const { houseId } = req.user;
        const { active, page, limit, search } = req.query;

        const result = await getEmployeesService(
            houseId,
            active,
            page,
            limit,
            search,
        );

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

module.exports = {
    getAll,
};

const {
    getEmployeesService,
} = require("../../service/employee/getAll.service");

const getAll = async (req, res) => {
    try {
        const { houseId } = req.user;
        const { active } = req.query;

        const employees = await getEmployeesService(houseId, active);

        return res.status(200).json({
            success: true,
            data: employees,
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

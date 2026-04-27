const {
    getRoles,
    getById: getEmployeeById,
    createEmployee,
} = require("../../service/employee/employeeAdd.service");

exports.getAdd = async (req, res) => {
    try {
        const roles = await getRoles();

        return res.status(200).json({
            roles,
            house_id: req.user.houseId,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Error cargando datos del formulario",
        });
    }
};

exports.getById = async (req, res) => {
    try {
        const result = await getEmployeeById(req.params.id);

        if (!result) {
            return res.status(404).json({
                error: "Empleado no encontrado",
            });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

exports.postAdd = async (req, res) => {
    try {
        const data = { ...req.body };

        if (req.file) {
            data.picture = req.file.path;
        }

        const result = await createEmployee(data, req.user, req);

        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "No se pudo registrar correctamente el empleado",
        });
    }
};

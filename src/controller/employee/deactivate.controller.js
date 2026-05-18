const {
    deactivateEmployee,
} = require("../../service/employee/deactivate.service.js");
const RESPONSES = require("../../utils/responses");

exports.deactivateEmployeeController = async (req, res) => {
    try {
        const { code, data } = await deactivateEmployee(req);

        if (code === RESPONSES.EMPLOYEE.DEACTIVATED) {
            return res
                .status(200)
                .json({ message: `"${data.name}" ha sido dado de baja` });
        } else if (code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        } else if (code === RESPONSES.EMPLOYEE.ALREADY_INACTIVE) {
            return res
                .status(409)
                .json({ message: "El empleado ya está dado de baja" });
        } else if (code === RESPONSES.EMPLOYEE.DEACTIVATION_FAILED) {
            return res
                .status(400)
                .json({
                    message: `Hubo un error al dar de baja a "${data.name}".`,
                });
        } else {
            return res.status(500).json({ message: "Error inesperado" });
        }
    } catch (error) {
        console.error(
            "Error en el controlador de desactivación de empleado:",
            error,
        );
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

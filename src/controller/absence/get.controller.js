const absenceService = require("../../service/absence/get.service");
const RESPONSES = require("../../utils/responses");

exports.getAbsenceTypes = async (req, res) => {
    try {
        const result = await absenceService.getAbsenceTypes();

        if (result.code === RESPONSES.EVENTS.NOT_FOUND) {
            return res.status(204).json({
                success: false,
                message: "Error al buscar los tipos de ausencia o no hubo",
            });
        }

        if (result.code === RESPONSES.EVENTS.FOUND) {
            return res.status(200).json({
                success: true,
                data: {
                    absenceTypes: result.data.absenceTypes,
                },
            });
        }

        return res.status(500).json({
            success: false,
            message: "Respuesta inesperada al obtener tipos de ausencia",
        });
    } catch (err) {
        console.error("getAbsenceTypes error:", err);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

exports.getEmployeesAndAbsenceTypes = async (req, res) => {
    try {
        const result = await absenceService.getEmployeesAndAbsenceTypes(
            req.user?.id,
        );

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (result.code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (result.code === RESPONSES.ABSENCE.EMPLOYEES_NOT_FOUND) {
            return res.status(204).json({
                success: false,
                message: "Lista vacía de empleados",
            });
        }

        if (result.code === RESPONSES.ABSENCE.TYPES_NOT_FOUND) {
            return res.status(204).json({
                success: false,
                message: "Lista vacía de ausencias",
            });
        }

        if (result.code === RESPONSES.ABSENCE.ADD_FORM_FOUND) {
            return res.status(200).json({
                success: true,
                data: {
                    employees: result.data.employees,
                    absenceTypes: result.data.absenceTypes,
                },
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Respuesta inesperada al obtener empleados y tipos de ausencia",
        });
    } catch (err) {
        console.error("getEmployeesAndAbsenceTypes error:", err);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

const {
    getRoles,
    getById,
    getDocumentsByEmployee,
    getEmployees,
    getEmployeeDetail,
} = require("../../service/employee/get.service");
const RESPONSES = require("../../utils/responses");

exports.getAdd = async (req, res) => {
    try {
        const roles = await getRoles();
        return res.status(200).json({ roles, houseId: req.user.houseId });
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ error: "Error cargando datos del formulario" });
    }
};

exports.getById = async (req, res) => {
    try {
        const result = await getById(req.params.id);
        if (!result)
            return res.status(404).json({ error: "Empleado no encontrado" });
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

exports.getDocumentsByEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res
                .status(400)
                .json({ success: false, message: "Bad Request" });

        const result = await getDocumentsByEmployee(id);

        if (result.type === RESPONSES.DOCUMENTS.OK)
            return res.status(200).json({ success: true, body: result.body });
        if (result.type === RESPONSES.DOCUMENTS.NOT_FOUND)
            return res.status(200).json({
                success: true,
                message: "El empleado no tiene documentos",
            });
        if (result.type === RESPONSES.USER.NOT_FOUND)
            return res
                .status(404)
                .json({ success: false, message: "Empleado no encontrado" });
    } catch (err) {
        console.error("getDocumentsByEmployee error:", err);
        return res
            .status(500)
            .json({ success: false, message: "Error interno del servidor" });
    }
};

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
        return res
            .status(500)
            .json({ success: false, message: "Error interno del servidor" });
    }
};

exports.getEmployeeDetail = async (req, res) => {
    try {
        const userID = req.user.id;
        const { employeeId } = req.params;

        const result = await getEmployeeDetail(userID, employeeId);

        if (result.code === RESPONSES.EMPLOYEE.BAD_REQUEST) {
            return res.status(400).json({
                success: false,
                message: "Body incompleto para este request",
            });
        }
        if (result.code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Empleado con ID dado no encontrado",
            });
        }
        if (result.code === RESPONSES.EMPLOYEE.FOUND) {
            return res.status(200).json({
                success: true,
                message: "Datos del empleado encontrado con éxito",
                data: result.data,
            });
        }

        return res.status(500).json({
            sucess: false,
            message:
                "Error interno del servidor, resultado inesperado al solicitar detalle del empleado",
            data: {},
        });
    } catch (err) {
        console.error("Employee detail error:", err);
        return res.status(500).json({
            success: false,
            message: "Error Interno del Servidor",
        });
    }
};

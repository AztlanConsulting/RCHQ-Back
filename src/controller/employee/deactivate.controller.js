const { deactivateEmployee } = require("../../service/employee/deactivate.service");
const RESPONSES = require("../../utils/responses");

exports.deactivateEmployeeController = async (req, res) => {
  try {
    const { code } = await deactivateEmployee(req);

    switch (code) {
      case RESPONSES.employee.deactivated:
        return res.status(200).json({ message: "Empleado dado de baja exitosamente" });

      case RESPONSES.employee.deactivatedAndBlacklisted:
        return res.status(200).json({ message: "Empleado dado de baja y agregado a la lista negra" });

      case RESPONSES.employee.notFound:
        return res.status(404).json({ message: "Empleado no encontrado" });

      case RESPONSES.employee.alreadyInactive:
        return res.status(409).json({ message: "El empleado ya está dado de baja" });

      case RESPONSES.employee.deactivationFailed:
        return res.status(400).json({ message: "Hubo un error al dar de baja al empleado" });

      case RESPONSES.employee.deactivatedBlacklistFailed:
        return res.status(400).json({ message: "Empleado dado de baja, pero hubo un error al agregarlo a la lista negra" });

      default:
        return res.status(500).json({ message: "Error inesperado" });
    }
  } catch (error){
    console.error("Error en el controlador de desactivación de empleado:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
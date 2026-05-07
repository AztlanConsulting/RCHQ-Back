const prisma = require("../../src/prisma");

const resolveEmployeeHouse = async (req, res, next) => {
  try {
    const employeeId = req.params.id || req.params.employeeId;
    const employee = await prisma.employee.findUnique({
      where: { employee_id: Number(employeeId) },
      select: { house_id: true }, // solo lo que necesitas
    });
    if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });
    
    // Normaliza a camelCase para que coincida con el payload del token
    req.resolvedEmployee = { houseId: employee.house_id };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  resolveEmployeeHouse,
};
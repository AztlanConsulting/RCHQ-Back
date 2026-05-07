const prisma = require("../../src/prisma");

const resolveEmployeeHouse = async (req, res, next) => {
  try {
    const employeeId = req.params.id || req.params.employeeId;
    const employee = await prisma.employee.findUnique({
      where: { employee_id: employeeId },
      select: { house_id: true },
    });
    if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });
    
    req.resolvedEmployee = { houseId: employee.house_id };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  resolveEmployeeHouse,
};
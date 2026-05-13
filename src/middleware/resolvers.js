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

const resolveRequesterHouse = async (req, res, next) => {
  try {
    const requesterId = req.user?.id;

    if (!requesterId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const employee = await prisma.employee.findUnique({
      where: { employee_id: requesterId },
      select: {
        house_id: true,
        role: {
          select: {
            name: true,
            role_privilege: {
              include: {
                privilege: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ message: "Coordinador no encontrado" });
    }

    req.resolvedRequester = { houseId: employee.house_id };
    req.user = {
      ...req.user,
      houseId: employee.house_id,
      role: employee.role?.name,
      privileges: employee.role?.role_privilege?.map((rp) => rp.privilege.name) || [],
    };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  resolveEmployeeHouse,
  resolveRequesterHouse,
};

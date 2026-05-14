const prisma = require("../../src/prisma");

exports.resolveEmployeeHouse = async (req, res, next) => {
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

exports.resolveRequesterHouse = async (req, res, next) => {
  try {
    const requesterId = req.user?.id;

    if (!requesterId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
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
      return res.status(404).json({ message: "Empleado no encontrado" });
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

exports.resolveAbsenceHouse = async (req, res, next) => {
  try {
    const absenceId = req.params.absenceId;

    const absence = await prisma.absence.findUnique({
      where: { absence_id: absenceId },
      select: {
        employee: {
          select: {
            house_id: true,
          },
        },
      },
    });

    if (!absence) {
      return res.status(404).json({
        success: false,
        message: "Ausencia no encontrada",
      });
    }

    req.resolvedAbsence = { houseId: absence.employee.house_id };
    next();
  } catch (err) {
    next(err);
  }
};

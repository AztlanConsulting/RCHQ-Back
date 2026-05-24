const prisma = require("../../src/prisma");

exports.resolveEmployeeHouse = async (req, res, next) => {
    try {
        const employeeId = req.params.id || req.params.employeeId;
        const employee = await prisma.employee.findUnique({
            where: { employee_id: employeeId },
            select: { house_id: true },
        });

        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }

        const employeeHouseId = employee.house_id;

        req.resolvedEmployee = { houseId: employeeHouseId };
        next();
    } catch (error) {
        next(error);
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

        const requesterHouseId = employee.house_id;
        const requesterRole = employee.role?.name;
        const requesterPrivileges =
            employee.role?.role_privilege?.map(
                (rolePrivilege) => rolePrivilege.privilege.name,
            ) || [];

        req.resolvedRequester = { houseId: requesterHouseId };
        req.user = {
            ...req.user,
            houseId: requesterHouseId,
            role: requesterRole,
            privileges: requesterPrivileges,
        };
        next();
    } catch (error) {
        next(error);
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

        const absenceHouseId = absence.employee.house_id;

        req.resolvedAbsence = { houseId: absenceHouseId };
        next();
    } catch (error) {
        next(error);
    }
};

exports.resolveVacationRequestDatesResource = async (req, res, next) => {
    try {
        const vacationRequestId = req.params.vacationRequestId;

        const vacationRequest = await prisma.vacations_request.findUnique({
            where: { vacations_request_id: vacationRequestId },
            select: {
                employee_id: true,
                employee: {
                    select: {
                        house_id: true,
                    },
                },
            },
        });

        if (!vacationRequest) {
            return res.status(404).json({
                success: false,
                message: "Solicitud de vacaciones no encontrada",
            });
        }

        if (!vacationRequest.employee) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        req.resolvedVacationRequest = {
            employeeId: vacationRequest.employee_id,
            houseId: vacationRequest.employee.house_id,
        };

        next();
    } catch (error) {
        next(error);
    }
};

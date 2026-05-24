const prisma = require("../../prisma");
const { ROLES } = require("../../utils/roles");

exports.findEmployeeByCurp = async (curp) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { curp: curp },
            select: {
                name: true,
                surname: true,
                curp: true,
                is_active: true,
                blacklist: {
                    select: { blacklist_id: true }
                }
            },
        });

        if (!employee) return null;

        return {
            name: employee.name,
            surname: employee.surname,
            curp: employee.curp,
            isActive: employee.is_active,
            isBlacklisted: !!employee.blacklist,
        };
    } catch (error) {
        console.error("Error en findEmployeeByCurp:", error);
        return null;
    }
};

exports.getBlacklistedEmployees = async ({ page, limit, curp, isBlacklisted, role, houseId }) => {
    try {
        const skip = (page - 1) * limit;

        const whereClause = {};

        if (role === ROLES.COORDINATOR) {
            whereClause.house_id = houseId;
        }

        if (curp) {
            whereClause.curp = { contains: curp, mode: "insensitive" };
        }
        if (typeof isBlacklisted === "boolean") {
            whereClause.blacklist = isBlacklisted ? { isNot: null } : null;
        }

        const totalItems = await prisma.employee.count({ where: whereClause });

        const employees = await prisma.employee.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            select: {
                picture: true,
                name: true,
                surname: true,
                rfc: true,
                curp: true,
                nss: true,
                is_active: true,
                house: {
                    select: {
                        name: true,
                    },
                },
                role: {
                    select: {
                        name: true,
                    },
                },
                blacklist: {
                    select: { blacklist_id: true }
                }
            },
            orderBy: {
                name: "asc",
            },
        });

        const formattedEmployees = employees.map((emp) => ({
            picture: emp.picture,
            fullName: `${emp.name} ${emp.surname}`,
            rfc: emp.rfc,
            curp: emp.curp,
            houseName: emp.house.name,
            roleName: emp.role.name,
            nss: emp.nss,
            status: emp.is_active ? "Activo" : "Inactivo",
            isBlacklisted: !!emp.blacklist,
        }));

        return {
            employees: formattedEmployees,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
            },
        };
    } catch (error) {
        console.error("Error en getBlacklistedEmployees:", error);
        return null;
    }
};
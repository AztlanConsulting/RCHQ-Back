const prisma = require("../../prisma");
const { ROLES } = require("../../utils/roles");

const normalizeSearchTerm = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const matchesSearch = (employee, search) => {
    const searchTerms = String(search)
        .trim()
        .split(/\s+/)
        .map(normalizeSearchTerm)
        .filter(Boolean);

    if (searchTerms.length === 0) {
        return true;
    }

    const fullName = normalizeSearchTerm(
        `${employee.name || ""} ${employee.surname || ""}`,
    );
    const curp = normalizeSearchTerm(employee.curp || "");

    return searchTerms.every(
        (term) => fullName.includes(term) || curp.includes(term),
    );
};

exports.findEmployeeByCurp = async (curp) => {
    try {
        const employee = await prisma.employee.findFirst({
            where: { curp },
            select: {
                name: true,
                surname: true,
                curp: true,
                is_active: true,
            },
        });

        if (!employee) return null;

        const blacklistEntry = await prisma.blacklist.findUnique({ where: { curp } });

        return {
            name: employee.name,
            surname: employee.surname,
            curp: employee.curp,
            isActive: employee.is_active,
            isBlacklisted: !!blacklistEntry,
        };
    } catch (error) {
        console.error("Error en findEmployeeByCurp:", error);
        return null;
    }
};

exports.getBlacklistedEmployees = async ({
    page,
    limit,
    curp,
    search,
    isBlacklisted,
    role,
    houseId,
}) => {
    try {
        const skip = (page - 1) * limit;

        const whereClause = {};

        if (role === ROLES.COORDINATOR) {
            whereClause.house_id = houseId;
        }

        const blacklistEntries = await prisma.blacklist.findMany({
            select: { curp: true },
        });
        const blacklistedCurps = new Set(blacklistEntries.map((e) => e.curp));

        if (typeof isBlacklisted === "boolean") {
            const blacklistedCurpArray = [...blacklistedCurps];
            if (isBlacklisted) {
                whereClause.curp = { in: blacklistedCurpArray };
            } else {
                whereClause.curp = { notIn: blacklistedCurpArray };
            }
        }

        const resolvedSearch = (search ?? curp ?? "").trim();
        const employees = await prisma.employee.findMany({
            where: whereClause,
            select: {
                employee_id: true,
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
            },
            orderBy: {
                name: "asc",
            },
        });

        const filteredEmployees = resolvedSearch
            ? employees.filter((employee) => matchesSearch(employee, resolvedSearch))
            : employees;

        const totalItems = filteredEmployees.length;

        const paginatedEmployees = filteredEmployees.slice(skip, skip + limit);

        const formattedEmployees = paginatedEmployees.map((emp) => ({
            picture: emp.picture,
            fullName: `${emp.name} ${emp.surname}`,
            rfc: emp.rfc,
            curp: emp.curp,
            houseName: emp.house.name,
            roleName: emp.role.name,
            nss: emp.nss,
            status: emp.is_active ? "Activo" : "Inactivo",
            isBlacklisted: blacklistedCurps.has(emp.curp),
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

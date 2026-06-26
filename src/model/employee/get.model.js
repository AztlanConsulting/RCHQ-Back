const prisma = require("../../prisma");
const { mapEmployeeShifts } = require("../../utils/employeeShifts");
const {
    mapEmployee,
    mapEmployeeAddress,
    mapEmployeeFaults,
    mapEmployeeVacationRequests,
} = require("../../utils/mappers/employee.map");

const normalizeSearchTerm = (value) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const matchesEmployeeSearch = (employee, search) => {
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

    return searchTerms.every((term) => fullName.includes(term));
};

exports.findByCurpAndHouseId = async (curp, houseId) => {
    return await prisma.employee.findUnique({
        where: { curp_house_id: { curp, house_id: houseId } },
    });
};

exports.findById = async (employee_id) => {
    return await prisma.employee.findUnique({
        where: { employee_id },
    });
};

exports.getAllRoles = async () => {
    const roles = await prisma.role.findMany();
    return roles.map((role) => ({
        roleId: role.role_id,
        name: role.name,
    }));
};

exports.getRoleById = async (roleId) => {
    if (!roleId) return null;

    const role = await prisma.role.findUnique({
        where: { role_id: roleId },
        select: { role_id: true, name: true },
    });

    if (!role) return null;

    return {
        roleId: role.role_id,
        name: role.name,
    };
};

exports.getDocumentTypes = async () => {
    return await prisma.documents.findMany({
        orderBy: { name: "asc" },
        select: { document_id: true, name: true },
    });
};

exports.getDocumentsByEmployee = async (employeeId) => {
    return await prisma.employee_documents.findMany({
        where: { employee_id: employeeId },
        include: { documents: true },
    });
};

exports.findEmployeeDocument = async (employeeId, documentId) => {
    return await prisma.employee_documents.findUnique({
        where: {
            document_id_employee_id: {
                document_id: documentId,
                employee_id: employeeId,
            },
        },
    });
};

exports.findDocumentById = async (documentId) => {
    return await prisma.documents.findUnique({
        where: { document_id: documentId },
    });
};

exports.getEmployees = async (houseId, active, search, skip, take) => {
    const whereClause = {
        house_id: houseId,
        is_active: active,
    };

    const employees = await prisma.employee.findMany({
        where: whereClause,
        select: {
            employee_id: true,
            name: true,
            surname: true,
            picture: true,
            is_active: true,
            role: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: { name: "asc" },
    });

    const filteredEmployees = search
        ? employees.filter((employee) =>
              matchesEmployeeSearch(employee, search),
          )
        : employees;

    const total = filteredEmployees.length;
    const paginatedEmployees = filteredEmployees.slice(skip, skip + take);

    return {
        employees: paginatedEmployees.map((e) => ({
            employeeId: e.employee_id,
            name: e.name,
            surname: e.surname,
            picture: e.picture,
            isActive: e.is_active,
            roleName: e.role.name,
        })),
        total,
    };
};

exports.findEmployeeByEmail = async (email) => {
    const employee = await prisma.employee.findFirst({
        where: {
            email: {
                equals: email.trim(),
                mode: "insensitive",
            },
        },
        include: {
            role: {
                select: {
                    name: true,
                },
            },
        },
    });
    return mapEmployee(employee);
};

exports.getEmployeeById = async (employeeId) => {
    const employee = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        include: {
            role: { select: { name: true } },
            frecuency_of_payment: { select: { name: true } },
        },
    });
    return mapEmployee(employee);
};

exports.getEmployeeAddress = async (employeeId) => {
    const employeeAddress = await prisma.employee_address.findFirst({
        where: { employee_id: employeeId },
    });

    return mapEmployeeAddress(employeeAddress);
};

exports.getEmployeeFaults = async (employeeId) => {
    const employeeFaults = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        select: {
            employee_fault: {
                select: {
                    fault: {
                        select: {
                            fault_id: true,
                            date: true,
                            description: true,
                        },
                    },
                },
            },
        },
    });

    return mapEmployeeFaults(employeeFaults);
};

exports.getEmployeeShifts = async (employeeId) => {
    const employeeShifts = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        select: {
            employee_shift: {
                select: {
                    shift_id: true,
                    start: true,
                    end: true,
                    is_all_day: true,
                    start_workday_id: true,
                    end_workday_id: true,
                    start_workday: {
                        select: {
                            workday_id: true,
                            name: true,
                        },
                    },
                    end_workday: {
                        select: {
                            workday_id: true,
                            name: true,
                        },
                    },
                },
                orderBy: [
                    { start_workday_id: "asc" },
                    { start: "asc" },
                ],
            },
        },
    });

    return mapEmployeeShifts(employeeShifts);
};

/** @deprecated use getEmployeeShifts */
exports.getEmployeeWorkdays = exports.getEmployeeShifts;

exports.getEmployeeVacationRequests = async (employeeId) => {
    const employeeVacationRequests = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        select: {
            vacations_request: {
                where: {
                    status: 1,
                    start: {
                        gte: new Date(`${new Date().getFullYear()}-01-01`),
                        lt: new Date(`${new Date().getFullYear() + 1}-01-01`),
                    },
                },
                select: {
                    vacations_request_id: true,
                    start: true,
                    end: true,
                    status: true,
                    feedback: true,
                },
                orderBy: { start: "desc" },
            },
        },
    });

    return mapEmployeeVacationRequests(employeeVacationRequests);
};

exports.getEmployeeShiftsRaw = async (employeeId) => {
    return await prisma.employee_shift.findMany({
        where: {
            employee_id: employeeId,
        },
        include: {
            start_workday: true,
            end_workday: true,
        },
        orderBy: [
            { start_workday_id: "asc" },
            { start: "asc" },
        ],
    });
};

/** @deprecated use getEmployeeShiftsRaw */
exports.getWorkDays = exports.getEmployeeShiftsRaw;

exports.getHome = async (employeeId) => {
    return await prisma.employee.findUnique({
        where: {
            employee_id: employeeId,
        },
        select: {
            house_id: true,
        },
    });
};

exports.getStartDate = async (employeeId) => {
    return await prisma.employee.findUnique({
        where: {
            employee_id: employeeId,
        },
        select: {
            start_date: true,
        },
    });
};

exports.getAllWorkdays = async () => {
    const workdays = await prisma.workday.findMany({
        orderBy: { workday_id: "asc" },
    });
    return workdays.map((w) => ({ workdayId: w.workday_id, name: w.name }));
};

exports.getFrecuencyPaymentOptions = async () => {
    const options = await prisma.frecuency_of_payment.findMany({
        orderBy: { frecuency_of_payment_id: "asc" },
    });
    return options.map((o) => ({
        optionId: o.frecuency_of_payment_id,
        name: o.name,
    }));
};

exports.getAllHouses = async () => {
    const houses = await prisma.house.findMany({ orderBy: { name: "asc" } });
    return houses.map((h) => ({
        houseId: h.house_id,
        name: h.name,
        location: h.location,
    }));
};

exports.findByIdWithRoleAndHouse = async (employeeId) => {
    return await prisma.employee.findUnique({
        where: {
            employee_id: employeeId,
        },
        include: {
            role: {
                include: {
                    role_privilege: {
                        include: {
                            privilege: true,
                        },
                    },
                },
            },
            house: true,
        },
    });
};

exports.findByCurpWithRoleAndHouse = async (curp) => {
    return await prisma.employee.findFirst({
        where: { curp },
        include: {
            role: true,
            house: true,
        },
    });
};

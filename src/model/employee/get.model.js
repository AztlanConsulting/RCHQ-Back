const prisma = require("../../prisma");
const { Prisma } = require("@prisma/client");
const {
    mapEmployee,
    mapEmployeeAddress,
    mapEmployeeFaults,
    mapEmployeeWorkdays,
    mapEmployeeVacationRequests,
} = require("../../utils/mappers/employee.map");

exports.findByCurp = async (curp) => {
    return await prisma.employee.findUnique({
        where: { curp },
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
    let searchEmployee = Prisma.empty;

    if (search) {
        const terms = search.trim().split(/\s+/);
        const termConditions = terms.map(
            (term) =>
                Prisma.sql`(unaccent(e.name) ILIKE unaccent(${`%${term}%`}) OR unaccent(e.surname) ILIKE unaccent(${`%${term}%`}))`
        );
        searchEmployee = Prisma.sql`AND ${Prisma.join(termConditions, " AND ")}`;
    }

    const [employees, countResult] = await Promise.all([
        prisma.$queryRaw`
            SELECT e.employee_id, e.name, e.surname, e.picture, e.is_active, r.name AS role_name
            FROM employee e
            JOIN role r ON e.role_id = r.role_id
            WHERE e.house_id = ${houseId}::uuid
              AND e.is_active = ${active}
              ${searchEmployee}
            ORDER BY e.name ASC
            LIMIT ${take} OFFSET ${skip}
        `,
        prisma.$queryRaw`
            SELECT COUNT(*) AS total
            FROM employee e
            WHERE e.house_id = ${houseId}::uuid
              AND e.is_active = ${active}
              ${searchEmployee}
        `,
    ]);

    return {
        employees: employees.map((e) => ({
            employeeId: e.employee_id,
            name: e.name,
            surname: e.surname,
            picture: e.picture,
            isActive: e.is_active,
            roleName: e.role_name,
        })),
        total: Number(countResult[0].total),
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

exports.getEmployeeWorkdays = async (employeeId) => {
    const employeeWorkdays = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        select: {
            employee_workday: {
                select: {
                    start: true,
                    end: true,
                    workday: {
                        select: {
                            workday_id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    return mapEmployeeWorkdays(employeeWorkdays);
};

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

exports.getWorkDays = async (employeeId) => {
    return await prisma.employee_workday.findMany({
        where: {
            employee_id: employeeId,
        },
        include: {
            workday: true,
        },
    });
};

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
            role: true,
            house: true,
        },
    });
};
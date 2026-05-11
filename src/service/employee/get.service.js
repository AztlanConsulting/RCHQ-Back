const {
    findById,
    getAllRoles,
    findDocumentRowByEmployee,
    getEmployees,
    getEmployeeById,
    getEmployeeAddress,
    getEmployeeFaults,
    getEmployeeWorkdays,
    getEmployeeVacationRequests,
    getDocumentTypes,
    getDocumentsByEmployee,
    getWorkDays,
    getAllWorkdays,
    getAllHouses,
    getFrecuencyPaymentOptions,
    getEmployeesWithWorkdays,
} = require("../../model/employee/get.model");
const { getHouseById } = require("../../model/house/get.model");
const { decryptValue } = require("../../utils/password");
const RESPONSES = require("../../utils/responses");

exports.getEmployees = async (
    houseId,
    activeQuery,
    pageQuery,
    limitQuery,
    searchQuery,
) => {
    const active = activeQuery === "false" ? false : true;

    const page = Number(pageQuery) > 0 ? Number(pageQuery) : 1;
    const parsedLimit = Number(limitQuery) > 0 ? Number(limitQuery) : 6;
    const limit = Math.min(parsedLimit, 100);

    const skip = (page - 1) * limit;
    const search = searchQuery?.trim() || "";

    const { employees, total } = await getEmployees(
        houseId,
        active,
        search,
        skip,
        limit,
    );

    const totalPages = Math.ceil(total / limit);

    return {
        data: employees.map((employee) => ({
            employeeId: employee.employeeId,
            fullName: [employee.name, employee.surname]
                .filter(Boolean)
                .join(" "),
            role: employee.roleName,
            picture: employee.picture,
            status: employee.isActive,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
};

exports.getById = async (id) => {
    return await findById(id);
};

exports.getRoles = async () => {
    return await getAllRoles();
};

exports.getDocumentsByEmployee = async (employeeId) => {
    const employee = await findById(employeeId);

    if (!employee) {
        return { type: RESPONSES.USER.NOT_FOUND, body: null };
    }

    const docRow = await findDocumentRowByEmployee(employeeId);

    if (!docRow) {
        return { type: RESPONSES.DOCUMENTS.NOT_FOUND, body: null };
    }

    return { type: RESPONSES.DOCUMENTS.OK, body: docRow };
};

exports.getEmployeeDetail = async (userID, employeeId) => {
    if (!userID || !employeeId) {
        return {
            code: RESPONSES.EMPLOYEE.BAD_REQUEST,
        };
    }

    const employeeBasicInfo = await getEmployeeById(employeeId);

    if (!employeeBasicInfo) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const decryptedSalary = parseInt(decryptValue(employeeBasicInfo.salary));
    if (decryptedSalary) {
        employeeBasicInfo.salary = decryptedSalary;
    }

    const employeeAddress = await getEmployeeAddress(employeeId);
    const employeeHouse = await getHouseById(employeeBasicInfo.houseId);

    const employeeFaults = await getEmployeeFaults(employeeId);
    const employeeWorkdays = await getEmployeeWorkdays(employeeId);
    const employeeVacationRequests =
        await getEmployeeVacationRequests(employeeId);

    return {
        code: RESPONSES.EMPLOYEE.FOUND,
        data: {
            employee: {
                basicInfo: {
                    employee: employeeBasicInfo,
                    address: employeeAddress,
                    house: employeeHouse,
                },
                adminInfo: {
                    faults: employeeFaults,
                    workdays: employeeWorkdays,
                    vacationRequests: employeeVacationRequests,
                },
            },
        },
    };
};

exports.getDocumentTypes = async () => {
    try {
        const documentTypes = await getDocumentTypes();
        return documentTypes;
    } catch (error) {
        console.error("Error fetching document types:", error);
        return { success: false, message: "Error fetching document types" };
    }
};

exports.getDocumentsByEmployee = async (employeeId) => {
    const employee = await findById(employeeId);
    if (!employee) {
        return { type: RESPONSES.USER.NOT_FOUND, body: null };
    }

    const documents = await getDocumentsByEmployee(employeeId);
    if (!documents || documents.length === 0) {
        return { type: RESPONSES.DOCUMENTS.NOT_FOUND, body: [] };
    }

    const mapped = documents.map((d) => ({
        documentId: d.document_id,
        name: d.documents.name,
        url: d.url,
    }));
    return { type: RESPONSES.DOCUMENTS.OK, body: mapped };
};

exports.getWorkDays = async (employeeId) => {
    const rawWorkDays = await getWorkDays(employeeId);

    const workDays = [];
    rawWorkDays.forEach((day) => {
        workDays.push(day.workday.name);
    });
    return workDays;
}

exports.getUpdateFormData = async (houseId, excludeEmployeeId = null) => {
    const [roles, houses, workdays, frecuencyOptions, rawEmployees] = await Promise.all([
        getAllRoles(),
        getAllHouses(),
        getAllWorkdays(),
        getFrecuencyPaymentOptions(),
        getEmployeesWithWorkdays(houseId),
    ]);
 
    // ✅ Función segura para extraer la hora en formato "HH:mm"
    const formatTime = (timeData) => {
        if (!timeData) return "";
        
        // Si Prisma devuelve un objeto Date nativo
        if (timeData instanceof Date) {
            return timeData.toISOString().substring(11, 16);
        }
        
        // Si por alguna razón devuelve un String (ej. "1970-01-01T08:00:00.000Z" o "08:00:00")
        const timeStr = String(timeData);
        if (timeStr.includes("T")) {
            return timeStr.split("T")[1].substring(0, 5);
        }
        
        return timeStr.substring(0, 5);
    };

    const employees = rawEmployees
        .filter((e) => e.employee_id !== excludeEmployeeId)
        .map((e) => ({
            employeeId: e.employee_id,
            name: e.name,
            surname: e.surname,
            workdays: e.employee_workday.map((w) => ({
                workdayId: w.workday_id,
                name: w.workday.name,
                start: formatTime(w.start), 
                end: formatTime(w.end),    
            })),
        }));
 
    return { roles, houses, workdays, frecuencyOptions, houseId, employees };
};

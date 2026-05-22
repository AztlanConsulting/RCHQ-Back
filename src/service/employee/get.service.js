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
} = require("../../model/employee/get.model");
const { getEmployeeAbsenceRecords } = require("../../model/absence/get.model");
const { getHouseById } = require("../../model/house/get.model");
const { calculateUsedDays } = require("../../utils/dates");
const {
    getAbsenceCalculationContext,
    toUtcDate,
} = require("../../utils/absenceUsedDays");
const { decryptValue } = require("../../utils/password");
const RESPONSES = require("../../utils/responses");
const { ROLES } = require("../../utils/roles");

const calculateAbsenceUsedDaysTotal = async (employeeId, houseId) => {
    const [workDays, absences] = await Promise.all([
        getWorkDays(employeeId),
        getEmployeeAbsenceRecords(employeeId),
    ]);

    if (workDays.length === 0 || absences.length === 0 || !houseId) {
        return 0;
    }

    let totalUsedDays = 0;

    for (const absence of absences) {
        const startDate = toUtcDate(absence.start);
        const endDate = toUtcDate(absence.end);
        const { freeDays, overlappingVacations } =
            await getAbsenceCalculationContext({
                employeeId,
                houseId,
                startDate,
                endDate,
            });

        totalUsedDays += calculateUsedDays(
            workDays,
            startDate,
            endDate,
            [
                ...freeDays,
                ...overlappingVacations.map((vacation) => ({
                    isFreeDay: true,
                    start: toUtcDate(vacation.start),
                    end: toUtcDate(vacation.end),
                })),
            ],
        );
    }

    return totalUsedDays;
};

exports.getEmployees = async (
    houseId,
    activeQuery,
    pageQuery,
    limitQuery,
    searchQuery,
) => {
    const active = activeQuery === "false" ? false : true;

    const page = Number(pageQuery) > 0 ? Number(pageQuery) : 1;
    const parsedLimit = Number(limitQuery) > 0 ? Number(limitQuery) : 7;
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
    const roles = await getAllRoles();
    return roles.filter((role) => role.name !== ROLES.ADMIN);
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
    const employeeAbsenceUsedDays = await calculateAbsenceUsedDaysTotal(
        employeeId,
        employeeBasicInfo.houseId,
    );

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
                    absenceUsedDays: employeeAbsenceUsedDays,
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
};

exports.getUpdateFormData = async (user) => {
    const [roles, houses, workdays, frecuencyOptions] = await Promise.all([
        getAllRoles(),
        getAllHouses(),
        getAllWorkdays(),
        getFrecuencyPaymentOptions(),
    ]);
    return { roles, houses, workdays, frecuencyOptions, houseId: user.houseId };
};

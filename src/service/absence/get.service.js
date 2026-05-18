const { getAllAbsenceTypes } = require("../../model/absence/get.model");
const {
    getHouseEmployeesByEmployeeId,
} = require("../../model/house/get.model");
const {
    mapAbsenceType,
    mapHouseEmployeeForAbsence,
} = require("../../utils/mappers/absence.map");
const RESPONSES = require("../../utils/responses");

exports.getAbsenceTypes = async () => {
    const absenceTypes = await getAllAbsenceTypes();

    if (absenceTypes.length === 0) {
        return {
            code: RESPONSES.EVENTS.NOT_FOUND,
        };
    }

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            absenceTypes: absenceTypes.map((absenceType) => ({
                absenceTypeId: absenceType.absence_type_id,
                name: absenceType.name,
            })),
        },
    };
};

exports.getEmployeesAndAbsenceTypes = async (employeeId) => {
    if (!employeeId) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const employees = await getHouseEmployeesByEmployeeId(employeeId);

    if (employees === null) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    if (employees.length === 0) {
        return {
            code: RESPONSES.ABSENCE.EMPLOYEES_NOT_FOUND,
        };
    }

    const absenceTypes = await getAllAbsenceTypes();

    if (absenceTypes.length === 0) {
        return {
            code: RESPONSES.ABSENCE.TYPES_NOT_FOUND,
        };
    }

    return {
        code: RESPONSES.ABSENCE.ADD_FORM_FOUND,
        data: {
            employees: employees.map(mapHouseEmployeeForAbsence),
            absenceTypes: absenceTypes.map(mapAbsenceType),
        },
    };
};

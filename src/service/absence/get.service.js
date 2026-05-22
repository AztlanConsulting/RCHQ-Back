const { getAllAbsenceTypes } = require("../../model/absence/get.model");
const {
    findByIdWithRoleAndHouse,
} = require("../../model/employee/get.model");
const {
    getEligibleVacationEmployees,
} = require("../../model/vacation/get.model");
const {
    mapAbsenceType,
    mapEligibleEmployeeForAbsence,
} = require("../../utils/mappers/absence.map");
const RESPONSES = require("../../utils/responses");
const { ROLES } = require("../../utils/roles");

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

    const actorEmployee = await findByIdWithRoleAndHouse(employeeId);

    if (!actorEmployee) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const actorRoleName = actorEmployee.role?.name;
    const employeeWhere = {
        is_active: true,
        ...(actorRoleName === ROLES.COORDINATOR
            ? {
                house_id: actorEmployee.house_id,
                role: {
                    name: {
                        not: ROLES.ADMIN,
                    },
                },
            }
            : {}),
    };

    const employees = await getEligibleVacationEmployees(employeeWhere);

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
            employees: employees.map(mapEligibleEmployeeForAbsence),
            absenceTypes: absenceTypes.map(mapAbsenceType),
        },
    };
};

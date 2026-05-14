const { findByIdWithRoleAndHouse } = require("../../model/employee/get.model");
const { getAbsenceById } = require("../../model/absence/get.model");
const { softDeleteAbsenceById } = require("../../model/absence/delete.model");
const { absenceDeleteInputSchema } = require("../../schemas/absence/delete.schemas");
const { mapAbsenceDetail } = require("../../utils/mappers/absence.map");
const RESPONSES = require("../../utils/responses");

exports.deleteAbsence = async ({ actorEmployeeId, absenceId }) => {
    const validation = absenceDeleteInputSchema.safeParse({
        actorEmployeeId,
        absenceId,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.ABSENCE.VALIDATION_ERROR,
            errors: validation.error.issues.map((issue) => ({
                campo: issue.path.join("."),
                mensaje: issue.message,
            })),
        };
    }

    const actorEmployee = await findByIdWithRoleAndHouse(actorEmployeeId);

    if (!actorEmployee) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const actorRoleName = actorEmployee.role?.name;

    if (!["Admin", "Coordinador"].includes(actorRoleName)) {
        return {
            code: RESPONSES.ABSENCE.INSUFFICIENT_PERMISSIONS,
        };
    }

    const currentAbsence = await getAbsenceById(absenceId);

    if (!currentAbsence || currentAbsence.is_deleted) {
        return {
            code: RESPONSES.ABSENCE.NOT_FOUND,
        };
    }

    if (
        actorRoleName === "Coordinador" &&
        currentAbsence.employee.house_id !== actorEmployee.house_id
    ) {
        return {
            code: RESPONSES.ABSENCE.OUT_OF_SCOPE,
        };
    }

    const deletedAbsence = await softDeleteAbsenceById(absenceId);

    return {
        code: RESPONSES.ABSENCE.DELETED,
        data: {
            absence: mapAbsenceDetail(deletedAbsence),
        },
    };
};

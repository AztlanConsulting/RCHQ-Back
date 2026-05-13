const { findByIdWithRoleAndHouse } = require("../../model/employee/get.model");
const {
    getAbsenceById,
    getAbsenceTypeById,
} = require("../../model/absence/get.model");
const {
    updateAbsenceById,
} = require("../../model/absence/update.model");
const {
    absenceUpdateInputSchema,
} = require("../../schemas/absence/update.schemas");
const { mapAbsenceDetail } = require("../../utils/mappers/absence.map");
const RESPONSES = require("../../utils/responses");
const { stringToDate } = require("../../utils/dates");

exports.updateAbsence = async ({
    actorEmployeeId,
    absenceId,
    body,
}) => {
    const validation = absenceUpdateInputSchema.safeParse({
        actorEmployeeId,
        absenceId,
        body,
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

    if (!currentAbsence) {
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

    if (validation.data.body.absenceTypeId) {
        const absenceType = await getAbsenceTypeById(validation.data.body.absenceTypeId);

        if (!absenceType) {
            return {
                code: RESPONSES.ABSENCE.INVALID_TYPE,
            };
        }
    }

    const nextStartDate = validation.data.body.startDate
        ? stringToDate(validation.data.body.startDate)
        : currentAbsence.start;
    const nextEndDate = validation.data.body.endDate
        ? stringToDate(validation.data.body.endDate)
        : currentAbsence.end;

    if (nextEndDate < nextStartDate) {
        return {
            code: RESPONSES.DATES.BAD_DATES,
        };
    }

    const updateData = {};

    if (validation.data.body.absenceTypeId !== undefined) {
        updateData.absence_type_id = validation.data.body.absenceTypeId;
    }

    if (validation.data.body.description !== undefined) {
        updateData.description = validation.data.body.description;
    }

    if (validation.data.body.startDate !== undefined) {
        updateData.start = nextStartDate;
    }

    if (validation.data.body.endDate !== undefined) {
        updateData.end = nextEndDate;
    }

    const updatedAbsence = await updateAbsenceById(absenceId, updateData);

    return {
        code: RESPONSES.ABSENCE.UPDATED,
        data: {
            absence: mapAbsenceDetail(updatedAbsence),
        },
    };
};

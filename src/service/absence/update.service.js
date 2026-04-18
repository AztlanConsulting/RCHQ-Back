const { findByIdWithRoleAndHouse, getWorkDays } = require("../../model/employee/get.model");
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
const { 
    getGlobalEventsInRange, 
    getHouseEventsInRange,
} = require("../../model/event/get.model");
const { 
    calculateUsedDays,
    stringToDate,
    convertUTCToMexicanTime,
} = require("../../utils/dates");
const { mapAbsenceDetail } = require("../../utils/mappers/absence.map");
const RESPONSES = require("../../utils/responses");
const { deleteFileIfExists } = require("../../utils/deleteFile");

exports.updateAbsence = async ({
    actorEmployeeId,
    requesterHouseId,
    absenceId,
    body,
    file,
}) => {
    const validation = absenceUpdateInputSchema.safeParse({
        actorEmployeeId,
        absenceId,
        body,
    });

    if (!validation.success) {
        deleteFileIfExists(file?.path);
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
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const actorRoleName = actorEmployee.role?.name;

    if (!["Administrador", "Coordinador"].includes(actorRoleName)) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.ABSENCE.INSUFFICIENT_PERMISSIONS,
        };
    }

    const currentAbsence = await getAbsenceById(absenceId);

    if (!currentAbsence) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.ABSENCE.NOT_FOUND,
        };
    }

    if (
        actorRoleName === "Coordinador" &&
        currentAbsence.employee.house_id !== actorEmployee.house_id
    ) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.ABSENCE.OUT_OF_SCOPE,
        };
    }

    if (validation.data.body.absenceTypeId) {
        const absenceType = await getAbsenceTypeById(validation.data.body.absenceTypeId);

        if (!absenceType) {
            deleteFileIfExists(file?.path);
            return {
                code: RESPONSES.ABSENCE.INVALID_TYPE,
            };
        }
    }

    const workDays = await getWorkDays(currentAbsence.employee_id);
    if (workDays.length == 0) {
        return {
            code: RESPONSES.VACATION.WITHOUT_DATES
        }
    }

    const nextStartDate = validation.data.body.startDate
        ? stringToDate(validation.data.body.startDate)
        : currentAbsence.start;
    const nextEndDate = validation.data.body.endDate
        ? stringToDate(validation.data.body.endDate)
        : currentAbsence.end;

    if (nextEndDate < nextStartDate) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.DATES.BAD_DATES,
        };
    }

    const searchEndDate = new Date(nextEndDate);
    searchEndDate.setUTCDate(searchEndDate.getUTCDate() + 1);

    const globalEvents = await getGlobalEventsInRange(nextStartDate, searchEndDate);
    const houseEvents = await getHouseEventsInRange(requesterHouseId, nextStartDate, searchEndDate);

    const freeDays = [...houseEvents, ...globalEvents]
        .filter((event) => event.isFreeDay === true)
        .map((event) => ({
            ...event,
            start: convertUTCToMexicanTime(event.start),
            end: convertUTCToMexicanTime(event.end),
        }));

    const usedDays = calculateUsedDays(workDays, nextStartDate, nextEndDate, freeDays, true);

    if (usedDays == 0) {
        return {
            code: RESPONSES.VACATION.NULL_DATES
        }
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

    const fileUrl = file ? `uploads/documents/${file.filename}` : undefined;

    if (fileUrl !== undefined) {
        updateData.url = fileUrl;
    }

    try {
        const updatedAbsence = await updateAbsenceById(absenceId, updateData);

        if (fileUrl && currentAbsence.url) {
            deleteFileIfExists(currentAbsence.url);
        }

        return {
            code: RESPONSES.ABSENCE.UPDATED,
            data: {
                absence: mapAbsenceDetail(updatedAbsence),
            },
        };
    } catch (error) {
        deleteFileIfExists(fileUrl);
        throw error;
    }
};

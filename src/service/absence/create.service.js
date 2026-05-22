const { findById, getWorkDays } = require("../../model/employee/get.model");
const {
    getAbsenceTypeById,
    getHouseAbsencesInRange,
} = require("../../model/absence/get.model");
const {
    createAbsence: createAbsenceModel,
} = require("../../model/absence/create.model");
const { 
    calculateUsedDays,
    stringToDate,
} = require("../../utils/dates");
const {
    getAbsenceCalculationContext,
} = require("../../utils/absenceUsedDays");
const { absenceAddSchema } = require("../../schemas/absence/absenceAddSchema");
const { mapAbsenceDetail } = require("../../utils/mappers/absence.map");
const { deleteFileIfExists } = require("../../utils/deleteFile");
const RESPONSES = require("../../utils/responses");

const MAX_ABSENCES_PER_DATE = 10;

const hasAbsenceLimitReached = (absences, startDate, endDate) => {
    const absenceCountsByDate = new Map();
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        absenceCountsByDate.set(currentDate.toISOString().split("T")[0], 0);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    absences.forEach((absence) => {
        const overlapStart =
            absence.start > startDate ? absence.start : startDate;
        const overlapEnd = absence.end < endDate ? absence.end : endDate;
        const currentAbsenceDate = new Date(overlapStart);

        while (currentAbsenceDate <= overlapEnd) {
            const dateKey = currentAbsenceDate.toISOString().split("T")[0];
            absenceCountsByDate.set(
                dateKey,
                (absenceCountsByDate.get(dateKey) || 0) + 1,
            );
            currentAbsenceDate.setUTCDate(currentAbsenceDate.getUTCDate() + 1);
        }
    });

    return Array.from(absenceCountsByDate.values()).some(
        (absenceCount) => absenceCount >= MAX_ABSENCES_PER_DATE,
    );
};

exports.addAbsence = async ({
    actorEmployeeId,
    requesterHouseId,
    targetEmployeeId,
    body,
    file,
}) => {
    const absenceValidation = absenceAddSchema.safeParse({
        actorEmployeeId,
        targetEmployeeId,
        body,
        file,
    });

    if (!absenceValidation.success) {
        deleteFileIfExists(file?.path);
        const errors = absenceValidation.error.issues.map((issue) => ({
            campo: issue.path.join("."),
            mensaje: issue.message,
        }));

        return {
            code: RESPONSES.ABSENCE.VALIDATION_ERROR,
            message: errors[0]?.mensaje,
            errors,
        };
    }

    const absence = absenceValidation.data;
    const actorEmployee = await findById(absence.actorEmployeeId);

    if (!actorEmployee || actorEmployee.is_active === false) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const targetEmployee = await findById(absence.targetEmployeeId);

    if (!targetEmployee || targetEmployee.is_active === false) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const absenceType = await getAbsenceTypeById(absence.body.absenceTypeId);

    if (!absenceType) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.ABSENCE.INVALID_TYPE,
        };
    }

    const workDays = await getWorkDays(absence.targetEmployeeId);
    if (workDays.length == 0) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.ABSENCE.WITHOUT_DATES
        }
    }

    const startDate = stringToDate(absence.body.startDate);
    const endDate = stringToDate(absence.body.endDate);
    const {
        searchEndDate,
        freeDays,
        overlappingVacations,
    } = await getAbsenceCalculationContext({
        employeeId: absence.targetEmployeeId,
        houseId: requesterHouseId,
        startDate,
        endDate,
    });

    if (overlappingVacations.length > 0) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.VACATION.ALREADY_REQUEST,
        };
    }

    const registeredAbsences = await getHouseAbsencesInRange(
        targetEmployee.house_id,
        startDate,
        searchEndDate,
    );

    if (hasAbsenceLimitReached(registeredAbsences, startDate, endDate)) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.ABSENCE.LIMIT_REACHED,
        };
    }

    const usedDays = calculateUsedDays(workDays, startDate, endDate, freeDays, true);

    if (usedDays == 0) {
        deleteFileIfExists(file?.path);
        return {
            code: RESPONSES.ABSENCE.NULL_DATES
        }
    }

    const evidenceUrl = file ? `uploads/documents/${file.filename}` : null;

    try {
        const createdAbsence = await createAbsenceModel({
            employeeId: absence.targetEmployeeId,
            absenceTypeId: absence.body.absenceTypeId,
            start: startDate,
            end: endDate,
            description: absence.body.description,
            url: evidenceUrl,
            isDeleted: false,
        });

        return {
            code: RESPONSES.ABSENCE.CREATED,
            data: {
                absence: mapAbsenceDetail(createdAbsence),
            },
        };
    } catch (error) {
        deleteFileIfExists(evidenceUrl);
        throw error;
    }
};

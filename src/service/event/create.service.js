const {
    createHouseEvent,
    createPersonalEvent,
} = require("../../model/event/create.model");
const { randomUUID } = require("crypto");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const {
    houseEventCreateSchema,
    createPersonalEventSchema,
} = require("../../schemas/event/create.schemas");
const {
    findOverlappingHouseEvents,
    findOverlappingEmployees,
    getEmployeesInHouse,
    getEventTypeById,
} = require("../../model/event/get.model");
const {
    addOneDay,
    resolveEmployeeIds,
    resolveSchedule,
    getOverlapError,
} = require("../../utils/event/helpers");

const isMidnightEnd = (value) => String(value ?? "").slice(0, 5) === "00:00";

const validateAvailability = async (data) => {
    return await findOverlappingHouseEvents({
        houseId: data.houseId,
        start: data.start,
        end: data.end,
    });
};

exports.createHouseEvent = async (user, payload, clientIp) => {
    const parsed = houseEventCreateSchema.safeParse({ ...payload, houseId: user.houseId });

    if (!parsed.success) {
        return {
            code: RESPONSES.EVENTS.VALIDATION_ERROR,
            data: {
                errors: parsed.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            },
        };
    }

    const validData = parsed.data;

    const collisions = await validateAvailability({
        houseId: validData.houseId,
        start: validData.start,
        end: validData.end,
    });

    if (collisions.length > 0 && !validData.forceOverlap) {
        return {
            code: RESPONSES.EVENTS.OVERLAP,
            data: { collisions },
        };
    }

    const houseEvent = await createHouseEvent({
        houseId: validData.houseId,
        eventTypeId: validData.eventTypeId,
        name: validData.name,
        start: validData.start,
        end: validData.end,
        allDay: validData.allDay,
        isFreeDay: validData.isFreeDay,
        description: validData.description ?? null,
    });

    let warning = null;

    try {
        await createLog(
            user.id,
            LOG_ACTIONS.HOUSE_EVENT_CREATED,
            clientIp,
            houseEvent.houseEventId,
        );
        await createLog(
            user.id,
            LOG_ACTIONS.HOUSE_EVENT_ASSIGNED,
            clientIp,
            validData.houseId,
        );
    } catch (error) {
        console.error("Error creando log de evento:", error);
        warning = "Evento creado pero el log falló";
    }

    return {
        code: RESPONSES.EVENTS.CREATED,
        data: { houseEvent, warning },
    };
};

exports.createPersonalEvent = async (user, payload, clientIp) => {
    const parsed = createPersonalEventSchema.safeParse(payload);

    if (!parsed.success) {
        return {
            code: RESPONSES.EVENTS.VALIDATION_ERROR,
            data: { errors: parsed.error.flatten() },
        };
    }

    const {
        name,
        eventTypeId,
        date,
        description,
        allDay,
        start: startInput,
        end: endInput,
        employeeIds: employeeIdsInput,
        forceOverlap = false,
        trainer = null,
    } = parsed.data;

    const eventType = await getEventTypeById(eventTypeId);
    if (!eventType) {
        return { code: RESPONSES.EVENTS.NOT_FOUND };
    }

    const isTraining = eventType.name.toLowerCase() === "capacitaciones";
    if (isTraining && !trainer?.trim()) {
        return {
            code: RESPONSES.EVENTS.VALIDATION_ERROR,
            data: {
                errors: {
                    fieldErrors: {
                        trainer: ["El nombre del capacitador es obligatorio para capacitaciones."],
                    },
                },
            },
        };
    }

    const employeeIdsResult = resolveEmployeeIds(
        user,
        employeeIdsInput,
        forceOverlap,
    );
    if (employeeIdsResult.code) {
        return employeeIdsResult;
    }

    const { employeeIds } = employeeIdsResult;

    const foundEmployees = await getEmployeesInHouse(employeeIds, user.houseId);
    if (foundEmployees.length !== employeeIds.length) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const { start, end } = resolveSchedule(allDay, startInput, endInput);
    const endDate =
        allDay === true || isMidnightEnd(endInput) ? addOneDay(date) : date;

    const overlappedEmployees = await findOverlappingEmployees({
        employeeIds,
        date,
        start,
        end,
        endDate,
    });

    const overlapError = getOverlapError(
        user,
        overlappedEmployees,
        forceOverlap,
    );
    if (overlapError) {
        return overlapError;
    }

    const personalEventId = randomUUID();

    const personalEvent = await createPersonalEvent({
        personalEventId,
        eventTypeId,
        date,
        start,
        end,
        endDate,
        name,
        description,
        allDay,
        employeeIds,
        trainer: isTraining ? trainer : null,
    });

    let warning = null;

    try {
        await createLog(
            user.id,
            LOG_ACTIONS.PERSONAL_EVENT_CREATED,
            clientIp,
            personalEvent.personalEventId,
        );
        await Promise.all(
            employeeIds.map((employeeId) =>
                createLog(
                    user.id,
                    LOG_ACTIONS.PERSONAL_EVENT_ASSIGNED,
                    clientIp,
                    employeeId,
                ),
            ),
        );
    } catch (error) {
        console.error("Error creando logs de evento personal:", error);
        warning = "Evento creado pero los logs fallaron";
    }

    return {
        code: RESPONSES.EVENTS.CREATED,
        data: {
            personalEvent: {
                ...personalEvent,
                forcedOverlap: overlappedEmployees.length > 0,
            },
            warning,
        },
    };
};

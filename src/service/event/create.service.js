const createModel = require("../../model/event/create.model");
const { randomUUID } = require("crypto");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const {
    houseEventCreateSchema,
    createPersonalEventSchema,
} = require("../../schemas/event/create.schemas");
const getPersonalEventModel = require("../../model/event/get.model");
const { ROLES } = require("../../utils/roles");

const ALL_DAY_START = "00:00:00";
const ALL_DAY_END = "23:59:00";

const validateAvailability = async (data) => {
    return await createModel.findOverlappingHouseEvents({
        houseId: data.houseId,
        start: data.start,
        end: data.end,
    });
};

exports.createHouseEvent = async (data, user, req) => {
    const parsed = houseEventCreateSchema.safeParse(data);

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

    const houseEvent = await createModel.createHouseEvent({
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
        const ip = getClientIp(req);
        await createLog(
            user.id,
            LOG_ACTIONS.HOUSE_EVENT_CREATED,
            ip,
            houseEvent.houseEventId,
        );
        await createLog(
            user.id,
            LOG_ACTIONS.HOUSE_EVENT_ASSIGNED,
            ip,
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

const resolveEmployeeIds = (user, employeeIdsInput, forceOverlap) => {
    if (user.role === ROLES.COORDINATOR) {
        if (!Array.isArray(employeeIdsInput) || employeeIdsInput.length === 0) {
            return {
                code: RESPONSES.EMPLOYEE.NOT_PROVIDED,
            };
        }
        return { employeeIds: [...new Set(employeeIdsInput)] };
    }

    if (forceOverlap === true) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    return { employeeIds: [user.id] };
};

const resolveSchedule = (allDay, startInput, endInput) => {
    if (allDay === true) {
        return { start: ALL_DAY_START, end: ALL_DAY_END };
    }

    const normalizedStart =
        startInput && startInput.length === 5
            ? `${startInput}:00`
            : (startInput ?? ALL_DAY_START);
    const normalizedEnd =
        endInput && endInput.length === 5
            ? `${endInput}:00`
            : (endInput ?? ALL_DAY_END);

    return { start: normalizedStart, end: normalizedEnd };
};

const getOverlapError = (user, overlappedEmployees, forceOverlap) => {
    if (overlappedEmployees.length === 0) {
        return null;
    }

    if (user.role !== ROLES.COORDINATOR || forceOverlap !== true) {
        return {
            code: RESPONSES.EVENTS.OVERLAP,
            data: { overlappedEmployees },
        };
    }

    return null;
};

exports.createPersonalEvent = async (user, payload, req) => {
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
    } = parsed.data;

    const employeeIdsResult = resolveEmployeeIds(
        user,
        employeeIdsInput,
        forceOverlap,
    );
    if (employeeIdsResult.code) {
        return employeeIdsResult;
    }

    const { employeeIds } = employeeIdsResult;

    const foundEmployees = await getPersonalEventModel.getEmployeesInHouse(
        employeeIds,
        user.houseId,
    );
    if (foundEmployees.length !== employeeIds.length) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const { start, end } = resolveSchedule(allDay, startInput, endInput);

    const overlappedEmployees =
        await getPersonalEventModel.findOverlappingEmployees({
            employeeIds,
            date,
            start,
            end,
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

    const personalEvent = await createModel.createPersonalEvent({
        personalEventId,
        eventTypeId,
        date,
        start,
        end,
        name,
        description,
        allDay,
        employeeIds,
    });

    let warning = null;

    try {
        const ip = getClientIp(req);
        await createLog(
            user.id,
            LOG_ACTIONS.PERSONAL_EVENT_CREATED,
            ip,
            personalEvent.personalEventId,
        );
        await Promise.all(
            employeeIds.map((employeeId) =>
                createLog(
                    user.id,
                    LOG_ACTIONS.PERSONAL_EVENT_ASSIGNED,
                    ip,
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

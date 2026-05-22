const {
    findHouseEventByIdAndHouseId,
    findOverlappingHouseEvents,
    findPersonalEventById,
    getEmployeesInHouse,
    findOverlappingEmployees,
} = require("../../model/event/get.model");
const {
    updateHouseEvent,
    updatePersonalEvent: updatePersonalEventModel,
} = require("../../model/event/update.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const {
    houseEventUpdateSchema,
    updatePersonalEventSchema,
} = require("../../schemas/event/update.schemas");
const { ROLES } = require("../../utils/roles");

const ALL_DAY_START = "00:00:00";
const ALL_DAY_END = "00:00:00";

const addOneDay = (date) => {
    const nextDate = new Date(`${date}T00:00:00.000Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    return nextDate.toISOString().slice(0, 10);
};

const resolveEmployeeIds = (user, employeeIdsInput, forceOverlap) => {
    if (user.role === ROLES.COORDINATOR) {
        if (!Array.isArray(employeeIdsInput) || employeeIdsInput.length === 0) {
            return { code: RESPONSES.EMPLOYEE.NOT_PROVIDED };
        }
        return { employeeIds: [...new Set(employeeIdsInput)] };
    }
    if (forceOverlap === true) {
        return { code: RESPONSES.USER.NOT_ACCESS };
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
    if (overlappedEmployees.length === 0) return null;
    if (user.role !== ROLES.COORDINATOR || forceOverlap !== true) {
        return {
            code: RESPONSES.EVENTS.OVERLAP,
            data: { overlappedEmployees },
        };
    }
    return null;
};

exports.updateHouseEvent = async (eventId, user, payload, clientIp) => {
    const parsed = houseEventUpdateSchema.safeParse(payload);

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

    const existingEvent = await findHouseEventByIdAndHouseId(
        eventId,
        user.houseId,
    );

    if (!existingEvent) {
        return { code: RESPONSES.EVENTS.NOT_FOUND };
    }

    const collisions = await findOverlappingHouseEvents({
        houseId: user.houseId,
        start: validData.start,
        end: validData.end,
        excludeEventId: eventId,
    });

    if (collisions.length > 0 && !validData.forceOverlap) {
        return {
            code: RESPONSES.EVENTS.OVERLAP,
            data: { collisions },
        };
    }

    const houseEvent = await updateHouseEvent(eventId, {
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
            LOG_ACTIONS.HOUSE_EVENT_UPDATED,
            clientIp,
            eventId,
        );
    } catch (error) {
        console.error("Error creando log de actualización de evento:", error);
        warning = "Evento actualizado pero el log falló";
    }

    return {
        code: RESPONSES.EVENTS.UPDATED,
        data: { houseEvent, warning },
    };
};

exports.updatePersonalEvent = async (eventId, user, payload, clientIp) => {
    const parsed = updatePersonalEventSchema.safeParse(payload);

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

    const existingEvent = await findPersonalEventById(eventId, user.houseId);
    if (!existingEvent) {
        return { code: RESPONSES.EVENTS.NOT_FOUND };
    }

    if (user.role !== ROLES.COORDINATOR) {
        const isAssigned = existingEvent.employee_personal_event.some(
            (ep) => ep.employee_id === user.id,
        );
        if (!isAssigned) {
            return { code: RESPONSES.USER.NOT_ACCESS };
        }
    }

    const foundEmployees = await getEmployeesInHouse(employeeIds, user.houseId);
    if (foundEmployees.length !== employeeIds.length) {
        return { code: RESPONSES.EMPLOYEE.NOT_FOUND };
    }

    const { start, end } = resolveSchedule(allDay, startInput, endInput);
    const endDate = allDay === true ? addOneDay(date) : date;

    const overlappedEmployees = await findOverlappingEmployees({
        employeeIds,
        date,
        start,
        end,
        endDate,
        excludeEventId: eventId,
    });

    const overlapError = getOverlapError(user, overlappedEmployees, forceOverlap);
    if (overlapError) {
        return overlapError;
    }

    const oldEmployeeIds = existingEvent.employee_personal_event.map(
        (ep) => ep.employee_id,
    );

    const personalEvent = await updatePersonalEventModel(eventId, {
        eventTypeId,
        name,
        date,
        start,
        end,
        endDate,
        allDay,
        description,
        employeeIds,
    });

    const changedEmployeeIds = [
        ...oldEmployeeIds.filter((id) => !employeeIds.includes(id)),
        ...employeeIds.filter((id) => !oldEmployeeIds.includes(id)),
    ];

    let warning = null;

    try {
        await createLog(
            user.id,
            LOG_ACTIONS.PERSONAL_EVENT_UPDATED,
            clientIp,
            eventId,
        );
        if (changedEmployeeIds.length > 0) {
            await Promise.all(
                changedEmployeeIds.map((employeeId) =>
                    createLog(
                        user.id,
                        LOG_ACTIONS.PERSONAL_EVENT_EMPLOYEE_UPDATED,
                        clientIp,
                        employeeId,
                    ),
                ),
            );
        }
    } catch (error) {
        console.error(
            "Error creando logs de actualización de evento personal:",
            error,
        );
        warning = "Evento actualizado pero los logs fallaron";
    }

    return {
        code: RESPONSES.EVENTS.UPDATED,
        data: {
            personalEvent: {
                ...personalEvent,
                forcedOverlap: overlappedEmployees.length > 0,
            },
            warning,
        },
    };
};

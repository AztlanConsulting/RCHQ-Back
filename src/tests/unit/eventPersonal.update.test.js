const { updatePersonalEvent } = require("../../service/event/update.service");
const updateModel = require("../../model/event/update.model");
const getModel = require("../../model/event/get.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");

jest.mock("../../model/event/update.model");
jest.mock("../../model/event/get.model");
jest.mock("../../model/log.model");

const { futureDate } = require("../helpers/dateHelpers");

describe("updatePersonalEvent service", () => {
    const eventId = "11111111-1111-4111-8111-111111111111";
    const employeeId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const coordinatorId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const houseId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const eventTypeId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const otherEmployeeId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    const clientIp = "127.0.0.1";

    const employeeUser = {
        id: employeeId,
        role: "Mantenimiento",
        houseId,
    };

    const coordinatorUser = {
        id: coordinatorId,
        role: "Coordinador",
        houseId,
    };

    const basePayload = {
        name: "Reunion medica",
        eventTypeId,
        date: futureDate(30),
        allDay: false,
        start: "09:00",
        end: "10:00",
    };

    const mockExistingEvent = {
        personal_event_id: eventId,
        employee_personal_event: [{ employee_id: employeeId }],
    };

    const mockUpdatedEvent = {
        personalEventId: eventId,
        eventTypeId,
        date: futureDate(30),
        start: "09:00:00",
        end: "10:00:00",
        name: "Reunion medica",
        description: null,
        allDay: false,
        employeeIds: [employeeId],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });


    describe("Caso exitoso — coordinador actualiza evento de empleados", () => {
        it("puede cambiar los empleados asignados", async () => {
            const newEmployeeIds = [employeeId, otherEmployeeId];
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
                { employee_id: otherEmployeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue({
                ...mockUpdatedEvent,
                employeeIds: newEmployeeIds,
            });
            createLog.mockResolvedValue();

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: newEmployeeIds },
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
            const updateCall = updateModel.updatePersonalEvent.mock.calls[0][1];
            expect(updateCall.employeeIds).toEqual(newEmployeeIds);
        });

        it("deduplica los employeeIds recibidos", async () => {
            const duplicatedIds = [employeeId, employeeId, otherEmployeeId];
            const uniqueIds = [employeeId, otherEmployeeId];
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
                { employee_id: otherEmployeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue({
                ...mockUpdatedEvent,
                employeeIds: uniqueIds,
            });
            createLog.mockResolvedValue();

            await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: duplicatedIds },
                clientIp,
            );

            const updateCall = updateModel.updatePersonalEvent.mock.calls[0][1];
            expect(updateCall.employeeIds).toEqual(uniqueIds);
        });
    });

    describe("Errores de validación", () => {
        it("retorna VALIDATION_ERROR si falta name", async () => {
            const payload = { ...basePayload };
            delete payload.name;

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                payload,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(updateModel.updatePersonalEvent).not.toHaveBeenCalled();
        });

        it("retorna VALIDATION_ERROR si name está vacío", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, name: "" },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si name excede 70 caracteres", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, name: "a".repeat(71) },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si name tiene caracteres no permitidos (XSS)", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, name: "<script>alert(1)</script>" },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si eventTypeId no es UUID válido", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, eventTypeId: "no-es-uuid" },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si falta date", async () => {
            const payload = { ...basePayload };
            delete payload.date;

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                payload,
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si date no tiene formato YYYY-MM-DD", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, date: "10/07/2026" },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si falta allDay", async () => {
            const payload = { ...basePayload };
            delete payload.allDay;

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                payload,
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si allDay=false y falta start", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, allDay: false, start: undefined },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si allDay=false y falta end", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, allDay: false, end: undefined },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si end es menor que start", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, start: "10:00", end: "09:00" },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si start y end son iguales", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, start: "09:00", end: "09:00" },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si start no tiene formato de hora válido", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, start: "9am" },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si description excede 250 caracteres", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, description: "a".repeat(251) },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si employeeIds contiene un UUID inválido", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: ["no-es-uuid"] },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("acepta description nula u omitida", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            const payload = { ...basePayload };
            delete payload.description;

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...payload, employeeIds: [employeeId] },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
        });
    });

    describe("Restricciones por rol", () => {
        it("retorna NOT_PROVIDED si el coordinador no envía employeeIds", async () => {
            const payload = { ...basePayload };
            delete payload.employeeIds;

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                payload,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_PROVIDED);
            expect(updateModel.updatePersonalEvent).not.toHaveBeenCalled();
        });

        it("retorna NOT_PROVIDED si el coordinador envía employeeIds vacío", async () => {
            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [] },
                clientIp,
            );
            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_PROVIDED);
        });

        it("retorna NOT_ACCESS si el usuario no es coordinador", async () => {
            const result = await updatePersonalEvent(
                eventId,
                employeeUser,
                basePayload,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
            expect(updateModel.updatePersonalEvent).not.toHaveBeenCalled();
        });
    });

    describe("Verificación del evento existente", () => {
        it("retorna NOT_FOUND si el evento no existe en la casa", async () => {
            getModel.findPersonalEventById.mockResolvedValue(null);

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.NOT_FOUND);
            expect(updateModel.updatePersonalEvent).not.toHaveBeenCalled();
        });

        it("el coordinador puede modificar el evento aunque no esté asignado a él", async () => {
            getModel.findPersonalEventById.mockResolvedValue({
                ...mockExistingEvent,
                employee_personal_event: [{ employee_id: otherEmployeeId }],
            });
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
        });

        it("busca el evento usando la houseId del usuario", async () => {
            getModel.findPersonalEventById.mockResolvedValue(null);

            await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(getModel.findPersonalEventById).toHaveBeenCalledWith(
                eventId,
                houseId,
            );
        });
    });

    describe("Validación de empleados en la casa", () => {
        it("retorna NOT_FOUND si el empleado no pertenece a la casa", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([]);

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
            expect(updateModel.updatePersonalEvent).not.toHaveBeenCalled();
        });

        it("retorna NOT_FOUND si solo uno de varios empleados no pertenece a la casa", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId, otherEmployeeId] },
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
        });

        it("consulta la casa correcta en getEmployeesInHouse", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(getModel.getEmployeesInHouse).toHaveBeenCalledWith(
                [employeeId],
                houseId,
            );
        });
    });

    describe("Detección de empalmes", () => {
        const overlappedEmployee = {
            employeeId,
            employeeName: "Juan Pérez",
        };

        it("retorna OVERLAP si hay empalme y forceOverlap es false", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
            ]);

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.overlappedEmployees).toEqual([overlappedEmployee]);
            expect(updateModel.updatePersonalEvent).not.toHaveBeenCalled();
        });

        it("el coordinador puede forzar el empalme con forceOverlap=true", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
            ]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId], forceOverlap: true },
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
            expect(updateModel.updatePersonalEvent).toHaveBeenCalledTimes(1);
        });

        it("marca forcedOverlap=true en la respuesta cuando se forzó el empalme", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
            ]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId], forceOverlap: true },
                clientIp,
            );

            expect(result.data.personalEvent.forcedOverlap).toBe(true);
        });

        it("marca forcedOverlap=false en la respuesta cuando no hubo empalme", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(result.data.personalEvent.forcedOverlap).toBe(false);
        });

        it("pasa excludeEventId correcto a findOverlappingEmployees para excluir el evento actual", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(getModel.findOverlappingEmployees).toHaveBeenCalledWith(
                expect.objectContaining({ excludeEventId: eventId }),
            );
        });

        it("retorna OVERLAP con múltiples empleados empatados", async () => {
            const secondOverlap = { employeeId: otherEmployeeId, employeeName: "Ana G." };
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
                { employee_id: otherEmployeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
                secondOverlap,
            ]);

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                {
                    ...basePayload,
                    employeeIds: [employeeId, otherEmployeeId],
                    forceOverlap: false,
                },
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.overlappedEmployees).toHaveLength(2);
        });
    });

    describe("Logs de auditoría", () => {
        it("crea un log del evento actualizado siempre", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(createLog).toHaveBeenCalledWith(
                coordinatorUser.id,
                expect.any(String),
                clientIp,
                eventId,
            );
        });

        it("no crea log de empleado si los asignados no cambiaron", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("crea log de empleado por cada empleado nuevo agregado", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
                { employee_id: otherEmployeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue({
                ...mockUpdatedEvent,
                employeeIds: [employeeId, otherEmployeeId],
            });
            createLog.mockResolvedValue();

            await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId, otherEmployeeId] },
                clientIp,
            );

            expect(createLog).toHaveBeenCalledTimes(2);
        });

        it("crea log de empleado por cada empleado removido", async () => {
            getModel.findPersonalEventById.mockResolvedValue({
                ...mockExistingEvent,
                employee_personal_event: [
                    { employee_id: employeeId },
                    { employee_id: otherEmployeeId },
                ],
            });
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(createLog).toHaveBeenCalledTimes(2);
        });

        it("retorna UPDATED con warning si el log falla", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockRejectedValue(new Error("Log DB error"));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
            expect(result.data.warning).toBe(
                "Evento actualizado pero los logs fallaron",
            );
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("retorna warning null si todos los logs se crean correctamente", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                clientIp,
            );

            expect(result.data.warning).toBeNull();
        });

        it("pasa la IP correcta a createLog", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([]);
            updateModel.updatePersonalEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            await updatePersonalEvent(eventId, coordinatorUser, { ...basePayload, employeeIds: [employeeId] }, "10.0.0.1");

            expect(createLog).toHaveBeenCalledWith(
                coordinatorUser.id,
                expect.any(String),
                "10.0.0.1",
                expect.any(String),
            );
        });
    });

    describe("Defaults del schema", () => {
        it("aplica forceOverlap=false por defecto y bloquea el empalme", async () => {
            const overlappedEmployee = { employeeId, employeeName: "Juan" };
            getModel.findPersonalEventById.mockResolvedValue(mockExistingEvent);
            getModel.getEmployeesInHouse.mockResolvedValue([
                { employee_id: employeeId },
            ]);
            getModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
            ]);

            const payloadWithoutForce = { ...basePayload, employeeIds: [employeeId] };
            delete payloadWithoutForce.forceOverlap;

            const result = await updatePersonalEvent(
                eventId,
                coordinatorUser,
                payloadWithoutForce,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
        });
    });
});

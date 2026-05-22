const createService = require("../../service/event/create.service");
const createModel = require("../../model/event/create.model");
const getPersonalEventModel = require("../../model/event/get.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");

jest.mock("../../model/event/create.model");
jest.mock("../../model/event/get.model");
jest.mock("../../model/log.model");

describe("createPersonalEvent service", () => {
    const employeeId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const coordinatorId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const houseId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const eventTypeId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const otherEmployeeId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

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
        date: "2026-07-10",
        allDay: false,
        start: "09:00",
        end: "10:00",
    };

    const mockCreatedEvent = {
        personalEventId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        eventTypeId,
        date: "2026-07-10",
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

    describe("Caso exitoso — empleado crea evento para sí mismo", () => {
        it("crea el evento, retorna CREATED y registra los logs", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const result = await createService.createPersonalEvent(
                employeeUser,
                basePayload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(result.data.personalEvent).toMatchObject({
                personalEventId: mockCreatedEvent.personalEventId,
                forcedOverlap: false,
            });
            expect(result.data.warning).toBeNull();
            expect(createModel.createPersonalEvent).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledTimes(2);
        });

        it("el model recibe el id del empleado como employeeIds cuando no se envían employeeIds", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            await createService.createPersonalEvent(
                employeeUser,
                basePayload,
                "127.0.0.1",
            );

            const createCall = createModel.createPersonalEvent.mock.calls[0][0];
            expect(createCall.employeeIds).toEqual([employeeId]);
        });

        it("acepta evento allDay y normaliza horario a rango exclusivo 00:00:00 - 00:00:00 del dia siguiente", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue({
                ...mockCreatedEvent,
                start: "00:00:00",
                end: "00:00:00",
                allDay: true,
            });
            createLog.mockResolvedValue();

            const allDayPayload = {
                ...basePayload,
                allDay: true,
                start: undefined,
                end: undefined,
            };

            const result = await createService.createPersonalEvent(
                employeeUser,
                allDayPayload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            const createCall = createModel.createPersonalEvent.mock.calls[0][0];
            expect(createCall.start).toBe("00:00:00");
            expect(createCall.end).toBe("00:00:00");
            expect(createCall.endDate).toBe("2026-07-11");
        });

        it("normaliza hora HH:mm a HH:mm:ss antes de llamar al model", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, start: "09:00", end: "10:00" },
                "127.0.0.1",
            );

            const createCall = createModel.createPersonalEvent.mock.calls[0][0];
            expect(createCall.start).toBe("09:00:00");
            expect(createCall.end).toBe("10:00:00");
        });

        it("no normaliza si la hora ya tiene formato HH:mm:ss", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, start: "09:00:00", end: "10:00:00" },
                "127.0.0.1",
            );

            const createCall = createModel.createPersonalEvent.mock.calls[0][0];
            expect(createCall.start).toBe("09:00:00");
            expect(createCall.end).toBe("10:00:00");
        });
    });

    describe("Caso exitoso — coordinador asigna evento a empleados", () => {
        it("crea el evento para múltiples empleados y registra logs por cada uno", async () => {
            const employeeIds = [employeeId, otherEmployeeId];
            const createdEvent = { ...mockCreatedEvent, employeeIds };

            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
                { employeeId: otherEmployeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(createdEvent);
            createLog.mockResolvedValue();

            const result = await createService.createPersonalEvent(
                coordinatorUser,
                { ...basePayload, employeeIds },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(createLog).toHaveBeenCalledTimes(3);
        });

        it("deduplica los employeeIds recibidos", async () => {
            const duplicatedIds = [employeeId, employeeId, otherEmployeeId];
            const uniqueIds = [employeeId, otherEmployeeId];

            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
                { employeeId: otherEmployeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue({
                ...mockCreatedEvent,
                employeeIds: uniqueIds,
            });
            createLog.mockResolvedValue();

            await createService.createPersonalEvent(
                coordinatorUser,
                { ...basePayload, employeeIds: duplicatedIds },
                "127.0.0.1",
            );

            const createCall = createModel.createPersonalEvent.mock.calls[0][0];
            expect(createCall.employeeIds).toEqual(uniqueIds);
        });
    });

    describe("Errores de validación", () => {
        it("retorna VALIDATION_ERROR si falta name", async () => {
            const payload = { ...basePayload };
            delete payload.name;

            const result = await createService.createPersonalEvent(
                employeeUser,
                payload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(createModel.createPersonalEvent).not.toHaveBeenCalled();
        });

        it("retorna VALIDATION_ERROR si name está vacío", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, name: "" },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si name excede 70 caracteres", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, name: "a".repeat(71) },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si name tiene caracteres no permitidos (XSS)", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, name: "<script>alert(1)</script>" },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si eventTypeId no es UUID válido", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, eventTypeId: "no-es-uuid" },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si falta date", async () => {
            const payload = { ...basePayload };
            delete payload.date;

            const result = await createService.createPersonalEvent(
                employeeUser,
                payload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si date no tiene formato YYYY-MM-DD", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, date: "10/07/2026" },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si falta allDay", async () => {
            const payload = { ...basePayload };
            delete payload.allDay;

            const result = await createService.createPersonalEvent(
                employeeUser,
                payload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si allDay=false y falta start", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, allDay: false, start: undefined },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si allDay=false y falta end", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, allDay: false, end: undefined },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si end es menor o igual que start", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, start: "10:00", end: "09:00" },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si start y end son iguales", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, start: "09:00", end: "09:00" },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si start no tiene formato de hora válido", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, start: "9am" },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si description excede 250 caracteres", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, description: "a".repeat(251) },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si employeeIds contiene un UUID inválido", async () => {
            const result = await createService.createPersonalEvent(
                coordinatorUser,
                { ...basePayload, employeeIds: ["no-es-uuid"] },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("acepta description nula u omitida", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const payload = { ...basePayload };
            delete payload.description;

            const result = await createService.createPersonalEvent(
                employeeUser,
                payload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
        });
    });

    describe("Restricciones por rol", () => {
        it("retorna NOT_PROVIDED si el coordinador no envía employeeIds", async () => {
            const payload = { ...basePayload };
            delete payload.employeeIds;

            const result = await createService.createPersonalEvent(
                coordinatorUser,
                payload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_PROVIDED);
            expect(createModel.createPersonalEvent).not.toHaveBeenCalled();
        });

        it("retorna NOT_PROVIDED si el coordinador envía employeeIds vacío", async () => {
            const result = await createService.createPersonalEvent(
                coordinatorUser,
                { ...basePayload, employeeIds: [] },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_PROVIDED);
        });

        it("retorna NOT_ACCESS si un empleado no coordinador intenta usar forceOverlap", async () => {
            const result = await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, forceOverlap: true },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
            expect(createModel.createPersonalEvent).not.toHaveBeenCalled();
        });

        it("el empleado no puede asignar el evento a otros (se ignora employeeIds y se asigna a sí mismo)", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            await createService.createPersonalEvent(
                employeeUser,
                { ...basePayload, employeeIds: [otherEmployeeId] },
                "127.0.0.1",
            );

            const createCall = createModel.createPersonalEvent.mock.calls[0][0];
            expect(createCall.employeeIds).toEqual([employeeId]);
        });
    });

    describe("Validación de empleados en la casa", () => {
        it("retorna NOT_FOUND si algún empleado no pertenece a la casa", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([]);

            const result = await createService.createPersonalEvent(
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId] },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
            expect(createModel.createPersonalEvent).not.toHaveBeenCalled();
        });

        it("retorna NOT_FOUND si solo uno de varios empleados no pertenece a la casa", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);

            const result = await createService.createPersonalEvent(
                coordinatorUser,
                { ...basePayload, employeeIds: [employeeId, otherEmployeeId] },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
        });

        it("consulta la casa correcta en getEmployeesInHouse", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            await createService.createPersonalEvent(
                employeeUser,
                basePayload,
                "127.0.0.1",
            );

            expect(
                getPersonalEventModel.getEmployeesInHouse,
            ).toHaveBeenCalledWith([employeeId], houseId);
        });
    });

    describe("Detección de empalmes", () => {
        const overlappedEmployee = {
            employeeId,
            name: "Juan Pérez",
        };

        it("retorna OVERLAP si hay empalme y forceOverlap es false", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
            ]);

            const result = await createService.createPersonalEvent(
                employeeUser,
                basePayload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.overlappedEmployees).toEqual([
                overlappedEmployee,
            ]);
            expect(createModel.createPersonalEvent).not.toHaveBeenCalled();
        });

        it("el coordinador puede forzar el empalme con forceOverlap=true", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
            ]);
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const result = await createService.createPersonalEvent(
                coordinatorUser,
                {
                    ...basePayload,
                    employeeIds: [employeeId],
                    forceOverlap: true,
                },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(createModel.createPersonalEvent).toHaveBeenCalledTimes(1);
        });

        it("marca forcedOverlap=true en la respuesta cuando se forzó el empalme", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
            ]);
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const result = await createService.createPersonalEvent(
                coordinatorUser,
                {
                    ...basePayload,
                    employeeIds: [employeeId],
                    forceOverlap: true,
                },
                "127.0.0.1",
            );

            expect(result.data.personalEvent.forcedOverlap).toBe(true);
        });

        it("marca forcedOverlap=false en la respuesta cuando no hubo empalme", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const result = await createService.createPersonalEvent(
                employeeUser,
                basePayload,
                "127.0.0.1",
            );

            expect(result.data.personalEvent.forcedOverlap).toBe(false);
        });

        it("retorna OVERLAP con múltiples empleados empatados", async () => {
            const secondOverlap = {
                employeeId: otherEmployeeId,
                name: "Ana G.",
            };
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
                { employeeId: otherEmployeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
                secondOverlap,
            ]);

            const result = await createService.createPersonalEvent(
                coordinatorUser,
                {
                    ...basePayload,
                    employeeIds: [employeeId, otherEmployeeId],
                    forceOverlap: false,
                },
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.overlappedEmployees).toHaveLength(2);
        });
    });

    describe("Manejo del log", () => {
        it("retorna CREATED con warning si el log falla", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockRejectedValue(new Error("Log DB error"));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const result = await createService.createPersonalEvent(
                employeeUser,
                basePayload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(result.data.warning).toBe(
                "Evento creado pero los logs fallaron",
            );
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("retorna warning null si todos los logs se crean correctamente", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const result = await createService.createPersonalEvent(
                employeeUser,
                basePayload,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(result.data.warning).toBeNull();
        });

        it("pasa la IP correcta a createLog", async () => {
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue(
                [],
            );
            createModel.createPersonalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            await createService.createPersonalEvent(
                employeeUser,
                basePayload,
                "10.0.0.1",
            );

            expect(createLog).toHaveBeenCalledWith(
                employeeUser.id,
                expect.any(String),
                "10.0.0.1",
                expect.any(String),
            );
        });
    });

    describe("Defaults del schema", () => {
        it("aplica forceOverlap=false por defecto y bloquea empalme", async () => {
            const overlappedEmployee = { employeeId, name: "Juan" };
            getPersonalEventModel.getEmployeesInHouse.mockResolvedValue([
                { employeeId },
            ]);
            getPersonalEventModel.findOverlappingEmployees.mockResolvedValue([
                overlappedEmployee,
            ]);

            const payloadWithoutForce = { ...basePayload };
            delete payloadWithoutForce.forceOverlap;

            const result = await createService.createPersonalEvent(
                employeeUser,
                payloadWithoutForce,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
        });
    });
});

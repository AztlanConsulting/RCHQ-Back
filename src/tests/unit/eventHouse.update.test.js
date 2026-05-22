const updateService = require("../../service/event/update.service");
const updateModel = require("../../model/event/update.model");
const getModel = require("../../model/event/get.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");

jest.mock("../../model/event/update.model");
jest.mock("../../model/event/get.model");
jest.mock("../../model/log.model");

describe("updateHouseEvent service", () => {
    const validUser = {
        id: "11111111-1111-4111-8111-111111111111",
        role: "Coordinador",
        houseId: "22222222-2222-4222-8222-222222222222",
        privileges: ["updateEvent"],
    };

    const validClientIp = "127.0.0.1";

    const validEventId = "44444444-4444-4444-8444-444444444444";

    const baseValidData = {
        eventTypeId: "33333333-3333-4333-8333-333333333333",
        name: "Reunión semanal",
        start: "2026-06-15T09:00:00-06:00",
        end: "2026-06-15T11:00:00-06:00",
        allDay: false,
        isFreeDay: false,
        description: "Reunión de coordinación",
        forceOverlap: false,
    };

    const mockExistingEvent = {
        houseEventId: validEventId,
        houseId: validUser.houseId,
        eventTypeId: baseValidData.eventTypeId,
        name: "Evento anterior",
        start: new Date("2026-06-15T14:00:00.000Z"),
        end: new Date("2026-06-15T16:00:00.000Z"),
    };

    const mockUpdatedEvent = {
        houseEventId: validEventId,
        houseId: validUser.houseId,
        eventTypeId: baseValidData.eventTypeId,
        name: baseValidData.name,
        start: new Date("2026-06-15T15:00:00.000Z"),
        end: new Date("2026-06-15T17:00:00.000Z"),
        allDay: false,
        isFreeDay: false,
        description: baseValidData.description,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 1: Actualización exitosa con evento con hora
    // ──────────────────────────────────────────────────────────
    describe("Caso exitoso con evento con hora", () => {
        it("actualiza el evento, retorna UPDATED y registra el log", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
            expect(result.data.houseEvent).toEqual(mockUpdatedEvent);
            expect(result.data.warning).toBeNull();
            expect(getModel.findHouseEventByIdAndHouseId).toHaveBeenCalledTimes(
                1,
            );
            expect(getModel.findOverlappingHouseEvents).toHaveBeenCalledTimes(
                1,
            );
            expect(updateModel.updateHouseEvent).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("transforma las fechas string a Date antes de llamar al model", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);

            await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            const updateCall = updateModel.updateHouseEvent.mock.calls[0][1];
            expect(updateCall.start).toBeInstanceOf(Date);
            expect(updateCall.end).toBeInstanceOf(Date);
            expect(updateCall.start.toISOString()).toBe(
                "2026-06-15T15:00:00.000Z",
            );
            expect(updateCall.end.toISOString()).toBe(
                "2026-06-15T17:00:00.000Z",
            );
        });

        it("pasa el eventId correcto al model de actualización", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);

            await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            expect(updateModel.updateHouseEvent.mock.calls[0][0]).toBe(
                validEventId,
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 2: Actualización exitosa con evento allDay
    // ──────────────────────────────────────────────────────────
    describe("Caso exitoso con evento allDay", () => {
        it("suma un día al end para un evento allDay de un solo día", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);

            const allDayData = {
                ...baseValidData,
                start: "2026-06-15",
                end: "2026-06-15",
                allDay: true,
            };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                allDayData,
                validClientIp,
            );

            const updateCall = updateModel.updateHouseEvent.mock.calls[0][1];
            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
            expect(updateCall.start.toISOString()).toBe(
                "2026-06-15T06:00:00.000Z",
            );
            expect(updateCall.end.toISOString()).toBe(
                "2026-06-16T06:00:00.000Z",
            );
        });

        it("suma un día al end para un evento allDay de varios días", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);

            const allDayData = {
                ...baseValidData,
                start: "2026-06-15",
                end: "2026-06-17",
                allDay: true,
            };

            await updateService.updateHouseEvent(
                validEventId,
                validUser,
                allDayData,
                validClientIp,
            );

            const updateCall = updateModel.updateHouseEvent.mock.calls[0][1];
            expect(updateCall.start.toISOString()).toBe(
                "2026-06-15T06:00:00.000Z",
            );
            expect(updateCall.end.toISOString()).toBe(
                "2026-06-18T06:00:00.000Z",
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 3: Evento no encontrado
    // ──────────────────────────────────────────────────────────
    describe("Evento no encontrado", () => {
        it("retorna NOT_FOUND si el evento no existe", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(null);

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.NOT_FOUND);
            expect(getModel.findOverlappingHouseEvents).not.toHaveBeenCalled();
            expect(updateModel.updateHouseEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        it("busca el evento con el houseId del usuario", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(null);

            await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            expect(getModel.findHouseEventByIdAndHouseId).toHaveBeenCalledWith(
                validEventId,
                validUser.houseId,
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 4: Errores de validación de Zod
    // ──────────────────────────────────────────────────────────
    describe("Errores de validación", () => {
        it("retorna VALIDATION_ERROR si falta eventTypeId", async () => {
            const invalidData = { ...baseValidData };
            delete invalidData.eventTypeId;

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(
                result.data.errors.some((e) => e.field === "eventTypeId"),
            ).toBe(true);
            expect(
                getModel.findHouseEventByIdAndHouseId,
            ).not.toHaveBeenCalled();
            expect(updateModel.updateHouseEvent).not.toHaveBeenCalled();
        });

        it("retorna VALIDATION_ERROR si falta name", async () => {
            const invalidData = { ...baseValidData };
            delete invalidData.name;

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si el name está vacío", async () => {
            const invalidData = { ...baseValidData, name: "" };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si el name excede 70 caracteres", async () => {
            const invalidData = { ...baseValidData, name: "a".repeat(71) };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si el name tiene caracteres no permitidos", async () => {
            const invalidData = { ...baseValidData, name: "Evento <script>" };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si eventTypeId no es un UUID válido", async () => {
            const invalidData = {
                ...baseValidData,
                eventTypeId: "no-es-uuid",
            };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si start no es ISO con timezone (evento con hora)", async () => {
            const invalidData = {
                ...baseValidData,
                start: "2026-06-15T09:00:00",
            };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "start")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si start no es YYYY-MM-DD (evento allDay)", async () => {
            const invalidData = {
                ...baseValidData,
                start: "2026-06-15T09:00:00-06:00",
                end: "2026-06-15",
                allDay: true,
            };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "start")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si end es anterior a start", async () => {
            const invalidData = {
                ...baseValidData,
                start: "2026-06-15T11:00:00-06:00",
                end: "2026-06-15T09:00:00-06:00",
            };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "start")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si start y end son iguales (evento con hora)", async () => {
            const invalidData = {
                ...baseValidData,
                start: "2026-06-15T09:00:00-06:00",
                end: "2026-06-15T09:00:00-06:00",
            };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si la fecha del mes es inválida (mes 13)", async () => {
            const invalidData = {
                ...baseValidData,
                start: "2026-13-15T09:00:00-06:00",
            };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si description excede 250 caracteres", async () => {
            const invalidData = {
                ...baseValidData,
                description: "a".repeat(251),
            };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                invalidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(
                result.data.errors.some((e) => e.field === "description"),
            ).toBe(true);
        });

        it("acepta description nulo u omitido", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);

            const dataWithoutDesc = { ...baseValidData };
            delete dataWithoutDesc.description;

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                dataWithoutDesc,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 5: Detección de empalmes
    // ──────────────────────────────────────────────────────────
    describe("Detección de empalmes", () => {
        const mockCollision = {
            houseEventId: "55555555-5555-4555-8555-555555555555",
            name: "Capacitación previa",
            start: new Date("2026-06-15T16:00:00.000Z"),
            end: new Date("2026-06-15T18:00:00.000Z"),
        };

        it("retorna OVERLAP cuando hay empalme y forceOverlap es false", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([
                mockCollision,
            ]);

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.collisions).toEqual([mockCollision]);
            expect(updateModel.updateHouseEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        it("actualiza el evento cuando hay empalme pero forceOverlap es true", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([
                mockCollision,
            ]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            const forceData = { ...baseValidData, forceOverlap: true };

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                forceData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
            expect(updateModel.updateHouseEvent).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("retorna múltiples colisiones cuando hay varios empalmes", async () => {
            const secondCollision = {
                ...mockCollision,
                houseEventId: "66666666-6666-4666-8666-666666666666",
            };
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([
                mockCollision,
                secondCollision,
            ]);

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.collisions).toHaveLength(2);
        });

        it("pasa excludeEventId al buscar empalmes para excluir el evento actual", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);

            await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            expect(getModel.findOverlappingHouseEvents).toHaveBeenCalledWith(
                expect.objectContaining({ excludeEventId: validEventId }),
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 6: Manejo del log
    // ──────────────────────────────────────────────────────────
    describe("Manejo del log", () => {
        it("retorna UPDATED con warning si el log falla", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockRejectedValue(new Error("Log DB error"));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
            expect(result.data.houseEvent).toEqual(mockUpdatedEvent);
            expect(result.data.warning).toBe(
                "Evento actualizado pero el log falló",
            );
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("retorna warning null si el log se crea correctamente", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
            expect(result.data.warning).toBeNull();
        });

        it("pasa los datos correctos a createLog", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);
            createLog.mockResolvedValue();

            await updateService.updateHouseEvent(
                validEventId,
                validUser,
                baseValidData,
                "192.168.1.1",
            );

            expect(createLog).toHaveBeenCalledWith(
                validUser.id,
                expect.any(String),
                "192.168.1.1",
                validEventId,
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 7: Defaults del schema
    // ──────────────────────────────────────────────────────────
    describe("Defaults del schema", () => {
        it("aplica allDay=false por defecto si no se envía", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);

            const dataWithoutAllDay = { ...baseValidData };
            delete dataWithoutAllDay.allDay;

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                dataWithoutAllDay,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.UPDATED);
            const updateCall = updateModel.updateHouseEvent.mock.calls[0][1];
            expect(updateCall.allDay).toBe(false);
        });

        it("aplica isFreeDay=false por defecto si no se envía", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([]);
            updateModel.updateHouseEvent.mockResolvedValue(mockUpdatedEvent);

            const dataWithoutFree = { ...baseValidData };
            delete dataWithoutFree.isFreeDay;

            await updateService.updateHouseEvent(
                validEventId,
                validUser,
                dataWithoutFree,
                validClientIp,
            );

            const updateCall = updateModel.updateHouseEvent.mock.calls[0][1];
            expect(updateCall.isFreeDay).toBe(false);
        });

        it("aplica forceOverlap=false por defecto si no se envía", async () => {
            const mockCollision = {
                houseEventId: "77777777-7777-4777-8777-777777777777",
                name: "Otro evento",
                start: new Date(),
                end: new Date(),
            };
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(
                mockExistingEvent,
            );
            getModel.findOverlappingHouseEvents.mockResolvedValue([
                mockCollision,
            ]);

            const dataWithoutForce = { ...baseValidData };
            delete dataWithoutForce.forceOverlap;

            const result = await updateService.updateHouseEvent(
                validEventId,
                validUser,
                dataWithoutForce,
                validClientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
        });
    });
});

const createService = require("../../service/event/create.service");
const createModel = require("../../model/event/create.model");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const RESPONSES = require("../../utils/responses");

jest.mock("../../model/event/create.model");
jest.mock("../../model/log.model");
jest.mock("../../utils/ip");

describe("createHouseEvent service", () => {
    const validUser = {
        id: "11111111-1111-4111-8111-111111111111",
        role: "Coordinador",
        houseId: "22222222-2222-4222-8222-222222222222",
        privileges: ["createEvent"],
    };

    const validReq = { headers: {}, ip: "127.0.0.1" };

    const baseValidData = {
        event_type_id: "33333333-3333-4333-8333-333333333333",
        house_id: "22222222-2222-4222-8222-222222222222",
        name: "Reunión semanal",
        start: "2026-06-15T09:00:00-06:00",
        end: "2026-06-15T11:00:00-06:00",
        all_day: false,
        is_free_day: false,
        description: "Reunión de coordinación",
        forceOverlap: false,
    };

    const mockCreatedEvent = {
        house_event_id: "44444444-4444-4444-8444-444444444444",
        house_id: validUser.houseId,
        event_type_id: baseValidData.event_type_id,
        name: baseValidData.name,
        start: new Date("2026-06-15T15:00:00.000Z"),
        end: new Date("2026-06-15T17:00:00.000Z"),
        all_day: false,
        is_free_day: false,
        description: baseValidData.description,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        getClientIp.mockReturnValue("127.0.0.1");
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 1: Creación exitosa de evento con hora
    // ──────────────────────────────────────────────────────────
    describe("Caso exitoso con evento con hora", () => {
        it("crea el evento, retorna CREATED y registra el log", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const result = await createService.createHouseEvent(
                baseValidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(result.data.houseEvent).toEqual(mockCreatedEvent);
            expect(result.data.warning).toBeNull();
            expect(
                createModel.findOverlappingHouseEvents,
            ).toHaveBeenCalledTimes(1);
            expect(createModel.createHouseEvent).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("transforma las fechas string a Date antes de llamar al model", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);

            await createService.createHouseEvent(
                baseValidData,
                validUser,
                validReq,
            );

            const createCall = createModel.createHouseEvent.mock.calls[0][0];
            expect(createCall.start).toBeInstanceOf(Date);
            expect(createCall.end).toBeInstanceOf(Date);
            expect(createCall.start.toISOString()).toBe(
                "2026-06-15T15:00:00.000Z",
            );
            expect(createCall.end.toISOString()).toBe(
                "2026-06-15T17:00:00.000Z",
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 2: Creación exitosa de evento all_day
    // ──────────────────────────────────────────────────────────
    describe("Caso exitoso con evento all_day", () => {
        it("suma un día al end para un evento all_day de un solo día", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);

            const allDayData = {
                ...baseValidData,
                start: "2026-06-15",
                end: "2026-06-15",
                all_day: true,
            };

            const result = await createService.createHouseEvent(
                allDayData,
                validUser,
                validReq,
            );

            const createCall = createModel.createHouseEvent.mock.calls[0][0];
            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(createCall.start.toISOString()).toBe(
                "2026-06-15T00:00:00.000Z",
            );
            expect(createCall.end.toISOString()).toBe(
                "2026-06-16T00:00:00.000Z",
            );
        });

        it("suma un día al end para un evento all_day de varios días", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);

            const allDayData = {
                ...baseValidData,
                start: "2026-06-15",
                end: "2026-06-17",
                all_day: true,
            };

            await createService.createHouseEvent(
                allDayData,
                validUser,
                validReq,
            );

            const createCall = createModel.createHouseEvent.mock.calls[0][0];
            expect(createCall.start.toISOString()).toBe(
                "2026-06-15T00:00:00.000Z",
            );
            expect(createCall.end.toISOString()).toBe(
                "2026-06-18T00:00:00.000Z",
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 3: Errores de validación de Zod
    // ──────────────────────────────────────────────────────────
    describe("Errores de validación", () => {
        it("retorna VALIDATION_ERROR si falta event_type_id", async () => {
            const invalidData = { ...baseValidData };
            delete invalidData.event_type_id;

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(
                result.data.errors.some((e) => e.field === "event_type_id"),
            ).toBe(true);
            expect(
                createModel.findOverlappingHouseEvents,
            ).not.toHaveBeenCalled();
            expect(createModel.createHouseEvent).not.toHaveBeenCalled();
        });

        it("retorna VALIDATION_ERROR si falta house_id", async () => {
            const invalidData = { ...baseValidData };
            delete invalidData.house_id;

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "house_id")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si el name está vacío", async () => {
            const invalidData = { ...baseValidData, name: "" };

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si el name excede 70 caracteres", async () => {
            const invalidData = { ...baseValidData, name: "a".repeat(71) };

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si el name tiene caracteres no permitidos", async () => {
            const invalidData = { ...baseValidData, name: "Evento <script>" };

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si event_type_id no es un UUID válido", async () => {
            const invalidData = {
                ...baseValidData,
                event_type_id: "no-es-uuid",
            };

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si start no es ISO con timezone (evento con hora)", async () => {
            const invalidData = {
                ...baseValidData,
                start: "2026-06-15T09:00:00",
            };

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "start")).toBe(
                true,
            );
        });

        it("retorna VALIDATION_ERROR si start no es YYYY-MM-DD (evento all_day)", async () => {
            const invalidData = {
                ...baseValidData,
                start: "2026-06-15T09:00:00-06:00",
                end: "2026-06-15",
                all_day: true,
            };

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
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

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
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

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si la fecha del mes es inválida (mes 13)", async () => {
            const invalidData = {
                ...baseValidData,
                start: "2026-13-15T09:00:00-06:00",
            };

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si description excede 250 caracteres", async () => {
            const invalidData = {
                ...baseValidData,
                description: "a".repeat(251),
            };

            const result = await createService.createHouseEvent(
                invalidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(
                result.data.errors.some((e) => e.field === "description"),
            ).toBe(true);
        });

        it("acepta description nulo u omitido", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);

            const dataWithoutDesc = { ...baseValidData };
            delete dataWithoutDesc.description;

            const result = await createService.createHouseEvent(
                dataWithoutDesc,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 4: Detección de empalmes
    // ──────────────────────────────────────────────────────────
    describe("Detección de empalmes", () => {
        const mockCollision = {
            house_event_id: "55555555-5555-4555-8555-555555555555",
            name: "Capacitación previa",
            start: new Date("2026-06-15T16:00:00.000Z"),
            end: new Date("2026-06-15T18:00:00.000Z"),
        };

        it("retorna OVERLAP cuando hay empalme y forceOverlap es false", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([
                mockCollision,
            ]);

            const result = await createService.createHouseEvent(
                baseValidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.collisions).toEqual([mockCollision]);
            expect(createModel.createHouseEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        it("crea el evento cuando hay empalme pero forceOverlap es true", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([
                mockCollision,
            ]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const forceData = { ...baseValidData, forceOverlap: true };

            const result = await createService.createHouseEvent(
                forceData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(createModel.createHouseEvent).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("retorna múltiples colisiones cuando hay varios empalmes", async () => {
            const secondCollision = {
                ...mockCollision,
                house_event_id: "66666666-6666-4666-8666-666666666666",
            };
            createModel.findOverlappingHouseEvents.mockResolvedValue([
                mockCollision,
                secondCollision,
            ]);

            const result = await createService.createHouseEvent(
                baseValidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.collisions).toHaveLength(2);
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 5: Manejo del log fallido
    // ──────────────────────────────────────────────────────────
    describe("Manejo del log", () => {
        it("retorna CREATED con warning si el log falla", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockRejectedValue(new Error("Log DB error"));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const result = await createService.createHouseEvent(
                baseValidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(result.data.houseEvent).toEqual(mockCreatedEvent);
            expect(result.data.warning).toBe("Evento creado pero el log falló");
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("retorna warning null si el log se crea correctamente", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const result = await createService.createHouseEvent(
                baseValidData,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(result.data.warning).toBeNull();
        });

        it("pasa los datos correctos a createLog", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();
            getClientIp.mockReturnValue("192.168.1.1");

            await createService.createHouseEvent(
                baseValidData,
                validUser,
                validReq,
            );

            expect(createLog).toHaveBeenCalledWith(
                validUser.id,
                expect.any(String),
                "192.168.1.1",
                mockCreatedEvent.house_event_id,
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 6: Defaults del schema
    // ──────────────────────────────────────────────────────────
    describe("Defaults del schema", () => {
        it("aplica all_day=false por defecto si no se envía", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);

            const dataWithoutAllDay = { ...baseValidData };
            delete dataWithoutAllDay.all_day;

            const result = await createService.createHouseEvent(
                dataWithoutAllDay,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            const createCall = createModel.createHouseEvent.mock.calls[0][0];
            expect(createCall.all_day).toBe(false);
        });

        it("aplica is_free_day=false por defecto si no se envía", async () => {
            createModel.findOverlappingHouseEvents.mockResolvedValue([]);
            createModel.createHouseEvent.mockResolvedValue(mockCreatedEvent);

            const dataWithoutFree = { ...baseValidData };
            delete dataWithoutFree.is_free_day;

            await createService.createHouseEvent(
                dataWithoutFree,
                validUser,
                validReq,
            );

            const createCall = createModel.createHouseEvent.mock.calls[0][0];
            expect(createCall.is_free_day).toBe(false);
        });

        it("aplica forceOverlap=false por defecto si no se envía", async () => {
            const mockCollision = {
                house_event_id: "77777777-7777-4777-8777-777777777777",
                name: "Otro evento",
                start: new Date(),
                end: new Date(),
            };
            createModel.findOverlappingHouseEvents.mockResolvedValue([
                mockCollision,
            ]);

            const dataWithoutForce = { ...baseValidData };
            delete dataWithoutForce.forceOverlap;

            const result = await createService.createHouseEvent(
                dataWithoutForce,
                validUser,
                validReq,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
        });
    });
});

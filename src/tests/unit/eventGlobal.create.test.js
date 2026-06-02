const createService = require("../../service/event/create.service");
const createModel = require("../../model/event/create.model");
const getModel = require("../../model/event/get.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");

jest.mock("../../model/event/create.model");
jest.mock("../../model/event/get.model");
jest.mock("../../model/log.model");

const {
    futureDate,
    futureDatetime,
    futureDatetimeUtc,
    allDayEndUtc,
} = require("../helpers/dateHelpers");

describe("createGlobalEvent service", () => {
    const validUser = {
        id: "11111111-1111-4111-8111-111111111111",
        role: "Administrador",
        privileges: ["createGlobalEvent"],
    };

    const baseValidData = {
        eventTypeId: "33333333-3333-4333-8333-333333333333",
        name: "Día festivo nacional",
        start: futureDatetime(30, 9),
        end: futureDatetime(30, 11),
        allDay: false,
        isFreeDay: true,
        isRecurring: false,
        recurrenceType: null,
        description: "Festivo oficial",
        forceOverlap: false,
    };

    const mockCreatedEvent = {
        globalEventId: "44444444-4444-4444-8444-444444444444",
        eventTypeId: baseValidData.eventTypeId,
        name: baseValidData.name,
        start: new Date(futureDatetimeUtc(30, 15)),
        end: new Date(futureDatetimeUtc(30, 17)),
        allDay: false,
        isFreeDay: true,
        isRecurring: false,
        recurrenceType: null,
        description: baseValidData.description,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Caso exitoso con evento con hora", () => {
        it("crea el evento, retorna CREATED y registra el log", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const result = await createService.createGlobalEvent(
                validUser,
                baseValidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(result.data.globalEvent).toEqual(mockCreatedEvent);
            expect(result.data.warning).toBeNull();
            expect(
                getModel.findOverlappingGlobalEvents,
            ).toHaveBeenCalledTimes(1);
            expect(createModel.createGlobalEvent).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("transforma las fechas string a Date antes de llamar al model", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);

            await createService.createGlobalEvent(
                validUser,
                baseValidData,
                "127.0.0.1",
            );

            const createCall = createModel.createGlobalEvent.mock.calls[0][0];
            expect(createCall.start).toBeInstanceOf(Date);
            expect(createCall.end).toBeInstanceOf(Date);
            expect(createCall.start.toISOString()).toBe(futureDatetimeUtc(30, 9));
            expect(createCall.end.toISOString()).toBe(futureDatetimeUtc(30, 11));
        });
    });

    describe("Caso exitoso con evento allDay", () => {
        it("suma un día al end para un evento allDay de un solo día", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);

            const allDayData = {
                ...baseValidData,
                start: futureDate(30),
                end: futureDate(30),
                allDay: true,
            };

            const result = await createService.createGlobalEvent(
                validUser,
                allDayData,
                "127.0.0.1",
            );

            const createCall = createModel.createGlobalEvent.mock.calls[0][0];
            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(createCall.start.toISOString()).toBe(
                `${futureDate(30)}T06:00:00.000Z`,
            );
            expect(createCall.end.toISOString()).toBe(allDayEndUtc(30));
        });

        it("suma un día al end para un evento allDay de varios días", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);

            const allDayData = {
                ...baseValidData,
                start: futureDate(30),
                end: futureDate(32),
                allDay: true,
            };

            await createService.createGlobalEvent(
                validUser,
                allDayData,
                "127.0.0.1",
            );

            const createCall = createModel.createGlobalEvent.mock.calls[0][0];
            expect(createCall.start.toISOString()).toBe(
                `${futureDate(30)}T06:00:00.000Z`,
            );
            expect(createCall.end.toISOString()).toBe(allDayEndUtc(32));
        });
    });

    describe("Errores de validación", () => {
        it("retorna VALIDATION_ERROR si falta eventTypeId", async () => {
            const invalidData = { ...baseValidData };
            delete invalidData.eventTypeId;

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(
                result.data.errors.some((e) => e.field === "eventTypeId"),
            ).toBe(true);
            expect(
                getModel.findOverlappingGlobalEvents,
            ).not.toHaveBeenCalled();
            expect(createModel.createGlobalEvent).not.toHaveBeenCalled();
        });

        it("retorna VALIDATION_ERROR si el name está vacío", async () => {
            const invalidData = { ...baseValidData, name: "" };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(true);
        });

        it("retorna VALIDATION_ERROR si el name excede 70 caracteres", async () => {
            const invalidData = { ...baseValidData, name: "a".repeat(71) };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(true);
        });

        it("retorna VALIDATION_ERROR si el name tiene caracteres no permitidos", async () => {
            const invalidData = { ...baseValidData, name: "Evento <script>" };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "name")).toBe(true);
        });

        it("retorna VALIDATION_ERROR si eventTypeId no es un UUID válido", async () => {
            const invalidData = { ...baseValidData, eventTypeId: "no-es-uuid" };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si start no es ISO con timezone (evento con hora)", async () => {
            const invalidData = {
                ...baseValidData,
                start: `${futureDate(30)}T09:00:00`,
            };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "start")).toBe(true);
        });

        it("retorna VALIDATION_ERROR si start no es YYYY-MM-DD (evento allDay)", async () => {
            const invalidData = {
                ...baseValidData,
                start: futureDatetime(30, 9),
                end: futureDate(30),
                allDay: true,
            };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "start")).toBe(true);
        });

        it("retorna VALIDATION_ERROR si end es anterior a start", async () => {
            const invalidData = {
                ...baseValidData,
                start: futureDatetime(30, 11),
                end: futureDatetime(30, 9),
            };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(result.data.errors.some((e) => e.field === "start")).toBe(true);
        });

        it("retorna VALIDATION_ERROR si start y end son iguales (evento con hora)", async () => {
            const invalidData = {
                ...baseValidData,
                start: futureDatetime(30, 9),
                end: futureDatetime(30, 9),
            };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si la fecha del mes es inválida (mes 13)", async () => {
            const invalidData = {
                ...baseValidData,
                start: `${new Date().getFullYear()}-13-15T09:00:00-06:00`,
            };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("retorna VALIDATION_ERROR si description excede 250 caracteres", async () => {
            const invalidData = {
                ...baseValidData,
                description: "a".repeat(251),
            };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(
                result.data.errors.some((e) => e.field === "description"),
            ).toBe(true);
        });

        it("acepta description nulo u omitido", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);

            const dataWithoutDesc = { ...baseValidData };
            delete dataWithoutDesc.description;

            const result = await createService.createGlobalEvent(
                validUser,
                dataWithoutDesc,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
        });
    });

    describe("Validación de recurrencia", () => {
        it("retorna VALIDATION_ERROR si isRecurring es true y falta recurrenceType", async () => {
            const invalidData = {
                ...baseValidData,
                isRecurring: true,
                recurrenceType: null,
            };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
            expect(
                result.data.errors.some((e) => e.field === "recurrenceType"),
            ).toBe(true);
        });

        it("retorna VALIDATION_ERROR si recurrenceType tiene un valor inválido", async () => {
            const invalidData = {
                ...baseValidData,
                isRecurring: true,
                recurrenceType: "hourly",
            };

            const result = await createService.createGlobalEvent(
                validUser,
                invalidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.VALIDATION_ERROR);
        });

        it("crea el evento con recurrenceType=null si isRecurring es false", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);

            const recurringData = {
                ...baseValidData,
                isRecurring: false,
                recurrenceType: "weekly",
            };

            const result = await createService.createGlobalEvent(
                validUser,
                recurringData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            const createCall = createModel.createGlobalEvent.mock.calls[0][0];
            expect(createCall.recurrenceType).toBeNull();
        });

        it.each(["daily", "weekly", "monthly", "yearly"])(
            "acepta recurrenceType='%s' cuando isRecurring es true",
            async (type) => {
                getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
                createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);

                const recurringData = {
                    ...baseValidData,
                    isRecurring: true,
                    recurrenceType: type,
                };

                const result = await createService.createGlobalEvent(
                    validUser,
                    recurringData,
                    "127.0.0.1",
                );

                expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
                const createCall =
                    createModel.createGlobalEvent.mock.calls[0][0];
                expect(createCall.recurrenceType).toBe(type);
            },
        );
    });

    describe("Detección de empalmes", () => {
        const mockCollision = {
            globalEventId: "55555555-5555-4555-8555-555555555555",
            name: "Evento previo",
            start: new Date(futureDatetimeUtc(30, 16)),
            end: new Date(futureDatetimeUtc(30, 18)),
        };

        it("retorna OVERLAP cuando hay empalme y forceOverlap es false", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([
                mockCollision,
            ]);

            const result = await createService.createGlobalEvent(
                validUser,
                baseValidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.collisions).toEqual([mockCollision]);
            expect(createModel.createGlobalEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        it("crea el evento cuando hay empalme pero forceOverlap es true", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([
                mockCollision,
            ]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const forceData = { ...baseValidData, forceOverlap: true };

            const result = await createService.createGlobalEvent(
                validUser,
                forceData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(createModel.createGlobalEvent).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("retorna múltiples colisiones cuando hay varios empalmes", async () => {
            const secondCollision = {
                ...mockCollision,
                globalEventId: "66666666-6666-4666-8666-666666666666",
            };
            getModel.findOverlappingGlobalEvents.mockResolvedValue([
                mockCollision,
                secondCollision,
            ]);

            const result = await createService.createGlobalEvent(
                validUser,
                baseValidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
            expect(result.data.collisions).toHaveLength(2);
        });
    });

    describe("Manejo del log", () => {
        it("retorna CREATED con warning si el log falla", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockRejectedValue(new Error("Log DB error"));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const result = await createService.createGlobalEvent(
                validUser,
                baseValidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(result.data.globalEvent).toEqual(mockCreatedEvent);
            expect(result.data.warning).toBe("Evento creado pero el log falló");
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("retorna warning null si el log se crea correctamente", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            const result = await createService.createGlobalEvent(
                validUser,
                baseValidData,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            expect(result.data.warning).toBeNull();
        });

        it("solo registra un log al crear el evento global", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            await createService.createGlobalEvent(
                validUser,
                baseValidData,
                "127.0.0.1",
            );

            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("pasa los datos correctos a createLog", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);
            createLog.mockResolvedValue();

            await createService.createGlobalEvent(
                validUser,
                baseValidData,
                "192.168.1.1",
            );

            expect(createLog).toHaveBeenCalledWith(
                validUser.id,
                expect.any(String),
                "192.168.1.1",
                mockCreatedEvent.globalEventId,
            );
        });
    });

    describe("Defaults del schema", () => {
        it("aplica allDay=false por defecto si no se envía", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);

            const dataWithoutAllDay = { ...baseValidData };
            delete dataWithoutAllDay.allDay;

            const result = await createService.createGlobalEvent(
                validUser,
                dataWithoutAllDay,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.CREATED);
            const createCall = createModel.createGlobalEvent.mock.calls[0][0];
            expect(createCall.allDay).toBe(false);
        });

        it("aplica isFreeDay=false por defecto si no se envía", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);

            const dataWithoutFree = { ...baseValidData };
            delete dataWithoutFree.isFreeDay;

            await createService.createGlobalEvent(
                validUser,
                dataWithoutFree,
                "127.0.0.1",
            );

            const createCall = createModel.createGlobalEvent.mock.calls[0][0];
            expect(createCall.isFreeDay).toBe(false);
        });

        it("aplica isRecurring=false por defecto si no se envía", async () => {
            getModel.findOverlappingGlobalEvents.mockResolvedValue([]);
            createModel.createGlobalEvent.mockResolvedValue(mockCreatedEvent);

            const dataWithoutRecurring = { ...baseValidData };
            delete dataWithoutRecurring.isRecurring;

            await createService.createGlobalEvent(
                validUser,
                dataWithoutRecurring,
                "127.0.0.1",
            );

            const createCall = createModel.createGlobalEvent.mock.calls[0][0];
            expect(createCall.isRecurring).toBe(false);
        });

        it("aplica forceOverlap=false por defecto si no se envía", async () => {
            const mockCollision = {
                globalEventId: "77777777-7777-4777-8777-777777777777",
                name: "Otro evento",
                start: new Date(),
                end: new Date(),
            };
            getModel.findOverlappingGlobalEvents.mockResolvedValue([
                mockCollision,
            ]);

            const dataWithoutForce = { ...baseValidData };
            delete dataWithoutForce.forceOverlap;

            const result = await createService.createGlobalEvent(
                validUser,
                dataWithoutForce,
                "127.0.0.1",
            );

            expect(result.code).toBe(RESPONSES.EVENTS.OVERLAP);
        });
    });
});

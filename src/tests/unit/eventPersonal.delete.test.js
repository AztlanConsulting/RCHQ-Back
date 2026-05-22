const { deletePersonalEvent } = require("../../service/event/delete.service");
const deleteModel = require("../../model/event/delete.model");
const getModel = require("../../model/event/get.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");

jest.mock("../../model/event/delete.model");
jest.mock("../../model/event/get.model");
jest.mock("../../model/log.model");

describe("deletePersonalEvent service", () => {
    const employeeId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const coordinatorId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const houseId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const personalEventId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const clientIp = "127.0.0.1";

    const employeeUser = {
        id: employeeId,
        role: "Mantenimiento",
        houseId,
        privileges: ["deleteEvent"],
    };

    const coordinatorUser = {
        id: coordinatorId,
        role: "Coordinador",
        houseId,
        privileges: ["deleteEvent"],
    };

    const mockEvent = {
        personal_event_id: personalEventId,
        name: "Cita médica",
        employee_personal_event: [{ employee_id: employeeId }],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 1: Eliminación exitosa
    // ──────────────────────────────────────────────────────────
    describe("Caso exitoso", () => {
        it("elimina el evento y retorna DELETED cuando el empleado está asignado", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            const result = await deletePersonalEvent(
                personalEventId,
                employeeUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.DELETED);
        });

        it("elimina el evento y retorna DELETED cuando el usuario es coordinador", async () => {
            getModel.findPersonalEventById.mockResolvedValue({
                ...mockEvent,
                employee_personal_event: [{ employee_id: employeeId }],
            });
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            const result = await deletePersonalEvent(
                personalEventId,
                coordinatorUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.DELETED);
        });

        it("llama a findPersonalEventById con el eventId y houseId correctos", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await deletePersonalEvent(personalEventId, employeeUser, clientIp);

            expect(getModel.findPersonalEventById).toHaveBeenCalledWith(
                personalEventId,
                houseId,
            );
            expect(getModel.findPersonalEventById).toHaveBeenCalledTimes(1);
        });

        it("llama a softDeletePersonalEvent con el id correcto", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await deletePersonalEvent(personalEventId, employeeUser, clientIp);

            expect(deleteModel.softDeletePersonalEvent).toHaveBeenCalledWith(
                personalEventId,
            );
            expect(deleteModel.softDeletePersonalEvent).toHaveBeenCalledTimes(1);
        });

        it("el coordinador puede eliminar un evento al que no está asignado", async () => {
            const otherEmployeeId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
            getModel.findPersonalEventById.mockResolvedValue({
                ...mockEvent,
                employee_personal_event: [{ employee_id: otherEmployeeId }],
            });
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            const result = await deletePersonalEvent(
                personalEventId,
                coordinatorUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.DELETED);
            expect(deleteModel.softDeletePersonalEvent).toHaveBeenCalledTimes(1);
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 2: Evento no encontrado
    // ──────────────────────────────────────────────────────────
    describe("Evento no encontrado", () => {
        it("retorna NOT_FOUND si el evento no existe (null)", async () => {
            getModel.findPersonalEventById.mockResolvedValue(null);

            const result = await deletePersonalEvent(
                personalEventId,
                employeeUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.NOT_FOUND);
            expect(deleteModel.softDeletePersonalEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        it("no llama al soft delete si el evento no fue encontrado", async () => {
            getModel.findPersonalEventById.mockResolvedValue(null);

            await deletePersonalEvent(personalEventId, coordinatorUser, clientIp);

            expect(deleteModel.softDeletePersonalEvent).not.toHaveBeenCalled();
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 3: Acceso denegado
    // ──────────────────────────────────────────────────────────
    describe("Acceso denegado", () => {
        it("retorna NOT_ACCESS si el empleado no está asignado al evento", async () => {
            const otherEmployeeId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
            getModel.findPersonalEventById.mockResolvedValue({
                ...mockEvent,
                employee_personal_event: [{ employee_id: otherEmployeeId }],
            });

            const result = await deletePersonalEvent(
                personalEventId,
                employeeUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
            expect(deleteModel.softDeletePersonalEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        it("no llama al soft delete si se deniega el acceso", async () => {
            getModel.findPersonalEventById.mockResolvedValue({
                ...mockEvent,
                employee_personal_event: [],
            });

            await deletePersonalEvent(personalEventId, employeeUser, clientIp);

            expect(deleteModel.softDeletePersonalEvent).not.toHaveBeenCalled();
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 4: Manejo del log
    // ──────────────────────────────────────────────────────────
    describe("Manejo del log", () => {
        it("retorna DELETED aunque el log falle", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockRejectedValue(new Error("Log DB error"));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const result = await deletePersonalEvent(
                personalEventId,
                employeeUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.DELETED);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("el soft delete se ejecuta aunque el log falle después", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockRejectedValue(new Error("Log DB error"));

            jest.spyOn(console, "error").mockImplementation(() => {});

            await deletePersonalEvent(personalEventId, employeeUser, clientIp);

            expect(deleteModel.softDeletePersonalEvent).toHaveBeenCalledTimes(1);

            jest.restoreAllMocks();
        });

        it("pasa los datos correctos a createLog", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await deletePersonalEvent(personalEventId, employeeUser, clientIp);

            expect(createLog).toHaveBeenCalledWith(
                employeeUser.id,
                LOG_ACTIONS.PERSONAL_EVENT_DELETED,
                clientIp,
                personalEventId,
            );
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("pasa la IP correcta a createLog", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await deletePersonalEvent(personalEventId, employeeUser, "10.0.0.5");

            expect(createLog).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                "10.0.0.5",
                expect.any(String),
            );
        });

        it("pasa el userId del coordinador al log cuando es el que elimina", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await deletePersonalEvent(personalEventId, coordinatorUser, clientIp);

            expect(createLog).toHaveBeenCalledWith(
                coordinatorId,
                LOG_ACTIONS.PERSONAL_EVENT_DELETED,
                clientIp,
                personalEventId,
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 5: Error al eliminar en BD
    // ──────────────────────────────────────────────────────────
    describe("Error en base de datos al eliminar", () => {
        it("propaga el error si softDeletePersonalEvent lanza una excepción", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockRejectedValue(
                new Error("DB connection error"),
            );

            jest.spyOn(console, "error").mockImplementation(() => {});

            await expect(
                deletePersonalEvent(personalEventId, employeeUser, clientIp),
            ).rejects.toThrow("DB connection error");

            jest.restoreAllMocks();
        });

        it("no crea log si el soft delete falla", async () => {
            getModel.findPersonalEventById.mockResolvedValue(mockEvent);
            deleteModel.softDeletePersonalEvent.mockRejectedValue(
                new Error("DB error"),
            );

            jest.spyOn(console, "error").mockImplementation(() => {});

            await expect(
                deletePersonalEvent(personalEventId, employeeUser, clientIp),
            ).rejects.toThrow();

            expect(createLog).not.toHaveBeenCalled();

            jest.restoreAllMocks();
        });
    });
});

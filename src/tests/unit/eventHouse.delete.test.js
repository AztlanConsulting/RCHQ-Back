const deleteService = require("../../service/event/delete.service");
const deleteModel = require("../../model/event/delete.model");
const getModel = require("../../model/event/get.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");

jest.mock("../../model/event/delete.model");
jest.mock("../../model/event/get.model");
jest.mock("../../model/log.model");

describe("deleteHouseEvent service", () => {
    const validUser = {
        id: "11111111-1111-4111-8111-111111111111",
        role: "Coordinador",
        houseId: "22222222-2222-4222-8222-222222222222",
        privileges: ["deleteEvent"],
    };

    const clientIp = "127.0.0.1";
    const houseEventId = "44444444-4444-4444-8444-444444444444";

    const mockEvent = {
        houseEventId,
        houseId: validUser.houseId,
        name: "Reunión semanal",
        isDeleted: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 1: Eliminación exitosa
    // ──────────────────────────────────────────────────────────
    describe("Caso exitoso", () => {
        it("elimina el evento y retorna DELETED", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(mockEvent);
            deleteModel.softDeleteHouseEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            const result = await deleteService.deleteHouseEvent(
                houseEventId,
                validUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.DELETED);
        });

        it("llama a findHouseEventByIdAndHouseId con el id y houseId correctos", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(mockEvent);
            deleteModel.softDeleteHouseEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await deleteService.deleteHouseEvent(houseEventId, validUser, clientIp);

            expect(getModel.findHouseEventByIdAndHouseId).toHaveBeenCalledWith(houseEventId, validUser.houseId);
            expect(getModel.findHouseEventByIdAndHouseId).toHaveBeenCalledTimes(1);
        });

        it("llama a softDeleteHouseEvent con el id correcto", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(mockEvent);
            deleteModel.softDeleteHouseEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await deleteService.deleteHouseEvent(houseEventId, validUser, clientIp);

            expect(deleteModel.softDeleteHouseEvent).toHaveBeenCalledWith(houseEventId);
            expect(deleteModel.softDeleteHouseEvent).toHaveBeenCalledTimes(1);
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 2: Evento no encontrado
    // ──────────────────────────────────────────────────────────
    describe("Evento no encontrado", () => {
        it("retorna NOT_FOUND si el evento no existe (null)", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(null);

            const result = await deleteService.deleteHouseEvent(
                houseEventId,
                validUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.NOT_FOUND);
            expect(deleteModel.softDeleteHouseEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

    });

    // ──────────────────────────────────────────────────────────
    //  CASO 3: Evento de otra casa
    // ──────────────────────────────────────────────────────────
    describe("Evento de otra casa", () => {
        it("retorna NOT_FOUND si el evento no pertenece a la casa del usuario", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(null);

            const result = await deleteService.deleteHouseEvent(
                houseEventId,
                validUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.NOT_FOUND);
            expect(deleteModel.softDeleteHouseEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    // ──────────────────────────────────────────────────────────
    //  CASO 4: Manejo del log
    // ──────────────────────────────────────────────────────────
    describe("Manejo del log", () => {
        it("retorna DELETED aunque el log falle", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(mockEvent);
            deleteModel.softDeleteHouseEvent.mockResolvedValue();
            createLog.mockRejectedValue(new Error("Log DB error"));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const result = await deleteService.deleteHouseEvent(
                houseEventId,
                validUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.DELETED);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("el soft delete se ejecuta aunque el log falle después", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(mockEvent);
            deleteModel.softDeleteHouseEvent.mockResolvedValue();
            createLog.mockRejectedValue(new Error("Log DB error"));

            jest.spyOn(console, "error").mockImplementation(() => {});

            await deleteService.deleteHouseEvent(houseEventId, validUser, clientIp);

            expect(deleteModel.softDeleteHouseEvent).toHaveBeenCalledTimes(1);

            jest.restoreAllMocks();
        });

        it("pasa los datos correctos a createLog", async () => {
            getModel.findHouseEventByIdAndHouseId.mockResolvedValue(mockEvent);
            deleteModel.softDeleteHouseEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await deleteService.deleteHouseEvent(houseEventId, validUser, clientIp);

            expect(createLog).toHaveBeenCalledWith(
                validUser.id,
                expect.any(String),
                clientIp,
                houseEventId,
            );
            expect(createLog).toHaveBeenCalledTimes(1);
        });
    });
});

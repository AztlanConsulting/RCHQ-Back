const {
    removeEmployeeFromPersonalEvent,
} = require("../../service/event/delete.service");
const deleteModel = require("../../model/event/delete.model");
const getModel = require("../../model/event/get.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");

jest.mock("../../model/event/delete.model");
jest.mock("../../model/event/get.model");
jest.mock("../../model/log.model");

describe("removeEmployeeFromPersonalEvent service", () => {
    const coordinatorId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const employeeId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const houseId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const personalEventId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const clientIp = "127.0.0.1";

    const coordinatorUser = {
        id: coordinatorId,
        role: "Coordinador",
        houseId,
        privileges: ["deleteEvent"],
    };

    const mockTrainingEvent = {
        personal_event_id: personalEventId,
        name: "Capacitación de seguridad",
        is_deleted: false,
        employee_personal_event: [{ employee_id: employeeId }],
        event_type: { name: "Capacitaciones" },
    };

    const mockNonTrainingEvent = {
        personal_event_id: personalEventId,
        name: "Cita médica",
        is_deleted: false,
        employee_personal_event: [{ employee_id: employeeId }],
        event_type: { name: "Cita médica" },
    };

    const mockRelation = {
        personal_event_id: personalEventId,
        employee_id: employeeId,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Caso exitoso", () => {
        it("elimina al empleado y retorna EMPLOYEE_REMOVED", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            const result = await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.EMPLOYEE_REMOVED);
        });

        it("llama a findPersonalEventByIdIncludeDeleted con los parámetros correctos", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(getModel.findPersonalEventByIdIncludeDeleted).toHaveBeenCalledWith(
                personalEventId,
                houseId,
            );
            expect(getModel.findPersonalEventByIdIncludeDeleted).toHaveBeenCalledTimes(1);
        });

        it("llama a findEmployeeInPersonalEvent con los parámetros correctos", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(getModel.findEmployeeInPersonalEvent).toHaveBeenCalledWith(
                personalEventId,
                employeeId,
            );
            expect(getModel.findEmployeeInPersonalEvent).toHaveBeenCalledTimes(1);
        });

        it("llama a removeEmployeeFromPersonalEvent del model con los IDs correctos", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(deleteModel.removeEmployeeFromPersonalEvent).toHaveBeenCalledWith(
                personalEventId,
                employeeId,
            );
            expect(deleteModel.removeEmployeeFromPersonalEvent).toHaveBeenCalledTimes(1);
        });

        it("permite eliminar empleado de una capacitación con is_deleted=true", async () => {
            const deletedTrainingEvent = { ...mockTrainingEvent, is_deleted: true };
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(deletedTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            const result = await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.EMPLOYEE_REMOVED);
        });
    });

    describe("Evento no encontrado", () => {
        it("retorna NOT_FOUND si el evento no existe (null)", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(null);

            const result = await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.NOT_FOUND);
        });

        it("no llama a findEmployeeInPersonalEvent si el evento no existe", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(null);

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(getModel.findEmployeeInPersonalEvent).not.toHaveBeenCalled();
        });

        it("no llama al delete si el evento no existe", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(null);

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(deleteModel.removeEmployeeFromPersonalEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("El evento no es una capacitación", () => {
        it("retorna NOT_TRAINING_EVENT si el tipo no es Capacitaciones", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockNonTrainingEvent);

            const result = await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.NOT_TRAINING_EVENT);
        });

        it("no llama a findEmployeeInPersonalEvent si el evento no es capacitación", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockNonTrainingEvent);

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(getModel.findEmployeeInPersonalEvent).not.toHaveBeenCalled();
        });

        it("no llama al delete si el evento no es capacitación", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockNonTrainingEvent);

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(deleteModel.removeEmployeeFromPersonalEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("Empleado no asignado al evento", () => {
        it("retorna EMPLOYEE_NOT_IN_EVENT si la relación no existe", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(null);

            const result = await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.EMPLOYEE_NOT_IN_EVENT);
        });

        it("no llama al delete si el empleado no está asignado", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(null);

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(deleteModel.removeEmployeeFromPersonalEvent).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("Manejo del log", () => {
        it("retorna EMPLOYEE_REMOVED aunque el log falle", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockResolvedValue();
            createLog.mockRejectedValue(new Error("Log DB error"));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const result = await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(result.code).toBe(RESPONSES.EVENTS.EMPLOYEE_REMOVED);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("el delete se ejecuta aunque el log falle después", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockResolvedValue();
            createLog.mockRejectedValue(new Error("Log DB error"));

            jest.spyOn(console, "error").mockImplementation(() => {});

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(deleteModel.removeEmployeeFromPersonalEvent).toHaveBeenCalledTimes(1);

            jest.restoreAllMocks();
        });

        it("pasa los datos correctos a createLog", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                clientIp,
            );

            expect(createLog).toHaveBeenCalledWith(
                coordinatorId,
                LOG_ACTIONS.PERSONAL_EVENT_EMPLOYEE_REMOVED,
                clientIp,
                personalEventId,
            );
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        it("pasa la IP correcta a createLog", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockResolvedValue();
            createLog.mockResolvedValue();

            await removeEmployeeFromPersonalEvent(
                personalEventId,
                employeeId,
                coordinatorUser,
                "10.0.0.5",
            );

            expect(createLog).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                "10.0.0.5",
                expect.any(String),
            );
        });
    });

    describe("Error en base de datos al eliminar", () => {
        it("propaga el error si el delete lanza una excepción", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockRejectedValue(
                new Error("DB connection error"),
            );

            jest.spyOn(console, "error").mockImplementation(() => {});

            await expect(
                removeEmployeeFromPersonalEvent(
                    personalEventId,
                    employeeId,
                    coordinatorUser,
                    clientIp,
                ),
            ).rejects.toThrow("DB connection error");

            jest.restoreAllMocks();
        });

        it("no crea log si el delete falla", async () => {
            getModel.findPersonalEventByIdIncludeDeleted.mockResolvedValue(mockTrainingEvent);
            getModel.findEmployeeInPersonalEvent.mockResolvedValue(mockRelation);
            deleteModel.removeEmployeeFromPersonalEvent.mockRejectedValue(
                new Error("DB error"),
            );

            jest.spyOn(console, "error").mockImplementation(() => {});

            await expect(
                removeEmployeeFromPersonalEvent(
                    personalEventId,
                    employeeId,
                    coordinatorUser,
                    clientIp,
                ),
            ).rejects.toThrow();

            expect(createLog).not.toHaveBeenCalled();

            jest.restoreAllMocks();
        });
    });
});

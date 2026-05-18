const {
    rejectVacationRequest,
} = require("../../service/vacation/update.service");

const employeeGetModel = require("../../model/employee/get.model");
const vacationGetModel = require("../../model/vacation/get.model");
const vacationUpdateModel = require("../../model/vacation/update.model");
const logModel = require("../../model/log.model");

const RESPONSES = require("../../utils/responses");
const { VACATION_STATUS } = require("../../utils/vacationStatus");
const { LOG_ACTIONS } = require("../../utils/logActions");

jest.mock("../../model/employee/get.model");
jest.mock("../../model/vacation/get.model");
jest.mock("../../model/vacation/update.model");
jest.mock("../../model/log.model");

describe("US35 - rejectVacationRequest service", () => {
    const actorEmployeeId = "e3500000-0000-4000-8000-000000000001";
    const targetEmployeeId = "e3500000-0000-4000-8000-000000000003";
    const vacationRequestId = "c3500000-0000-4000-8000-000000000014";
    const ipAddress = "127.0.0.1";

    const actorCoordinator = {
        employee_id: actorEmployeeId,
        house_id: "a0000001-0000-4000-8000-000000000001",
        role: {
            name: "Coordinador",
        },
    };

    const targetEmployee = {
        employee_id: targetEmployeeId,
        house_id: "a0000001-0000-4000-8000-000000000001",
        role: {
            name: "Mantenimiento",
        },
    };

    const pendingVacationRequest = {
        vacations_request_id: vacationRequestId,
        employee_id: targetEmployeeId,
        start: new Date("2026-12-01T00:00:00.000Z"),
        end: new Date("2026-12-03T00:00:00.000Z"),
        status: VACATION_STATUS.PENDING,
        feedback: null,
        created_at: new Date("2026-05-13T16:35:24.746Z"),
        used_days: 3,
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("regresa VALIDATION_ERROR si el contrato interno es inválido", async () => {
        const result = await rejectVacationRequest({
            actorEmployeeId: "no-es-uuid",
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.VALIDATION_ERROR);
        expect(
            employeeGetModel.findByIdWithRoleAndHouse,
        ).not.toHaveBeenCalled();
        expect(
            vacationUpdateModel.rejectVacationRequestAtomically,
        ).not.toHaveBeenCalled();
    });

    it("regresa NOT_ACCESS si el actor no existe", async () => {
        employeeGetModel.findByIdWithRoleAndHouse.mockResolvedValueOnce(null);

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
        expect(employeeGetModel.findByIdWithRoleAndHouse).toHaveBeenCalledWith(
            actorEmployeeId,
        );
    });

    it("regresa INSUFFICIENT_PERMISSIONS si el actor no es Coordinador", async () => {
        employeeGetModel.findByIdWithRoleAndHouse.mockResolvedValueOnce({
            ...actorCoordinator,
            role: {
                name: "Administrador",
            },
        });

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS);
        expect(vacationGetModel.getVacationRequestById).not.toHaveBeenCalled();
    });

    it("regresa REQUEST_NOT_FOUND si la solicitud no existe", async () => {
        employeeGetModel.findByIdWithRoleAndHouse.mockResolvedValueOnce(
            actorCoordinator,
        );
        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(null);

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUEST_NOT_FOUND);
    });

    it("regresa REQUEST_ALREADY_REVIEWED si la solicitud ya fue aprobada", async () => {
        employeeGetModel.findByIdWithRoleAndHouse.mockResolvedValueOnce(
            actorCoordinator,
        );
        vacationGetModel.getVacationRequestById.mockResolvedValueOnce({
            ...pendingVacationRequest,
            status: VACATION_STATUS.APPROVED,
        });

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED);
    });

    it("regresa REQUEST_ALREADY_REVIEWED si la solicitud ya fue rechazada", async () => {
        employeeGetModel.findByIdWithRoleAndHouse.mockResolvedValueOnce(
            actorCoordinator,
        );
        vacationGetModel.getVacationRequestById.mockResolvedValueOnce({
            ...pendingVacationRequest,
            status: VACATION_STATUS.REJECTED,
        });

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED);
    });

    it("regresa EMPLOYEE.NOT_FOUND si el empleado dueño de la solicitud no existe", async () => {
        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce(null);

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(
            pendingVacationRequest,
        );

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si el empleado pertenece a otra casa", async () => {
        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce({
                ...targetEmployee,
                house_id: "b0000001-0000-4000-8000-000000000001",
            });

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(
            pendingVacationRequest,
        );

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE);
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si el empleado objetivo es Administrador", async () => {
        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce({
                ...targetEmployee,
                role: {
                    name: "Administrador",
                },
            });

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(
            pendingVacationRequest,
        );

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE);
    });

    it("rechaza correctamente sin feedback", async () => {
        const rejectedVacationRequest = {
            ...pendingVacationRequest,
            status: VACATION_STATUS.REJECTED,
            feedback: null,
        };

        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce(targetEmployee);

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(
            pendingVacationRequest,
        );

        vacationUpdateModel.rejectVacationRequestAtomically.mockResolvedValueOnce(
            {
                success: true,
                data: {
                    vacationRequest: rejectedVacationRequest,
                },
            },
        );

        logModel.createLog.mockResolvedValueOnce(undefined);

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.REJECTED);
        expect(result.data.vacationRequest.status).toBe(
            VACATION_STATUS.REJECTED,
        );
        expect(result.data.vacationRequest.feedback).toBeNull();

        expect(
            vacationUpdateModel.rejectVacationRequestAtomically,
        ).toHaveBeenCalledWith({
            vacationRequestId,
            employeeId: targetEmployeeId,
            actorHouseId: actorCoordinator.house_id,
            feedback: undefined,
        });

        expect(logModel.createLog).toHaveBeenCalledWith(
            actorEmployeeId,
            LOG_ACTIONS.VACATION_REJECTED_SUCCESS,
            ipAddress,
            targetEmployeeId,
        );
    });

    it("rechaza correctamente con feedback válido", async () => {
        const feedback = "Periodo de alta demanda operativa";

        const rejectedVacationRequest = {
            ...pendingVacationRequest,
            status: VACATION_STATUS.REJECTED,
            feedback,
        };

        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce(targetEmployee);

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(
            pendingVacationRequest,
        );

        vacationUpdateModel.rejectVacationRequestAtomically.mockResolvedValueOnce(
            {
                success: true,
                data: {
                    vacationRequest: rejectedVacationRequest,
                },
            },
        );

        logModel.createLog.mockResolvedValueOnce(undefined);

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            feedback,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.REJECTED);
        expect(result.data.vacationRequest.feedback).toBe(feedback);

        expect(
            vacationUpdateModel.rejectVacationRequestAtomically,
        ).toHaveBeenCalledWith({
            vacationRequestId,
            employeeId: targetEmployeeId,
            actorHouseId: actorCoordinator.house_id,
            feedback,
        });
    });

    it("si falla el log, no rompe el rechazo exitoso", async () => {
        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce(targetEmployee);

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(
            pendingVacationRequest,
        );

        vacationUpdateModel.rejectVacationRequestAtomically.mockResolvedValueOnce(
            {
                success: true,
                data: {
                    vacationRequest: {
                        ...pendingVacationRequest,
                        status: VACATION_STATUS.REJECTED,
                        feedback: null,
                    },
                },
            },
        );

        logModel.createLog.mockRejectedValueOnce(new Error("Log failed"));

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.REJECTED);
    });

    it("propaga código de error si la transacción detecta solicitud ya revisada", async () => {
        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce(targetEmployee);

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(
            pendingVacationRequest,
        );

        vacationUpdateModel.rejectVacationRequestAtomically.mockResolvedValueOnce(
            {
                success: false,
                code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
            },
        );

        const result = await rejectVacationRequest({
            actorEmployeeId,
            vacationRequestId,
            feedback: "Rechazo concurrente",
            ipAddress,
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED);
        expect(logModel.createLog).not.toHaveBeenCalled();
    });
});

const prisma = require("../../../src/prisma");
const {
    rejectVacationRequestAtomically,
} = require("../../../src/model/vacation/update.model");

const RESPONSES = require("../../../src/utils/responses");
const { VACATION_STATUS } = require("../../../src/utils/vacationStatus");

jest.mock("../../../src/prisma", () => ({
    $transaction: jest.fn(),
}));

describe("US35 - rejectVacationRequestAtomically model", () => {
    const vacationRequestId = "c3500000-0000-4000-8000-000000000014";
    const employeeId = "e3500000-0000-4000-8000-000000000013";
    const actorHouseId = "a0000001-0000-4000-8000-000000000001";

    const pendingVacationRequest = {
        vacations_request_id: vacationRequestId,
        employee_id: employeeId,
        start: new Date("2026-12-01T00:00:00.000Z"),
        end: new Date("2026-12-03T00:00:00.000Z"),
        status: VACATION_STATUS.PENDING,
        feedback: null,
        used_days: 3,
    };

    const targetEmployee = {
        employee_id: employeeId,
        house_id: actorHouseId,
        role: {
            name: "Mantenimiento",
        },
    };

    const buildTransaction = ({
        vacationRequest = pendingVacationRequest,
        employee = targetEmployee,
        updatedVacationRequest = {
            ...pendingVacationRequest,
            status: VACATION_STATUS.REJECTED,
            feedback: null,
        },
    } = {}) => ({
        $queryRaw: jest.fn().mockResolvedValue([{ employee_id: employeeId }]),
        vacations_request: {
            findUnique: jest.fn().mockResolvedValue(vacationRequest),
            update: jest.fn().mockResolvedValue(updatedVacationRequest),
        },
        employee: {
            findUnique: jest.fn().mockResolvedValue(employee),
        },
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("bloquea al empleado y rechaza solicitud pendiente sin feedback", async () => {
        const tx = buildTransaction();

        prisma.$transaction.mockImplementationOnce(async (callback) => {
            return callback(tx);
        });

        const result = await rejectVacationRequestAtomically({
            vacationRequestId,
            employeeId,
            actorHouseId,
            feedback: null,
        });

        expect(result.success).toBe(true);
        expect(result.data.vacationRequest.status).toBe(
            VACATION_STATUS.REJECTED,
        );
        expect(result.data.vacationRequest.feedback).toBeNull();

        expect(tx.$queryRaw).toHaveBeenCalled();
        expect(tx.vacations_request.findUnique).toHaveBeenCalledWith({
            where: {
                vacations_request_id: vacationRequestId,
            },
        });

        expect(tx.vacations_request.update).toHaveBeenCalledWith({
            where: {
                vacations_request_id: vacationRequestId,
            },
            data: {
                status: VACATION_STATUS.REJECTED,
                feedback: null,
            },
        });
    });

    it("rechaza solicitud pendiente con feedback", async () => {
        const feedback = "Periodo de alta demanda operativa";

        const tx = buildTransaction({
            updatedVacationRequest: {
                ...pendingVacationRequest,
                status: VACATION_STATUS.REJECTED,
                feedback,
            },
        });

        prisma.$transaction.mockImplementationOnce(async (callback) => {
            return callback(tx);
        });

        const result = await rejectVacationRequestAtomically({
            vacationRequestId,
            employeeId,
            actorHouseId,
            feedback,
        });

        expect(result.success).toBe(true);
        expect(result.data.vacationRequest.feedback).toBe(feedback);

        expect(tx.vacations_request.update).toHaveBeenCalledWith({
            where: {
                vacations_request_id: vacationRequestId,
            },
            data: {
                status: VACATION_STATUS.REJECTED,
                feedback,
            },
        });
    });

    it("regresa REQUEST_NOT_FOUND si la solicitud no existe dentro de la transacción", async () => {
        const tx = buildTransaction({
            vacationRequest: null,
        });

        prisma.$transaction.mockImplementationOnce(async (callback) => {
            return callback(tx);
        });

        const result = await rejectVacationRequestAtomically({
            vacationRequestId,
            employeeId,
            actorHouseId,
            feedback: null,
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe(RESPONSES.VACATION.REQUEST_NOT_FOUND);
        expect(tx.vacations_request.update).not.toHaveBeenCalled();
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si la solicitud pertenece a otro empleado", async () => {
        const tx = buildTransaction({
            vacationRequest: {
                ...pendingVacationRequest,
                employee_id: "e3500000-0000-4000-8000-999999999999",
            },
        });

        prisma.$transaction.mockImplementationOnce(async (callback) => {
            return callback(tx);
        });

        const result = await rejectVacationRequestAtomically({
            vacationRequestId,
            employeeId,
            actorHouseId,
            feedback: null,
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe(RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE);
        expect(tx.vacations_request.update).not.toHaveBeenCalled();
    });

    it("regresa EMPLOYEE.NOT_FOUND si el empleado objetivo no existe", async () => {
        const tx = buildTransaction({
            employee: null,
        });

        prisma.$transaction.mockImplementationOnce(async (callback) => {
            return callback(tx);
        });

        const result = await rejectVacationRequestAtomically({
            vacationRequestId,
            employeeId,
            actorHouseId,
            feedback: null,
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
        expect(tx.vacations_request.update).not.toHaveBeenCalled();
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si el empleado objetivo es Administrador", async () => {
        const tx = buildTransaction({
            employee: {
                ...targetEmployee,
                role: {
                    name: "Administrador",
                },
            },
        });

        prisma.$transaction.mockImplementationOnce(async (callback) => {
            return callback(tx);
        });

        const result = await rejectVacationRequestAtomically({
            vacationRequestId,
            employeeId,
            actorHouseId,
            feedback: null,
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe(RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE);
        expect(tx.vacations_request.update).not.toHaveBeenCalled();
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si el empleado objetivo pertenece a otra casa", async () => {
        const tx = buildTransaction({
            employee: {
                ...targetEmployee,
                house_id: "b0000001-0000-4000-8000-000000000001",
            },
        });

        prisma.$transaction.mockImplementationOnce(async (callback) => {
            return callback(tx);
        });

        const result = await rejectVacationRequestAtomically({
            vacationRequestId,
            employeeId,
            actorHouseId,
            feedback: null,
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe(RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE);
        expect(tx.vacations_request.update).not.toHaveBeenCalled();
    });

    it("regresa REQUEST_ALREADY_REVIEWED si la solicitud ya no está pendiente", async () => {
        const tx = buildTransaction({
            vacationRequest: {
                ...pendingVacationRequest,
                status: VACATION_STATUS.APPROVED,
            },
        });

        prisma.$transaction.mockImplementationOnce(async (callback) => {
            return callback(tx);
        });

        const result = await rejectVacationRequestAtomically({
            vacationRequestId,
            employeeId,
            actorHouseId,
            feedback: null,
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe(RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED);
        expect(tx.vacations_request.update).not.toHaveBeenCalled();
    });
});

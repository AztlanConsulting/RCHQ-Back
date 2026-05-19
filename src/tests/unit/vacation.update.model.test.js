jest.mock("../../prisma", () => ({
    $transaction: jest.fn(),
}));

const prisma = require("../../prisma");

const {
    updateVacationRequestDatesAtomically,
} = require("../../model/vacation/update.model");

const RESPONSES = require("../../utils/responses");
const { VACATION_STATUS } = require("../../utils/vacationStatus");

describe("updateVacationRequestDatesAtomically model", () => {
    const vacationRequestId = "33333333-3333-4333-8333-333333333333";
    const employeeId = "22222222-2222-4222-8222-222222222222";
    const actorHouseId = "44444444-4444-4444-8444-444444444444";

    const params = {
        vacationRequestId,
        employeeId,
        actorHouseId,
        startDate: new Date("2026-06-16T00:00:00.000Z"),
        endDate: new Date("2026-06-19T00:00:00.000Z"),
        usedDays: 4,
        anniversaryStartDate: new Date("2026-04-09T00:00:00.000Z"),
        anniversaryEndDate: new Date("2027-04-08T00:00:00.000Z"),
        maxDays: 12,
    };

    const vacationRequest = {
        vacations_request_id: vacationRequestId,
        employee_id: employeeId,
        start: new Date("2026-06-10T00:00:00.000Z"),
        end: new Date("2026-06-15T00:00:00.000Z"),
        status: VACATION_STATUS.PENDING,
        used_days: 4,
    };

    const targetEmployee = {
        employee_id: employeeId,
        house_id: actorHouseId,
        role: {
            name: "Mantenimiento",
        },
    };

    const buildTransaction = ({
        foundVacationRequest = vacationRequest,
        foundEmployee = targetEmployee,
        overlappingVacation = null,
        activeVacations = [],
        updatedVacation = {
            ...vacationRequest,
            start: params.startDate,
            end: params.endDate,
            used_days: params.usedDays,
        },
    } = {}) => ({
        $queryRaw: jest.fn().mockResolvedValue([{ employee_id: employeeId }]),
        vacations_request: {
            findUnique: jest.fn().mockResolvedValue(foundVacationRequest),
            findFirst: jest.fn().mockResolvedValue(overlappingVacation),
            findMany: jest.fn().mockResolvedValue(activeVacations),
            update: jest.fn().mockResolvedValue(updatedVacation),
        },
        employee: {
            findUnique: jest.fn().mockResolvedValue(foundEmployee),
        },
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("actualiza fechas y used_days correctamente dentro de una transacción", async () => {
        const transaction = buildTransaction();

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result.success).toBe(true);
        expect(result.data.vacationRequest.start).toEqual(params.startDate);
        expect(result.data.vacationRequest.end).toEqual(params.endDate);
        expect(result.data.vacationRequest.used_days).toBe(params.usedDays);

        expect(transaction.$queryRaw).toHaveBeenCalled();
        expect(transaction.vacations_request.update).toHaveBeenCalledWith({
            where: {
                vacations_request_id: vacationRequestId,
            },
            data: {
                start: params.startDate,
                end: params.endDate,
                used_days: params.usedDays,
            },
        });
    });

    it("regresa REQUEST_NOT_FOUND si no existe la solicitud", async () => {
        const transaction = buildTransaction({
            foundVacationRequest: null,
        });

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si la solicitud pertenece a otro empleado", async () => {
        const transaction = buildTransaction({
            foundVacationRequest: {
                ...vacationRequest,
                employee_id: "99999999-9999-4999-8999-999999999999",
            },
        });

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        });
    });

    it("regresa EMPLOYEE.NOT_FOUND si no existe el empleado", async () => {
        const transaction = buildTransaction({
            foundEmployee: null,
        });

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result).toEqual({
            success: false,
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        });
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si el empleado es Administrador", async () => {
        const transaction = buildTransaction({
            foundEmployee: {
                ...targetEmployee,
                role: {
                    name: "Administrador",
                },
            },
        });

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        });
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si el empleado es de otra casa", async () => {
        const transaction = buildTransaction({
            foundEmployee: {
                ...targetEmployee,
                house_id: "55555555-5555-4555-8555-555555555555",
            },
        });

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        });
    });

    it("regresa REQUEST_NOT_MODIFIABLE si la solicitud está rechazada", async () => {
        const transaction = buildTransaction({
            foundVacationRequest: {
                ...vacationRequest,
                status: VACATION_STATUS.REJECTED,
            },
        });

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.REQUEST_NOT_MODIFIABLE,
        });
    });

    it("permite modificar solicitudes aprobadas", async () => {
        const transaction = buildTransaction({
            foundVacationRequest: {
                ...vacationRequest,
                status: VACATION_STATUS.APPROVED,
            },
        });

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result.success).toBe(true);
    });

    it("regresa OUT_OF_RANGE si las fechas salen del periodo laboral", async () => {
        const transaction = buildTransaction();

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically({
            ...params,
            startDate: new Date("2027-04-09T00:00:00.000Z"),
            endDate: new Date("2027-04-10T00:00:00.000Z"),
        });

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.OUT_OF_RANGE,
        });
    });

    it("regresa ALREADY_REQUEST si hay traslape con otra solicitud activa", async () => {
        const transaction = buildTransaction({
            overlappingVacation: {
                vacations_request_id: "66666666-6666-4666-8666-666666666666",
            },
        });

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.ALREADY_REQUEST,
        });
    });

    it("regresa INSUFFICIENT_DATES si excede los días disponibles", async () => {
        const transaction = buildTransaction({
            activeVacations: [
                {
                    used_days: 10,
                },
            ],
        });

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        const result = await updateVacationRequestDatesAtomically(params);

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.INSUFFICIENT_DATES,
        });
    });

    it("excluye la misma solicitud al validar traslape y días usados", async () => {
        const transaction = buildTransaction();

        prisma.$transaction.mockImplementation(async (callback) =>
            callback(transaction)
        );

        await updateVacationRequestDatesAtomically(params);

        expect(transaction.vacations_request.findFirst).toHaveBeenCalledWith({
            where: {
                employee_id: employeeId,
                vacations_request_id: {
                    not: vacationRequestId,
                },
                status: {
                    in: expect.any(Array),
                },
                start: {
                    lte: params.endDate,
                },
                end: {
                    gte: params.startDate,
                },
            },
        });

        expect(transaction.vacations_request.findMany).toHaveBeenCalledWith({
            where: {
                employee_id: employeeId,
                vacations_request_id: {
                    not: vacationRequestId,
                },
                status: {
                    in: expect.any(Array),
                },
                start: {
                    lte: params.anniversaryEndDate,
                },
                end: {
                    gte: params.anniversaryStartDate,
                },
            },
            select: {
                used_days: true,
            },
        });
    });
});

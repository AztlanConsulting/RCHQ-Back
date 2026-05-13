jest.mock("../../prisma", () => ({
    $transaction: jest.fn(),
}));

const prisma = require("../../prisma");

const {
    approveVacationRequestAtomically,
} = require("../../model/vacation/update.model");

const RESPONSES = require("../../utils/responses");

const {
    VACATION_STATUS,
    ACTIVE_VACATION_STATUSES,
} = require("../../utils/vacationStatus");

describe("vacation.update.model — approveVacationRequestAtomically", () => {
    const vacationRequestId = "vacation-request-id";
    const employeeId = "employee-id";
    const actorHouseId = "house-1";

    const startDate = new Date(Date.UTC(2026, 5, 22));
    const endDate = new Date(Date.UTC(2026, 5, 26));
    const anniversaryStartDate = new Date(Date.UTC(2026, 3, 9));
    const anniversaryEndDate = new Date(Date.UTC(2027, 3, 8));

    const baseVacationRequest = {
        vacations_request_id: vacationRequestId,
        employee_id: employeeId,
        start: startDate,
        end: endDate,
        status: VACATION_STATUS.PENDING,
        used_days: 5,
    };

    const targetEmployee = {
        employee_id: employeeId,
        house_id: actorHouseId,
        role: {
            name: "Psicóloga",
        },
    };

    let transaction;

    beforeEach(() => {
        jest.clearAllMocks();

        transaction = {
            $queryRaw: jest.fn(),
            vacations_request: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
            },
            employee: {
                findUnique: jest.fn(),
            },
        };

        prisma.$transaction.mockImplementation(async (callback) => {
            return await callback(transaction);
        });

        transaction.vacations_request.findUnique.mockResolvedValue(
            baseVacationRequest
        );

        transaction.employee.findUnique.mockResolvedValue(targetEmployee);

        transaction.vacations_request.findFirst.mockResolvedValue(null);

        transaction.vacations_request.findMany.mockResolvedValue([]);

        transaction.vacations_request.update.mockResolvedValue({
            ...baseVacationRequest,
            status: VACATION_STATUS.APPROVED,
        });
    });

    async function callApprove(options = {}) {
        return await approveVacationRequestAtomically({
            vacationRequestId: options.vacationRequestId ?? vacationRequestId,
            employeeId: options.employeeId ?? employeeId,
            actorHouseId: options.actorHouseId ?? actorHouseId,
            usedDays: options.usedDays ?? 5,
            anniversaryStartDate:
                options.anniversaryStartDate ?? anniversaryStartDate,
            anniversaryEndDate:
                options.anniversaryEndDate ?? anniversaryEndDate,
            maxDays: options.maxDays ?? 14,
        });
    }

    test("aprueba solicitud pendiente dentro de una transacción si todo es válido", async () => {
        const result = await callApprove();

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(transaction.$queryRaw).toHaveBeenCalledTimes(1);

        expect(transaction.vacations_request.findUnique).toHaveBeenCalledWith({
            where: {
                vacations_request_id: vacationRequestId,
            },
        });

        expect(transaction.employee.findUnique).toHaveBeenCalledWith({
            where: {
                employee_id: employeeId,
            },
            include: {
                role: true,
            },
        });

        expect(transaction.vacations_request.findFirst).toHaveBeenCalledWith({
            where: {
                employee_id: employeeId,
                vacations_request_id: {
                    not: vacationRequestId,
                },
                status: VACATION_STATUS.APPROVED,
                start: {
                    lte: endDate,
                },
                end: {
                    gte: startDate,
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
                    in: ACTIVE_VACATION_STATUSES,
                },
                start: {
                    lte: anniversaryEndDate,
                },
                end: {
                    gte: anniversaryStartDate,
                },
            },
            select: {
                used_days: true,
            },
        });

        expect(transaction.vacations_request.update).toHaveBeenCalledWith({
            where: {
                vacations_request_id: vacationRequestId,
            },
            data: {
                status: VACATION_STATUS.APPROVED,
                used_days: 5,
            },
        });

        expect(result.success).toBe(true);
        expect(result.data.vacationRequest.status).toBe(VACATION_STATUS.APPROVED);
    });

    test("retorna REQUEST_NOT_FOUND si la solicitud no existe", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce(null);

        const result = await callApprove();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    test("retorna EMPLOYEE_OUT_OF_SCOPE si la solicitud pertenece a otro empleado", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            employee_id: "another-employee-id",
        });

        const result = await callApprove();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    test("retorna EMPLOYEE.NOT_FOUND si el empleado no existe", async () => {
        transaction.employee.findUnique.mockResolvedValueOnce(null);

        const result = await callApprove();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    test("coordinador no puede aprobar solicitud de un admin", async () => {
        transaction.employee.findUnique.mockResolvedValueOnce({
            ...targetEmployee,
            role: {
                name: "Admin",
            },
        });

        const result = await callApprove();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    test("coordinador no puede aprobar solicitud de empleado de otra casa", async () => {
        transaction.employee.findUnique.mockResolvedValueOnce({
            ...targetEmployee,
            house_id: "house-2",
        });

        const result = await callApprove();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    test("retorna REQUEST_ALREADY_REVIEWED si la solicitud ya no está pendiente", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            status: VACATION_STATUS.APPROVED,
        });

        const result = await callApprove();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    test("retorna OUT_OF_RANGE si la solicitud está fuera del año laboral", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            start: new Date(Date.UTC(2028, 0, 1)),
            end: new Date(Date.UTC(2028, 0, 5)),
        });

        const result = await callApprove();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.OUT_OF_RANGE,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    test("retorna APPROVED_OVERLAP si encuentra vacaciones aprobadas traslapadas", async () => {
        transaction.vacations_request.findFirst.mockResolvedValueOnce({
            vacations_request_id: "approved-overlap-id",
            employee_id: employeeId,
            status: VACATION_STATUS.APPROVED,
            start: new Date(Date.UTC(2026, 5, 24)),
            end: new Date(Date.UTC(2026, 5, 25)),
        });

        const result = await callApprove();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.APPROVED_OVERLAP,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    test("retorna INSUFFICIENT_DATES si PENDING + APPROVED + solicitud actual excede maxDays", async () => {
        transaction.vacations_request.findMany.mockResolvedValueOnce([
            { used_days: 10 },
        ]);

        const result = await callApprove({
            usedDays: 5,
            maxDays: 14,
        });

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.INSUFFICIENT_DATES,
        });

        expect(transaction.vacations_request.update).not.toHaveBeenCalled();
    });

    test("permite aprobar si el total activo queda exactamente en maxDays", async () => {
        transaction.vacations_request.findMany.mockResolvedValueOnce([
            { used_days: 9 },
        ]);

        const result = await callApprove({
            usedDays: 5,
            maxDays: 14,
        });

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.update).toHaveBeenCalledTimes(1);
    });
});
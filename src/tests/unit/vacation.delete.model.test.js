jest.mock("../../prisma", () => ({
    $transaction: jest.fn(),
}));

const prisma = require("../../prisma");

const {
    deleteVacationRequestAtomically,
} = require("../../model/vacation/delete.model");

const RESPONSES = require("../../utils/responses");
const { VACATION_STATUS } = require("../../utils/vacationStatus");
const { ROLES } = require("../../utils/roles");

describe("vacation.delete.model — deleteVacationRequestAtomically", () => {
    const vacationRequestId = "44444444-4444-4444-8444-444444444444";
    const employeeId = "33333333-3333-4333-8333-333333333333";
    const actorHouseId = "house-1";

    const baseVacationRequest = {
        vacations_request_id: vacationRequestId,
        employee_id: employeeId,
        start: new Date(Date.UTC(2026, 5, 22)),
        end: new Date(Date.UTC(2026, 5, 26)),
        status: VACATION_STATUS.PENDING,
        used_days: 5,
        feedback: null,
        created_at: new Date(Date.UTC(2026, 4, 1)),
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
                delete: jest.fn(),
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

        transaction.vacations_request.delete.mockResolvedValue(
            baseVacationRequest
        );
    });

    async function callDelete(options = {}) {
        return await deleteVacationRequestAtomically({
            vacationRequestId: options.vacationRequestId ?? vacationRequestId,
            employeeId: options.employeeId ?? employeeId,
            actorHouseId: options.actorHouseId ?? actorHouseId,
        });
    }

    test("elimina solicitud dentro de una transacción si todo es válido", async () => {
        const result = await callDelete();

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

        expect(transaction.vacations_request.delete).toHaveBeenCalledWith({
            where: {
                vacations_request_id: vacationRequestId,
            },
        });

        expect(result).toEqual({
            success: true,
            data: {
                vacationRequest: baseVacationRequest,
            },
        });
    });

    test("retorna REQUEST_NOT_FOUND si la solicitud no existe", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce(null);

        const result = await callDelete();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
        });

        expect(transaction.employee.findUnique).not.toHaveBeenCalled();
        expect(transaction.vacations_request.delete).not.toHaveBeenCalled();
    });

    test("retorna EMPLOYEE_OUT_OF_SCOPE si la solicitud pertenece a otro empleado", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            employee_id: "another-employee-id",
        });

        const result = await callDelete();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        });

        expect(transaction.employee.findUnique).not.toHaveBeenCalled();
        expect(transaction.vacations_request.delete).not.toHaveBeenCalled();
    });

    test("retorna EMPLOYEE.NOT_FOUND si el empleado no existe", async () => {
        transaction.employee.findUnique.mockResolvedValueOnce(null);

        const result = await callDelete();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        });

        expect(transaction.vacations_request.delete).not.toHaveBeenCalled();
    });

    test("retorna EMPLOYEE_OUT_OF_SCOPE si el empleado es Admin", async () => {
        transaction.employee.findUnique.mockResolvedValueOnce({
            ...targetEmployee,
            role: {
                name: ROLES.ADMIN,
            },
        });

        const result = await callDelete();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        });

        expect(transaction.vacations_request.delete).not.toHaveBeenCalled();
    });

    test("retorna EMPLOYEE_OUT_OF_SCOPE si el empleado pertenece a otra casa", async () => {
        transaction.employee.findUnique.mockResolvedValueOnce({
            ...targetEmployee,
            house_id: "house-2",
        });

        const result = await callDelete();

        expect(result).toEqual({
            success: false,
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        });

        expect(transaction.vacations_request.delete).not.toHaveBeenCalled();
    });

    test("permite eliminar solicitud pendiente", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            status: VACATION_STATUS.PENDING,
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });

    test("permite eliminar solicitud aprobada", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            status: VACATION_STATUS.APPROVED,
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });

    test("permite eliminar solicitud rechazada", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            status: VACATION_STATUS.REJECTED,
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });
});

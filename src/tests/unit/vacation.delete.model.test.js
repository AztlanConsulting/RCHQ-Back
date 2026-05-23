jest.mock("../../prisma", () => ({
    $transaction: jest.fn(),
}));

const prisma = require("../../prisma");

const {
    deleteVacationRequestAtomically,
} = require("../../model/vacation/delete.model");

const RESPONSES = require("../../utils/responses");
const { VACATION_STATUS } = require("../../utils/vacationStatus");

describe("vacation.delete.model — deleteVacationRequestAtomically", () => {
    const vacationRequestId = "44444444-4444-4444-8444-444444444444";
    const employeeId = "33333333-3333-4333-8333-333333333333";

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
        house_id: "house-1",
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
            baseVacationRequest,
        );

        transaction.employee.findUnique.mockResolvedValue(targetEmployee);

        transaction.vacations_request.delete.mockResolvedValue(
            baseVacationRequest,
        );
    });

    async function callDelete(options = {}) {
        return await deleteVacationRequestAtomically({
            vacationRequestId: options.vacationRequestId ?? vacationRequestId,
            employeeId: options.employeeId ?? employeeId,
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

    test("elimina la solicitud aunque el empleado sea Admin porque el alcance se valida en service/ABAC", async () => {
        transaction.employee.findUnique.mockResolvedValueOnce({
            ...targetEmployee,
            role: {
                name: "Administrador",
            },
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });

    test("elimina la solicitud aunque el empleado tenga otra casa porque el alcance se valida en service/ABAC", async () => {
        transaction.employee.findUnique.mockResolvedValueOnce({
            ...targetEmployee,
            house_id: "house-2",
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });

    test("permite eliminar solicitud pendiente futura", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            start: new Date(Date.UTC(2026, 5, 22)),
            end: new Date(Date.UTC(2026, 5, 26)),
            status: VACATION_STATUS.PENDING,
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });

    test("permite eliminar solicitud pendiente pasada", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            start: new Date(Date.UTC(2026, 3, 22)),
            end: new Date(Date.UTC(2026, 3, 26)),
            status: VACATION_STATUS.PENDING,
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });

    test("permite eliminar solicitud aprobada futura", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            start: new Date(Date.UTC(2026, 5, 22)),
            end: new Date(Date.UTC(2026, 5, 26)),
            status: VACATION_STATUS.APPROVED,
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });

    test("elimina solicitud aprobada en curso porque la regla de fecha se valida en service", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            start: new Date(Date.UTC(2026, 4, 20)),
            end: new Date(Date.UTC(2026, 4, 24)),
            status: VACATION_STATUS.APPROVED,
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });

    test("elimina solicitud aprobada pasada porque la regla de fecha se valida en service", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            start: new Date(Date.UTC(2026, 3, 22)),
            end: new Date(Date.UTC(2026, 3, 26)),
            status: VACATION_STATUS.APPROVED,
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });

    test("permite eliminar solicitud rechazada pasada", async () => {
        transaction.vacations_request.findUnique.mockResolvedValueOnce({
            ...baseVacationRequest,
            start: new Date(Date.UTC(2026, 3, 22)),
            end: new Date(Date.UTC(2026, 3, 26)),
            status: VACATION_STATUS.REJECTED,
        });

        const result = await callDelete();

        expect(result.success).toBe(true);
        expect(transaction.vacations_request.delete).toHaveBeenCalledTimes(1);
    });
});

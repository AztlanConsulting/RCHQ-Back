jest.mock("../../prisma", () => ({
    $transaction: jest.fn(),
}));

const prisma = require("../../prisma");
const { registerVacation } = require("../../model/vacation/create.model");
const {
    VACATION_STATUS,
    ACTIVE_VACATION_STATUSES,
} = require("../../utils/vacationStatus");

describe("vacation.create.model — registerVacation", () => {
    const vacationId = "vacation-id";
    const employeeId = "employee-id";
    const startDate = new Date(Date.UTC(2026, 5, 22));
    const endDate = new Date(Date.UTC(2026, 5, 26));
    const usedDays = 5;

    let tx;

    beforeEach(() => {
        jest.clearAllMocks();

        tx = {
            $queryRaw: jest.fn(),
            vacations_request: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                create: jest.fn(),
            },
            employee: {
                findUnique: jest.fn(),
            },
        };

        prisma.$transaction.mockImplementation(async (callback) => {
            return await callback(tx);
        });
    });

    test("crea vacaciones aprobadas dentro de una transacción si no hay traslape", async () => {
        const createdVacation = {
            vacations_request_id: vacationId,
            employee_id: employeeId,
            start: startDate,
            end: endDate,
            status: VACATION_STATUS.APPROVED,
            used_days: usedDays,
            created_at: new Date(),
        };

        tx.vacations_request.findFirst.mockResolvedValueOnce(null);
        tx.vacations_request.create.mockResolvedValueOnce(createdVacation);

        const result = await registerVacation(
            vacationId,
            employeeId,
            startDate,
            endDate,
            usedDays,
        );

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(tx.$queryRaw).toHaveBeenCalledTimes(1);

        expect(tx.vacations_request.findFirst).toHaveBeenCalledWith({
            where: {
                employee_id: employeeId,
                status: {
                    in: ACTIVE_VACATION_STATUSES,
                },
                start: {
                    lte: endDate,
                },
                end: {
                    gte: startDate,
                },
            },
        });

        expect(tx.vacations_request.create).toHaveBeenCalledWith({
            data: {
                vacations_request_id: vacationId,
                employee_id: employeeId,
                start: startDate,
                end: endDate,
                status: VACATION_STATUS.APPROVED,
                used_days: usedDays,
                created_at: expect.any(Date),
            },
        });

        expect(result).toBe(createdVacation);
    });

    test("retorna null y no crea vacaciones si encuentra traslape dentro de la transacción", async () => {
        tx.vacations_request.findFirst.mockResolvedValueOnce({
            vacations_request_id: "overlap-id",
            employee_id: employeeId,
            start: new Date(Date.UTC(2026, 5, 23)),
            end: new Date(Date.UTC(2026, 5, 24)),
            status: VACATION_STATUS.APPROVED,
        });

        const result = await registerVacation(
            vacationId,
            employeeId,
            startDate,
            endDate,
            usedDays,
        );

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
        expect(tx.vacations_request.findFirst).toHaveBeenCalledTimes(1);
        expect(tx.vacations_request.create).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });
});

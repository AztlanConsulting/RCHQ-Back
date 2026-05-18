const vacationGetService = require("../../service/vacation/get.service");

jest.mock("../../model/employee/get.model");
jest.mock("../../model/event/get.model");
jest.mock("../../model/vacation/get.model");
jest.mock("../../model/vacation/create.model");
jest.mock("../../model/log.model");
jest.mock("../../utils/ip");
jest.mock("../../utils/dates", () => {
    const actual = jest.requireActual("../../utils/dates");

    return {
        ...actual,
        calculateUsedDays: jest.fn(),
    };
});

const employeeModel = require("../../model/employee/get.model");
const vacationGetModel = require("../../model/vacation/get.model");
const RESPONSES = require("../../utils/responses");

const EMPLOYEE_ID = 1;

describe("vacation.service — requestVacation", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("Flujo - Verificar días de trabajo", () => {
        it("retorna días de vacaciones libres y su rango", async () => {
            employeeModel.getStartDate.mockResolvedValue({
                start_date: new Date("2020-06-01"),
            });

            vacationGetModel.getVacationsInRange.mockResolvedValue([]);

            const result =
                await vacationGetService.getRemainingVacations(EMPLOYEE_ID);

            expect(result.code).toBe(
                RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
            );
            expect(result.data.startDate.getTime()).toBe(
                new Date("2025-06-01").getTime(),
            );
            expect(result.data.endDate.getTime()).toBe(
                new Date("2026-05-31").getTime(),
            );
        });
    });

    describe("Flujo - Sin día de trabajo inicial", () => {
        it("retorna código de error", async () => {
            employeeModel.getStartDate.mockResolvedValue(undefined);

            vacationGetModel.getVacationsInRange.mockResolvedValue([]);

            const result =
                await vacationGetService.getRemainingVacations(EMPLOYEE_ID);

            expect(result.code).toBe(RESPONSES.VACATION.WITHOUT_START_DATE);
        });
    });
});

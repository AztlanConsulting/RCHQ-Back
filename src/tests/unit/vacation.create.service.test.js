const vacationCreateService = require("../../service/vacation/create.service");

jest.mock("../../service/vacation/get.service");
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

const vacationGetService = require("../../service/vacation/get.service");
const employeeModel = require("../../model/employee/get.model");
const eventsModel = require("../../model/event/get.model");
const vacationGetModel = require("../../model/vacation/get.model");
const vacationAddModel = require("../../model/vacation/create.model");
const logModel = require("../../model/log.model");
const ipUtils = require("../../utils/ip");
const RESPONSES = require("../../utils/responses");
const datesUtils = require("../../utils/dates");
const actualDatesUtils = jest.requireActual("../../utils/dates");

const EMPLOYEE_ID = 1;
const TODAY = new Date();
const RAW_START_DATE = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), TODAY.getUTCDate() + 1));
const RAW_END_DATE =   new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), TODAY.getUTCDate() + 4));

const START_DATE = `${RAW_START_DATE.getUTCFullYear()}-${RAW_START_DATE.getUTCMonth() + 1}-${RAW_START_DATE.getUTCDate()}`;
const END_DATE = `${RAW_END_DATE.getUTCFullYear()}-${RAW_END_DATE.getUTCMonth() + 1}-${RAW_END_DATE.getUTCDate()}`;

const CLIENT_IP = "127.0.0.1";
const mondayToFridayWorkDays = [
    { workday: { name: "Lunes" } },
    { workday: { name: "Martes" } },
    { workday: { name: "Miércoles" } },
    { workday: { name: "Jueves" } },
    { workday: { name: "Viernes" } },
];

describe("vacation.service — requestVacation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        employeeModel.getWorkDays.mockResolvedValue(mondayToFridayWorkDays);
        vacationGetService.getRemainingVacations.mockResolvedValue({
            data: {
                remainingDays: 10,
                startDate: new Date(Date.UTC(TODAY.getUTCFullYear(), 0, 1)),
                endDate: new Date(Date.UTC(TODAY.getUTCFullYear(), 11, 31)),
            },
        });
        eventsModel.getGlobalEventsInRange.mockResolvedValue([]);
        eventsModel.getHouseEventsInRange.mockResolvedValue([]);
        datesUtils.calculateUsedDays.mockReturnValue(5);
        vacationGetModel.getVacationsInRange.mockResolvedValue([]);
        vacationGetModel.getOutsideVacations.mockResolvedValue([]);
        ipUtils.getClientIp.mockReturnValue(CLIENT_IP);
    });

    describe("Flujo exitoso", () => {
        it("Crea una vacación", async () => {
            employeeModel.getHome.mockResolvedValue("1");

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                START_DATE,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.REQUESTED);
            expect(vacationAddModel.requestVacation).toHaveBeenCalled();
            expect(logModel.createLog).toHaveBeenCalled();
        });

        it("no cuenta los días si el empleado no trabaja en ellos", async () => {
            employeeModel.getWorkDays.mockResolvedValueOnce([
                { workday: { name: "Lunes" } },
                { workday: { name: "Miércoles" } },
                { workday: { name: "Viernes" } },
            ]);

            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: {
                    remainingDays: 10,
                    startDate: new Date("2026-01-01T00:00:00.000Z"),
                    endDate: new Date("2026-12-31T00:00:00.000Z"),
                },
            });

            datesUtils.calculateUsedDays.mockImplementation(
                actualDatesUtils.calculateUsedDays,
            );
            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                "2026-06-22",
                "2026-06-26",
                CLIENT_IP,
                "house-1",
            );

            expect(result.code).toBe(RESPONSES.VACATION.REQUESTED);
            expect(vacationAddModel.requestVacation).toHaveBeenCalledWith(
                expect.any(String),
                EMPLOYEE_ID,
                new Date("2026-06-22T00:00:00.000Z"),
                new Date("2026-06-26T00:00:00.000Z"),
                3,
            );
        });

        it("no cuenta los días feriados en eventos globales", async () => {
            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: {
                    remainingDays: 10,
                    startDate: new Date("2026-01-01T00:00:00.000Z"),
                    endDate: new Date("2026-12-31T00:00:00.000Z"),
                },
            });

            eventsModel.getGlobalEventsInRange.mockResolvedValue([
                {
                    start: new Date("2026-06-24T06:00:00.000Z"),
                    end: new Date("2026-06-25T05:59:00.000Z"),
                    isFreeDay: true,
                },
            ]);
            datesUtils.calculateUsedDays.mockImplementation(
                actualDatesUtils.calculateUsedDays,
            );

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                "2026-06-22",
                "2026-06-26",
                CLIENT_IP,
                "house-1",
            );

            expect(result.code).toBe(RESPONSES.VACATION.REQUESTED);
            expect(vacationAddModel.requestVacation).toHaveBeenCalledWith(
                expect.any(String),
                EMPLOYEE_ID,
                new Date("2026-06-22T00:00:00.000Z"),
                new Date("2026-06-26T00:00:00.000Z"),
                4,
            );
        });
    });

    describe("Flujo - fechas inválidas", () => {
        it("Verifica si las fecha de inicio es después de la final", async () => {
            employeeModel.getHome.mockResolvedValue("1");

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                END_DATE,
                START_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.DATES.BAD_DATES);
        });
    });

    describe("Flujo - sin días laborales", () => {
        it("Verifica que se tengan registrados los días de trabajo del empleado", async () => {
            employeeModel.getWorkDays.mockResolvedValueOnce([]);

            employeeModel.getHome.mockResolvedValue("1");

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                START_DATE,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.WITHOUT_DATES);
        });
    });

    describe("Flujo - días insuficientes", () => {
        it("Verifica que se tengan los días suficientes para pedir las vacaciones", async () => {
            vacationGetService.getRemainingVacations.mockResolvedValueOnce({
                data: { remainingDays: 2 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                START_DATE,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.INSUFFICIENT_DATES);
        });
    });

    describe("Flujo - traslape de vacaciones", () => {
        it("Verifica si se traslapan vacaciones dentro del rango pedido", async () => {
            employeeModel.getHome.mockResolvedValue("1");

            vacationGetModel.getVacationsInRange.mockResolvedValueOnce([{}]);

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                START_DATE,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.ALREADY_REQUEST);
        });

        it("Verifica si se traslapan vacaciones fuera del rango pedido", async () => {
            employeeModel.getHome.mockResolvedValue("1");

            vacationGetModel.getOutsideVacations.mockResolvedValueOnce([{}]);

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                START_DATE,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.ALREADY_REQUEST);
        });
    });

    describe("Flujo - sin días hábiles", () => {
        it("Verifica que se dentro de la solicitud haya al menos un día hábil seleciconado", async () => {
            employeeModel.getHome.mockResolvedValue("1");

            datesUtils.calculateUsedDays.mockReturnValueOnce(0);

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                START_DATE,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.NULL_DATES);
        });
    });

    describe("Flujo - vacación en el pasado", () => {
        it("Verifica que no se puedan pedir vacaciones en el pasado", async () => {
            employeeModel.getHome.mockResolvedValue("1");

            const rawYesterday = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), TODAY.getUTCDate() - 10));
            const yesterday = `${rawYesterday.getUTCFullYear()}-${rawYesterday.getUTCMonth() + 1}-${rawYesterday.getUTCDate()}`;

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                yesterday,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.PAST_REQUEST_NOT_ALLOWED);
        });
    });
});

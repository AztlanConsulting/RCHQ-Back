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

const EMPLOYEE_ID = 1;
const TODAY = new Date();
const RAW_START_DATE = new Date(
    Date.UTC(
        TODAY.getUTCFullYear(),
        TODAY.getUTCMonth(),
        TODAY.getUTCDate() + 1,
    ),
);
const RAW_END_DATE = new Date(
    Date.UTC(
        TODAY.getUTCFullYear(),
        TODAY.getUTCMonth(),
        TODAY.getUTCDate() + 4,
    ),
);

const START_DATE = `${RAW_START_DATE.getUTCFullYear()}-${RAW_START_DATE.getUTCMonth() + 1}-${RAW_START_DATE.getUTCDate()}`;
const END_DATE = `${RAW_END_DATE.getUTCFullYear()}-${RAW_END_DATE.getUTCMonth() + 1}-${RAW_END_DATE.getUTCDate()}`;

const CLIENT_IP = "127.0.0.1";

describe("vacation.service — requestVacation", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("Flujo exitoso", () => {
        it("Crea una vacación", async () => {
            employeeModel.getWorkDays.mockResolvedValue([1, 2, 3]);

            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationGetModel.getVacationsInRange.mockResolvedValue([]);
            vacationGetModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

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
    });

    describe("Flujo - fechas inválidas", () => {
        it("Verifica si las fecha de inicio es después de la final", async () => {
            employeeModel.getWorkDays.mockResolvedValue([1, 2, 3]);

            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationGetModel.getVacationsInRange.mockResolvedValue([]);
            vacationGetModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

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
            employeeModel.getWorkDays.mockResolvedValue([]);

            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationGetModel.getVacationsInRange.mockResolvedValue([]);
            vacationGetModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

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
            employeeModel.getWorkDays.mockResolvedValue([1, 2, 3]);

            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: { remainingDays: 2 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationGetModel.getVacationsInRange.mockResolvedValue([]);
            vacationGetModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

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
            employeeModel.getWorkDays.mockResolvedValue([1, 2, 3]);

            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationGetModel.getVacationsInRange.mockResolvedValue([{}]);
            vacationGetModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                START_DATE,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.ALREADY_REQUEST);
        });

        it("Verifica si se traslapan vacaciones fuera del rango pedido", async () => {
            employeeModel.getWorkDays.mockResolvedValue([1, 2, 3]);

            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationGetModel.getVacationsInRange.mockResolvedValue([]);
            vacationGetModel.getOutsideVacations.mockResolvedValue([{}]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

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
            employeeModel.getWorkDays.mockResolvedValue([1, 2, 3]);

            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: { remainingDays: 2 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(0);

            vacationGetModel.getVacationsInRange.mockResolvedValue([]);
            vacationGetModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

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
            employeeModel.getWorkDays.mockResolvedValue([1, 2, 3]);

            vacationGetService.getRemainingVacations.mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationGetModel.getVacationsInRange.mockResolvedValue([]);
            vacationGetModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const rawYesterday = new Date(
                Date.UTC(
                    TODAY.getUTCFullYear(),
                    TODAY.getUTCMonth(),
                    TODAY.getUTCDate() - 10,
                ),
            );
            const yesterday = `${rawYesterday.getUTCFullYear()}-${rawYesterday.getUTCMonth() + 1}-${rawYesterday.getUTCDate()}`;

            const result = await vacationCreateService.requestVacation(
                EMPLOYEE_ID,
                yesterday,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(
                RESPONSES.VACATION.PAST_REQUEST_NOT_ALLOWED,
            );
        });
    });
});

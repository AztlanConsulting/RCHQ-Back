const vacationService = require("../../service/vacation/add.service");

jest.mock("../../model/employee/consult.model");
jest.mock("../../model/event/getRanged.model");
jest.mock("../../model/vacation/consult.model");
jest.mock("../../model/vacation/add.model");
jest.mock("../../model/log.model");
jest.mock("../../utils/dates");
jest.mock("../../utils/ip");

const employeeModel = require("../../model/employee/consult.model");
const eventsModel = require("../../model/event/getRanged.model");
const vacationConsultModel = require("../../model/vacation/consult.model");
const vacationAddModel = require("../../model/vacation/add.model");
const logModel = require("../../model/log.model");
const datesUtils = require("../../utils/dates");
const ipUtils = require("../../utils/ip");
const RESPONSES = require("../../utils/responses");

const EMPLOYEE_ID = 1;
const TODAY = new Date();
const START_DATE = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), TODAY.getUTCDate() + 1));
const END_DATE = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), TODAY.getUTCDate() + 4));
const CLIENT_IP = "127.0.0.1";

describe("vacation.service — requestVacation", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("Flujo - Verificar días de trabajo", () => {
        it("retorna días de vacaciones libres y su rango", async () => {
            employeeModel.getStartDate.mockResolvedValue({
                start_date: new Date("2020-06-01"),
            });

            vacationConsultModel.getVacationsInRange.mockResolvedValue([]);

            const result =
                await vacationService.getRemainingVacations(EMPLOYEE_ID);

            expect(result.code).toBe(RESPONSES.VACATION.REMAINING_VACATIONS_FOUND);
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

            vacationConsultModel.getVacationsInRange.mockResolvedValue([]);

            const result =
                await vacationService.getRemainingVacations(START_DATE);

            expect(result.code).toBe(RESPONSES.VACATION.WITHOUT_START_DATE);
        });
    });

    describe("Flujo exitoso", () => {
        it("Crea una vacación", async () => {
            employeeModel.getWorkDays.mockResolvedValue([1, 2, 3]);

            jest.spyOn(
                vacationService,
                "getRemainingVacations",
            ).mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationConsultModel.getVacationsInRange.mockResolvedValue([]);
            vacationConsultModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const result = await vacationService.requestVacation(
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

            jest.spyOn(
                vacationService,
                "getRemainingVacations",
            ).mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationConsultModel.getVacationsInRange.mockResolvedValue([]);
            vacationConsultModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const result = await vacationService.requestVacation(
                EMPLOYEE_ID,
                END_DATE,
                START_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.BAD_DATES);
        });
    });

    describe("Flujo - sin días laborales", () => {
        it("Verifica que se tengan registrados los días de trabajo del empleado", async () => {
            employeeModel.getWorkDays.mockResolvedValue([]);

            jest.spyOn(
                vacationService,
                "getRemainingVacations",
            ).mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationConsultModel.getVacationsInRange.mockResolvedValue([]);
            vacationConsultModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const result = await vacationService.requestVacation(
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

            jest.spyOn(
                vacationService,
                "getRemainingVacations",
            ).mockResolvedValue({
                data: { remainingDays: 2 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationConsultModel.getVacationsInRange.mockResolvedValue([]);
            vacationConsultModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const result = await vacationService.requestVacation(
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

            jest.spyOn(
                vacationService,
                "getRemainingVacations",
            ).mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationConsultModel.getVacationsInRange.mockResolvedValue([{}]);
            vacationConsultModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const result = await vacationService.requestVacation(
                EMPLOYEE_ID,
                START_DATE,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.ALREADY_REQUEST);
        });

        it("Verifica si se traslapan vacaciones fuera del rango pedido", async () => {
            employeeModel.getWorkDays.mockResolvedValue([1, 2, 3]);

            jest.spyOn(
                vacationService,
                "getRemainingVacations",
            ).mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationConsultModel.getVacationsInRange.mockResolvedValue([]);
            vacationConsultModel.getOutsideVacations.mockResolvedValue([{}]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const result = await vacationService.requestVacation(
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

            jest.spyOn(
                vacationService,
                "getRemainingVacations",
            ).mockResolvedValue({
                data: { remainingDays: 2 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(0);

            vacationConsultModel.getVacationsInRange.mockResolvedValue([]);
            vacationConsultModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const result = await vacationService.requestVacation(
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

            jest.spyOn(
                vacationService,
                "getRemainingVacations",
            ).mockResolvedValue({
                data: { remainingDays: 10 },
            });

            employeeModel.getHome.mockResolvedValue("1");

            eventsModel.getGlobalEventsInRange.mockResolvedValue([]);

            datesUtils.calculateUsedDays.mockReturnValue(5);

            vacationConsultModel.getVacationsInRange.mockResolvedValue([]);
            vacationConsultModel.getOutsideVacations.mockResolvedValue([]);

            ipUtils.getClientIp.mockReturnValue(CLIENT_IP);

            const yesterday = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), TODAY.getUTCDate() - 10));

            const result = await vacationService.requestVacation(
                EMPLOYEE_ID,
                yesterday,
                END_DATE,
                CLIENT_IP,
            );

            expect(result.code).toBe(RESPONSES.VACATION.PAST_REQUEST_NOT_ALLOWED);
        });
    });
});

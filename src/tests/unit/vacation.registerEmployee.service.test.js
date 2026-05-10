// src/tests/unit/vacation.registerEmployee.service.test.js

jest.mock("../../model/employee/get.model", () => ({
    getWorkDays: jest.fn(),
    findByIdWithRoleAndHouse: jest.fn(),
}));

jest.mock("../../model/vacation/get.model", () => ({
    getActiveVacationsInRange: jest.fn(),
}));

jest.mock("../../model/event/get.model", () => ({
    getGlobalEventsInRange: jest.fn(),
}));

jest.mock("../../service/vacation/get.service", () => ({
    getRemainingVacations: jest.fn(),
}));

jest.mock("../../model/vacation/create.model", () => ({
    registerVacation: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
    createLog: jest.fn(),
}));

jest.mock("crypto", () => ({
    randomUUID: jest.fn(),
}));

const {
    getWorkDays,
    findByIdWithRoleAndHouse,
} = require("../../model/employee/get.model");

const {
    getActiveVacationsInRange,
} = require("../../model/vacation/get.model");

const {
    getGlobalEventsInRange,
} = require("../../model/event/get.model");

const {
    getRemainingVacations,
} = require("../../service/vacation/get.service");

const { registerVacation } = require("../../model/vacation/create.model");
const { createLog } = require("../../model/log.model");
const { randomUUID } = require("crypto");

const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { VACATION_STATUS } = require("../../utils/vacationStatus");

const {
    registerEmployeeVacation,
} = require("../../service/vacation/create.service");

describe("US28 - registerEmployeeVacation service", () => {
    const actorAdminId = "actor-admin-id";
    const actorCoordinatorId = "actor-coordinator-id";
    const actorUserId = "actor-user-id";
    const targetEmployeeId = "target-employee-id";
    const vacationId = "generated-vacation-id";
    const sameHouseId = "house-1";
    const otherHouseId = "house-2";
    const ipAddress = "127.0.0.1";

    const makeUTCDate = (year, month, day) => {
        return new Date(Date.UTC(year, month - 1, day));
    };

    const frozenToday = makeUTCDate(2026, 4, 30);

    const validStartDate = "2026-06-22";
    const validEndDate = "2026-06-26";
    const parsedValidStartDate = makeUTCDate(2026, 6, 22);
    const parsedValidEndDate = makeUTCDate(2026, 6, 26);

    const todayDate = "2026-04-30";
    const parsedTodayDate = makeUTCDate(2026, 4, 30);

    const yesterdayDate = "2026-04-29";

    const weekendStartDate = "2026-06-27";
    const weekendEndDate = "2026-06-28";

    const anniversaryStartDate = makeUTCDate(2026, 4, 9);
    const anniversaryEndDate = makeUTCDate(2027, 4, 9);

    const mondayToFridayWorkDays = [
        { workday: { name: "Lunes" } },
        { workday: { name: "Martes" } },
        { workday: { name: "Miércoles" } },
        { workday: { name: "Jueves" } },
        { workday: { name: "Viernes" } },
    ];

    const adminEmployee = {
        employee_id: actorAdminId,
        house_id: sameHouseId,
        role: { name: "Admin" },
        house: { house_id: sameHouseId },
    };

    const coordinatorEmployee = {
        employee_id: actorCoordinatorId,
        house_id: sameHouseId,
        role: { name: "Coordinador" },
        house: { house_id: sameHouseId },
    };

    const regularUserEmployee = {
        employee_id: actorUserId,
        house_id: sameHouseId,
        role: { name: "Usuario" },
        house: { house_id: sameHouseId },
    };

    const targetEmployeeSameHouse = {
        employee_id: targetEmployeeId,
        house_id: sameHouseId,
        role: { name: "Usuario" },
        house: { house_id: sameHouseId },
    };

    const targetEmployeeOtherHouse = {
        employee_id: targetEmployeeId,
        house_id: otherHouseId,
        role: { name: "Usuario" },
        house: { house_id: otherHouseId },
    };

    function mockSuccessfulDependencies({
        actor = adminEmployee,
        target = targetEmployeeSameHouse,
        workDays = mondayToFridayWorkDays,
        remainingDays = 14,
        activeVacations = [],
        globalEvents = [],
        vacationResult,
    } = {}) {
        findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actor)
            .mockResolvedValueOnce(target);

        getWorkDays.mockResolvedValue(workDays);

        getRemainingVacations.mockResolvedValue({
            code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
            data: {
                remainingDays,
                startDate: anniversaryStartDate,
                endDate: anniversaryEndDate,
            },
        });

        getGlobalEventsInRange.mockResolvedValue(globalEvents);
        getActiveVacationsInRange.mockResolvedValue(activeVacations);

        registerVacation.mockResolvedValue(
            vacationResult || {
                vacations_request_id: vacationId,
                employee_id: targetEmployeeId,
                start: parsedValidStartDate,
                end: parsedValidEndDate,
                status: VACATION_STATUS.APPROVED,
                used_days: 5,
                created_at: new Date(),
            }
        );

        createLog.mockResolvedValue({
            log_id: "log-id",
        });
    }

    async function callRegisterVacation(options = {}) {
        const actorEmployeeId = Object.prototype.hasOwnProperty.call(
            options,
            "actorEmployeeId"
        )
            ? options.actorEmployeeId
            : actorAdminId;

        const targetId = Object.prototype.hasOwnProperty.call(options, "targetId")
            ? options.targetId
            : targetEmployeeId;

        const startDate = Object.prototype.hasOwnProperty.call(options, "startDate")
            ? options.startDate
            : validStartDate;

        const endDate = Object.prototype.hasOwnProperty.call(options, "endDate")
            ? options.endDate
            : validEndDate;

        return await registerEmployeeVacation({
            actorEmployeeId,
            targetEmployeeId: targetId,
            rawStartDate: startDate,
            rawEndDate: endDate,
            ipAddress,
        });
    }

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(frozenToday);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        randomUUID.mockReturnValue(vacationId);
        mockSuccessfulDependencies();
    });

    describe("happy paths", () => {
        test("admin registra vacaciones aprobadas correctamente", async () => {
            const result = await callRegisterVacation();

            expect(result.code).toBe(RESPONSES.VACATION.REGISTERED);
            expect(result.data.vacationRequest).toBeDefined();

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(2);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(1, actorAdminId);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(2, targetEmployeeId);

            expect(getWorkDays).toHaveBeenCalledWith(targetEmployeeId);
            expect(getRemainingVacations).toHaveBeenCalledWith(targetEmployeeId);
            expect(getGlobalEventsInRange).toHaveBeenCalledWith(
                parsedValidStartDate,
                parsedValidEndDate
            );
            expect(getActiveVacationsInRange).toHaveBeenCalledWith(
                targetEmployeeId,
                parsedValidStartDate,
                parsedValidEndDate
            );

            expect(randomUUID).toHaveBeenCalledTimes(1);
            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                targetEmployeeId,
                parsedValidStartDate,
                parsedValidEndDate,
                5
            );

            expect(createLog).toHaveBeenCalledWith(
                actorAdminId,
                LOG_ACTIONS.VACATION_REGISTERED_SUCCESS,
                ipAddress,
                targetEmployeeId
            );
        });

        test("coordinador registra vacaciones de empleado de su misma casa", async () => {
            findByIdWithRoleAndHouse.mockReset();
            mockSuccessfulDependencies({
                actor: coordinatorEmployee,
                target: targetEmployeeSameHouse,
            });

            const result = await callRegisterVacation({
                actorEmployeeId: actorCoordinatorId,
            });

            expect(result.code).toBe(RESPONSES.VACATION.REGISTERED);
            expect(registerVacation).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledWith(
                actorCoordinatorId,
                LOG_ACTIONS.VACATION_REGISTERED_SUCCESS,
                ipAddress,
                targetEmployeeId
            );
        });

        test("admin puede registrar vacaciones de empleado de otra casa", async () => {
            findByIdWithRoleAndHouse.mockReset();
            mockSuccessfulDependencies({
                actor: {
                    ...adminEmployee,
                    house_id: otherHouseId,
                    house: { house_id: otherHouseId },
                },
                target: targetEmployeeSameHouse,
            });

            const result = await callRegisterVacation();

            expect(result.code).toBe(RESPONSES.VACATION.REGISTERED);
            expect(registerVacation).toHaveBeenCalledTimes(1);
        });

        test("permite registrar un solo día laboral", async () => {
            const result = await callRegisterVacation({
                startDate: "2026-06-22",
                endDate: "2026-06-22",
            });

            expect(result.code).toBe(RESPONSES.VACATION.REGISTERED);
            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                targetEmployeeId,
                parsedValidStartDate,
                parsedValidStartDate,
                1
            );
        });

        test("permite registrar si los días solicitados son exactamente los días restantes", async () => {
            getRemainingVacations.mockResolvedValueOnce({
                code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
                data: {
                    remainingDays: 5,
                    startDate: anniversaryStartDate,
                    endDate: anniversaryEndDate,
                },
            });

            const result = await callRegisterVacation();

            expect(result.code).toBe(RESPONSES.VACATION.REGISTERED);
            expect(registerVacation).toHaveBeenCalledTimes(1);
        });

        test("acepta roles con mayúsculas/minúsculas mixtas", async () => {
            findByIdWithRoleAndHouse.mockReset();
            mockSuccessfulDependencies({
                actor: {
                    ...adminEmployee,
                    role: { name: "aDmIn" },
                },
            });

            const result = await callRegisterVacation();

            expect(result.code).toBe(RESPONSES.VACATION.REGISTERED);
            expect(registerVacation).toHaveBeenCalledTimes(1);
        });
    });

    describe("validación de autenticación y permisos", () => {
        test("retorna USER.NOT_ACCESS si no hay actorEmployeeId", async () => {
            const result = await callRegisterVacation({
                actorEmployeeId: null,
            });

            expect(result).toEqual({
                code: RESPONSES.USER.NOT_ACCESS,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(randomUUID).not.toHaveBeenCalled();
        });

        test("retorna USER.NOT_ACCESS si el actor no existe", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce(null);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: RESPONSES.USER.NOT_ACCESS,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(1);
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna INSUFFICIENT_PERMISSIONS si el actor no es admin ni coordinador", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce(regularUserEmployee);

            const result = await callRegisterVacation({
                actorEmployeeId: actorUserId,
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(1);
            expect(getWorkDays).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna INSUFFICIENT_PERMISSIONS si el actor no tiene rol", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce({
                ...regularUserEmployee,
                role: null,
            });

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
            });

            expect(registerVacation).not.toHaveBeenCalled();
        });
    });

    describe("validación de empleado objetivo y alcance por casa", () => {
        test("retorna EMPLOYEE.NOT_FOUND si no hay targetEmployeeId", async () => {
            const result = await callRegisterVacation({
                targetId: null,
            });

            expect(result).toEqual({
                code: RESPONSES.EMPLOYEE.NOT_FOUND,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna EMPLOYEE.NOT_FOUND si el empleado objetivo no existe", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(adminEmployee)
                .mockResolvedValueOnce(null);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: RESPONSES.EMPLOYEE.NOT_FOUND,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(2);
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna EMPLOYEE_OUT_OF_SCOPE si coordinador intenta registrar vacaciones de otra casa", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(coordinatorEmployee)
                .mockResolvedValueOnce(targetEmployeeOtherHouse);

            const result = await callRegisterVacation({
                actorEmployeeId: actorCoordinatorId,
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            });

            expect(getWorkDays).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("validación de fechas", () => {
        test("retorna WRONG_FORMAT si falta startDate", async () => {
            const result = await callRegisterVacation({
                startDate: undefined,
            });

            expect(result).toEqual({
                code: RESPONSES.DATES.WRONG_FORMAT,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
        });

        test("retorna WRONG_FORMAT si falta endDate", async () => {
            const result = await callRegisterVacation({
                endDate: undefined,
            });

            expect(result).toEqual({
                code: RESPONSES.DATES.WRONG_FORMAT,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
        });

        test("retorna WRONG_FORMAT si la fecha no existe", async () => {
            const result = await callRegisterVacation({
                startDate: "2026-02-30",
                endDate: "2026-03-02",
            });

            expect(result).toEqual({
                code: RESPONSES.DATES.WRONG_FORMAT,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
        });

        test("retorna WRONG_FORMAT si la fecha no tiene formato YYYY-MM-DD", async () => {
            const result = await callRegisterVacation({
                startDate: "22/06/2026",
                endDate: "26/06/2026",
            });

            expect(result).toEqual({
                code: RESPONSES.DATES.WRONG_FORMAT,
            });

            expect(registerVacation).not.toHaveBeenCalled();
        });

        test("retorna DATES.BAD_DATES si endDate es anterior a startDate", async () => {
            const result = await callRegisterVacation({
                startDate: "2026-06-26",
                endDate: "2026-06-22",
            });

            expect(result).toEqual({
                code: RESPONSES.DATES.BAD_DATES,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
        });

        test("retorna PAST_REGISTER_NOT_ALLOWED si startDate es anterior a hoy", async () => {
            const result = await callRegisterVacation({
                startDate: yesterdayDate,
                endDate: todayDate,
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.PAST_REGISTER_NOT_ALLOWED,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
        });

        test("permite startDate igual a hoy", async () => {
            const result = await callRegisterVacation({
                startDate: todayDate,
                endDate: todayDate,
            });

            expect(result.code).toBe(RESPONSES.VACATION.REGISTERED);
            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                targetEmployeeId,
                parsedTodayDate,
                parsedTodayDate,
                1
            );
        });

        test("retorna OUT_OF_RANGE si está fuera del año laboral actual", async () => {
            const result = await callRegisterVacation({
                startDate: "2027-04-09",
                endDate: "2027-04-10",
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.OUT_OF_RANGE,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(randomUUID).not.toHaveBeenCalled();
        });

        test("retorna WRONG_FORMAT si falta startDate", async () => {
            const result = await callRegisterVacation({
                startDate: undefined,
            });

            expect(result).toEqual({
                code: RESPONSES.DATES.WRONG_FORMAT,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(randomUUID).not.toHaveBeenCalled();
        });

        test("retorna WRONG_FORMAT si falta endDate", async () => {
            const result = await callRegisterVacation({
                endDate: undefined,
            });

            expect(result).toEqual({
                code: RESPONSES.DATES.WRONG_FORMAT,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(randomUUID).not.toHaveBeenCalled();
        });
    });

    describe("validación de días laborales y días restantes", () => {
        test("retorna WITHOUT_DATES si el empleado no tiene días laborales registrados", async () => {
            getWorkDays.mockResolvedValueOnce([]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: RESPONSES.VACATION.WITHOUT_DATES,
            });

            expect(getWorkDays).toHaveBeenCalledWith(targetEmployeeId);
            expect(getRemainingVacations).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna NULL_DATES si el rango no contiene días laborales del empleado", async () => {
            const result = await callRegisterVacation({
                startDate: weekendStartDate,
                endDate: weekendEndDate,
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.NULL_DATES,
            });

            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna INSUFFICIENT_DATES si no tiene días suficientes", async () => {
            getRemainingVacations.mockResolvedValueOnce({
                code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
                data: {
                    remainingDays: 4,
                    startDate: anniversaryStartDate,
                    endDate: anniversaryEndDate,
                },
            });

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: RESPONSES.VACATION.INSUFFICIENT_DATES,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(randomUUID).not.toHaveBeenCalled();
        });

        test("descuenta eventos globales como días no usados", async () => {
            getGlobalEventsInRange.mockResolvedValueOnce([
                {
                    date: makeUTCDate(2026, 6, 24),
                    is_free_day: true,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result.code).toBe(RESPONSES.VACATION.REGISTERED);
            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                targetEmployeeId,
                parsedValidStartDate,
                parsedValidEndDate,
                4
            );
        });
    });

    describe("validación de traslapes", () => {
        test("retorna ALREADY_REQUEST si hay vacaciones pendientes traslapadas", async () => {
            getActiveVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "pending-overlap",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.PENDING,
                    start: makeUTCDate(2026, 6, 23),
                    end: makeUTCDate(2026, 6, 24),
                    used_days: 2,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: RESPONSES.VACATION.ALREADY_REQUEST,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(randomUUID).not.toHaveBeenCalled();
        });

        test("retorna ALREADY_REQUEST si hay vacaciones aprobadas traslapadas", async () => {
            getActiveVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "approved-overlap",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.APPROVED,
                    start: makeUTCDate(2026, 6, 22),
                    end: makeUTCDate(2026, 6, 26),
                    used_days: 5,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: RESPONSES.VACATION.ALREADY_REQUEST,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(randomUUID).not.toHaveBeenCalled();
        });

        test("llama getActiveVacationsInRange con el empleado objetivo y no con el actor", async () => {
            const result = await callRegisterVacation();

            expect(result.code).toBe(RESPONSES.VACATION.REGISTERED);
            expect(getActiveVacationsInRange).toHaveBeenCalledWith(
                targetEmployeeId,
                parsedValidStartDate,
                parsedValidEndDate
            );
            expect(getActiveVacationsInRange).not.toHaveBeenCalledWith(
                actorAdminId,
                parsedValidStartDate,
                parsedValidEndDate
            );
        });
    });

    describe("seguridad de side effects", () => {
        test("no genera UUID ni crea registros si falla una validación", async () => {
            getRemainingVacations.mockResolvedValueOnce({
                code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
                data: {
                    remainingDays: 0,
                    startDate: anniversaryStartDate,
                    endDate: anniversaryEndDate,
                },
            });

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: RESPONSES.VACATION.INSUFFICIENT_DATES,
            });

            expect(randomUUID).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("no crea log si registerVacation falla", async () => {
            registerVacation.mockRejectedValueOnce(new Error("DB create failed"));

            await expect(callRegisterVacation()).rejects.toThrow("DB create failed");

            expect(registerVacation).toHaveBeenCalledTimes(1);
            expect(createLog).not.toHaveBeenCalled();
        });

        test("propaga error si createLog falla después de crear vacaciones", async () => {
            createLog.mockRejectedValueOnce(new Error("Audit log failed"));

            await expect(callRegisterVacation()).rejects.toThrow("Audit log failed");

            expect(registerVacation).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        test("propaga error si getWorkDays falla", async () => {
            getWorkDays.mockRejectedValueOnce(new Error("Workdays lookup failed"));

            await expect(callRegisterVacation()).rejects.toThrow(
                "Workdays lookup failed"
            );

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });
});
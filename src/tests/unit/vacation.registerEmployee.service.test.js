// src/tests/unit/vacation.registerEmployee.service.test.js

jest.mock("../../model/employee/consult.model", () => ({
    getStartDate: jest.fn(),
    getWorkDays: jest.fn(),
    findByIdWithRoleAndHouse: jest.fn(),
}));

jest.mock("../../model/vacation/consult.model", () => ({
    getVacationsInRange: jest.fn(),
    getOutsideVacations: jest.fn(),
    getActiveVacationsInRange: jest.fn(),
    getCommittedVacationsInRange: jest.fn(),
}));

jest.mock("../../model/vacation/add.model", () => ({
    requestVacation: jest.fn(),
    registerVacation: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
    createLog: jest.fn(),
}));

jest.mock("../../utils/ip", () => ({
    getClientIp: jest.fn(),
}));

jest.mock("uuid", () => ({
    v4: jest.fn(),
}));

const {
    getStartDate,
    getWorkDays,
    findByIdWithRoleAndHouse,
} = require("../../model/employee/consult.model");

const {
    getActiveVacationsInRange,
    getCommittedVacationsInRange,
} = require("../../model/vacation/consult.model");

const { registerVacation } = require("../../model/vacation/add.model");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { v4: uuidv4 } = require("uuid");

const responses = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { VACATION_STATUS } = require("../../utils/vacationStatus");

const {
    registerEmployeeVacation,
} = require("../../service/vacation/add.service");

describe("US28 - registerEmployeeVacation unit tests - defensive/security coverage", () => {
    const actorAdminId = "actor-admin-id";
    const actorCoordinatorId = "actor-coordinator-id";
    const actorUserId = "actor-user-id";
    const targetEmployeeId = "target-employee-id";
    const sameHouseId = "house-1";
    const otherHouseId = "house-2";
    const vacationId = "generated-vacation-id";
    const ipAddress = "127.0.0.1";

    const req = {
        headers: {
            "x-forwarded-for": ipAddress,
        },
        socket: {
            remoteAddress: ipAddress,
        },
    };

    const makeUTCDate = (year, month, day) => {
        return new Date(Date.UTC(year, month - 1, day));
    };

    const frozenToday = makeUTCDate(2026, 4, 30);

    const todayStartDate = makeUTCDate(2026, 4, 30); // jueves
    const todayEndDate = makeUTCDate(2026, 4, 30);

    const validStartDate = makeUTCDate(2026, 6, 22); // lunes
    const validEndDate = makeUTCDate(2026, 6, 26); // viernes

    const oneDayVacationDate = makeUTCDate(2026, 6, 22); // lunes

    const weekendStartDate = makeUTCDate(2026, 6, 27); // sábado
    const weekendEndDate = makeUTCDate(2026, 6, 28); // domingo

    const employeeStartDate = makeUTCDate(2025, 4, 9);
    const expectedWorkYearStart = makeUTCDate(2026, 4, 9);
    const expectedWorkYearEnd = makeUTCDate(2027, 4, 9);

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
        role: {
            name: "admin",
        },
        house: {
            house_id: sameHouseId,
        },
    };

    const adminEmployeeOtherHouse = {
        employee_id: actorAdminId,
        house_id: otherHouseId,
        role: {
            name: "admin",
        },
        house: {
            house_id: otherHouseId,
        },
    };

    const coordinatorEmployee = {
        employee_id: actorCoordinatorId,
        house_id: sameHouseId,
        role: {
            name: "coordinador",
        },
        house: {
            house_id: sameHouseId,
        },
    };

    const coordinatorAsTargetEmployee = {
        employee_id: actorCoordinatorId,
        house_id: sameHouseId,
        role: {
            name: "coordinador",
        },
        house: {
            house_id: sameHouseId,
        },
    };

    const regularUserEmployee = {
        employee_id: actorUserId,
        house_id: sameHouseId,
        role: {
            name: "usuario",
        },
        house: {
            house_id: sameHouseId,
        },
    };

    const targetEmployeeSameHouse = {
        employee_id: targetEmployeeId,
        house_id: sameHouseId,
        role: {
            name: "usuario",
        },
        house: {
            house_id: sameHouseId,
        },
    };

    const targetEmployeeOtherHouse = {
        employee_id: targetEmployeeId,
        house_id: otherHouseId,
        role: {
            name: "usuario",
        },
        house: {
            house_id: otherHouseId,
        },
    };

    function mockDefaultSuccessfulDependencies({
        actor = adminEmployee,
        target = targetEmployeeSameHouse,
        committedVacations = [],
        activeVacations = [],
        workDays = mondayToFridayWorkDays,
        startDateRecord = { start_date: employeeStartDate },
        vacationResult = null,
    } = {}) {
        findByIdWithRoleAndHouse.mockResolvedValueOnce(actor);
        findByIdWithRoleAndHouse.mockResolvedValueOnce(target);

        getWorkDays.mockResolvedValue(workDays);
        getActiveVacationsInRange.mockResolvedValue(activeVacations);
        getStartDate.mockResolvedValue(startDateRecord);
        getCommittedVacationsInRange.mockResolvedValue(committedVacations);

        registerVacation.mockResolvedValue(
            vacationResult || {
                vacations_request_id: vacationId,
                employee_id: targetEmployeeId,
                start: validStartDate,
                end: validEndDate,
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

        const request = Object.prototype.hasOwnProperty.call(options, "request")
            ? options.request
            : req;

        return await registerEmployeeVacation({
            actorEmployeeId,
            targetEmployeeId: targetId,
            startDate,
            endDate,
            req: request,
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
        uuidv4.mockReturnValue(vacationId);
        getClientIp.mockReturnValue(ipAddress);
        mockDefaultSuccessfulDependencies();
    });

    describe("authentication and authorization failures", () => {
        test("returns USER_NOT_AUTHENTICATED when actorEmployeeId is null", async () => {
            const result = await callRegisterVacation({
                actorEmployeeId: null,
            });

            expect(result).toEqual({
                code: responses.vacation.userNotAuthenticated,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(getWorkDays).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns USER_NOT_AUTHENTICATED when actorEmployeeId is undefined", async () => {
            const result = await callRegisterVacation({
                actorEmployeeId: undefined,
            });

            expect(result).toEqual({
                code: responses.vacation.userNotAuthenticated,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("returns USER_NOT_AUTHENTICATED when actor does not exist", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce(null);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.userNotAuthenticated,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(1);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(1, actorAdminId);
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns INSUFFICIENT_PERMISSIONS when actor is normal user", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce(regularUserEmployee);

            const result = await callRegisterVacation({
                actorEmployeeId: actorUserId,
            });

            expect(result).toEqual({
                code: responses.vacation.insufficientPermissions,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(1);
            expect(getWorkDays).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns INSUFFICIENT_PERMISSIONS when role name is missing", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce({
                ...regularUserEmployee,
                role: {},
            });

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.insufficientPermissions,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("returns INSUFFICIENT_PERMISSIONS when actor role object is null", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce({
                ...regularUserEmployee,
                role: {
                    name: undefined,
                },
            });

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.insufficientPermissions,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("malformed actor role defensive handling", () => {
        test("returns INSUFFICIENT_PERMISSIONS when actor role is null instead of throwing", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce({
                ...regularUserEmployee,
                role: null,
            });

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.insufficientPermissions,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(1);
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns INSUFFICIENT_PERMISSIONS when actor role name is empty string", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce({
                ...regularUserEmployee,
                role: {
                    name: "",
                },
            });

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.insufficientPermissions,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("accepts role name with different casing for admin", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce({
                    ...adminEmployee,
                    role: {
                        name: "ADMIN",
                    },
                })
                .mockResolvedValueOnce(targetEmployeeSameHouse);

            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);
            expect(registerVacation).toHaveBeenCalledTimes(1);
        });

        test("accepts role name with different casing for coordinator", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce({
                    ...coordinatorEmployee,
                    role: {
                        name: "CoOrDiNaDoR",
                    },
                })
                .mockResolvedValueOnce(targetEmployeeSameHouse);

            const result = await callRegisterVacation({
                actorEmployeeId: actorCoordinatorId,
            });

            expect(result.code).toBe(responses.vacation.registered);
            expect(registerVacation).toHaveBeenCalledTimes(1);
        });
    });

    describe("malformed identifiers defensive handling", () => {
        test("returns USER_NOT_AUTHENTICATED when actorEmployeeId is empty string", async () => {
            const result = await callRegisterVacation({
                actorEmployeeId: "",
            });

            expect(result).toEqual({
                code: responses.vacation.userNotAuthenticated,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns EMPLOYEE_NOT_FOUND when targetEmployeeId is empty string", async () => {
            const result = await callRegisterVacation({
                targetId: "",
            });

            expect(result).toEqual({
                code: responses.vacation.employeeNotFound,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(getWorkDays).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("does not create vacation when targetEmployeeId has injection-like content and model does not find it", async () => {
            const maliciousTargetId = "'; DROP TABLE employee; --";

            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(adminEmployee)
                .mockResolvedValueOnce(null);

            const result = await callRegisterVacation({
                targetId: maliciousTargetId,
            });

            expect(result).toEqual({
                code: responses.vacation.employeeNotFound,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(1, actorAdminId);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(2, maliciousTargetId);
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });
    });

    describe("malformed date defensive handling", () => {
        test("returns invalidDates when startDate is an invalid Date object", async () => {
            const result = await callRegisterVacation({
                startDate: new Date("invalid-date"),
                endDate: validEndDate,
            });

            expect(result).toEqual({
                code: responses.vacation.invalidDates,
            });

            expect(getWorkDays).not.toHaveBeenCalled();
            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns invalidDates when endDate is an invalid Date object", async () => {
            const result = await callRegisterVacation({
                startDate: validStartDate,
                endDate: new Date("invalid-date"),
            });

            expect(result).toEqual({
                code: responses.vacation.invalidDates,
            });

            expect(getWorkDays).not.toHaveBeenCalled();
            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns invalidDates when startDate is a string instead of Date", async () => {
            const result = await callRegisterVacation({
                startDate: "2026-06-22",
                endDate: validEndDate,
            });

            expect(result).toEqual({
                code: responses.vacation.invalidDates,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns invalidDates when endDate is null", async () => {
            const result = await callRegisterVacation({
                startDate: validStartDate,
                endDate: null,
            });

            expect(result).toEqual({
                code: responses.vacation.invalidDates,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });
    });

    describe("target employee validation and ABAC scope", () => {
        test("returns EMPLOYEE_NOT_FOUND when targetEmployeeId is null", async () => {
            const result = await callRegisterVacation({
                targetId: null,
            });

            expect(result).toEqual({
                code: responses.vacation.employeeNotFound,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(getWorkDays).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns EMPLOYEE_NOT_FOUND when targetEmployeeId is undefined", async () => {
            const result = await callRegisterVacation({
                targetId: undefined,
            });

            expect(result).toEqual({
                code: responses.vacation.employeeNotFound,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(getWorkDays).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns EMPLOYEE_NOT_FOUND when target employee does not exist", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(adminEmployee)
                .mockResolvedValueOnce(null);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.employeeNotFound,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(2);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(1, actorAdminId);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(2, targetEmployeeId);
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("returns EMPLOYEE_OUT_OF_SCOPE when coordinator registers employee from another house", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(coordinatorEmployee)
                .mockResolvedValueOnce(targetEmployeeOtherHouse);

            const result = await callRegisterVacation({
                actorEmployeeId: actorCoordinatorId,
            });

            expect(result).toEqual({
                code: responses.vacation.employeeOutOfScope,
            });

            expect(getWorkDays).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("allows admin to register vacation for employee from another house", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(adminEmployeeOtherHouse)
                .mockResolvedValueOnce(targetEmployeeSameHouse);

            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);

            expect(registerVacation).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        test("allows coordinator to register vacation for employee from same house", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(coordinatorEmployee)
                .mockResolvedValueOnce(targetEmployeeSameHouse);

            const result = await callRegisterVacation({
                actorEmployeeId: actorCoordinatorId,
            });

            expect(result.code).toBe(responses.vacation.registered);

            expect(registerVacation).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledWith(
                actorCoordinatorId,
                LOG_ACTIONS.VACATION_REGISTERED_SUCCESS,
                ipAddress,
                targetEmployeeId
            );
        });

        test("allows coordinator to register vacation for themselves when actor id equals target id and same house", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(coordinatorEmployee)
                .mockResolvedValueOnce(coordinatorAsTargetEmployee);

            const result = await callRegisterVacation({
                actorEmployeeId: actorCoordinatorId,
                targetId: actorCoordinatorId,
            });

            expect(result.code).toBe(responses.vacation.registered);

            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(1, actorCoordinatorId);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(2, actorCoordinatorId);
            expect(getWorkDays).toHaveBeenCalledWith(actorCoordinatorId);
            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                actorCoordinatorId,
                validStartDate,
                validEndDate,
                5
            );
            expect(createLog).toHaveBeenCalledWith(
                actorCoordinatorId,
                LOG_ACTIONS.VACATION_REGISTERED_SUCCESS,
                ipAddress,
                actorCoordinatorId
            );
        });
    });

    describe("date boundary and invalid range behavior", () => {
        test("allows startDate equal to today exact UTC date", async () => {
            const result = await callRegisterVacation({
                startDate: todayStartDate,
                endDate: todayEndDate,
            });

            expect(result.code).toBe(responses.vacation.registered);

            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                targetEmployeeId,
                todayStartDate,
                todayEndDate,
                1
            );
        });

        test("allows startDate equal to endDate when it is a working day", async () => {
            const result = await callRegisterVacation({
                startDate: oneDayVacationDate,
                endDate: oneDayVacationDate,
            });

            expect(result.code).toBe(responses.vacation.registered);

            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                targetEmployeeId,
                oneDayVacationDate,
                oneDayVacationDate,
                1
            );
            expect(uuidv4).toHaveBeenCalledTimes(1);
        });

        test("returns PAST_DATE_NOT_ALLOWED when startDate is one day before today", async () => {
            const yesterday = makeUTCDate(2026, 4, 29);

            const result = await callRegisterVacation({
                startDate: yesterday,
                endDate: todayEndDate,
            });

            expect(result).toEqual({
                code: responses.vacation.pastDateNotAllowed,
            });

            expect(getWorkDays).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns badDates when endDate is before startDate", async () => {
            const result = await callRegisterVacation({
                startDate: makeUTCDate(2026, 7, 10),
                endDate: makeUTCDate(2026, 7, 5),
            });

            expect(result).toEqual({
                code: responses.vacation.badDates,
            });

            expect(getWorkDays).not.toHaveBeenCalled();
            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });
    });

    describe("workday validation and actor/target confusion prevention", () => {
        test("calls getWorkDays with targetEmployeeId and never with actorEmployeeId", async () => {
            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);

            expect(getWorkDays).toHaveBeenCalledTimes(1);
            expect(getWorkDays).toHaveBeenCalledWith(targetEmployeeId);
            expect(getWorkDays).not.toHaveBeenCalledWith(actorAdminId);
        });

        test("returns withoutDates when target employee has no workdays", async () => {
            getWorkDays.mockResolvedValueOnce([]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.withoutDates,
            });

            expect(getWorkDays).toHaveBeenCalledWith(targetEmployeeId);
            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns noWorkDaysInRange when range has only non-working days", async () => {
            const result = await callRegisterVacation({
                startDate: weekendStartDate,
                endDate: weekendEndDate,
            });

            expect(result).toEqual({
                code: responses.vacation.noWorkDaysInRange,
            });

            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(getCommittedVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });
    });

    describe("overlap validation", () => {
        test("calls getActiveVacationsInRange with exact target id and requested range", async () => {
            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);

            expect(getActiveVacationsInRange).toHaveBeenCalledTimes(1);
            expect(getActiveVacationsInRange).toHaveBeenCalledWith(
                targetEmployeeId,
                validStartDate,
                validEndDate
            );
            expect(getActiveVacationsInRange).not.toHaveBeenCalledWith(
                actorAdminId,
                validStartDate,
                validEndDate
            );
        });

        test("returns alreadyRequest when pending vacation overlaps", async () => {
            getActiveVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "pending-overlap-id",
                    employee_id: targetEmployeeId,
                    start: makeUTCDate(2026, 6, 23),
                    end: makeUTCDate(2026, 6, 24),
                    status: VACATION_STATUS.PENDING,
                    used_days: 2,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.alreadyRequest,
            });

            expect(getStartDate).not.toHaveBeenCalled();
            expect(getCommittedVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns alreadyRequest when approved vacation overlaps", async () => {
            getActiveVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "approved-overlap-id",
                    employee_id: targetEmployeeId,
                    start: makeUTCDate(2026, 6, 22),
                    end: makeUTCDate(2026, 6, 26),
                    status: VACATION_STATUS.APPROVED,
                    used_days: 5,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.alreadyRequest,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("does not block when getActiveVacationsInRange returns no active overlaps", async () => {
            getActiveVacationsInRange.mockResolvedValueOnce([]);

            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);
            expect(registerVacation).toHaveBeenCalledTimes(1);
        });
    });

    describe("committed days and remaining days validation", () => {
        test("calls getCommittedVacationsInRange with exact target id and current work year range", async () => {
            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);

            expect(getCommittedVacationsInRange).toHaveBeenCalledTimes(1);
            expect(getCommittedVacationsInRange).toHaveBeenCalledWith(
                targetEmployeeId,
                expectedWorkYearStart,
                expectedWorkYearEnd
            );
            expect(getCommittedVacationsInRange).not.toHaveBeenCalledWith(
                actorAdminId,
                expectedWorkYearStart,
                expectedWorkYearEnd
            );
        });

        test("allows registration when usedDays equals remainingDays exactly", async () => {
            // start_date 2025-04-09, frozenToday 2026-04-30 => 1 year worked => 14 days
            // requested valid range uses 5 days
            // committed 9 days => remaining 5 days
            getCommittedVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "committed-1",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.PENDING,
                    used_days: 4,
                },
                {
                    vacations_request_id: "committed-2",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.APPROVED,
                    used_days: 5,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);

            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                targetEmployeeId,
                validStartDate,
                validEndDate,
                5
            );
        });

        test("returns insufficientDays when remainingDays is zero", async () => {
            // 14 committed days => remaining 0
            getCommittedVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "committed-1",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.PENDING,
                    used_days: 7,
                },
                {
                    vacations_request_id: "committed-2",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.APPROVED,
                    used_days: 7,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.insufficientDays,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns insufficientDays when requested days exceed remaining days by one", async () => {
            // 10 committed days => remaining 4, requested 5
            getCommittedVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "committed-1",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.PENDING,
                    used_days: 10,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.insufficientDays,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns EMPLOYEE_NOT_FOUND when employee start date cannot be loaded after target validation", async () => {
            getStartDate.mockResolvedValueOnce(null);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.employeeNotFound,
            });

            expect(getCommittedVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });
    });

    describe("successful creation integrity", () => {
        test("creates approved vacation with exact registerVacation parameters", async () => {
            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);

            expect(uuidv4).toHaveBeenCalledTimes(1);

            expect(registerVacation).toHaveBeenCalledTimes(1);
            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                targetEmployeeId,
                validStartDate,
                validEndDate,
                5
            );

            expect(createLog).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledWith(
                actorAdminId,
                LOG_ACTIONS.VACATION_REGISTERED_SUCCESS,
                ipAddress,
                targetEmployeeId
            );
        });

        test("returns created vacation request from model without mutating it", async () => {
            const vacationRequestFromModel = {
                vacations_request_id: vacationId,
                employee_id: targetEmployeeId,
                start: validStartDate,
                end: validEndDate,
                status: VACATION_STATUS.APPROVED,
                feedback: null,
                used_days: 5,
                created_at: makeUTCDate(2026, 4, 30),
            };

            registerVacation.mockResolvedValueOnce(vacationRequestFromModel);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.registered,
                data: {
                    vacationRequest: vacationRequestFromModel,
                },
            });
        });

        test("findByIdWithRoleAndHouse is called in strict actor-then-target order", async () => {
            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(2);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(1, actorAdminId);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(2, targetEmployeeId);
        });

        test("does not call uuidv4 until all validations pass", async () => {
            getActiveVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "overlap-id",
                    status: VACATION_STATUS.PENDING,
                    used_days: 2,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.alreadyRequest,
            });

            expect(uuidv4).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("failure behavior and side-effect safety", () => {
        test("does not create audit log when registerVacation throws", async () => {
            registerVacation.mockRejectedValueOnce(new Error("DB create failed"));

            await expect(callRegisterVacation()).rejects.toThrow("DB create failed");

            expect(registerVacation).toHaveBeenCalledTimes(1);
            expect(createLog).not.toHaveBeenCalled();
        });

        test("creates vacation but throws if audit log fails, exposing missing transaction boundary", async () => {
            createLog.mockRejectedValueOnce(new Error("Audit log failed"));

            await expect(callRegisterVacation()).rejects.toThrow("Audit log failed");

            expect(registerVacation).toHaveBeenCalledTimes(1);
            expect(registerVacation).toHaveBeenCalledWith(
                vacationId,
                targetEmployeeId,
                validStartDate,
                validEndDate,
                5
            );

            expect(createLog).toHaveBeenCalledTimes(1);
            expect(createLog).toHaveBeenCalledWith(
                actorAdminId,
                LOG_ACTIONS.VACATION_REGISTERED_SUCCESS,
                ipAddress,
                targetEmployeeId
            );
        });

        test("does not create vacation when getCommittedVacationsInRange throws", async () => {
            getCommittedVacationsInRange.mockRejectedValueOnce(
                new Error("Committed vacation lookup failed")
            );

            await expect(callRegisterVacation()).rejects.toThrow(
                "Committed vacation lookup failed"
            );

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("does not create vacation when getActiveVacationsInRange throws", async () => {
            getActiveVacationsInRange.mockRejectedValueOnce(
                new Error("Overlap lookup failed")
            );

            await expect(callRegisterVacation()).rejects.toThrow(
                "Overlap lookup failed"
            );

            expect(getCommittedVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("does not create vacation when getWorkDays throws", async () => {
            getWorkDays.mockRejectedValueOnce(new Error("Workdays lookup failed"));

            await expect(callRegisterVacation()).rejects.toThrow(
                "Workdays lookup failed"
            );

            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("strict validation order", () => {
        test("checks authorization before loading target employee", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce(regularUserEmployee);

            const result = await callRegisterVacation({
                actorEmployeeId: actorUserId,
            });

            expect(result).toEqual({
                code: responses.vacation.insufficientPermissions,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledTimes(1);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(1, actorUserId);
            expect(getWorkDays).not.toHaveBeenCalled();
            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(getCommittedVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("does not check workdays before ABAC house scope is validated", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(coordinatorEmployee)
                .mockResolvedValueOnce(targetEmployeeOtherHouse);

            const result = await callRegisterVacation({
                actorEmployeeId: actorCoordinatorId,
            });

            expect(result).toEqual({
                code: responses.vacation.employeeOutOfScope,
            });

            expect(getWorkDays).not.toHaveBeenCalled();
            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(getCommittedVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("does not generate uuid before committed days validation passes", async () => {
            getCommittedVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "committed-1",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.APPROVED,
                    used_days: 14,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.insufficientDays,
            });

            expect(uuidv4).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("corrupted database data handling", () => {
        test("does not create vacation when workDays contains unknown day names and usedDays becomes zero", async () => {
            getWorkDays.mockResolvedValueOnce([
                { workday: { name: "FeriadoInventado" } },
                { workday: { name: "NotADay" } },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.noWorkDaysInRange,
            });

            expect(getActiveVacationsInRange).not.toHaveBeenCalled();
            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("returns insufficientDays when committed vacation data exceeds legal vacation balance", async () => {
            getCommittedVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "corrupt-committed-1",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.APPROVED,
                    used_days: 999,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result).toEqual({
                code: responses.vacation.insufficientDays,
            });

            expect(registerVacation).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
            expect(uuidv4).not.toHaveBeenCalled();
        });

        test("exposes vulnerability if committed used_days is negative", async () => {
            getCommittedVacationsInRange.mockResolvedValueOnce([
                {
                    vacations_request_id: "corrupt-negative-days",
                    employee_id: targetEmployeeId,
                    status: VACATION_STATUS.APPROVED,
                    used_days: -100,
                },
            ]);

            const result = await callRegisterVacation();

            expect(result.code).toBe(responses.vacation.registered);

            // Este test documenta una debilidad:
            // si la BD tiene used_days negativo, el service aumenta artificialmente remainingDays.
            expect(registerVacation).toHaveBeenCalledTimes(1);
        });
    });
});
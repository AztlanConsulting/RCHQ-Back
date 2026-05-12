jest.mock("../../model/employee/get.model", () => ({
    findByIdWithRoleAndHouse: jest.fn(),
    getWorkDays: jest.fn(),
}));

jest.mock("../../model/vacation/get.model", () => ({
    getVacationRequestById: jest.fn(),
}));

jest.mock("../../model/event/get.model", () => ({
    getGlobalEventsInRange: jest.fn(),
}));

jest.mock("../../model/vacation/update.model", () => ({
    approveVacationRequestAtomically: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
    createLog: jest.fn(),
}));

jest.mock("../../service/vacation/get.service", () => ({
    getVacationYearInfoForApproval: jest.fn(),
}));

const {
    findByIdWithRoleAndHouse,
    getWorkDays,
} = require("../../model/employee/get.model");

const {
    getVacationRequestById,
} = require("../../model/vacation/get.model");

const {
    getGlobalEventsInRange,
} = require("../../model/event/get.model");

const {
    approveVacationRequestAtomically,
} = require("../../model/vacation/update.model");

const { createLog } = require("../../model/log.model");

const {
    getVacationYearInfoForApproval,
} = require("../../service/vacation/get.service");

const {
    approveVacationRequest,
} = require("../../service/vacation/update.service");

const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { VACATION_STATUS } = require("../../utils/vacationStatus");

describe("US34 - approveVacationRequest service", () => {
    const actorAdminId = "11111111-1111-4111-8111-111111111111";
    const actorCoordinatorId = "22222222-2222-4222-8222-222222222222";
    const targetEmployeeId = "33333333-3333-4333-8333-333333333333";
    const vacationRequestId = "44444444-4444-4444-8444-444444444444";
    const ipAddress = "127.0.0.1";

    const makeUTCDate = (year, month, day) => {
        return new Date(Date.UTC(year, month - 1, day));
    };

    const startDate = makeUTCDate(2026, 6, 22);
    const endDate = makeUTCDate(2026, 6, 26);
    const anniversaryStartDate = makeUTCDate(2026, 4, 9);
    const anniversaryEndDate = makeUTCDate(2027, 4, 8);

    const vacationRequest = {
        vacations_request_id: vacationRequestId,
        employee_id: targetEmployeeId,
        start: startDate,
        end: endDate,
        status: VACATION_STATUS.PENDING,
        used_days: 5,
    };

    const approvedVacationRequest = {
        ...vacationRequest,
        status: VACATION_STATUS.APPROVED,
        used_days: 5,
    };

    const adminActor = {
        employee_id: actorAdminId,
        house_id: "house-1",
        role: { name: "Admin" },
    };

    const coordinatorActor = {
        employee_id: actorCoordinatorId,
        house_id: "house-1",
        role: { name: "Coordinador" },
    };

    const targetEmployee = {
        employee_id: targetEmployeeId,
        house_id: "house-1",
        role: { name: "Psicóloga" },
    };

    const targetAdminEmployee = {
        employee_id: targetEmployeeId,
        house_id: "house-1",
        role: { name: "Admin" },
    };

    const targetOtherHouseEmployee = {
        employee_id: targetEmployeeId,
        house_id: "house-2",
        role: { name: "Psicóloga" },
    };

    const mondayToFridayWorkDays = [
        { workday: { name: "Lunes" } },
        { workday: { name: "Martes" } },
        { workday: { name: "Miércoles" } },
        { workday: { name: "Jueves" } },
        { workday: { name: "Viernes" } },
    ];

    function mockHappyPath({
        actor = adminActor,
        target = targetEmployee,
        request = vacationRequest,
        workDays = mondayToFridayWorkDays,
        globalEvents = [],
        maxDays = 14,
        atomicResult,
    } = {}) {
        getVacationRequestById.mockResolvedValue(request);

        findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actor)
            .mockResolvedValueOnce(target);

        getVacationYearInfoForApproval.mockResolvedValue({
            code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
            data: {
                startDate: anniversaryStartDate,
                endDate: anniversaryEndDate,
                maxDays,
            },
        });

        getWorkDays.mockResolvedValue(workDays);
        getGlobalEventsInRange.mockResolvedValue(globalEvents);

        approveVacationRequestAtomically.mockResolvedValue(
            atomicResult || {
                success: true,
                data: {
                    vacationRequest: approvedVacationRequest,
                },
            }
        );

        createLog.mockResolvedValue({
            log_id: "log-id",
        });
    }

    async function callApprove(options = {}) {
        return await approveVacationRequest({
            actorEmployeeId: options.actorEmployeeId ?? actorAdminId,
            vacationRequestId: options.vacationRequestId ?? vacationRequestId,
            ipAddress,
        });
    }

    beforeEach(() => {
        jest.resetAllMocks();
        mockHappyPath();
    });

    describe("happy paths", () => {
        test("admin aprueba una solicitud pendiente correctamente", async () => {
            const result = await callApprove();

            expect(result.code).toBe(RESPONSES.VACATION.APPROVED);
            expect(result.data.vacationRequest).toEqual(approvedVacationRequest);

            expect(findByIdWithRoleAndHouse).toHaveBeenCalledWith(actorAdminId);
            expect(getVacationRequestById).toHaveBeenCalledWith(vacationRequestId);
            expect(getWorkDays).toHaveBeenCalledWith(targetEmployeeId);

            expect(approveVacationRequestAtomically).toHaveBeenCalledWith({
                vacationRequestId,
                employeeId: targetEmployeeId,
                actorRoleName: "Admin",
                actorHouseId: "house-1",
                usedDays: 5,
                anniversaryStartDate,
                anniversaryEndDate,
                maxDays: 14,
            });

            expect(createLog).toHaveBeenCalledWith(
                actorAdminId,
                LOG_ACTIONS.VACATION_APPROVED_SUCCESS,
                ipAddress,
                targetEmployeeId
            );
        });

        test("coordinador aprueba solicitud de empleado de su misma casa", async () => {
            jest.resetAllMocks();
            mockHappyPath({
                actor: coordinatorActor,
                target: targetEmployee,
            });

            const result = await callApprove({
                actorEmployeeId: actorCoordinatorId,
            });

            expect(result.code).toBe(RESPONSES.VACATION.APPROVED);

            expect(approveVacationRequestAtomically).toHaveBeenCalledWith({
                vacationRequestId,
                employeeId: targetEmployeeId,
                actorRoleName: "Coordinador",
                actorHouseId: "house-1",
                usedDays: 5,
                anniversaryStartDate,
                anniversaryEndDate,
                maxDays: 14,
            });
        });
    });

    describe("validaciones de input y permisos", () => {
        test("retorna VALIDATION_ERROR si actorEmployeeId no es UUID válido", async () => {
            const result = await callApprove({
                actorEmployeeId: "invalid-id",
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.VALIDATION_ERROR,
            });

            expect(getVacationRequestById).not.toHaveBeenCalled();
            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
        });

        test("retorna VALIDATION_ERROR si vacationRequestId no es UUID válido", async () => {
            const result = await callApprove({
                vacationRequestId: "invalid-id",
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.VALIDATION_ERROR,
            });

            expect(getVacationRequestById).not.toHaveBeenCalled();
            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
        });

        test("retorna USER.NOT_ACCESS si el actor no existe", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce(null);

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.USER.NOT_ACCESS,
            });

            expect(getVacationRequestById).not.toHaveBeenCalled();
            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
        });

        test("retorna INSUFFICIENT_PERMISSIONS si el actor no es Admin ni Coordinador", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse.mockResolvedValueOnce({
                employee_id: actorAdminId,
                house_id: "house-1",
                role: { name: "Psicóloga" },
            });

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
            });

            expect(getVacationRequestById).not.toHaveBeenCalled();
            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
        });

        test("coordinador no puede aprobar solicitud de un admin", async () => {
            jest.resetAllMocks();

            mockHappyPath({
                actor: coordinatorActor,
                target: targetAdminEmployee,
            });

            const result = await callApprove({
                actorEmployeeId: actorCoordinatorId,
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(1, actorCoordinatorId);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(2, targetEmployeeId);
            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("coordinador no puede aprobar solicitud de empleado de otra casa", async () => {
            jest.resetAllMocks();

            mockHappyPath({
                actor: coordinatorActor,
                target: targetOtherHouseEmployee,
            });

            const result = await callApprove({
                actorEmployeeId: actorCoordinatorId,
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            });

            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(1, actorCoordinatorId);
            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(2, targetEmployeeId);
            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("validaciones de solicitud", () => {
        test("retorna REQUEST_NOT_FOUND si la solicitud no existe", async () => {
            getVacationRequestById.mockResolvedValueOnce(null);

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
            });

            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna REQUEST_ALREADY_REVIEWED si la solicitud ya fue aprobada", async () => {
            getVacationRequestById.mockResolvedValueOnce({
                ...vacationRequest,
                status: VACATION_STATUS.APPROVED,
            });

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
            });

            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna REQUEST_ALREADY_REVIEWED si la solicitud ya fue rechazada", async () => {
            getVacationRequestById.mockResolvedValueOnce({
                ...vacationRequest,
                status: VACATION_STATUS.REJECTED,
            });

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
            });

            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna EMPLOYEE.NOT_FOUND si el empleado dueño de la solicitud no existe", async () => {
            findByIdWithRoleAndHouse.mockReset();
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(adminActor)
                .mockResolvedValueOnce(null);

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.EMPLOYEE.NOT_FOUND,
            });

            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
        });
    });

    describe("validaciones de calendario y días", () => {
        test("retorna WITHOUT_START_DATE si el empleado no tiene fecha de inicio", async () => {
            getVacationYearInfoForApproval.mockResolvedValueOnce({
                code: RESPONSES.VACATION.WITHOUT_START_DATE,
            });

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.WITHOUT_START_DATE,
            });

            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
        });

        test("retorna OUT_OF_RANGE si la solicitud está fuera del año laboral actual", async () => {
            getVacationRequestById.mockResolvedValueOnce({
                ...vacationRequest,
                start: makeUTCDate(2028, 1, 1),
                end: makeUTCDate(2028, 1, 5),
            });

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.OUT_OF_RANGE,
            });

            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
        });

        test("retorna WITHOUT_DATES si el empleado no tiene días laborales", async () => {
            getWorkDays.mockResolvedValueOnce([]);

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.WITHOUT_DATES,
            });

            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
        });

        test("retorna NULL_DATES si el rango no consume días laborales", async () => {
            getVacationRequestById.mockResolvedValueOnce({
                ...vacationRequest,
                start: makeUTCDate(2026, 6, 27),
                end: makeUTCDate(2026, 6, 28),
            });

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.NULL_DATES,
            });

            expect(approveVacationRequestAtomically).not.toHaveBeenCalled();
        });

        test("descuenta eventos globales como días no usados", async () => {
            getGlobalEventsInRange.mockResolvedValueOnce([
                {
                    date: makeUTCDate(2026, 6, 24),
                    is_free_day: true,
                },
            ]);

            const result = await callApprove();

            expect(result.code).toBe(RESPONSES.VACATION.APPROVED);

            expect(approveVacationRequestAtomically).toHaveBeenCalledWith(
                expect.objectContaining({
                    usedDays: 4,
                })
            );
        });
    });

    describe("resultados atómicos del model", () => {
        test("retorna INSUFFICIENT_DATES si el model detecta días insuficientes atómicamente", async () => {
            approveVacationRequestAtomically.mockResolvedValueOnce({
                success: false,
                code: RESPONSES.VACATION.INSUFFICIENT_DATES,
            });

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.INSUFFICIENT_DATES,
            });

            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna APPROVED_OVERLAP si el model detecta traslape dentro de la transacción", async () => {
            approveVacationRequestAtomically.mockResolvedValueOnce({
                success: false,
                code: RESPONSES.VACATION.APPROVED_OVERLAP,
            });

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.APPROVED_OVERLAP,
            });

            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna REQUEST_ALREADY_REVIEWED si el model detecta que la solicitud ya fue revisada dentro de la transacción", async () => {
            approveVacationRequestAtomically.mockResolvedValueOnce({
                success: false,
                code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
            });

            const result = await callApprove();

            expect(result).toEqual({
                code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
            });

            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("side effects", () => {
        test("no falla la aprobación si createLog falla", async () => {
            createLog.mockRejectedValueOnce(new Error("Log failed"));

            const result = await callApprove();

            expect(result.code).toBe(RESPONSES.VACATION.APPROVED);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        test("no crea log si la aprobación atómica falla", async () => {
            approveVacationRequestAtomically.mockResolvedValueOnce({
                success: false,
                code: RESPONSES.VACATION.APPROVED_OVERLAP,
            });

            const result = await callApprove();

            expect(result.code).toBe(RESPONSES.VACATION.APPROVED_OVERLAP);
            expect(createLog).not.toHaveBeenCalled();
        });
    });
});
jest.mock("../../model/employee/get.model", () => ({
    findByIdWithRoleAndHouse: jest.fn(),
}));

jest.mock("../../model/vacation/get.model", () => ({
    getVacationRequestById: jest.fn(),
}));

jest.mock("../../model/vacation/delete.model", () => ({
    deleteVacationRequestAtomically: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
    createLog: jest.fn(),
}));

const { findByIdWithRoleAndHouse } = require("../../model/employee/get.model");

const { getVacationRequestById } = require("../../model/vacation/get.model");

const {
    deleteVacationRequestAtomically,
} = require("../../model/vacation/delete.model");

const { createLog } = require("../../model/log.model");

const {
    deleteVacationRequest,
} = require("../../service/vacation/delete.service");

const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { VACATION_STATUS } = require("../../utils/vacationStatus");
const { ROLES } = require("../../utils/roles");

describe("US32 - deleteVacationRequest service", () => {
    const actorAdminId = "11111111-1111-4111-8111-111111111111";
    const actorCoordinatorId = "22222222-2222-4222-8222-222222222222";
    const actorUserId = "55555555-5555-4555-8555-555555555555";
    const targetEmployeeId = "33333333-3333-4333-8333-333333333333";
    const vacationRequestId = "44444444-4444-4444-8444-444444444444";
    const ipAddress = "127.0.0.1";

    function todayUTC() {
        const now = new Date();

        return new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
    }

    function dateFromToday(days) {
        const date = todayUTC();
        date.setUTCDate(date.getUTCDate() + days);
        return date;
    }

    const vacationRequest = {
        vacations_request_id: vacationRequestId,
        employee_id: targetEmployeeId,
        start: dateFromToday(30),
        end: dateFromToday(34),
        status: VACATION_STATUS.PENDING,
        feedback: null,
        used_days: 5,
        created_at: new Date("2026-05-01T00:00:00.000Z"),
    };

    const coordinatorActor = {
        employee_id: actorCoordinatorId,
        house_id: "house-1",
        role: {
            name: ROLES.COORDINATOR,
        },
    };

    const adminActor = {
        employee_id: actorAdminId,
        house_id: "house-1",
        role: {
            name: ROLES.ADMIN,
        },
    };

    const userActor = {
        employee_id: actorUserId,
        house_id: "house-1",
        role: {
            name: "Usuario",
        },
    };

    const ownerActor = {
        employee_id: targetEmployeeId,
        house_id: "house-1",
        role: {
            name: "Usuario",
        },
    };

    const targetEmployee = {
        employee_id: targetEmployeeId,
        house_id: "house-1",
        role: {
            name: "Psicóloga",
        },
    };

    const targetAdminEmployee = {
        employee_id: targetEmployeeId,
        house_id: "house-1",
        role: {
            name: ROLES.ADMIN,
        },
    };

    const targetOtherHouseEmployee = {
        employee_id: targetEmployeeId,
        house_id: "house-2",
        role: {
            name: "Psicóloga",
        },
    };

    function mockHappyPath({
        actor = coordinatorActor,
        target = targetEmployee,
        request = vacationRequest,
        atomicResult,
    } = {}) {
        findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actor)
            .mockResolvedValueOnce(target);

        getVacationRequestById.mockResolvedValueOnce(request);

        deleteVacationRequestAtomically.mockResolvedValueOnce(
            atomicResult || {
                success: true,
                data: {
                    vacationRequest,
                },
            },
        );

        createLog.mockResolvedValueOnce({
            log_id: "log-id",
        });
    }

    async function callDelete(options = {}) {
        return await deleteVacationRequest({
            actorEmployeeId: options.actorEmployeeId ?? actorCoordinatorId,
            vacationRequestId: options.vacationRequestId ?? vacationRequestId,
            ipAddress: options.ipAddress ?? ipAddress,
        });
    }

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("happy path", () => {
        test("coordinador elimina una solicitud de vacaciones correctamente", async () => {
            mockHappyPath();

            const result = await callDelete();

            expect(result.code).toBe(RESPONSES.VACATION.DELETED);
            expect(result.data.vacationRequest).toEqual(vacationRequest);

            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(
                1,
                actorCoordinatorId,
            );

            expect(getVacationRequestById).toHaveBeenCalledWith(
                vacationRequestId,
            );

            expect(findByIdWithRoleAndHouse).toHaveBeenNthCalledWith(
                2,
                targetEmployeeId,
            );

            expect(deleteVacationRequestAtomically).toHaveBeenCalledWith({
                vacationRequestId,
                employeeId: targetEmployeeId,
            });

            expect(createLog).toHaveBeenCalledWith(
                actorCoordinatorId,
                LOG_ACTIONS.VACATION_DELETED_SUCCESS,
                ipAddress,
                targetEmployeeId,
            );
        });

        test("permite eliminar solicitud pendiente futura", async () => {
            mockHappyPath({
                request: {
                    ...vacationRequest,
                    start: dateFromToday(30),
                    end: dateFromToday(34),
                    status: VACATION_STATUS.PENDING,
                },
            });

            const result = await callDelete();

            expect(result.code).toBe(RESPONSES.VACATION.DELETED);
            expect(deleteVacationRequestAtomically).toHaveBeenCalledTimes(1);
        });

        test("permite eliminar solicitud pendiente pasada", async () => {
            mockHappyPath({
                request: {
                    ...vacationRequest,
                    start: dateFromToday(-30),
                    end: dateFromToday(-26),
                    status: VACATION_STATUS.PENDING,
                },
            });

            const result = await callDelete();

            expect(result.code).toBe(RESPONSES.VACATION.DELETED);
            expect(deleteVacationRequestAtomically).toHaveBeenCalledTimes(1);
        });

        test("permite eliminar solicitud aprobada futura", async () => {
            mockHappyPath({
                request: {
                    ...vacationRequest,
                    start: dateFromToday(30),
                    end: dateFromToday(34),
                    status: VACATION_STATUS.APPROVED,
                },
            });

            const result = await callDelete();

            expect(result.code).toBe(RESPONSES.VACATION.DELETED);
            expect(deleteVacationRequestAtomically).toHaveBeenCalledTimes(1);
        });

        test("permite eliminar solicitud rechazada pasada", async () => {
            mockHappyPath({
                request: {
                    ...vacationRequest,
                    start: dateFromToday(-30),
                    end: dateFromToday(-26),
                    status: VACATION_STATUS.REJECTED,
                },
            });

            const result = await callDelete();

            expect(result.code).toBe(RESPONSES.VACATION.DELETED);
            expect(deleteVacationRequestAtomically).toHaveBeenCalledTimes(1);
        });

        test("permite que el dueño elimine su propia solicitud pendiente futura", async () => {
            mockHappyPath({
                actor: ownerActor,
                request: {
                    ...vacationRequest,
                    employee_id: targetEmployeeId,
                    start: dateFromToday(30),
                    end: dateFromToday(34),
                    status: VACATION_STATUS.PENDING,
                },
            });

            const result = await callDelete({
                actorEmployeeId: targetEmployeeId,
            });

            expect(result.code).toBe(RESPONSES.VACATION.DELETED);
            expect(deleteVacationRequestAtomically).toHaveBeenCalledWith(
                expect.objectContaining({
                    employeeId: targetEmployeeId,
                }),
            );
            expect(createLog).toHaveBeenCalledWith(
                targetEmployeeId,
                LOG_ACTIONS.VACATION_DELETED_SUCCESS,
                ipAddress,
                targetEmployeeId,
            );
        });

        test("permite que el dueño elimine su propia solicitud rechazada pasada", async () => {
            mockHappyPath({
                actor: ownerActor,
                request: {
                    ...vacationRequest,
                    employee_id: targetEmployeeId,
                    start: dateFromToday(-30),
                    end: dateFromToday(-26),
                    status: VACATION_STATUS.REJECTED,
                },
            });

            const result = await callDelete({
                actorEmployeeId: targetEmployeeId,
            });

            expect(result.code).toBe(RESPONSES.VACATION.DELETED);
            expect(deleteVacationRequestAtomically).toHaveBeenCalledWith(
                expect.objectContaining({
                    employeeId: targetEmployeeId,
                }),
            );
        });
    });

    describe("validaciones de input y permisos", () => {
        test("retorna VALIDATION_ERROR si actorEmployeeId no es UUID válido", async () => {
            const result = await callDelete({
                actorEmployeeId: "invalid-id",
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.VALIDATION_ERROR,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(getVacationRequestById).not.toHaveBeenCalled();
            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna VALIDATION_ERROR si vacationRequestId no es UUID válido", async () => {
            const result = await callDelete({
                vacationRequestId: "invalid-id",
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.VALIDATION_ERROR,
            });

            expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
            expect(getVacationRequestById).not.toHaveBeenCalled();
            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna USER.NOT_ACCESS si el actor no existe", async () => {
            findByIdWithRoleAndHouse.mockResolvedValueOnce(null);

            const result = await callDelete();

            expect(result).toEqual({
                code: RESPONSES.USER.NOT_ACCESS,
            });

            expect(getVacationRequestById).not.toHaveBeenCalled();
            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna INSUFFICIENT_PERMISSIONS si el actor es Admin", async () => {
            mockHappyPath({
                actor: adminActor,
            });

            const result = await callDelete({
                actorEmployeeId: actorAdminId,
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
            });

            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna INSUFFICIENT_PERMISSIONS si el actor no es Coordinador ni dueño", async () => {
            mockHappyPath({
                actor: userActor,
            });

            const result = await callDelete({
                actorEmployeeId: actorUserId,
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
            });

            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("validaciones de solicitud y alcance", () => {
        test("retorna REQUEST_NOT_FOUND si la solicitud no existe", async () => {
            findByIdWithRoleAndHouse.mockResolvedValueOnce(coordinatorActor);
            getVacationRequestById.mockResolvedValueOnce(null);

            const result = await callDelete();

            expect(result).toEqual({
                code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
            });

            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna EMPLOYEE.NOT_FOUND si el empleado dueño de la solicitud no existe", async () => {
            findByIdWithRoleAndHouse
                .mockResolvedValueOnce(coordinatorActor)
                .mockResolvedValueOnce(null);

            getVacationRequestById.mockResolvedValueOnce(vacationRequest);

            const result = await callDelete();

            expect(result).toEqual({
                code: RESPONSES.EMPLOYEE.NOT_FOUND,
            });

            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna EMPLOYEE_OUT_OF_SCOPE si la solicitud pertenece a un Admin", async () => {
            mockHappyPath({
                target: targetAdminEmployee,
            });

            const result = await callDelete();

            expect(result).toEqual({
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            });

            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna EMPLOYEE_OUT_OF_SCOPE si el empleado pertenece a otra casa", async () => {
            mockHappyPath({
                target: targetOtherHouseEmployee,
            });

            const result = await callDelete();

            expect(result).toEqual({
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            });

            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna REQUEST_NOT_MODIFIABLE si la solicitud aprobada ya inició", async () => {
            mockHappyPath({
                request: {
                    ...vacationRequest,
                    start: dateFromToday(-2),
                    end: dateFromToday(2),
                    status: VACATION_STATUS.APPROVED,
                },
            });

            const result = await callDelete();

            expect(result).toEqual({
                code: RESPONSES.VACATION.REQUEST_NOT_MODIFIABLE,
            });

            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna REQUEST_NOT_MODIFIABLE si la solicitud aprobada ya terminó", async () => {
            mockHappyPath({
                request: {
                    ...vacationRequest,
                    start: dateFromToday(-30),
                    end: dateFromToday(-26),
                    status: VACATION_STATUS.APPROVED,
                },
            });

            const result = await callDelete();

            expect(result).toEqual({
                code: RESPONSES.VACATION.REQUEST_NOT_MODIFIABLE,
            });

            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna REQUEST_NOT_MODIFIABLE si el dueño intenta eliminar su solicitud aprobada que ya inició", async () => {
            mockHappyPath({
                actor: ownerActor,
                request: {
                    ...vacationRequest,
                    employee_id: targetEmployeeId,
                    start: dateFromToday(-2),
                    end: dateFromToday(2),
                    status: VACATION_STATUS.APPROVED,
                },
            });

            const result = await callDelete({
                actorEmployeeId: targetEmployeeId,
            });

            expect(result).toEqual({
                code: RESPONSES.VACATION.REQUEST_NOT_MODIFIABLE,
            });

            expect(deleteVacationRequestAtomically).not.toHaveBeenCalled();
            expect(createLog).not.toHaveBeenCalled();
        });
    });

    describe("resultado atómico y logs", () => {
        test("retorna el código del model si la eliminación atómica falla", async () => {
            mockHappyPath({
                atomicResult: {
                    success: false,
                    code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
                },
            });

            const result = await callDelete();

            expect(result).toEqual({
                code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
            });

            expect(createLog).not.toHaveBeenCalled();
        });

        test("retorna EMPLOYEE_OUT_OF_SCOPE si el model detecta alcance inválido dentro de la transacción", async () => {
            mockHappyPath({
                atomicResult: {
                    success: false,
                    code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
                },
            });

            const result = await callDelete();

            expect(result).toEqual({
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            });

            expect(createLog).not.toHaveBeenCalled();
        });

        test("no falla la eliminación si createLog falla", async () => {
            mockHappyPath();
            createLog.mockRejectedValueOnce(new Error("Log failed"));

            const result = await callDelete();

            expect(result.code).toBe(RESPONSES.VACATION.DELETED);
            expect(createLog).toHaveBeenCalledTimes(1);
        });

        test("no crea log si la eliminación atómica falla", async () => {
            mockHappyPath({
                atomicResult: {
                    success: false,
                    code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
                },
            });

            const result = await callDelete();

            expect(result.code).toBe(RESPONSES.VACATION.REQUEST_NOT_FOUND);
            expect(createLog).not.toHaveBeenCalled();
        });
    });
});

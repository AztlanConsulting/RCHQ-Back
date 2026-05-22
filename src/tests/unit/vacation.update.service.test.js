jest.mock("../../model/employee/get.model", () => ({
    findByIdWithRoleAndHouse: jest.fn(),
    getWorkDays: jest.fn(),
}));

jest.mock("../../model/vacation/get.model", () => ({
    getVacationRequestById: jest.fn(),
}));

jest.mock("../../model/event/get.model", () => ({
    getGlobalEventsInRange: jest.fn(),
    getHouseEventsInRange: jest.fn(),
}));

jest.mock("../../model/vacation/update.model", () => ({
    approveVacationRequestAtomically: jest.fn(),
    rejectVacationRequestAtomically: jest.fn(),
    updateVacationRequestDatesAtomically: jest.fn(),
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
    getHouseEventsInRange,
} = require("../../model/event/get.model");

const {
    updateVacationRequestDatesAtomically,
} = require("../../model/vacation/update.model");

const { createLog } = require("../../model/log.model");

const {
    getVacationYearInfoForApproval,
} = require("../../service/vacation/get.service");

const {
    updateVacationRequestDates,
} = require("../../service/vacation/update.service");

const RESPONSES = require("../../utils/responses");
const { VACATION_STATUS } = require("../../utils/vacationStatus");
const { LOG_ACTIONS } = require("../../utils/logActions");

describe("updateVacationRequestDates service", () => {
    const actorEmployeeId = "11111111-1111-4111-8111-111111111111";
    const targetEmployeeId = "22222222-2222-4222-8222-222222222222";
    const vacationRequestId = "33333333-3333-4333-8333-333333333333";
    const houseId = "44444444-4444-4444-8444-444444444444";

    const actorEmployee = {
        employee_id: actorEmployeeId,
        house_id: houseId,
        role: {
            name: "Coordinador",
        },
    };

    const targetEmployee = {
        employee_id: targetEmployeeId,
        house_id: houseId,
        role: {
            name: "Mantenimiento",
        },
    };

    const vacationRequest = {
        vacations_request_id: vacationRequestId,
        employee_id: targetEmployeeId,
        start: new Date("2026-06-10T00:00:00.000Z"),
        end: new Date("2026-06-15T00:00:00.000Z"),
        status: VACATION_STATUS.PENDING,
        used_days: 4,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        findByIdWithRoleAndHouse.mockImplementation(async (employeeId) => {
            if (employeeId === actorEmployeeId) return actorEmployee;
            if (employeeId === targetEmployeeId) return targetEmployee;
            return null;
        });

        getVacationRequestById.mockResolvedValue(vacationRequest);

        getVacationYearInfoForApproval.mockResolvedValue({
            code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
            data: {
                startDate: new Date("2026-04-09T00:00:00.000Z"),
                endDate: new Date("2027-04-08T00:00:00.000Z"),
                maxDays: 12,
            },
        });

        getWorkDays.mockResolvedValue([
            { workday: { name: "Lunes" } },
            { workday: { name: "Martes" } },
            { workday: { name: "Miércoles" } },
            { workday: { name: "Jueves" } },
            { workday: { name: "Viernes" } },
        ]);

        getGlobalEventsInRange.mockResolvedValue([]);
        getHouseEventsInRange.mockResolvedValue([]);

        updateVacationRequestDatesAtomically.mockResolvedValue({
            success: true,
            data: {
                vacationRequest: {
                    ...vacationRequest,
                    start: new Date("2026-06-16T00:00:00.000Z"),
                    end: new Date("2026-06-19T00:00:00.000Z"),
                    used_days: 4,
                },
            },
        });

        createLog.mockResolvedValue({});
    });

    it("actualiza fechas de vacaciones correctamente", async () => {
        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.UPDATED);
        expect(updateVacationRequestDatesAtomically).toHaveBeenCalledWith({
            vacationRequestId,
            employeeId: targetEmployeeId,
            actorHouseId: houseId,
            startDate: new Date("2026-06-16T00:00:00.000Z"),
            endDate: new Date("2026-06-19T00:00:00.000Z"),
            usedDays: 4,
            anniversaryStartDate: new Date("2026-04-09T00:00:00.000Z"),
            anniversaryEndDate: new Date("2027-04-08T00:00:00.000Z"),
            maxDays: 12,
        });

        expect(createLog).toHaveBeenCalledWith(
            actorEmployeeId,
            LOG_ACTIONS.VACATION_UPDATED_SUCCESS,
            "127.0.0.1",
            targetEmployeeId
        );
    });

    it("no cuenta los días si el empleado no trabaja en ellos", async () => {
        getWorkDays.mockResolvedValueOnce([
            { workday: { name: "Lunes" } },
            { workday: { name: "Miércoles" } },
            { workday: { name: "Viernes" } },
        ]);

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-15",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
            requesterHouseId: houseId,
        });

        expect(result.code).toBe(RESPONSES.VACATION.UPDATED);
        expect(updateVacationRequestDatesAtomically).toHaveBeenCalledWith(
            expect.objectContaining({
                startDate: new Date("2026-06-15T00:00:00.000Z"),
                endDate: new Date("2026-06-19T00:00:00.000Z"),
                usedDays: 3,
            }),
        );
    });

    it("no cuenta los días feriados en los eventos globales", async () => {
        getGlobalEventsInRange.mockResolvedValueOnce([
            {
                start: new Date("2026-06-17T06:00:00.000Z"),
                end: new Date("2026-06-18T05:59:00.000Z"),
                isFreeDay: true,
            },
        ]);

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
            requesterHouseId: houseId,
        });

        expect(result.code).toBe(RESPONSES.VACATION.UPDATED);
        expect(getGlobalEventsInRange).toHaveBeenCalledWith(
            new Date("2026-06-16T00:00:00.000Z"),
            new Date("2026-06-20T00:00:00.000Z"),
        );
        expect(updateVacationRequestDatesAtomically).toHaveBeenCalledWith(
            expect.objectContaining({
                usedDays: 3,
            }),
        );
    });

    it("no cuenta los días feriados en los eventos de casa", async () => {
        getHouseEventsInRange.mockResolvedValueOnce([
            {
                start: new Date("2026-06-18T06:00:00.000Z"),
                end: new Date("2026-06-19T05:59:00.000Z"),
                isFreeDay: true,
            },
        ]);

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
            requesterHouseId: houseId,
        });

        expect(result.code).toBe(RESPONSES.VACATION.UPDATED);
        expect(getHouseEventsInRange).toHaveBeenCalledWith(
            houseId,
            new Date("2026-06-16T00:00:00.000Z"),
            new Date("2026-06-20T00:00:00.000Z"),
        );
        expect(updateVacationRequestDatesAtomically).toHaveBeenCalledWith(
            expect.objectContaining({
                usedDays: 3,
            }),
        );
    });

    it("regresa error en caso de que ninguno de los días sea hábil", async () => {
        getGlobalEventsInRange.mockResolvedValueOnce([
            {
                start: new Date("2026-06-16T06:00:00.000Z"),
                end: new Date("2026-06-20T05:59:00.000Z"),
                isFreeDay: true,
            },
        ]);

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
            requesterHouseId: houseId,
        });

        expect(result.code).toBe(RESPONSES.VACATION.NULL_DATES);
        expect(updateVacationRequestDatesAtomically).not.toHaveBeenCalled();
    });

    it("regresa error de validación si los datos son inválidos", async () => {
        const result = await updateVacationRequestDates({
            actorEmployeeId: "id-invalido",
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.VALIDATION_ERROR);
        expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
    });

    it("regresa NOT_ACCESS si el actor no existe", async () => {
        findByIdWithRoleAndHouse.mockResolvedValueOnce(null);

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
    });

    it("regresa INSUFFICIENT_PERMISSIONS si el actor no es Coordinador", async () => {
        findByIdWithRoleAndHouse.mockResolvedValueOnce({
            ...actorEmployee,
            role: {
                name: "Mantenimiento",
            },
        });

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS);
    });

    it("regresa BAD_DATES si startDate es posterior a endDate", async () => {
        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-20",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.DATES.BAD_DATES);
        expect(getVacationRequestById).not.toHaveBeenCalled();
    });

    it("regresa REQUEST_NOT_FOUND si la solicitud no existe", async () => {
        getVacationRequestById.mockResolvedValueOnce(null);

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUEST_NOT_FOUND);
    });

    it("regresa REQUEST_NOT_MODIFIABLE si la solicitud está rechazada", async () => {
        getVacationRequestById.mockResolvedValueOnce({
            ...vacationRequest,
            status: VACATION_STATUS.REJECTED,
        });

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUEST_NOT_MODIFIABLE);
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si intenta modificar a un Administrador", async () => {
        findByIdWithRoleAndHouse.mockImplementation(async (employeeId) => {
            if (employeeId === actorEmployeeId) return actorEmployee;
            if (employeeId === targetEmployeeId) {
                return {
                    ...targetEmployee,
                    role: {
                        name: "Administrador",
                    },
                };
            }
            return null;
        });

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE);
    });

    it("regresa EMPLOYEE_OUT_OF_SCOPE si el empleado pertenece a otra casa", async () => {
        findByIdWithRoleAndHouse.mockImplementation(async (employeeId) => {
            if (employeeId === actorEmployeeId) return actorEmployee;
            if (employeeId === targetEmployeeId) {
                return {
                    ...targetEmployee,
                    house_id: "55555555-5555-4555-8555-555555555555",
                };
            }
            return null;
        });

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE);
    });

    it("regresa OUT_OF_RANGE si las fechas están fuera del año laboral", async () => {
        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2027-04-09",
            rawEndDate: "2027-04-10",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.OUT_OF_RANGE);
    });

    it("regresa WITHOUT_DATES si el empleado no tiene días laborales", async () => {
        getWorkDays.mockResolvedValueOnce([]);

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.WITHOUT_DATES);
    });

    it("regresa NULL_DATES si el rango no contiene días hábiles", async () => {
        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-20",
            rawEndDate: "2026-06-21",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.NULL_DATES);
    });

    it("propaga el código de error del model transaccional", async () => {
        updateVacationRequestDatesAtomically.mockResolvedValueOnce({
            success: false,
            code: RESPONSES.VACATION.ALREADY_REQUEST,
        });

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.ALREADY_REQUEST);
    });

    it("no falla aunque falle el log", async () => {
        createLog.mockRejectedValueOnce(new Error("Error de log"));

        const result = await updateVacationRequestDates({
            actorEmployeeId,
            vacationRequestId,
            rawStartDate: "2026-06-16",
            rawEndDate: "2026-06-19",
            ipAddress: "127.0.0.1",
        });

        expect(result.code).toBe(RESPONSES.VACATION.UPDATED);
    });
});

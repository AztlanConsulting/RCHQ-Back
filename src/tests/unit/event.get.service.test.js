const eventGetService = require("../../service/event/get.service");

jest.mock("../../model/employee/get.model");
jest.mock("../../model/vacation/get.model");
jest.mock("../../model/event/get.model");
jest.mock("../../model/absence/get.model");

const eventModel = require("../../model/event/get.model");
const absenceModel = require("../../model/absence/get.model");
const vacationModel = require("../../model/vacation/get.model");
const employeeModel = require("../../model/employee/get.model");
const RESPONSES = require("../../utils/responses");

describe("event.service — getAllEventTypes", () => {
    beforeEach(() => jest.clearAllMocks());

    it("retorna eventTypes con eventTypeId en camelCase", async () => {
        eventModel.getAllEventTypes.mockResolvedValue([
            {
                event_type_id: "550e8400-e29b-41d4-a716-446655440000",
                name: "Festivo",
            },
        ]);

        const result = await eventGetService.getAllEventTypes();

        expect(result.code).toBe(RESPONSES.EVENTS.FOUND);
        expect(result.data.eventTypes).toEqual([
            {
                eventTypeId: "550e8400-e29b-41d4-a716-446655440000",
                name: "Festivo",
            },
        ]);
    });
});

describe("event.service — getEmployeeDateRules", () => {
    beforeEach(() => jest.clearAllMocks());

    it("regresa días laborales, fines no laborales y feriados sin duplicar el día de fin exclusivo", async () => {
        employeeModel.findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "employee-1",
            house_id: "house-1",
            is_active: true,
        });
        employeeModel.getWorkDays.mockResolvedValue([
            {
                start: new Date("1970-01-01T09:00:00.000Z"),
                end: new Date("1970-01-01T17:00:00.000Z"),
                workday: {
                    workday_id: "workday-monday",
                    name: "Lunes",
                },
            },
        ]);
        eventModel.getGlobalEventsInRange.mockResolvedValue([
            {
                start: new Date("2026-06-10T06:00:00.000Z"),
                end: new Date("2026-06-11T06:00:00.000Z"),
                isFreeDay: true,
            },
        ]);
        eventModel.getHouseEventsInRange.mockResolvedValue([]);

        const result = await eventGetService.getEmployeeDateRules({
            employeeId: "employee-1",
            mode: "absence",
        });

        expect(result.code).toBe(RESPONSES.EVENTS.FOUND);
        expect(result.data.workDays).toEqual([
            expect.objectContaining({
                name: "Lunes",
                weekday: 1,
            }),
        ]);
        expect(result.data.nonWorkingWeekdays).toEqual([0, 2, 3, 4, 5, 6]);
        expect(result.data.freeDays).toContain("2026-06-10");
        expect(result.data.freeDays).not.toContain("2026-06-11");
        expect(eventModel.getGlobalEventsInRange).toHaveBeenCalledWith(
            expect.any(Date),
            expect.any(Date),
        );
    });

    it("retorna WITHOUT_DATES cuando el empleado no tiene workdays", async () => {
        employeeModel.findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "employee-1",
            house_id: "house-1",
            is_active: true,
        });
        employeeModel.getWorkDays.mockResolvedValue([]);

        const result = await eventGetService.getEmployeeDateRules({
            employeeId: "employee-1",
            mode: "vacation",
        });

        expect(result.code).toBe(RESPONSES.VACATION.WITHOUT_DATES);
        expect(eventModel.getGlobalEventsInRange).not.toHaveBeenCalled();
    });
});

describe("event.service — getHouseCalendarRecordsInRange", () => {
    beforeEach(() => jest.clearAllMocks());

    it("retorna error si las fechas vienen en formato inválido", async () => {
        const result = await eventGetService.getHouseCalendarRecordsInRange(
            "employee-1",
            "house-1",
            "2026/05/01",
            "2026-05-10",
        );

        expect(result.code).toBe(RESPONSES.DATES.WRONG_FORMAT);
    });

    it("retorna error si la fecha final es menor a la inicial", async () => {
        const result = await eventGetService.getHouseCalendarRecordsInRange(
            "employee-1",
            "house-1",
            "2026-05-10",
            "2026-05-01",
        );

        expect(result.code).toBe(RESPONSES.DATES.BAD_DATES);
    });

    it("mapea las ausencias de la casa para el calendario", async () => {
        absenceModel.getHouseCalendarAbsenceInRange.mockResolvedValue([
            {
                absence_id: "absence-1",
                start: new Date("2026-05-14T00:00:00.000Z"),
                end: new Date("2026-05-15T00:00:00.000Z"),
                description: "Consulta médica",
                url: "https://example.com/evidence.pdf",
                is_deleted: false,
                absence_type: {
                    name: "Permiso",
                },
                employee: {
                    employee_id: "employee-1",
                    name: "Ana",
                    surname: "Lopez",
                    curp: "LOPA000000MDFXXX00",
                    employee_workday: [
                        { workday: { name: "Jueves" } },
                        { workday: { name: "Viernes" } },
                    ],
                },
            },
        ]);

        eventModel.getHouseEventsInRange.mockResolvedValue([
            {
                date: new Date("2026-05-15T00:00:00.000Z"),
                start: new Date("2026-05-15T06:00:00.000Z"),
                end: new Date("2026-05-16T06:00:00.000Z"),
                isFreeDay: true,
            },
        ]);

        eventModel.getGlobalEventsInRange.mockResolvedValue([]);
        eventModel.getHouseCalendarPersonalEventsInRange.mockResolvedValue([]);
        vacationModel.getHouseCalendarVacationsInRange.mockResolvedValue([]);

        const result = await eventGetService.getHouseCalendarRecordsInRange(
            "employee-1",
            "house-1",
            "2026-05-01",
            "2026-05-31",
        );

        expect(result.code).toBe(RESPONSES.EVENTS.FOUND);
        expect(result.data.events).toHaveLength(1);
        expect(result.data.events[0]).toMatchObject({
            absenceId: "absence-1",
            employeeId: "employee-1",
            name: "Ana Lopez",
            curp: "LOPA000000MDFXXX00",
            type: "Permiso",
            subtitle: "LOPA000000MDFXXX00",
            description: "Consulta médica",
            link: "https://example.com/evidence.pdf",
            isDeleted: false,
            usedDays: 1,
            totalDays: 2,
            focus: "ausencias",
            scope: "house",
            allDay: true,
        });

        expect(result.data.events[0].end.toISOString()).toBe(
            "2026-05-16T06:00:00.000Z",
        );
    });
});

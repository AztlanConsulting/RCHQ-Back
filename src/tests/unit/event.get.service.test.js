const eventGetService = require("../../service/event/get.service");

jest.mock("../../model/employee/get.model");
jest.mock("../../model/vacation/get.model");
jest.mock("../../model/event/get.model");

const eventModel = require("../../model/event/get.model");
const RESPONSES = require("../../utils/responses");

describe("event.service — getHouseAbsencesInRange", () => {
    beforeEach(() => jest.clearAllMocks());

    it("retorna error si las fechas vienen en formato inválido", async () => {
        const result = await eventGetService.getHouseAbsencesInRange(
            "house-1",
            "2026/05/01",
            "2026-05-10",
        );

        expect(result.code).toBe(RESPONSES.DATES.WRONG_FORMAT);
    });

    it("retorna error si la fecha final es menor a la inicial", async () => {
        const result = await eventGetService.getHouseAbsencesInRange(
            "house-1",
            "2026-05-10",
            "2026-05-01",
        );

        expect(result.code).toBe(RESPONSES.DATES.BAD_DATES);
    });

    it("mapea las ausencias de la casa para el calendario", async () => {
        eventModel.getHouseAbsencesInRange.mockResolvedValue([
            {
                absence_id: "absence-1",
                start: new Date("2026-05-14T00:00:00.000Z"),
                end: new Date("2026-05-15T00:00:00.000Z"),
                description: "Consulta médica",
                url: "https://example.com/evidence.pdf",
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
                is_free_day: true,
            },
        ]);
        eventModel.getGlobalEventsInRange.mockResolvedValue([]);

        const result = await eventGetService.getHouseAbsencesInRange(
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
            usedDays: 1,
            focus: "ausencias",
            scope: "house",
            lastsAllDay: true,
        });
        expect(result.data.events[0].end.toISOString()).toBe("2026-05-16T00:00:00.000Z");
    });
});

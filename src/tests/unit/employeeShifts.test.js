const {
    getShiftDurationMinutes,
    getScheduledWeekdayNumbers,
    resolveScheduledWeekdayNumbers,
    mapShiftToApi,
} = require("../../utils/employeeShifts");

describe("employeeShifts utils", () => {
    it("calcula duración de turno diurno", () => {
        const minutes = getShiftDurationMinutes({
            start: "09:00",
            end: "18:00",
            startWorkdayName: "Lunes",
            endWorkdayName: "Lunes",
        });

        expect(minutes).toBe(9 * 60);
    });

    it("calcula duración de turno nocturno en días distintos", () => {
        const minutes = getShiftDurationMinutes({
            start: "22:00",
            end: "04:00",
            startWorkdayName: "Lunes",
            endWorkdayName: "Martes",
        });

        expect(minutes).toBe(6 * 60);
    });

    it("incluye ambos weekdays en turnos que cruzan medianoche (Regla A)", () => {
        const weekdays = getScheduledWeekdayNumbers([
            {
                start_workday: { name: "Lunes" },
                end_workday: { name: "Martes" },
                start: "22:00",
                end: "04:00",
            },
        ]);

        expect(weekdays).toEqual([1, 2]);
    });

    it("resuelve weekdays desde formato legacy employee_workday", () => {
        const weekdays = resolveScheduledWeekdayNumbers([
            { workday: { name: "Viernes" } },
        ]);

        expect(weekdays).toEqual([5]);
    });

    it("mapea turno Prisma a API", () => {
        const apiShift = mapShiftToApi({
            shift_id: "shift-1",
            start_workday_id: "wd-1",
            end_workday_id: "wd-2",
            start: new Date("1970-01-01T09:30:00.000Z"),
            end: new Date("1970-01-01T18:15:00.000Z"),
            is_all_day: false,
            start_workday: { name: "Lunes" },
            end_workday: { name: "Martes" },
        });

        expect(apiShift).toEqual({
            shiftId: "shift-1",
            startWorkdayId: "wd-1",
            endWorkdayId: "wd-2",
            startWorkdayName: "Lunes",
            endWorkdayName: "Martes",
            start: "09:30",
            end: "18:15",
            allDay: false,
        });
    });
});
